import { createHash } from 'node:crypto';
import { z } from 'zod';

export const zoomConfigSchema = z.object({
  account_id: z.string().trim().min(5).max(300), client_id: z.string().trim().min(5).max(300),
  client_secret: z.string().min(5).max(1000), host_email: z.email().max(254)
}).strict();
export const meetingSchema = z.object({
  business_name: z.string().trim().min(2).max(150),
  start_at: z.iso.datetime({ offset: true }), duration_minutes: z.number().int().min(15).max(60),
  prospect_timezone: z.string().refine(value => { try { new Intl.DateTimeFormat('en', { timeZone: value }); return value.includes('/'); } catch { return false; } }, 'Use an IANA timezone'),
  attendance_confirmed: z.literal(true)
}).strict();
export const cancelMeetingSchema = z.object({ meeting_id: z.string().regex(/^\d{8,15}$/) }).strict();
const uncertain = 'Zoom may have created this meeting. Do not create another booking. Retry the same tool later or ask the operator to check Zoom.';

export function createZoom(store, getConfig, { fetch: request = globalThis.fetch, now = Date.now } = {}) {
  store.db.exec(`CREATE TABLE IF NOT EXISTS zoom_meetings (
    booking_key TEXT PRIMARY KEY, call_id TEXT NOT NULL, payload TEXT NOT NULL, marker TEXT NOT NULL,
    state TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, result TEXT
  ); CREATE INDEX IF NOT EXISTS zoom_call ON zoom_meetings(call_id);`);
  let token, tokenUntil = 0, tokenKey;
  async function access() {
    const cfg = getConfig();
    if (!cfg) throw new Error('Zoom is not connected. Do not promise a confirmed Zoom appointment.');
    const key = createHash('sha256').update(JSON.stringify(cfg)).digest('hex');
    if (token && tokenKey === key && tokenUntil > now() + 60000) return { cfg, token };
    let response;
    try { response = await request('https://zoom.us/oauth/token', {
      method: 'POST', headers: { Authorization: 'Basic ' + Buffer.from(cfg.client_id + ':' + cfg.client_secret).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'account_credentials', account_id: cfg.account_id }).toString(), signal: AbortSignal.timeout(10000)
    }); } catch { throw new Error('Zoom authentication is temporarily unavailable. Please retry.'); }
    if (!response.ok) throw new Error(`Zoom authentication failed (HTTP ${response.status}). Ask the operator to check the app activation and credentials.`);
    const data = await response.json();
    if (!data.access_token || !Number.isFinite(data.expires_in)) throw new Error('Zoom returned an invalid authentication response');
    token = data.access_token; tokenUntil = now() + data.expires_in * 1000; tokenKey = key;
    return { cfg, token };
  }
  async function api(path, options = {}) {
    const auth = await access();
    const response = await request('https://api.zoom.us/v2' + path, {
      ...options, headers: { Authorization: 'Bearer ' + auth.token, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000)
    });
    if (response.status === 401) { token = null; tokenUntil = 0; }
    return response;
  }
  function update(key, state, result = null) {
    store.db.prepare('UPDATE zoom_meetings SET state=?,result=?,updated_at=? WHERE booking_key=?').run(state, result && JSON.stringify(result), now(), key);
  }
  function publicMeeting(data, input) {
    const url = new URL(data.join_url);
    if (url.protocol !== 'https:' || !(url.hostname === 'zoom.us' || url.hostname.endsWith('.zoom.us')) || !url.pathname.startsWith('/j/')) throw new Error('Zoom did not return a valid attendee join link');
    if (!/^\d{8,15}$/.test(String(data.id)) || Math.abs(Date.parse(data.start_time) - Date.parse(input.start_at)) > 60000 || Number(data.duration) !== input.duration_minutes) throw new Error('Zoom returned different meeting details; operator review is required');
    return { meeting_id: String(data.id), join_url: url.href, start_at: new Date(input.start_at).toISOString(), end_at: new Date(Date.parse(input.start_at) + input.duration_minutes * 60000).toISOString(), duration_minutes: input.duration_minutes, host_timezone: 'Asia/Ho_Chi_Minh', prospect_timezone: input.prospect_timezone, status: 'created', calendar_booked: false };
  }
  async function listMeetings() {
    const { cfg } = await access();
    const meetings = []; let next = '';
    for (let page = 0; page < 10; page++) {
      const query = new URLSearchParams({ type: 'scheduled', page_size: '300', ...(next ? { next_page_token: next } : {}) });
      const response = await api('/users/' + encodeURIComponent(cfg.host_email) + '/meetings?' + query);
      if (!response.ok) throw new Error(`Zoom meeting lookup failed (HTTP ${response.status})`);
      const data = await response.json(); meetings.push(...(data.meetings || [])); next = data.next_page_token;
      if (!next) return meetings;
    }
    throw new Error('Zoom meeting lookup exceeded its safe limit; operator review is required');
  }
  return {
    async verify() { await listMeetings(); return { configured: true, host_email: getConfig().host_email, timezone: 'Asia/Ho_Chi_Minh' }; },
    async create(callId, raw, callStartedAt) {
      const input = meetingSchema.parse(raw);
      input.start_at = new Date(input.start_at).toISOString();
      const payload = JSON.stringify(input), key = createHash('sha256').update(callId + ':' + payload).digest('hex');
      const marker = '[OTS-' + key.slice(0, 16) + ']';
      let old = store.db.prepare('SELECT * FROM zoom_meetings WHERE booking_key=?').get(key);
      if (old?.state === 'created') return { ...JSON.parse(old.result), duplicate: true };
      if (old?.state === 'cancelled') throw new Error('This booking was cancelled. Choose a new time before creating a replacement.');
      if (old && ['creating', 'uncertain'].includes(old.state)) {
        if (now() - old.updated_at < 60000) throw new Error(uncertain);
        const found = (await listMeetings()).filter(m => m.topic?.includes(marker));
        if (found.length !== 1) throw new Error(uncertain);
        const result = publicMeeting(found[0], input); update(key, 'created', result);
        return { ...result, duplicate: true };
      }
      const reference = callStartedAt ? Date.parse(callStartedAt) : old?.created_at || now();
      const start = Date.parse(input.start_at), hours = (start - reference) / 3600000;
      if (!Number.isFinite(reference) || hours < 24 || hours > 48 || start <= now()) throw new Error('Select an available meeting 24–48 hours after the call starts.');
      const active = store.db.prepare("SELECT booking_key FROM zoom_meetings WHERE call_id=? AND state NOT IN ('cancelled','failed') AND booking_key<>?").get(callId, key);
      if (active) throw new Error('This call already has a Zoom booking. Cancel it before choosing another time.');
      if (!old) store.db.prepare('INSERT INTO zoom_meetings VALUES(?,?,?,?,?,?,?,?)').run(key, callId, payload, marker, 'creating', now(), now(), null);
      else update(key, 'creating');
      // Persist the reservation before any network await to prevent concurrent duplicates.
      let cfg;
      try { ({ cfg } = await access()); } catch (error) { update(key, 'failed'); throw error; }
      const topic = ('OneTimeSuite website presentation — ' + input.business_name).slice(0, 175) + ' ' + marker;
      let response;
      try {
        response = await api('/users/' + encodeURIComponent(cfg.host_email) + '/meetings', {
          method: 'POST', body: JSON.stringify({ topic, type: 2, start_time: input.start_at, duration: input.duration_minutes, timezone: 'Asia/Ho_Chi_Minh',
            agenda: 'Website concept presentation. Please join seated at a computer or tablet. No purchase commitment.',
            settings: { use_pmi: false, waiting_room: true, join_before_host: false, mute_upon_entry: true, auto_recording: 'none', host_video: true, participant_video: false, meeting_authentication: false }
          })
        });
      } catch { update(key, 'uncertain'); throw new Error(uncertain); }
      if (!response.ok) {
        const definite = response.status >= 400 && response.status < 500 && response.status !== 408;
        update(key, definite ? 'failed' : 'uncertain');
        throw new Error(definite ? `Zoom could not create the meeting (HTTP ${response.status}). Do not book the calendar event yet.` : uncertain);
      }
      try {
        const result = publicMeeting(await response.json(), input); update(key, 'created', result); return { ...result, duplicate: false };
      } catch { update(key, 'uncertain'); throw new Error(uncertain); }
    },
    async cancel(callId, raw) {
      const { meeting_id } = cancelMeetingSchema.parse(raw);
      const row = store.db.prepare('SELECT * FROM zoom_meetings WHERE call_id=?').all(callId).find(r => r.result && JSON.parse(r.result).meeting_id === meeting_id);
      if (!row) throw new Error('This call does not own that Zoom meeting. Ask the operator to review.');
      if (row.state === 'cancelled') return { meeting_id, status: 'cancelled', duplicate: true };
      const response = await api('/meetings/' + meeting_id + '?schedule_for_reminder=false&cancel_meeting_reminder=false', { method: 'DELETE' });
      if (!response.ok && response.status !== 404) throw new Error(`Zoom cancellation failed (HTTP ${response.status}); ask the operator to check before rescheduling.`);
      update(row.booking_key, 'cancelled', JSON.parse(row.result));
      return { meeting_id, status: 'cancelled', calendar_event_cancelled: false };
    },
    assertBooking(callId, appointment) {
      const rows = store.db.prepare("SELECT result FROM zoom_meetings WHERE call_id=? AND state='created'").all(callId);
      const match = rows.map(r => JSON.parse(r.result)).find(m => m.join_url === appointment?.join_url && Date.parse(m.start_at) === Date.parse(appointment?.start_at) && Date.parse(m.end_at) === Date.parse(appointment?.end_at));
      if (!match) throw new Error('The brief must include this call’s successful Zoom join link and exact booked meeting times.');
    }
  };
}

export function zoomTools(origin) {
  const schema = input => { const out = z.toJSONSchema(input); delete out.$schema; if (out.properties.attendance_confirmed) { delete out.properties.attendance_confirmed.const; out.properties.attendance_confirmed.description = 'Must be true after the prospect confirms attendance and screen viewing.'; } return out; };
  return [
    { name: 'create_website_demo_zoom', description: 'After calendar availability is confirmed and the prospect agrees to the exact time, create a 15–60 minute Zoom demo 24–48 hours after this call. Include the exact returned attendee join_url in the Google Calendar summary so the invitation contains the link. This tool does not send a calendar invitation.', parameters: schema(meetingSchema) },
    { name: 'cancel_website_demo_zoom', description: 'Cancel only the Zoom meeting created during this call, if Google Calendar booking failed or the prospect declined or changed the time. This does not cancel a Google Calendar event; escalate any existing calendar event to the operator.', parameters: schema(cancelMeetingSchema) }
  ].map(fn => ({ type: 'function', async: false, function: fn, server: { url: origin + '/api/website-builder/vapi', timeoutSeconds: 40 } }));
}
