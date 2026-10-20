import { z } from 'zod';

const phone = z.string().regex(/^\+1[2-9]\d{2}[2-9]\d{6}$/);
const variant = z.enum(['a', 'b']);
const contactSchema = z.object({
  phone: phone, country: z.literal('US'), lead_id: z.string().min(1).max(100), variant,
  timezone: z.string().refine(value => {
    if (!value.includes('/')) return false;
    try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; }
  }),
  timezone_evidence: z.string().trim().min(10).max(2000),
  eligibility_verified: z.literal(true), eligibility_evidence: z.string().trim().min(10).max(2000),
}).strict();

// These tables are separate from builds. Neither importing nor registering starts calls.
export function createOutreach(store, now = Date.now) {
  const db = store.db;
  db.exec(`CREATE TABLE IF NOT EXISTS outreach_contacts (
    phone TEXT PRIMARY KEY, lead_id TEXT NOT NULL, variant TEXT NOT NULL,
    timezone TEXT NOT NULL, timezone_evidence TEXT NOT NULL, eligibility_evidence TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'ready', contact_id TEXT UNIQUE, call_id TEXT,
    reserved_at INTEGER, updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS outreach_campaigns(id TEXT PRIMARY KEY, variant TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS outreach_suppression (
    phone TEXT PRIMARY KEY, call_id TEXT NOT NULL, reason TEXT NOT NULL, recorded_at INTEGER NOT NULL
  );`);
  if (!db.prepare('PRAGMA table_info(outreach_contacts)').all().some(c => c.name === 'campaign_id')) {
    db.exec('ALTER TABLE outreach_contacts ADD COLUMN campaign_id TEXT');
  }
  function transaction(fn) {
    db.exec('BEGIN IMMEDIATE');
    try { const result = fn(); db.exec('COMMIT'); return result; }
    catch (error) { db.exec('ROLLBACK'); throw error; }
  }
  function summary() {
    return {
      paused: store.setting('outreach_paused') !== 'false',
      contacts: db.prepare('SELECT variant,state,count(*) count FROM outreach_contacts GROUP BY variant,state').all(),
      campaigns: db.prepare('SELECT * FROM outreach_campaigns').all(),
      suppressed: db.prepare('SELECT count(*) count FROM outreach_suppression').get().count,
      limits: { total: 500, each_offer: 250, local_start: '09:00', local_end: '17:00', weekdays: 'Monday-Friday' },
    };
  }
  return {
    summary,
    importContacts(input) {
      const rows = z.array(contactSchema).min(1).max(500).parse(input);
      return transaction(() => {
        for (const row of rows) {
          const old = db.prepare('SELECT * FROM outreach_contacts WHERE phone=?').get(row.phone);
          if (old && (old.variant !== row.variant || old.lead_id !== row.lead_id || old.timezone !== row.timezone)) {
            throw new Error('A phone already has a different lead, offer or timezone. Review it before replacing.');
          }
          db.prepare(`INSERT INTO outreach_contacts(phone,lead_id,variant,timezone,timezone_evidence,eligibility_evidence,updated_at)
            VALUES(?,?,?,?,?,?,?) ON CONFLICT(phone) DO UPDATE SET timezone_evidence=excluded.timezone_evidence,
            eligibility_evidence=excluded.eligibility_evidence,updated_at=excluded.updated_at`)
            .run(row.phone,row.lead_id,row.variant,row.timezone,row.timezone_evidence,row.eligibility_evidence,now());
        }
        if (db.prepare('SELECT variant FROM outreach_contacts GROUP BY variant HAVING count(*)>250').get()) {
          throw new Error('The first batch is limited to 250 unique phones per offer.');
        }
        return summary();
      });
    },
    register(input) {
      const data = z.object({ id: z.uuid(), variant }).strict().parse(input);
      const old = db.prepare('SELECT variant FROM outreach_campaigns WHERE id=?').get(data.id);
      if (old && old.variant !== data.variant) throw new Error('Campaign offer cannot change');
      db.prepare('INSERT OR IGNORE INTO outreach_campaigns(id,variant) VALUES(?,?)').run(data.id,data.variant);
      return summary();
    },
    pause(input) {
      const data = z.object({ paused: z.boolean() }).strict().parse(input);
      if (!data.paused && store.setting('paused') === 'true') throw new Error('Website production is paused');
      store.setting('outreach_paused', String(data.paused));
      return summary();
    },
    suppress(call, input) {
      // The authenticated call context supplies the number; the LLM cannot choose another person.
      const number = phone.parse(call?.customer?.number);
      const callId = z.string().min(1).max(200).parse(call?.id);
      const data = z.object({ reason: z.string().trim().min(1).max(500) }).strict().parse(input);
      db.prepare('INSERT OR IGNORE INTO outreach_suppression(phone,call_id,reason,recorded_at) VALUES(?,?,?,?)')
        .run(number,callId,data.reason,now());
      return { suppressed: true, message: 'The calling number is on the do-not-call list for both website campaigns.' };
    },
    suppressions() { return db.prepare('SELECT * FROM outreach_suppression ORDER BY recorded_at').all(); },
    predial(message) {
      return transaction(() => {
        const deny = { eligible: false };
        if (store.setting('outreach_paused') !== 'false' || store.setting('paused') === 'true') return deny;
        if (!phone.safeParse(message.contact?.number).success || typeof message.contact?.id !== 'string') return deny;
        const campaign = db.prepare('SELECT * FROM outreach_campaigns WHERE id=?').get(message.campaignId || '');
        const contact = db.prepare('SELECT * FROM outreach_contacts WHERE phone=?').get(message.contact.number);
        if (!campaign || !contact || campaign.variant !== contact.variant) return deny;
        if (db.prepare('SELECT phone FROM outreach_suppression WHERE phone=?').get(contact.phone)) return deny;
        if (!['ready','reserved'].includes(contact.state)) return deny;
        if (contact.contact_id && contact.contact_id !== message.contact.id) return deny;
        if (contact.campaign_id && contact.campaign_id !== message.campaignId) return deny;
        const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
          timeZone: contact.timezone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
        }).formatToParts(new Date(now())).map(p => [p.type,p.value]));
        if (!['Mon','Tue','Wed','Thu','Fri'].includes(parts.weekday) || +parts.hour < 9 || +parts.hour >= 17) return deny;
        db.prepare("UPDATE outreach_contacts SET state='reserved',contact_id=?,campaign_id=?,reserved_at=coalesce(reserved_at,?),updated_at=? WHERE phone=?")
          .run(message.contact.id,message.campaignId,now(),now(),contact.phone);
        return { eligible: true };
      });
    },
    event(message) {
      const campaign = db.prepare('SELECT * FROM outreach_campaigns WHERE id=?').get(message.campaignId || '');
      const data = message.data;
      if (!campaign || typeof data?.contactId !== 'string') return { ignored: true };
      const states = { 'contact.dispatched':'dispatched', 'contact.completed':'completed', 'contact.failed':'failed',
        'contact.skipped':'skipped', 'contact.predial-failed':'predial-failed' };
      const state = states[message.eventType];
      if (!state) return { ignored: true };
      // Late dispatched events cannot overwrite terminal outcomes. Never reset an attempt to ready.
      db.prepare(`UPDATE outreach_contacts SET state=?,call_id=coalesce(call_id,?),updated_at=?
        WHERE contact_id=? AND variant=? AND campaign_id=? AND state IN ('reserved','dispatched')`)
        .run(state,typeof data.callId === 'string' ? data.callId : null,now(),data.contactId,campaign.variant,message.campaignId);
      return { received: true };
    },
  };
}
