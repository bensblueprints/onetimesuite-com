/* drip.js — the daily scheduler.
 *
 * Each subscriber walks the sequence from their OWN signup date, so there is
 * no global broadcast day and volume ramps naturally with acquisition.
 *
 * Two properties matter more than anything else here:
 *
 * 1. A step is never sent twice. Guaranteed by store.claimStep()'s PRIMARY KEY
 *    (email, step) — not by a check-then-act in this file. A restart, a double
 *    tick, or two processes racing all fail the insert instead of double-sending.
 *
 * 2. An outage never causes a burst. After three days down, the naive design
 *    sends everyone three emails at once, complaints spike, and the sending
 *    domain gets filtered — which would also take down purchase receipts and
 *    coupon delivery. Instead the gap is marked 'skipped' and only the current
 *    step goes out. Content is lost; the domain is not.
 */

const store = require('./store.js');
const plan = require('./drip-plan.js');
const mailer = require('./mailer.js');

const ENABLED = process.env.DRIP_ENABLED === '1';
const LEADER = process.env.DRIP_LEADER !== '0';
const SEND_HOUR = Number(process.env.DRIP_SEND_HOUR_UTC ?? 14);
const MAX_PER_TICK = Number(process.env.DRIP_MAX_PER_TICK) || 100;
const CLOCK_OFFSET_DAYS = Number(process.env.DRIP_CLOCK_OFFSET_DAYS) || 0;
const TICK_MS = 60_000;

let lastTickAt = null;
let running = false;

const todayUTC = (offsetDays = CLOCK_OFFSET_DAYS) =>
  new Date(Date.now() + offsetDays * 864e5).toISOString().slice(0, 10);

const dayOffset = (startTs, todayISO) =>
  Math.floor((Date.parse(todayISO + 'T00:00:00Z') - Date.parse(String(startTs).slice(0, 10) + 'T00:00:00Z')) / 864e5);

/* The step due for this subscriber today, or null. */
function dueStep(sub, todayISO, sent) {
  const off = dayOffset(sub.start_ts, todayISO);
  if (off < 0) return null;
  const n = plan.stepForOffset(off);
  if (n == null || n > plan.TOTAL) return null;
  if (sent.has(n)) return null;
  return n;
}

/* Build the day's work. Pure — no sending — so the admin preview can call it. */
function planDay(todayISO, { limit = MAX_PER_TICK } = {}) {
  const work = [];
  for (const sub of store.activeSubscribers()) {
    const sent = store.sentSteps(sub.email);
    const n = dueStep(sub, todayISO, sent);
    if (n == null) continue;

    const coupon = store.getCoupon(sub.email);
    const msg = plan.render(n, sub, {
      hasCoupon: Boolean(coupon && coupon.status === 'minted'),
      unsubUrl: null,
    });

    work.push({ sub, step: n, msg, skipReason: msg ? null : 'no-content' });
    if (work.length >= limit) break;
  }
  return work;
}

async function runDay(todayISO, { unsubUrlFor = () => null, unsubHeadersFor = () => ({}) } = {}) {
  const work = planDay(todayISO);
  const items = [];

  for (const w of work) {
    /* Close any gap BEFORE claiming today's step, so an outage becomes a run
       of 'skipped' rows rather than a burst of catch-up mail. */
    const closed = store.skipStepsBelow(w.sub.email, w.step, 'catch-up');
    if (closed) store.logEvent('catch-up', w.sub.email, { closed, upTo: w.step });

    if (!store.claimStep(w.sub.email, w.step)) continue;   // already sent — race lost, fine

    if (!w.msg) {
      store.finishStep(w.sub.email, w.step, { status: 'skipped', note: w.skipReason });
      continue;
    }

    const unsubUrl = unsubUrlFor(w.sub.email);
    const msg = unsubUrl
      ? plan.render(w.step, w.sub, {
          hasCoupon: Boolean((store.getCoupon(w.sub.email) || {}).status === 'minted'),
          unsubUrl,
        }) || w.msg
      : w.msg;

    items.push({ email: w.sub.email, step: w.step, msg, headers: unsubHeadersFor(w.sub.email) });
  }

  if (!items.length) {
    console.log(`drip ${todayISO}: nothing due`);
    return { attempted: 0, sent: 0, failed: 0 };
  }

  const results = await mailer.sendBatch(items);
  let sent = 0, failed = 0;
  for (const r of results) {
    if (r.ok) {
      sent++;
      store.finishStep(r.email, r.step, { status: 'sent', tag: r.tag, resendId: r.id, dry: r.dry });
    } else {
      failed++;
      /* Leave the row as failed rather than deleting it: retrying tomorrow
         would send a step out of order, and the gap logic covers it anyway. */
      store.finishStep(r.email, r.step, { status: 'failed', note: String(r.err).slice(0, 200) });
    }
  }
  console.log(`drip ${todayISO}: attempted ${items.length} · sent ${sent} · failed ${failed}`);
  return { attempted: items.length, sent, failed };
}

async function tick(ctx = {}) {
  if (!ENABLED || !LEADER || running) return;
  const today = todayUTC();
  if (store.getMeta('last_tick_day') === today) return;
  if (new Date().getUTCHours() < SEND_HOUR) return;

  running = true;
  try {
    /* Marker first: a crash mid-run must not re-run the whole day on restart.
       Per-step claims make that safe anyway, but this avoids the churn. */
    store.setMeta('last_tick_day', today);
    lastTickAt = new Date().toISOString();
    await runDay(today, ctx);
  } catch (err) {
    console.log('drip tick failed:', err.message);
  } finally {
    running = false;
  }
}

function start(ctx = {}) {
  console.log(`drip: ${ENABLED ? 'ENABLED' : 'disabled'} · cadence ${plan.CADENCE}` +
    ` · send hour ${SEND_HOUR}:00 UTC · ${mailer.mode()}`);
  if (!ENABLED) return null;
  const t = setInterval(() => { tick(ctx); }, TICK_MS);
  t.unref();
  return t;
}

const health = () => ({
  enabled: ENABLED,
  cadence: plan.CADENCE,
  mode: mailer.mode(),
  lastTickDay: store.getMeta('last_tick_day'),
  lastTickAt,
});

module.exports = { start, tick, runDay, planDay, dueStep, dayOffset, todayUTC, health };
