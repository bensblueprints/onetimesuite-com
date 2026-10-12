import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createStore } from '../src/store.js';
import { createZoom } from '../src/zoom.js';
import { createApp } from '../src/server.js';

const cfg = { account_id: 'test-account', client_id: 'test-client', client_secret: 'test-secret', host_email: 'host@example.com' };
const input = now => ({ business_name: 'Example Plumbing', start_at: new Date(now + 30 * 3600000).toISOString(), duration_minutes: 30, prospect_timezone: 'America/New_York', attendance_confirmed: true });
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'ots-zoom-')), store = createStore(dir);
  t.after(() => { store.close(); rmSync(dir, { recursive: true, force: true }); });
  return store;
}
function provider() {
  const calls = [], meetings = []; let timeout = false, deletesFail = false;
  return { calls, meetings, set timeout(v) { timeout = v; }, set deletesFail(v) { deletesFail = v; },
    async fetch(url, options = {}) {
      calls.push({ url, options });
      if (url.includes('/oauth/token')) return Response.json({ access_token: 'private-access-token', expires_in: 3600 });
      if (options.method === 'POST') {
        const b = JSON.parse(options.body), id = 12345678901 + meetings.length;
        const m = { id, topic: b.topic, start_time: b.start_time, duration: b.duration, join_url: `https://us05web.zoom.us/j/${id}?pwd=test`, start_url: 'PRIVATE-HOST-LINK' };
        meetings.push(m); if (timeout) throw new Error('Network timeout after Zoom created the meeting');
        return Response.json(m, { status: 201 });
      }
      if (options.method === 'DELETE') return new Response(null, { status: deletesFail ? 503 : 204 });
      return Response.json({ meetings });
    }
  };
}
test('Zoom creation is durable and idempotent, keeps host secrets private and enforces ownership', async t => {
  const s = fixture(t), p = provider(), time = Date.now(), args = input(time);
  const zoom = createZoom(s, () => cfg, { fetch: p.fetch, now: () => time });
  const [a, simultaneous] = await Promise.allSettled([zoom.create('call-a', args), zoom.create('call-a', args)]);
  assert.equal(a.status, 'fulfilled'); assert.equal(simultaneous.status, 'rejected');
  const first = a.value; assert.ok(first.join_url.includes('/j/')); assert.equal(JSON.stringify(first).includes('PRIVATE'), false);
  assert.equal((await zoom.create('call-a', args)).duplicate, true);
  assert.equal((await createZoom(s, () => cfg, { fetch: p.fetch, now: () => time }).create('call-a', args)).duplicate, true);
  assert.equal(p.meetings.length, 1);
  const body = JSON.parse(p.calls.find(c => c.options.method === 'POST' && c.url.includes('/v2/')).options.body);
  assert.equal(body.settings.waiting_room, true); assert.equal(body.settings.use_pmi, false); assert.equal(body.timezone, 'Asia/Ho_Chi_Minh');
  await assert.rejects(zoom.create('call-a', { ...args, start_at: new Date(time + 31 * 3600000).toISOString() }), /already has/);
  await assert.rejects(zoom.cancel('other-call', { meeting_id: first.meeting_id }), /does not own/);
  zoom.assertBooking('call-a', { ...first });
  assert.throws(() => zoom.assertBooking('other-call', first));
  p.deletesFail = true; await assert.rejects(zoom.cancel('call-a', { meeting_id: first.meeting_id }), /failed/);
  p.deletesFail = false; assert.equal((await zoom.cancel('call-a', { meeting_id: first.meeting_id })).status, 'cancelled');
  assert.equal((await zoom.cancel('call-a', { meeting_id: first.meeting_id })).duplicate, true);
  assert.throws(() => zoom.assertBooking('call-a', first));
});
test('uncertain creation reconciles by a unique marker without making a duplicate meeting', async t => {
  const s = fixture(t), p = provider(); let time = Date.now(); const args = input(time);
  p.timeout = true; const zoom = createZoom(s, () => cfg, { fetch: p.fetch, now: () => time });
  await assert.rejects(zoom.create('call-a', args), /may have created/);
  await assert.rejects(zoom.create('call-a', args), /may have created/); assert.equal(p.meetings.length, 1);
  time += 61000; const recovered = await zoom.create('call-a', args);
  assert.equal(recovered.duplicate, true); assert.equal(p.meetings.length, 1);
});
test('Zoom enforces consent, absolute time window, exact duration and no configuration fails cleanly', async t => {
  const s = fixture(t), p = provider(), time = Date.now(), args = input(time);
  const zoom = createZoom(s, () => cfg, { fetch: p.fetch, now: () => time });
  await assert.rejects(zoom.create('call', { ...args, attendance_confirmed: false }));
  await assert.rejects(zoom.create('call', { ...args, prospect_timezone: 'EST' }));
  await assert.rejects(zoom.create('call', { ...args, start_at: new Date(time + 23 * 3600000).toISOString() }), /24–48/);
  await assert.rejects(zoom.create('call', { ...args, start_at: new Date(time + 49 * 3600000).toISOString() }), /24–48/);
  await assert.rejects(createZoom(s, () => null).create('call', args), /not connected/);
  assert.equal(s.db.prepare('SELECT state FROM zoom_meetings').get().state, 'failed');
  assert.equal(p.calls.length, 0);
});
test('authenticated Vapi Zoom tools use per-call ownership; admin stores credentials encrypted', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'ots-zoom-http-')), p = provider();
  const env = { SESSION_SECRET: 's'.repeat(40), WEBHOOK_SECRET: 'w'.repeat(40), DATA_DIR: dir, PUBLIC_URL: 'http://localhost:3180', WORKER_ENABLED: 'false', ADMIN_USER_1: 'tester', ADMIN_PASS_1: 'test-password' };
  const app = createApp(env, { zoom: { fetch: p.fetch } }); app.server.listen(0, '127.0.0.1'); await once(app.server, 'listening');
  t.after(() => { app.close(); rmSync(dir, { recursive: true, force: true }); });
  const base = 'http://127.0.0.1:' + app.server.address().port + '/api/website-builder/';
  const post = (path, data, headers = {}) => fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data) });
  assert.equal((await post('admin/zoom', cfg)).status, 401);
  const login = await post('login', { username: 'tester', password: 'test-password' }, { Origin: env.PUBLIC_URL });
  const headers = { Cookie: login.headers.get('set-cookie').split(';')[0], Origin: env.PUBLIC_URL };
  assert.equal((await post('admin/zoom', cfg, { ...headers, Origin: 'https://evil.example' })).status, 403);
  assert.equal((await post('admin/zoom', cfg, headers)).status, 200);
  assert.equal(app.store.setting('zoom_config').includes('test-secret'), false);
  const status = await (await fetch(base + 'admin/zoom', { headers })).json(); assert.equal(status.configured, true); assert.equal(status.client_secret, undefined);
  const payload = { message: { type: 'tool-calls', call: { id: 'call-test' }, toolCallList: [{ id: 'tool-test', function: { name: 'create_website_demo_zoom', arguments: input(Date.now()) } }] } };
  assert.equal((await post('vapi', payload)).status, 401);
  const result = await (await post('vapi', payload, { Authorization: 'Bearer ' + env.WEBHOOK_SECRET })).json();
  assert.equal(result.results[0].toolCallId, 'tool-test'); assert.equal(JSON.parse(result.results[0].result).status, 'created');
  payload.message.toolCallList[0].function = { name: 'start_website_build', arguments: { appointment: { join_url: 'https://zoom.us/j/99999999999' } } };
  const invalid = await (await post('vapi', payload, { Authorization: 'Bearer ' + env.WEBHOOK_SECRET })).json(); assert.match(invalid.results[0].error, /successful Zoom join link/);
});
