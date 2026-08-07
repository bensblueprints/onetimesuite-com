/* drip-sim.js — simulate the whole sequence against a throwaway database.
 *
 * No test framework, matching the house style. Run before every deploy:
 *   node scripts/drip-sim.js
 *
 * Asserts the failure modes that actually cost money:
 *   - a step is never sent twice, even on a double tick
 *   - an outage produces skips, not a burst of catch-up mail
 *   - unsubscribing stops the sequence dead
 *   - a second coupon for one address is refused
 *   - the $997 bundle plan can never be couponed
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'drip-sim-'));
process.env.DATA_FILE = path.join(TMP, 'leads.jsonl');
process.env.DB_FILE = path.join(TMP, 'sim.db');
process.env.DRIP_ENABLED = '0';        // never start the real timer
process.env.DRIP_DRY_RUN = '1';        // never touch Resend
process.env.DRIP_CADENCE = process.env.DRIP_CADENCE || 'daily';
process.env.COUPON_SECRET = 'sim-secret';
process.env.WHOP_DRY_RUN = '1';
process.env.SITE_URL = 'https://onetimesuite.com';

const store = require('../server/store.js');
const drip = require('../server/drip.js');
const plan = require('../server/drip-plan.js');
const whop = require('../server/whop.js');

let passed = 0, failed = 0;
const ok = (label, cond) => {
  if (cond) { console.log(`ok    ${label}`); passed++; }
  else { console.log(`FAIL  ${label}`); failed++; process.exitCode = 1; }
};

const START = '2026-01-01';
const day = n => new Date(Date.parse(START + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
const seed = email => {
  store.upsertSubscriber({ email, name: email.split('@')[0], source: 'sim', startTs: START + 'T09:00:00.000Z' });
  store.claimStep(email, 1);
  store.finishStep(email, 1, { status: 'sent', tag: 'welcome' });
};

/* Silence the per-message dry-run chatter — 100s of lines otherwise. */
const realLog = console.log;
const quiet = fn => { console.log = () => {}; return Promise.resolve(fn()).finally(() => { console.log = realLog; }); };

(async () => {
  console.log(`drip-sim · cadence=${plan.CADENCE} · ${plan.catalogSize()} live apps\n`);

  /* ---- 1. run 40 days, twice each -------------------------------------- */
  for (const e of ['a@example.com', 'b@example.com', 'c@example.com']) seed(e);
  ok('3 subscribers seeded', store.counts().subscribers === 3);

  const RUN = 40;
  await quiet(async () => {
    for (let d = 0; d < RUN; d++) {
      await drip.runDay(day(d));
      await drip.runDay(day(d));      // double tick: must be a no-op
    }
  });

  const db = store.open();
  const dupes = db.prepare('SELECT email, step, COUNT(*) AS n FROM sends GROUP BY email, step HAVING n > 1').all();
  ok('no (email, step) was sent twice', dupes.length === 0);

  const aSteps = [...store.sentSteps('a@example.com')].sort((x, y) => x - y);
  ok(`subscriber walked the sequence (${aSteps.length} steps by day ${RUN})`, aSteps.length > 5);
  ok('sequence starts at step 1', aSteps[0] === 1);
  ok('no step exceeds the plan length', aSteps[aSteps.length - 1] <= plan.TOTAL);

  /* ---- 2. re-running an old day adds nothing --------------------------- */
  const before = db.prepare("SELECT COUNT(*) AS n FROM sends WHERE status = 'sent'").get().n;
  await quiet(() => drip.runDay(day(RUN - 1)));
  const after = db.prepare("SELECT COUNT(*) AS n FROM sends WHERE status = 'sent'").get().n;
  ok('re-running an already-processed day adds no sends', after === before);

  /* ---- 3. an outage produces skips, not a burst ------------------------ */
  /* Pick a day that IS a send day under the active cadence — under 'taper'
     many offsets are deliberately quiet, and resuming on one of those proves
     nothing. */
  let gapDay = 20;
  while (gapDay < 60 && !plan.stepForOffset(gapDay)) gapDay++;
  const gapStep = plan.stepForOffset(gapDay);

  const gap = 'gap@example.com';
  seed(gap);
  await quiet(() => drip.runDay(day(gapDay)));      // every prior day "missed"
  const rows = db.prepare('SELECT status, COUNT(*) AS n FROM sends WHERE email = ? GROUP BY status').all(gap);
  const n = s => (rows.find(r => r.status === s) || { n: 0 }).n;
  ok(`outage: only 1 new email after a ${gapDay}-day gap (sent=${n('sent')} incl. welcome, resumed at step ${gapStep})`,
    n('sent') === 2);
  ok(`outage: the gap was closed as skips (skipped=${n('skipped')}, expected ${gapStep - 2})`,
    n('skipped') === gapStep - 2);

  /* ---- 4. unsubscribe halts the sequence -------------------------------- */
  store.unsubscribe('a@example.com', 'sim');
  const beforeUnsub = store.sentSteps('a@example.com').size;
  await quiet(async () => { for (let d = RUN; d < RUN + 10; d++) await drip.runDay(day(d)); });
  ok('no sends after unsubscribe', store.sentSteps('a@example.com').size === beforeUnsub);

  /* ---- 5. one coupon per address, deterministic codes ------------------- */
  const cEmail = 'coupon@example.com';
  const app = whop.eligible()[0];
  const code = whop.couponCode(cEmail, app.slug, 0);
  ok('first coupon reservation succeeds',
    store.reserveCoupon({ email: cEmail, code, slug: app.slug, planId: app.planId, productId: app.productId, price: app.price }) === true);
  ok('a second reservation for the same address is refused',
    store.reserveCoupon({ email: cEmail, code: code + 'X', slug: app.slug, planId: app.planId, productId: app.productId, price: app.price }) === false);
  ok('the code is deterministic across retries', whop.couponCode(cEmail, app.slug, 0) === code);
  ok('a new attempt yields a different code', whop.couponCode(cEmail, app.slug, 1) !== code);
  store.settleCoupon(cEmail, { status: 'minted', whopId: null, expiresAt: null });

  /* ---- 6. the bundle can never be couponed ------------------------------ */
  const BUNDLE = 'plan_5Mv4jYmDfZH3a';
  const eligiblePlans = new Set(whop.eligible().map(a => a.planId));
  ok('bundle plan is absent from the eligible catalog', !eligiblePlans.has(BUNDLE));
  const minted = db.prepare('SELECT plan_id FROM coupons').all();
  ok('no coupon row points at the bundle', !minted.some(m => m.plan_id === BUNDLE));
  ok('every coupon targets an eligible plan', minted.every(m => eligiblePlans.has(m.plan_id)));

  /* ---- 7. offer emails stop once a coupon exists ------------------------ */
  const offerStep = Number(Object.keys(plan.FIXED).find(k => plan.FIXED[k] === 'offer'));
  ok('offer email is suppressed for someone who already claimed',
    plan.render(offerStep, {}, { hasCoupon: true }) === null);
  ok('offer email still renders for someone who has not',
    plan.render(offerStep, {}, { hasCoupon: false }) !== null);

  /* ---- 8. webinar invites stop once watched ----------------------------- */
  const webStep = Number(Object.keys(plan.FIXED).find(k => plan.FIXED[k] === 'webinar'));
  ok('webinar invite is suppressed for someone who watched',
    plan.render(webStep, { watch_qualified: 1 }, {}) === null);

  /* ---- 9. sequence shape ------------------------------------------------ */
  const seen = new Set();
  let empty = 0;
  for (const s of plan.spotlightSteps) { const a = plan.appForStep(s); if (a) seen.add(a.slug); else empty++; }
  ok(`every live app gets exactly one spotlight (${seen.size}/${plan.catalogSize()}, ${empty} empty)`,
    seen.size === plan.catalogSize() && empty === 0);

  /* Scan far enough for the slowest cadence: 100 weekly emails span ~700 days. */
  let scheduled = 0, lastOffset = 0;
  for (let d = 0; d < 900; d++) if (plan.stepForOffset(d)) { scheduled++; lastOffset = d; }
  ok(`cadence "${plan.CADENCE}" schedules exactly ${plan.TOTAL} emails (got ${scheduled}, last on day ${lastOffset})`,
    scheduled === plan.TOTAL);

  /* ---- 10. every step renders without throwing -------------------------- */
  let rendered = 0, skippedSteps = 0;
  for (let s = 1; s <= plan.TOTAL; s++) {
    const m = plan.render(s, {}, { unsubUrl: 'https://x/u' });
    if (!m) { skippedSteps++; continue; }
    if (!m.subject || !m.html || !m.text) { ok(`step ${s} has subject/html/text`, false); break; }
    rendered++;
  }
  ok(`all ${plan.TOTAL} steps render (${rendered} emails, ${skippedSteps} intentionally blank)`,
    rendered + skippedSteps === plan.TOTAL && rendered > 90);

  console.log(`\n${passed} passed, ${failed} failed`);
  try { store.close(); } catch {}
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch {}
})();
