/*
 * api.js — tiny zero-dependency lead-capture + admin API for onetimesuite.com
 *
 * Node 22, built-ins only (http, fs, path, crypto). Runs next to nginx in the
 * same container; nginx proxies /api/ here on 127.0.0.1:3100.
 *
 * Env:
 *   PORT               listen port (default 3100)
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

const PORT = Number(process.env.PORT) || 3100;
const DATA_FILE = process.env.DATA_FILE || '/data/leads.jsonl';
const CHECKLIST_FILE = process.env.CHECKLIST_FILE || '/app/NEXT-UP.md';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID || '';
const LEAD_FROM_EMAIL = process.env.LEAD_FROM_EMAIL || 'hello@onetimesuite.com';
const GITHUB_URL = process.env.GITHUB_URL || 'https://github.com/bensblueprints';
const SITE_URL = process.env.SITE_URL || 'https://onetimesuite.com';

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

/* ---------------- leads store (jsonl, rewritten whole on flag updates) ---- */

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

function writeLeads(leads) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, leads.map(l => JSON.stringify(l)).join('\n') + '\n', 'utf8');
}

/* Append a lead, run best-effort Resend work, then persist updated flags.
   Low traffic site — a full-file rewrite keyed on the lead's `ts` is simple
   and race-safe enough here. */
function recordLead(lead) {
  const leads = readLeads();
  leads.push(lead);
  writeLeads(leads);
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

async function resendJson(url, payload) {
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  });
  if (!r.ok) throw new Error(`resend ${r.status}: ${(await r.text()).slice(0, 200)}`);
}

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function welcomeEmailHtml(name) {
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
    <p style="margin:0;font-size:13px;color:#85888f;">One email, no spam. Unsubscribe anytime.</p>
  </div>
</body></html>`;
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
      html: welcomeEmailHtml(lead.name),
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
      return send(res, 200, { ok: true });
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
      const leads = readLeads().reverse(); // newest first
      return send(res, 200, { leads });
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
});
