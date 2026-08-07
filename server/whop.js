/* whop.js — mint single-use 100%-off promo codes on Whop.
 *
 * Shape of the offer: one attendee, one app, one redemption. The code is
 * scoped to a single LIFETIME plan (never a monthly one — a 100%-off promo on
 * a recurring plan is a free subscription), stock 1, expires in 14 days. A
 * leaked code is therefore worth at most the one app the attendee already
 * picked, and only until someone burns it.
 *
 * The $997 bundle can never be minted against: catalog.json is built with a
 * guard that throws if the bundle plan id appears, and nothing here accepts a
 * plan that is not in that file.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const WHOP_API_KEY = process.env.WHOP_API_KEY || '';
const WHOP_COMPANY_ID = process.env.WHOP_COMPANY_ID || '';
const WHOP_DRY_RUN = process.env.WHOP_DRY_RUN === '1';
const COUPON_SECRET = process.env.COUPON_SECRET || '';
const COUPON_EXPIRY_DAYS = Number(process.env.COUPON_EXPIRY_DAYS) || 14;
const COUPON_MAX_PRICE = Number(process.env.COUPON_MAX_PRICE) || 0; // 0 = no cap
const BUNDLE_PLAN_ID = 'plan_5Mv4jYmDfZH3a';

/* ---------------- catalog -------------------------------------------------- */

const CATALOG_FILE = process.env.CATALOG_FILE ||
  (fs.existsSync('/app/catalog.json')
    ? '/app/catalog.json'
    : path.join(__dirname, '..', 'public', '_data', 'catalog.json'));

let catalog = [];
try {
  catalog = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8'));
} catch (err) {
  console.log(`whop: catalog unreadable at ${CATALOG_FILE} — coupons disabled (${err.message})`);
}

/* Defence in depth: even if a bad catalog.json were shipped, refuse the bundle. */
catalog = catalog.filter(r => r && r.planId && r.planId !== BUNDLE_PLAN_ID);

const eligible = () => catalog.filter(r => !COUPON_MAX_PRICE || r.price <= COUPON_MAX_PRICE);
const findApp = slug => eligible().find(r => r.slug === slug) || null;

/* ---------------- code generation ------------------------------------------ */

/* Crockford-style alphabet: no vowels (so no accidental words) and no 0/O or
   1/I (so nobody mistypes a code off a screen). */
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';

/* Deterministic in (email, slug, attempt). Re-running a mint after a timeout
   derives the SAME code, so Whop's "already taken" response is proof our
   earlier call succeeded rather than a reason to create a second coupon. */
function couponCode(email, slug, attempt = 0) {
  if (!COUPON_SECRET) throw new Error('COUPON_SECRET is not set');
  const h = crypto.createHmac('sha256', COUPON_SECRET)
    .update(`${String(email).toLowerCase()}|${slug}|${attempt}`)
    .digest();
  let out = '';
  for (let i = 0; i < 9; i++) out += ALPHABET[h[i] % ALPHABET.length];
  return `FREE${out}`;
}

/* ---------------- minting --------------------------------------------------- */

async function mintPromo({ email, slug, attempt = 0 }) {
  const app = findApp(slug);
  if (!app) throw new Error(`"${slug}" is not a coupon-eligible app`);
  if (app.planId === BUNDLE_PLAN_ID) throw new Error('refusing to mint against the bundle');

  const code = couponCode(email, slug, attempt);
  const expiresAt = new Date(Date.now() + COUPON_EXPIRY_DAYS * 864e5).toISOString();

  if (WHOP_DRY_RUN || !WHOP_API_KEY) {
    return { code, expiresAt, whopId: null, dryRun: true, app };
  }

  const body = {
    code,
    company_id: WHOP_COMPANY_ID,
    promo_type: 'percentage',
    amount_off: 100,
    base_currency: 'usd',
    plan_ids: [app.planId],
    stock: 1,
    unlimited_stock: false,
    one_per_customer: true,
    new_users_only: false,
    expires_at: expiresAt,
    promo_duration_months: 1,
  };
  // Optional on Whop's side, and null for the two apps whose plan id came from
  // a buyUrl rather than whop-links.json.
  if (app.productId) body.product_id = app.productId;

  const r = await fetch('https://api.whop.com/api/v1/promo_codes', {
    method: 'POST',
    headers: { authorization: `Bearer ${WHOP_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const text = await r.text();

  /* Our codes are deterministic, so "already exists" means a previous attempt
     by us got through. Treat as success rather than minting a duplicate. */
  if ((r.status === 422 || r.status === 409) && /taken|exist|duplicat/i.test(text)) {
    return { code, expiresAt, whopId: null, reused: true, app };
  }
  if (!r.ok) throw new Error(`whop ${r.status}: ${text.slice(0, 300)}`);

  let parsed = {};
  try { parsed = JSON.parse(text); } catch { /* id stays null */ }
  const id = parsed.id || (parsed.data && parsed.data.id) || null;
  return { code, expiresAt, whopId: id, app };
}

const redeemUrl = (app, code) =>
  `/checkout/${app.slug}/?plan=${encodeURIComponent(app.planId)}&promo=${encodeURIComponent(code)}`;

const configured = () => Boolean(WHOP_API_KEY && WHOP_COMPANY_ID && COUPON_SECRET);

module.exports = {
  couponCode, mintPromo, eligible, findApp, redeemUrl, configured,
  COUPON_EXPIRY_DAYS, COUPON_MAX_PRICE, CATALOG_FILE,
  catalogSize: () => catalog.length,
};
