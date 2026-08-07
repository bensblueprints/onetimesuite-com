/*
 * api.js — tiny zero-dependency lead-capture + admin API for onetimesuite.com
 *
 * Node 22, built-ins only (http, fs, path, crypto). Runs next to nginx in the
 * same container; nginx proxies /api/ here on 127.0.0.1:3100.
 *
 * Routes:
 *   GET  /api/health          liveness probe
 *   POST /api/lead            {name, email, source?} — capture a lead, best-effort Resend welcome
 *   POST /api/survey          {email, tools[], other?} — post-signup survey (no lead required)
 *   POST /api/admin/login     {username, password} -> {token}
 *   GET  /api/admin/leads     leads (newest first) with surveys merged in + orphan surveys
 *   GET  /api/admin/checklist launch checklist markdown
 *
 * DATA_FILE holds one JSON object per line. Lead lines have no `type` field
 * (or type:"lead"); survey lines have type:"survey".
 *
 * Env:
 *   API_PORT           listen port (default 3100; NOT "PORT" — Coolify injects PORT=80,
 *                      which collided with nginx and crashed the process)
 *   DATA_FILE          leads store, one JSON object per line (default /data/leads.jsonl)
 *   CHECKLIST_FILE     launch checklist markdown (default /app/NEXT-UP.md)
 *   ADMIN_USER_1/ADMIN_PASS_1, ADMIN_USER_2/ADMIN_PASS_2  admin credentials (env only)
 *   RESEND_API_KEY     if set, subscribe lead to audience + send welcome email
 *   RESEND_AUDIENCE_ID Resend audience id
 *   LEAD_FROM_EMAIL    From: address for the welcome email
 *   GITHUB_URL         default https://github.com/bensblueprints
 *   SITE_URL           default https://onetimesuite.com
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const store = require('./store.js');
const whop = require('./whop.js');
const webinar = require('./webinar.js');
const drip = require('./drip.js');
const dripPlan = require('./drip-plan.js');

const PORT = Number(process.env.API_PORT) || 3100;
const DATA_FILE = process.env.DATA_FILE || '/data/leads.jsonl';
const CHECKLIST_FILE = process.env.CHECKLIST_FILE || '/app/NEXT-UP.md';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID || '';
const LEAD_FROM_EMAIL = process.env.LEAD_FROM_EMAIL || 'hello@onetimesuite.com';
const GITHUB_URL = process.env.GITHUB_URL || 'https://github.com/bensblueprints';
const SITE_URL = process.env.SITE_URL || 'https://onetimesuite.com';

/* Unsubscribe links are signed with their OWN secret, deliberately not the
   admin-password-derived TOKEN_SECRET below: rotating an admin password must
   never invalidate links already sitting in delivered inboxes. Never rotate. */
const UNSUB_SECRET = process.env.UNSUB_SECRET || '';
const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET || '';

const ADMINS = [
  [process.env.ADMIN_USER_1, process.env.ADMIN_PASS_1],
  [process.env.ADMIN_USER_2, process.env.ADMIN_PASS_2],
].filter(([u, p]) => u && p);

/* HMAC secret for session tokens: derived from the configured admin passwords,
   never stored anywhere outside env. Empty when admin isn't configured. */
const TOKEN_SECRET = ADMINS.length
  ? crypto.createHash('sha256')
      .update(String(process.env.ADMIN_PASS_1 || ''))
      .update(String(process.env.ADMIN_PASS_2 || ''))
      .digest()
  : null;

const TOKEN_TTL_SEC = 12 * 60 * 60; // 12h

const sha256 = s => crypto.createHash('sha256').update(String(s)).digest();
const b64url = s => Buffer.from(s, 'utf8').toString('base64url');
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;

function send(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(body);
  console.log(`${new Date().toISOString()} ${res.req.method} ${res.req.url} ${status}`);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 64 * 1024) reject(new Error('body too large'));
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch { reject(new Error('invalid JSON')); }
    });
    req.on('error', reject);
  });
}

/* Raw body, kept as a string. Webhook signatures are computed over the exact
   bytes sent, so readBody's JSON.parse round-trip cannot be used for them. */
function readRaw(req, limit = 256 * 1024) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > limit) reject(new Error('body too large'));
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

/* ---------------- unsubscribe links --------------------------------------- */

const unsubToken = email =>
  crypto.createHmac('sha256', UNSUB_SECRET).update(String(email).toLowerCase()).digest('base64url');

function verifyUnsubToken(email, token) {
  if (!UNSUB_SECRET || !email || !token) return false;
  const expect = Buffer.from(unsubToken(email), 'utf8');
  const got = Buffer.from(String(token), 'utf8');
  if (got.length !== expect.length) return false;
  return crypto.timingSafeEqual(got, expect);
}

const unsubUrl = email =>
  `${SITE_URL}/api/unsubscribe?e=${encodeURIComponent(email)}&t=${unsubToken(email)}`;

/* RFC 8058 one-click. Gmail POSTs this directly with no user interaction, so
   the POST route must not require auth beyond the signed URL itself. */
function unsubHeaders(email) {
  if (!UNSUB_SECRET) return {};
  return {
    'List-Unsubscribe': `<${unsubUrl(email)}>, <mailto:unsubscribe@onetimesuite.com>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}

/* ---------------- Svix (Resend) webhook signatures ------------------------ */

/* Resend signs with Svix: base64 HMAC-SHA256 over `${id}.${timestamp}.${body}`
   keyed by the decoded whsec_ secret. The header may carry several versioned
   signatures; any one matching is enough. */
function verifySvix(headers, rawBody) {
  if (!RESEND_WEBHOOK_SECRET) return false;
  const id = headers['svix-id'];
  const ts = headers['svix-timestamp'];
  const sigHeader = headers['svix-signature'];
  if (!id || !ts || !sigHeader) return false;

  // Reject replays outside a 5 minute window.
  const age = Math.abs(Date.now() / 1000 - Number(ts));
  if (!Number.isFinite(age) || age > 300) return false;

  const secret = RESEND_WEBHOOK_SECRET.startsWith('whsec_')
    ? RESEND_WEBHOOK_SECRET.slice(6)
    : RESEND_WEBHOOK_SECRET;
  let key;
  try { key = Buffer.from(secret, 'base64'); } catch { return false; }

  const expected = crypto.createHmac('sha256', key).update(`${id}.${ts}.${rawBody}`).digest();
  for (const part of String(sigHeader).split(' ')) {
    const [, sig] = part.split(',');
    if (!sig) continue;
    let got;
    try { got = Buffer.from(sig, 'base64'); } catch { continue; }
    if (got.length === expected.length && crypto.timingSafeEqual(got, expected)) return true;
  }
  return false;
}

/* ---------------- leads store (jsonl, rewritten whole on flag updates) ---- */

function dataDirWritable() {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.accessSync(path.dirname(DATA_FILE), fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function readLeads() {
  try {
    return fs.readFileSync(DATA_FILE, 'utf8')
      .split('\n')
      .filter(l => l.trim())
      .map(l => { try { return JSON.parse(l); } catch { return null; } })
      .filter(Boolean);
  } catch {
    return []; // missing/unreadable file -> no leads yet
  }
}

/* Write to a sibling tmp file then rename(2). rename is atomic on the same
   filesystem, so a crash mid-write leaves the previous file intact instead of
   truncating the whole lead database. */
function writeLeads(leads) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, leads.map(l => JSON.stringify(l)).join('\n') + '\n', 'utf8');
  fs.renameSync(tmp, DATA_FILE);
}

/* Append a lead, run best-effort Resend work, then persist updated flags.
   Low traffic site — a full-file rewrite keyed on the lead's `ts` is simple
   and race-safe enough here. */
function recordLead(lead) {
  const leads = readLeads();
  leads.push(lead);
  writeLeads(leads);

  /* Mirror into the sequence store, and immediately consume step 1: the
     welcome email below IS step 1, so without this claim every new lead would
     receive two welcomes on their first day. */
  try {
    store.upsertSubscriber({
      email: lead.email, name: lead.name, source: lead.source, startTs: lead.ts,
    });
    if (store.claimStep(lead.email, 1)) {
      store.finishStep(lead.email, 1, { status: 'sent', tag: 'welcome' });
    }
  } catch (err) {
    console.log('store upsert failed:', err.message);
  }

  if (RESEND_API_KEY) {
    resendWork(lead)
      .catch(err => console.log('resend work failed:', err.message))
      .finally(() => {
        try {
          const cur = readLeads();
          const hit = cur.find(l => l.ts === lead.ts && l.email === lead.email);
          if (hit) {
            hit.resendContact = lead.resendContact;
            hit.resendEmail = lead.resendEmail;
            writeLeads(cur);
          }
        } catch (err) {
          console.log('failed to persist resend flags:', err.message);
        }
      });
  } else {
    console.log('resend not configured — lead stored locally only');
  }
}

/* Returns the parsed response body — the batch endpoint's message ids are what
   later correlate a delivery/bounce webhook back to a specific send. */
async function resendReq(method, url, payload) {
  const r = await fetch(url, {
    method,
    headers: {
      'authorization': `Bearer ${RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: payload === undefined ? undefined : JSON.stringify(payload),
    signal: AbortSignal.timeout(15_000),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`resend ${r.status}: ${text.slice(0, 200)}`);
  try { return text ? JSON.parse(text) : {}; } catch { return {}; }
}

const resendJson = (url, payload) => resendReq('POST', url, payload);

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function welcomeEmailHtml(name, email) {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:24px;background:#f4f5f2;font-family:ui-monospace,Menlo,monospace;color:#17191d;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1.5px solid #17191d;border-radius:12px;padding:28px;">
    <p style="margin:0 0 4px;font-size:13px;color:#85888f;">onetimesuite.com</p>
    <h1 style="margin:0 0 16px;font-size:22px;">Hey ${escHtml(name)},</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
      As promised, here is the GitHub software link:<br>
      <a href="${escHtml(GITHUB_URL)}" style="color:#e8420c;font-weight:700;">${escHtml(GITHUB_URL)}</a>
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
      Don't know how to use GitHub? No worries — here's the same software as a one-time purchase:<br>
      <a href="${escHtml(SITE_URL)}" style="color:#e8420c;font-weight:700;">${escHtml(SITE_URL)}</a>
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
      You're also on the list now — I'll email you first whenever we launch new software.
    </p>
    <p style="margin:0;font-size:13px;color:#85888f;">One email, no spam.
      ${UNSUB_SECRET
        ? `<a href="${escHtml(unsubUrl(email))}" style="color:#85888f;">Unsubscribe</a> anytime — one click, no questions.`
        : 'Unsubscribe anytime.'}
    </p>
  </div>
</body></html>`;
}

function welcomeEmailText(name, email) {
  return `Hey ${name},

As promised, here is the GitHub software link:
${GITHUB_URL}

Don't know how to use GitHub? No worries — here's the same software as a
one-time purchase:
${SITE_URL}

You're also on the list now — I'll email you first whenever we launch new
software.

One email, no spam.${UNSUB_SECRET ? `\nUnsubscribe: ${unsubUrl(email)}` : ''}
`;
}

async function resendWork(lead) {
  // a. upsert contact into the audience
  if (RESEND_AUDIENCE_ID) {
    try {
      await resendJson(`https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`, {
        email: lead.email,
        first_name: lead.name,
        unsubscribed: false,
      });
      lead.resendContact = true;
    } catch (err) {
      console.log('resend contact upsert failed:', err.message);
    }
  }
  // b. welcome email
  try {
    await resendJson('https://api.resend.com/emails', {
      from: LEAD_FROM_EMAIL,
      to: [lead.email],
      subject: 'Your software links — GitHub + one-time purchase',
      html: welcomeEmailHtml(lead.name, lead.email),
      text: welcomeEmailText(lead.name, lead.email),
      headers: unsubHeaders(lead.email),
    });
    lead.resendEmail = true;
  } catch (err) {
    console.log('resend welcome email failed:', err.message);
  }
}

/* ---------------- admin auth ---------------------------------------------- */

function timingSafeStrEq(a, b) {
  // hash both sides first so lengths are always equal
  return crypto.timingSafeEqual(sha256(a), sha256(b));
}

function checkLogin(username, password) {
  return ADMINS.some(([u, p]) => timingSafeStrEq(username, u) && timingSafeStrEq(password, p));
}

function issueToken(username) {
  const expiry = Math.floor(Date.now() / 1000) + TOKEN_TTL_SEC;
  const payload = `${b64url(username)}.${expiry}`;
  const hmac = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  return `${payload}.${hmac}`;
}

function verifyToken(req) {
  if (!TOKEN_SECRET) return false;
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');
  if (!m) return false;
  const parts = m[1].split('.');
  if (parts.length !== 3) return false;
  const [user64, expiryStr, hmac] = parts;
  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || expiry < Math.floor(Date.now() / 1000)) return false;
  const expect = crypto.createHmac('sha256', TOKEN_SECRET).update(`${user64}.${expiryStr}`).digest();
  let got;
  try { got = Buffer.from(hmac, 'base64url'); } catch { return false; }
  if (got.length !== expect.length) return false;
  return crypto.timingSafeEqual(got, expect);
}

/* ---------------- routes --------------------------------------------------- */

const server = http.createServer(async (req, res) => {
  res.req = req; // for the request log inside send()
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;

  try {
    if (req.method === 'GET' && p === '/api/health') {
      let counts = null;
      try { counts = store.counts(); } catch (err) { counts = { error: err.message }; }
      return send(res, 200, {
        ok: true,
        leads: readLeads().length,
        dataDir: dataDirWritable() ? 'writable' : 'NOT WRITABLE',
        store: counts,
        drip: drip.health(),
      });
    }

    if (req.method === 'POST' && p === '/api/lead') {
      const body = await readBody(req);
      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const source = String(body.source || 'lead-page').slice(0, 120);
      if (!name || name.length > 120) return send(res, 400, { error: 'name is required (max 120 chars)' });
      if (!EMAIL_RE.test(email)) return send(res, 400, { error: 'invalid email address' });
      recordLead({
        ts: new Date().toISOString(),
        name, email, source,
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
        resendContact: false,
        resendEmail: false,
      });
      return send(res, 200, { ok: true });
    }

    if (req.method === 'POST' && p === '/api/survey') {
      const body = await readBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      if (!EMAIL_RE.test(email)) return send(res, 400, { error: 'invalid email address' });
      if (!Array.isArray(body.tools)) return send(res, 400, { error: 'tools must be an array' });
      const tools = body.tools
        .slice(0, 50)
        .map(t => String(t).trim().slice(0, 80))
        .filter(Boolean);
      const other = String(body.other || '').trim().slice(0, 500);
      const line = JSON.stringify({
        type: 'survey',
        ts: new Date().toISOString(),
        email,
        tools,
        other,
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
      });
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.appendFileSync(DATA_FILE, line + '\n', 'utf8');
      return send(res, 200, { ok: true });
    }

    /* ---- webinar watch gate + free-app claim ---------------------------- */

    if (req.method === 'GET' && p === '/api/webinar/apps') {
      const apps = whop.eligible().map(a => ({
        slug: a.slug, brand: a.brand, icon: a.icon, price: a.price, kind: a.kind, demo: a.demo,
      })).sort((a, b) => a.price - b.price || a.brand.localeCompare(b.brand));
      return send(res, 200, { apps, count: apps.length, maxPrice: whop.COUPON_MAX_PRICE || null });
    }

    if (req.method === 'POST' && p === '/api/webinar/session') {
      if (!webinar.configured()) return send(res, 503, { error: 'webinar gate not configured' });
      const body = await readBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      const name = String(body.name || '').trim().slice(0, 120);
      if (!EMAIL_RE.test(email)) return send(res, 400, { error: 'invalid email address' });

      const existing = store.getCoupon(email);
      if (existing && existing.status === 'minted') {
        const app = whop.findApp(existing.slug);
        return send(res, 200, {
          alreadyClaimed: true,
          coupon: {
            code: existing.code, slug: existing.slug, brand: app ? app.brand : existing.slug,
            expiresAt: existing.expires_at,
            redeemUrl: app ? whop.redeemUrl(app, existing.code) : null,
          },
        });
      }

      const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
      const s = webinar.startSession(email, ip);
      if (s.limited) return send(res, 429, { error: 'too many sessions from this address — try again later' });

      try {
        store.upsertSubscriber({ email, name, source: 'webinar' });
      } catch (err) { console.log('webinar subscriber upsert failed:', err.message); }

      return send(res, 200, {
        token: s.token, videoSec: s.videoSec, needSec: s.needSec,
        answerRequired: webinar.answerRequired(),
      });
    }

    if (req.method === 'POST' && p === '/api/webinar/heartbeat') {
      const body = await readBody(req);
      const r = webinar.heartbeat(String(body.token || ''), body.pos);
      if (!r.ok) return send(res, r.reason === 'slow down' ? 429 : 401, { error: r.reason, retryIn: r.retryIn });
      try { store.setWatch(r.email, r.watched, r.qualified); } catch { /* non-fatal */ }
      return send(res, 200, { watched: r.watched, needSec: r.needSec, qualified: r.qualified });
    }

    if (req.method === 'POST' && p === '/api/webinar/claim') {
      if (!whop.configured() && process.env.WHOP_DRY_RUN !== '1') {
        return send(res, 503, { error: 'the free-app offer is not live yet' });
      }
      const body = await readBody(req);
      const st = webinar.status(String(body.token || ''));
      if (!st) return send(res, 401, { error: 'invalid or expired session' });

      const email = st.email;
      const slug = String(body.slug || '').trim().toLowerCase();

      /* Idempotent by design: an address that already has a coupon gets that
         same coupon back, never a second one. */
      const prior = store.getCoupon(email);
      if (prior && prior.status === 'minted') {
        const app = whop.findApp(prior.slug);
        return send(res, 409, {
          error: 'already claimed',
          coupon: {
            code: prior.code, slug: prior.slug, brand: app ? app.brand : prior.slug,
            expiresAt: prior.expires_at, redeemUrl: app ? whop.redeemUrl(app, prior.code) : null,
          },
        });
      }

      if (!st.qualified) {
        return send(res, 403, { error: 'watch the walkthrough first', watched: st.watched, needSec: st.needSec });
      }
      if (!webinar.checkAnswer(body.answer)) {
        return send(res, 403, { error: 'that is not the answer given in the video' });
      }
      const app = whop.findApp(slug);
      if (!app) return send(res, 400, { error: 'that app is not eligible for the free-app offer' });

      const attempt = prior ? (prior.attempt || 0) : 0;
      const code = whop.couponCode(email, slug, attempt);

      /* Reserve BEFORE calling Whop. If this process dies mid-mint, the row
         survives as 'pending' and a retry re-derives the identical code. */
      if (!prior && !store.reserveCoupon({
        email, code, slug, planId: app.planId, productId: app.productId, price: app.price, attempt,
      })) {
        const now = store.getCoupon(email);
        return send(res, 409, { error: 'already claimed', coupon: now ? { code: now.code, slug: now.slug } : null });
      }

      try {
        const minted = await whop.mintPromo({ email, slug, attempt });
        store.settleCoupon(email, { status: 'minted', whopId: minted.whopId, expiresAt: minted.expiresAt });
        return send(res, 200, {
          code: minted.code, slug: app.slug, brand: app.brand, price: app.price,
          expiresAt: minted.expiresAt, redeemUrl: whop.redeemUrl(app, minted.code),
          dryRun: minted.dryRun || undefined,
        });
      } catch (err) {
        console.log('whop mint failed:', err.message);
        store.settleCoupon(email, { status: 'failed' });
        store.dropCoupon(email); // let them try again rather than stranding the address
        return send(res, 503, { error: 'could not create your code — try again in a minute' });
      }
    }

    /* ---- unsubscribe (RFC 8058) -----------------------------------------
       GET  = a human clicked the footer link -> confirmation page.
       POST = Gmail/Yahoo one-click, fired automatically with no interaction.
       Both authenticate on the signed token alone; nothing else is required,
       and the POST must never redirect or ask for confirmation. */
    if ((req.method === 'GET' || req.method === 'POST') && p === '/api/unsubscribe') {
      if (!UNSUB_SECRET) return send(res, 503, { error: 'unsubscribe not configured' });
      const email = String(url.searchParams.get('e') || '').trim().toLowerCase();
      const token = url.searchParams.get('t') || '';
      if (req.method === 'POST') await readRaw(req).catch(() => '');

      const ok = verifyUnsubToken(email, token);
      if (ok) {
        try {
          store.unsubscribe(email, req.method === 'POST' ? 'one-click' : 'link');
          if (RESEND_API_KEY && RESEND_AUDIENCE_ID) {
            resendReq('PATCH', `https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts/${encodeURIComponent(email)}`,
              { unsubscribed: true })
              .catch(err => console.log('resend unsubscribe sync failed:', err.message));
          }
        } catch (err) {
          console.log('unsubscribe failed:', err.message);
        }
      }

      if (req.method === 'POST') return send(res, ok ? 200 : 401, ok ? { ok: true } : { error: 'invalid link' });

      const body = ok
        ? '<h1>You\'re off the list.</h1><p>No more sequence email. Purchases and receipts are unaffected.</p>'
        : '<h1>That link isn\'t valid.</h1><p>It may have been altered in transit. Reply to any email and I\'ll remove you by hand.</p>';
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribe — OneTimeSuite</title>
<meta name="robots" content="noindex"></head>
<body style="margin:0;padding:48px 24px;background:#f4f5f2;font-family:ui-monospace,Menlo,monospace;color:#17191d;">
<div style="max-width:520px;margin:0 auto;background:#fff;border:1.5px solid #17191d;border-radius:12px;padding:28px;">
<p style="margin:0 0 4px;font-size:13px;color:#85888f;">onetimesuite.com</p>${body}
<p style="margin:16px 0 0;"><a href="${escHtml(SITE_URL)}" style="color:#e8420c;font-weight:700;">Back to the catalog</a></p>
</div></body></html>`;
      res.writeHead(ok ? 200 : 400, { 'content-type': 'text/html; charset=utf-8' });
      res.end(html);
      console.log(`${new Date().toISOString()} ${req.method} ${req.url} ${ok ? 200 : 400}`);
      return;
    }

    /* ---- Resend delivery webhook ----------------------------------------
       Hard bounces and complaints suppress the address. Without this the
       sequence would hammer a dead mailbox 100 times and take the sending
       domain's reputation down with it. */
    if (req.method === 'POST' && p === '/api/resend/webhook') {
      const raw = await readRaw(req);
      if (!verifySvix(req.headers, raw)) return send(res, 401, { error: 'bad signature' });
      let evt;
      try { evt = JSON.parse(raw); } catch { return send(res, 400, { error: 'invalid JSON' }); }

      const type = String(evt.type || '');
      const to = [].concat((evt.data && evt.data.to) || []).map(e => String(e).toLowerCase());
      for (const email of to) {
        try {
          if (type === 'email.bounced') store.suppress(email, 'bounced');
          else if (type === 'email.complained') { store.suppress(email, 'complained'); store.unsubscribe(email, 'complaint'); }
          else store.logEvent(type, email, null);
        } catch (err) {
          console.log('webhook handling failed:', err.message);
        }
      }
      return send(res, 200, { ok: true });
    }

    if (req.method === 'POST' && p === '/api/admin/login') {
      if (!ADMINS.length) return send(res, 503, { error: 'admin not configured' });
      const body = await readBody(req);
      const username = String(body.username || '');
      const password = String(body.password || '');
      if (!checkLogin(username, password)) return send(res, 401, { error: 'wrong username or password' });
      return send(res, 200, { token: issueToken(username) });
    }

    if (req.method === 'GET' && p === '/api/admin/leads') {
      if (!verifyToken(req)) return send(res, 401, { error: 'unauthorized' });
      const lines = readLeads();
      const leads = lines.filter(l => !l.type || l.type === 'lead');
      const surveys = lines.filter(l => l.type === 'survey');
      // attach each survey to the most recent lead with the same email
      for (const s of surveys) {
        const em = String(s.email || '').toLowerCase();
        let hit = null;
        for (const l of leads) {
          if (String(l.email || '').toLowerCase() === em) hit = l; // keep walking: last match is newest
        }
        if (hit) hit.survey = { ts: s.ts, tools: s.tools || [], other: s.other || '' };
      }
      const matched = new Set(surveys.filter(s =>
        leads.some(l => String(l.email || '').toLowerCase() === String(s.email || '').toLowerCase())));
      const orphans = surveys.filter(s => !matched.has(s)).map(s => ({
        orphan: true,
        ts: s.ts,
        email: s.email,
        name: '(no lead signup)',
        survey: { ts: s.ts, tools: s.tools || [], other: s.other || '' },
      }));
      const out = leads.reverse() // newest first
        .concat(orphans.reverse()); // orphan surveys at the end, newest first
      return send(res, 200, { leads: out });
    }

    /* ---- admin: sequence + coupon visibility ---------------------------- */

    if (req.method === 'GET' && p === '/api/admin/subscribers') {
      if (!verifyToken(req)) return send(res, 401, { error: 'unauthorized' });
      const today = drip.todayUTC();
      const subs = store.allSubscribers().map(s => {
        const stats = store.sendStats(s.email);
        const sent = store.sentSteps(s.email);
        const coupon = store.getCoupon(s.email);
        const app = coupon ? whop.findApp(coupon.slug) : null;
        const off = drip.dayOffset(s.start_ts, today);
        return {
          email: s.email, name: s.name, source: s.source, start: String(s.start_ts).slice(0, 10),
          dayOffset: off,
          step: dripPlan.stepForOffset(Math.max(0, off)),
          sentCount: stats.sent || 0, lastSent: stats.last_sent || null,
          highestStep: sent.size ? Math.max(...sent) : 0,
          unsubscribed: s.unsubscribed_at, bounced: !!s.bounced, complained: !!s.complained,
          watch: { sec: Math.round(s.watch_sec), qualified: !!s.watch_qualified, at: s.watch_at },
          coupon: coupon ? {
            code: coupon.code, slug: coupon.slug, brand: app ? app.brand : coupon.slug,
            price: coupon.price, status: coupon.status, expiresAt: coupon.expires_at,
          } : null,
        };
      });
      const cs = store.couponStats();
      return send(res, 200, {
        subs,
        totals: { ...store.counts(), coupons: cs.minted || 0, couponFaceValue: cs.face_value || 0 },
        drip: drip.health(),
      });
    }

    /* Render any step for any address without sending it. */
    if (req.method === 'POST' && p === '/api/admin/drip/preview') {
      if (!verifyToken(req)) return send(res, 401, { error: 'unauthorized' });
      const body = await readBody(req);
      const step = Number(body.step || body.day || 1);
      if (!Number.isInteger(step) || step < 1 || step > dripPlan.TOTAL) {
        return send(res, 400, { error: `step must be 1..${dripPlan.TOTAL}` });
      }
      const email = String(body.email || '').trim().toLowerCase();
      const sub = email ? store.getSubscriber(email) : null;
      const coupon = email ? store.getCoupon(email) : null;
      const msg = dripPlan.render(step, sub || {}, {
        hasCoupon: Boolean(coupon && coupon.status === 'minted'),
        unsubUrl: email && UNSUB_SECRET ? unsubUrl(email) : null,
      });
      if (!msg) return send(res, 200, { step, type: dripPlan.typeOf(step), skipped: true });
      return send(res, 200, { step, type: msg.type, tag: msg.tag, subject: msg.subject, html: msg.html, text: msg.text });
    }

    /* Rehearse today's send. dryRun (the default) never touches Resend. */
    if (req.method === 'POST' && p === '/api/admin/drip/tick') {
      if (!verifyToken(req)) return send(res, 401, { error: 'unauthorized' });
      const body = await readBody(req);
      const today = String(body.date || drip.todayUTC()).slice(0, 10);
      if (body.dryRun === false) {
        const r = await drip.runDay(today, { unsubUrlFor: e => (UNSUB_SECRET ? unsubUrl(e) : null), unsubHeadersFor: unsubHeaders });
        return send(res, 200, { ran: true, date: today, ...r });
      }
      const work = drip.planDay(today, { limit: 500 });
      return send(res, 200, {
        ran: false, date: today, count: work.length,
        would: work.map(w => ({
          email: w.sub.email, step: w.step,
          subject: w.msg ? w.msg.subject : null,
          skip: w.msg ? null : w.skipReason,
        })),
      });
    }

    if (req.method === 'GET' && p === '/api/admin/checklist') {
      if (!verifyToken(req)) return send(res, 401, { error: 'unauthorized' });
      let markdown;
      try {
        markdown = fs.readFileSync(CHECKLIST_FILE, 'utf8');
      } catch {
        return send(res, 404, { error: 'checklist file not found' });
      }
      return send(res, 200, { markdown });
    }

    return send(res, 404, { error: 'not found' });
  } catch (err) {
    console.log('request error:', err.message);
    return send(res, err.message === 'invalid JSON' || err.message === 'body too large' ? 400 : 500,
      { error: err.message === 'invalid JSON' ? 'invalid JSON' : 'server error' });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`onetimesuite api listening on 127.0.0.1:${PORT}`);
  console.log(`admin: ${ADMINS.length ? ADMINS.length + ' account(s) configured' : 'NOT configured'}` +
    ` · resend: ${RESEND_API_KEY ? 'configured' : 'not configured'}`);

  /* readLeads() returns [] on a missing file, so an unmounted /data volume is
     indistinguishable from "no signups yet" — every redeploy would silently
     wipe the list. Say so loudly at boot instead. */
  if (dataDirWritable()) {
    console.log(`state dir OK: ${path.dirname(DATA_FILE)} · ${readLeads().length} record(s) loaded`);
    try {
      const m = store.migrateFromJsonl();
      if (!m.skipped) console.log(`store: migrated ${m.imported} lead(s) from jsonl`);
      const c = store.counts();
      console.log(`store: ${c.subscribers} subscriber(s) · ${c.active} active · ${c.unsubscribed} unsubscribed`);
    } catch (err) {
      console.log('store init FAILED:', err.message);
    }
    if (!UNSUB_SECRET) console.log('WARNING: UNSUB_SECRET not set — emails ship without a working unsubscribe link.');
    if (!RESEND_WEBHOOK_SECRET) console.log('WARNING: RESEND_WEBHOOK_SECRET not set — bounces will not suppress.');
    console.log(`coupons: ${whop.configured() ? 'configured' : 'NOT configured'} · ` +
      `${whop.catalogSize()} eligible app(s) · webinar gate: ${webinar.configured() ? 'on' : 'off'}`);
    drip.start({
      unsubUrlFor: e => (UNSUB_SECRET ? unsubUrl(e) : null),
      unsubHeadersFor: unsubHeaders,
    });
  } else {
    console.log(`WARNING: ${path.dirname(DATA_FILE)} is NOT writable — leads will be lost on redeploy.` +
      ' Check that a persistent volume is mounted there.');
  }
});
