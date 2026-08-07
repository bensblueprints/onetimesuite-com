/* store.js — subscriber / sequence / coupon state.
 *
 * SQLite via node:sqlite (built into Node 22.13+, so still zero npm deps).
 * The Dockerfile pins node:22.14-alpine; if that base ever moves below 22.13
 * this require throws at boot, which is deliberate — a loud failure beats
 * silently losing the drip.
 *
 * Two constraints in the schema carry most of the correctness:
 *   sends   PRIMARY KEY (email, step)  -> a step can never be sent twice
 *   coupons PRIMARY KEY (email)        -> an address can never mint two coupons
 * Both are enforced by the database, not by application logic, so no race,
 * retry or restart can get around them.
 */

const fs = require('fs');
const path = require('path');

let sqlite;
try {
  sqlite = require('node:sqlite');
} catch (err) {
  throw new Error(
    'node:sqlite unavailable (Node ' + process.version + '). ' +
    'Needs Node >= 22.13 — check the Dockerfile base image pin. Original: ' + err.message);
}

const DATA_FILE = process.env.DATA_FILE || '/data/leads.jsonl';
const DB_FILE = process.env.DB_FILE || path.join(path.dirname(DATA_FILE), 'suite.db');

let db = null;

/* ---------------- schema ---------------------------------------------------- */

const SCHEMA = `
CREATE TABLE IF NOT EXISTS subscribers (
  email           TEXT PRIMARY KEY,
  name            TEXT NOT NULL DEFAULT '',
  source          TEXT NOT NULL DEFAULT '',
  start_ts        TEXT NOT NULL,
  unsubscribed_at TEXT,
  bounced         INTEGER NOT NULL DEFAULT 0,
  complained      INTEGER NOT NULL DEFAULT 0,
  watch_sec       REAL    NOT NULL DEFAULT 0,
  watch_qualified INTEGER NOT NULL DEFAULT 0,
  watch_at        TEXT
);

/* One row per (subscriber, sequence step). Inserted as 'pending' BEFORE the
   send is attempted, so a crash mid-send cannot produce a duplicate on retry. */
CREATE TABLE IF NOT EXISTS sends (
  email     TEXT    NOT NULL,
  step      INTEGER NOT NULL,
  status    TEXT    NOT NULL,
  tag       TEXT,
  resend_id TEXT,
  dry       INTEGER NOT NULL DEFAULT 0,
  note      TEXT,
  ts        TEXT    NOT NULL,
  PRIMARY KEY (email, step)
);

CREATE TABLE IF NOT EXISTS coupons (
  email      TEXT PRIMARY KEY,
  code       TEXT NOT NULL UNIQUE,
  slug       TEXT NOT NULL,
  plan_id    TEXT NOT NULL,
  product_id TEXT,
  price      INTEGER,
  status     TEXT NOT NULL,
  whop_id    TEXT,
  attempt    INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT,
  redeemed   INTEGER NOT NULL DEFAULT 0,
  ts         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  ts    TEXT NOT NULL,
  email TEXT,
  kind  TEXT NOT NULL,
  data  TEXT
);

CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT NOT NULL);

CREATE INDEX IF NOT EXISTS idx_sends_email  ON sends (email);
CREATE INDEX IF NOT EXISTS idx_events_email ON events (email, id);
`;

function open() {
  if (db) return db;
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  db = new sqlite.DatabaseSync(DB_FILE);
  /* WAL survives a hard kill mid-write; NORMAL sync is the right trade for a
     low-traffic marketing DB that is also backed by leads.jsonl. */
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA synchronous = NORMAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(SCHEMA);
  return db;
}

const now = () => new Date().toISOString();

/* ---------------- events ---------------------------------------------------- */

function logEvent(kind, email, data) {
  open().prepare('INSERT INTO events (ts, email, kind, data) VALUES (?, ?, ?, ?)')
    .run(now(), email || null, kind, data == null ? null : JSON.stringify(data));
}

/* ---------------- subscribers ----------------------------------------------- */

/* Idempotent: re-signup keeps the ORIGINAL start_ts so the sequence day does
   not reset, and never resurrects an unsubscribed contact. */
function upsertSubscriber({ email, name = '', source = '', startTs = null }) {
  const d = open();
  const existing = d.prepare('SELECT email, unsubscribed_at FROM subscribers WHERE email = ?').get(email);
  if (existing) {
    d.prepare('UPDATE subscribers SET name = COALESCE(NULLIF(?, \'\'), name), source = COALESCE(NULLIF(?, \'\'), source) WHERE email = ?')
      .run(name, source, email);
    return { created: false, resubscribed: false };
  }
  d.prepare('INSERT INTO subscribers (email, name, source, start_ts) VALUES (?, ?, ?, ?)')
    .run(email, name, source, startTs || now());
  logEvent('subscribe', email, { source });
  return { created: true, resubscribed: false };
}

const getSubscriber = email =>
  open().prepare('SELECT * FROM subscribers WHERE email = ?').get(email) || null;

/* Everyone eligible to receive sequence mail. */
const activeSubscribers = () =>
  open().prepare(
    'SELECT * FROM subscribers WHERE unsubscribed_at IS NULL AND bounced = 0 AND complained = 0 ORDER BY start_ts'
  ).all();

const allSubscribers = () =>
  open().prepare('SELECT * FROM subscribers ORDER BY start_ts DESC').all();

function unsubscribe(email, via = 'link') {
  const r = open().prepare('UPDATE subscribers SET unsubscribed_at = ? WHERE email = ? AND unsubscribed_at IS NULL')
    .run(now(), email);
  if (r.changes) logEvent('unsubscribe', email, { via });
  return r.changes > 0;
}

function suppress(email, reason) {
  const col = reason === 'complained' ? 'complained' : 'bounced';
  const r = open().prepare(`UPDATE subscribers SET ${col} = 1 WHERE email = ?`).run(email);
  if (r.changes) logEvent('suppress', email, { reason });
  return r.changes > 0;
}

function setWatch(email, sec, qualified) {
  open().prepare('UPDATE subscribers SET watch_sec = ?, watch_qualified = ?, watch_at = ? WHERE email = ?')
    .run(sec, qualified ? 1 : 0, now(), email);
}

/* ---------------- sends ------------------------------------------------------ */

/* Claim a step before sending. Returns false if this (email, step) already
   exists — the PRIMARY KEY, not a check-then-act, is what makes this safe. */
function claimStep(email, step) {
  try {
    open().prepare('INSERT INTO sends (email, step, status, ts) VALUES (?, ?, \'pending\', ?)')
      .run(email, step, now());
    return true;
  } catch (err) {
    if (/UNIQUE|PRIMARY KEY|constraint/i.test(err.message)) return false;
    throw err;
  }
}

function finishStep(email, step, { status, tag = null, resendId = null, dry = false, note = null }) {
  open().prepare('UPDATE sends SET status = ?, tag = ?, resend_id = ?, dry = ?, note = ?, ts = ? WHERE email = ? AND step = ?')
    .run(status, tag, resendId, dry ? 1 : 0, note, now(), email, step);
}

/* Mark a range of missed steps as skipped in one statement — the outage
   catch-up path. Never sends; just closes the gap so the sequence moves on. */
function skipStepsBelow(email, step, note = 'catch-up') {
  const d = open();
  const stmt = d.prepare('INSERT OR IGNORE INTO sends (email, step, status, note, ts) VALUES (?, ?, \'skipped\', ?, ?)');
  let n = 0;
  for (let m = 1; m < step; m++) n += stmt.run(email, m, note, now()).changes;
  return n;
}

const sentSteps = email =>
  new Set(open().prepare('SELECT step FROM sends WHERE email = ?').all(email).map(r => r.step));

const sendStats = email =>
  open().prepare(
    "SELECT COUNT(*) AS total, SUM(status = 'sent') AS sent, MAX(CASE WHEN status = 'sent' THEN ts END) AS last_sent FROM sends WHERE email = ?"
  ).get(email) || { total: 0, sent: 0, last_sent: null };

/* ---------------- coupons ---------------------------------------------------- */

const getCoupon = email =>
  open().prepare('SELECT * FROM coupons WHERE email = ?').get(email) || null;

/* Reserve the row before calling Whop. A UNIQUE violation here means another
   request already claimed this address — the caller returns that coupon. */
function reserveCoupon({ email, code, slug, planId, productId, price, attempt = 0 }) {
  try {
    open().prepare(
      'INSERT INTO coupons (email, code, slug, plan_id, product_id, price, status, attempt, ts) VALUES (?, ?, ?, ?, ?, ?, \'pending\', ?, ?)'
    ).run(email, code, slug, planId, productId || null, price == null ? null : price, attempt, now());
    return true;
  } catch (err) {
    if (/UNIQUE|PRIMARY KEY|constraint/i.test(err.message)) return false;
    throw err;
  }
}

function settleCoupon(email, { status, whopId = null, expiresAt = null }) {
  open().prepare('UPDATE coupons SET status = ?, whop_id = ?, expires_at = ?, ts = ? WHERE email = ?')
    .run(status, whopId, expiresAt, now(), email);
  logEvent('coupon:' + status, email, { whopId });
}

const dropCoupon = email => open().prepare('DELETE FROM coupons WHERE email = ?').run(email).changes > 0;

const couponStats = () =>
  open().prepare(
    "SELECT COUNT(*) AS total, SUM(status = 'minted') AS minted, SUM(CASE WHEN status = 'minted' THEN COALESCE(price, 0) ELSE 0 END) AS face_value FROM coupons"
  ).get() || { total: 0, minted: 0, face_value: 0 };

/* ---------------- meta ------------------------------------------------------- */

const getMeta = k => { const r = open().prepare('SELECT v FROM meta WHERE k = ?').get(k); return r ? r.v : null; };
const setMeta = (k, v) =>
  open().prepare('INSERT INTO meta (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v').run(k, String(v));

/* ---------------- migration from leads.jsonl --------------------------------- */

/* One-way import. leads.jsonl stays the source of record for the admin Leads
   view and as a backup; this only seeds subscriber rows so the sequence has
   something to walk. Safe to run on every boot — upsert is idempotent. */
function migrateFromJsonl() {
  if (getMeta('jsonl_migrated_at')) return { skipped: true, imported: 0 };
  let raw;
  try { raw = fs.readFileSync(DATA_FILE, 'utf8'); } catch { setMeta('jsonl_migrated_at', now()); return { skipped: false, imported: 0 }; }

  let imported = 0;
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    let rec;
    try { rec = JSON.parse(line); } catch { continue; }
    if (rec.type === 'survey') continue;
    const email = String(rec.email || '').trim().toLowerCase();
    if (!email) continue;
    const r = upsertSubscriber({
      email,
      name: String(rec.name || ''),
      source: String(rec.source || 'import'),
      startTs: rec.ts || now(),
    });
    if (r.created) imported++;
  }
  setMeta('jsonl_migrated_at', now());
  logEvent('migrate', null, { imported });
  return { skipped: false, imported };
}

function counts() {
  const d = open();
  const g = sql => (d.prepare(sql).get() || {}).n || 0;
  return {
    subscribers: g('SELECT COUNT(*) AS n FROM subscribers'),
    active: g('SELECT COUNT(*) AS n FROM subscribers WHERE unsubscribed_at IS NULL AND bounced = 0 AND complained = 0'),
    unsubscribed: g('SELECT COUNT(*) AS n FROM subscribers WHERE unsubscribed_at IS NOT NULL'),
    suppressed: g('SELECT COUNT(*) AS n FROM subscribers WHERE bounced = 1 OR complained = 1'),
    qualified: g('SELECT COUNT(*) AS n FROM subscribers WHERE watch_qualified = 1'),
    sends: g("SELECT COUNT(*) AS n FROM sends WHERE status = 'sent'"),
  };
}

module.exports = {
  open, close: () => { if (db) { db.close(); db = null; } },
  DB_FILE, logEvent,
  upsertSubscriber, getSubscriber, activeSubscribers, allSubscribers,
  unsubscribe, suppress, setWatch,
  claimStep, finishStep, skipStepsBelow, sentSteps, sendStats,
  getCoupon, reserveCoupon, settleCoupon, dropCoupon, couponStats,
  getMeta, setMeta, migrateFromJsonl, counts,
};
