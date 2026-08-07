/* mailer.js — Resend sending for the sequence.
 *
 * Batched: POST /emails/batch takes up to 100 messages per request, and Resend
 * allows ~2 requests/second, so a 100-recipient day is a single call. Chunks
 * are spaced to stay under that.
 *
 * Every send carries List-Unsubscribe + List-Unsubscribe-Post. That is legally
 * required at this volume and it is also the cheapest way to keep complaints
 * down — people who can leave in one click do that instead of hitting "spam",
 * and a spam complaint costs far more than an unsubscribe.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const SEQUENCE_FROM_EMAIL = process.env.SEQUENCE_FROM_EMAIL ||
  process.env.LEAD_FROM_EMAIL || 'hello@onetimesuite.com';
const REPLY_TO = process.env.SEQUENCE_REPLY_TO || '';

const DRY_RUN = process.env.DRIP_DRY_RUN === '1';
const ALLOWLIST = (process.env.DRIP_TEST_ALLOWLIST || '')
  .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

const BATCH_SIZE = 100;
const BATCH_GAP_MS = 600;

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* Would this address actually receive mail, or is it held back by a switch? */
function isLive(email) {
  if (DRY_RUN || !RESEND_API_KEY) return false;
  if (ALLOWLIST.length) return ALLOWLIST.includes(String(email).toLowerCase());
  return true;
}

async function resendBatch(payload) {
  const r = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: { authorization: `Bearer ${RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30_000),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`resend ${r.status}: ${text.slice(0, 200)}`);
  try { return JSON.parse(text); } catch { return {}; }
}

/* items: [{ email, step, msg: {subject, html, text, tag}, headers }]
   Always resolves — a failed chunk marks its own items failed rather than
   throwing, so one bad batch can't abort the whole day. */
async function sendBatch(items) {
  const out = [];
  const live = [];

  for (const it of items) {
    if (isLive(it.email)) live.push(it);
    else {
      console.log(`[drip dry] step ${it.step} -> ${it.email} :: ${it.msg.subject}`);
      out.push({ ok: true, dry: true, email: it.email, step: it.step, tag: it.msg.tag, id: null });
    }
  }

  for (let i = 0; i < live.length; i += BATCH_SIZE) {
    const chunk = live.slice(i, i + BATCH_SIZE);
    const payload = chunk.map(it => {
      const m = {
        from: SEQUENCE_FROM_EMAIL,
        to: [it.email],
        subject: it.msg.subject,
        html: it.msg.html,
        text: it.msg.text,
      };
      if (it.headers && Object.keys(it.headers).length) m.headers = it.headers;
      if (REPLY_TO) m.reply_to = REPLY_TO;
      return m;
    });

    try {
      const res = await resendBatch(payload);
      const ids = (res && res.data) || [];
      chunk.forEach((it, k) => out.push({
        ok: true, email: it.email, step: it.step, tag: it.msg.tag,
        id: (ids[k] && ids[k].id) || null,
      }));
    } catch (err) {
      console.log(`drip batch failed (${chunk.length} recipients):`, err.message);
      chunk.forEach(it => out.push({ ok: false, email: it.email, step: it.step, err: err.message }));
    }

    if (i + BATCH_SIZE < live.length) await sleep(BATCH_GAP_MS);
  }

  return out;
}

const mode = () => {
  if (!RESEND_API_KEY) return 'no api key — nothing will send';
  if (DRY_RUN) return 'DRY RUN — rendering only';
  if (ALLOWLIST.length) return `allowlist only (${ALLOWLIST.join(', ')})`;
  return 'LIVE — real subscribers will receive mail';
};

module.exports = { sendBatch, isLive, mode, SEQUENCE_FROM_EMAIL };
