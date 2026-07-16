/*
 * pricing.js — THE single place the pricing formula lives.
 *
 * Web (self-hosted) apps get three tiers derived from the existing one-time
 * `price` in src/products*.js. Desktop apps keep a single one-time price.
 *
 * FORMULA (user-approved 2026-07-16; canonical per-app values live in the
 * Notion 🚀 Launch Tracker "Monthly/Yearly/Lifetime Price" columns — Notion
 * overrides win over this formula once wired):
 *   monthly       = max(MIN_MONTHLY, round(price / MONTHLY_DIVISOR))
 *   yearly        = YEARLY_MONTHS * monthly            ("2 months free")
 *   lifetime      = roundToNearest9(price * LIFETIME_MULTIPLIER)
 *   lifetimeList  = lifetime * ANCHOR_MULTIPLIER — the FULL LAUNCH PRICE,
 *                   shown struck-through above the intro price. This is the
 *                   documented "intro pricing → launches higher, first 1,000
 *                   licenses" roadmap, NOT a fake sale: the list price is the
 *                   real post-intro price the catalog moves to.
 */

export const PRICING_PARAMS = {
  MIN_MONTHLY: 5,
  MONTHLY_DIVISOR: 4,
  YEARLY_MONTHS: 10,
  LIFETIME_MULTIPLIER: 3,
  ANCHOR_MULTIPLIER: 2, // lifetime list (launch) price = 2x intro lifetime
};

/** Round to the nearest integer ending in 9 (e.g. 147.5 -> 149, 62 -> 59). */
export function roundToNearest9(x) {
  return Math.round((x + 1) / 10) * 10 - 1;
}

/**
 * @param {number} price   existing one-time price from products data
 * @param {boolean} isDesktop
 * @param {{monthly?: number, yearly?: number, lifetime?: number}} [overrides]
 *        per-app values from the Notion Launch Tracker (source of truth)
 * @returns pricing model for the page template
 */
export function computePricing(price, isDesktop, overrides = {}) {
  if (isDesktop) {
    return { kind: 'desktop', once: price };
  }
  const { MIN_MONTHLY, MONTHLY_DIVISOR, YEARLY_MONTHS, LIFETIME_MULTIPLIER, ANCHOR_MULTIPLIER } = PRICING_PARAMS;
  const monthly = overrides.monthly ?? Math.max(MIN_MONTHLY, Math.round(price / MONTHLY_DIVISOR));
  const yearly = overrides.yearly ?? YEARLY_MONTHS * monthly;
  const lifetime = overrides.lifetime ?? roundToNearest9(price * LIFETIME_MULTIPLIER);
  const lifetimeList = lifetime * ANCHOR_MULTIPLIER;
  return { kind: 'web', monthly, yearly, lifetime, lifetimeList };
}
