/* webinar.js — the "did they actually watch it" gate.
 *
 * Honest threat model: the video plays in the visitor's browser, so every
 * signal about it originates on their machine and is forgeable by anyone who
 * opens DevTools. This cannot be made unspoofable and the site copy should not
 * pretend otherwise. What it CAN do is make forging cost real wall-clock time
 * plus knowledge that only exists inside the video:
 *
 *   1. a signed session, so heartbeats can't be posted anonymously
 *   2. credit capped at elapsed real time x 2.05 (YouTube's max speed), so
 *      seeking forward and replaying heartbeats in a loop both earn nothing
 *   3. an answer only spoken aloud in the video, checked server-side
 *   4. per-IP session rate limiting
 *
 * Layer 3 is the one that actually stops scripted bypasses, because writing
 * the script requires watching the video once — and the answer is rotatable.
 */

const crypto = require('crypto');

const WATCH_SECRET = process.env.WATCH_SECRET || '';
const WEBINAR_VIDEO_SEC = Number(process.env.WEBINAR_VIDEO_SEC) || 720; // ~12 min
const WEBINAR_WATCH_PCT = Number(process.env.WEBINAR_WATCH_PCT) || 70;
const WEBINAR_ANSWER = process.env.WEBINAR_ANSWER || '';
const SESSION_TTL_SEC = Number(process.env.WEBINAR_SESSION_TTL_SEC) || 6 * 60 * 60;
const SESSIONS_PER_IP_HOUR = Number(process.env.WEBINAR_SESSIONS_PER_IP_HOUR) || 5;

const MAX_RATE = 2.05;       // fastest a player can legitimately advance
const MIN_ELAPSED_SEC = 10;  // heartbeats closer together than this earn nothing

const needSec = () => Math.round(WEBINAR_VIDEO_SEC * (WEBINAR_WATCH_PCT / 100));

/* In-memory. A restart drops progress, which is acceptable: the video is short
   and a restart is rare. Persisting it would let an attacker accumulate credit
   across process lifetimes, which is worse. */
const sessions = new Map();   // sid -> { email, watched, lastPos, lastAt, createdAt }
const ipHits = new Map();     // ip  -> [timestamps]

function sweep() {
  const cutoff = Date.now() - SESSION_TTL_SEC * 1000;
  for (const [sid, s] of sessions) if (s.createdAt < cutoff) sessions.delete(sid);
  const hourAgo = Date.now() - 3600_000;
  for (const [ip, hits] of ipHits) {
    const keep = hits.filter(t => t > hourAgo);
    if (keep.length) ipHits.set(ip, keep); else ipHits.delete(ip);
  }
}

function rateLimited(ip) {
  sweep();
  const hits = ipHits.get(ip) || [];
  if (hits.length >= SESSIONS_PER_IP_HOUR) return true;
  hits.push(Date.now());
  ipHits.set(ip, hits);
  return false;
}

const sign = payload =>
  crypto.createHmac('sha256', WATCH_SECRET).update(payload).digest('base64url');

function issueToken(sid, email) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SEC;
  const payload = `${sid}.${Buffer.from(email, 'utf8').toString('base64url')}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token) {
  if (!WATCH_SECRET || !token) return null;
  const parts = String(token).split('.');
  if (parts.length !== 4) return null;
  const [sid, email64, expStr, mac] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return null;
  const expect = Buffer.from(sign(`${sid}.${email64}.${expStr}`), 'utf8');
  const got = Buffer.from(mac, 'utf8');
  if (got.length !== expect.length || !crypto.timingSafeEqual(got, expect)) return null;
  let email;
  try { email = Buffer.from(email64, 'base64url').toString('utf8'); } catch { return null; }
  return { sid, email };
}

function startSession(email, ip) {
  if (!WATCH_SECRET) throw new Error('WATCH_SECRET is not set');
  if (rateLimited(ip)) return { limited: true };
  const sid = crypto.randomBytes(9).toString('base64url');
  sessions.set(sid, { email, watched: 0, lastPos: 0, lastAt: Date.now(), createdAt: Date.now() });
  return {
    limited: false,
    sid,
    token: issueToken(sid, email),
    videoSec: WEBINAR_VIDEO_SEC,
    needSec: needSec(),
  };
}

/* Credit the smaller of "what the player claims advanced" and "what real time
   allows". Both a forward seek and a replayed heartbeat fail the second test. */
function heartbeat(token, pos) {
  const t = verifyToken(token);
  if (!t) return { ok: false, reason: 'invalid or expired session' };
  const s = sessions.get(t.sid);
  if (!s) return { ok: false, reason: 'invalid or expired session' };

  const now = Date.now();
  const elapsed = (now - s.lastAt) / 1000;
  if (elapsed < MIN_ELAPSED_SEC) return { ok: false, reason: 'slow down', retryIn: Math.ceil(MIN_ELAPSED_SEC - elapsed) };

  const position = Math.max(0, Math.min(Number(pos) || 0, WEBINAR_VIDEO_SEC));
  const claimed = position - s.lastPos;
  const credit = Math.max(0, Math.min(claimed, elapsed * MAX_RATE));

  s.watched = Math.min(s.watched + credit, WEBINAR_VIDEO_SEC);
  s.lastPos = position;
  s.lastAt = now;

  return {
    ok: true,
    email: t.email,
    watched: Math.round(s.watched),
    needSec: needSec(),
    qualified: s.watched >= needSec(),
  };
}

function status(token) {
  const t = verifyToken(token);
  if (!t) return null;
  const s = sessions.get(t.sid);
  if (!s) return null;
  return { email: t.email, watched: Math.round(s.watched), needSec: needSec(), qualified: s.watched >= needSec() };
}

/* Case- and whitespace-insensitive so a correct answer typed casually still
   passes; compared in constant time so the key can't be probed a char at a time. */
function checkAnswer(given) {
  if (!WEBINAR_ANSWER) return true; // not configured -> gate disabled
  const norm = v => String(v || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const a = Buffer.from(norm(given), 'utf8');
  const b = Buffer.from(norm(WEBINAR_ANSWER), 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = {
  startSession, heartbeat, status, checkAnswer, verifyToken,
  needSec, configured: () => Boolean(WATCH_SECRET),
  answerRequired: () => Boolean(WEBINAR_ANSWER),
  WEBINAR_VIDEO_SEC, WEBINAR_WATCH_PCT,
  _sessions: sessions,
};
