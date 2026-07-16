/*
 * pricing.js — THE single place the pricing formula lives.
 *
 * Web (self-hosted) apps get three tiers derived from the existing one-time
 * `price` in src/products*.js. Desktop apps keep a single one-time price.
 *
 * FORMULA (pending user approval — tweak the constants/functions below and
 * re-run `npm run generate`, nothing else references these numbers):
 *   monthly  = max(MIN_MONTHLY, round(price / MONTHLY_DIVISOR))
 *   yearly   = YEARLY_MONTHS * monthly            ("2 months free")
 *   lifetime = roundToNearest9(price * LIFETIME_MULTIPLIER)
 */

export const PRICING_PARAMS = {
  MIN_MONTHLY: 5,
  MONTHLY_DIVISOR: 4,
  YEARLY_MONTHS: 10,
  LIFETIME_MULTIPLIER: 2.5,
};

/** Round to the nearest integer ending in 9 (e.g. 147.5 -> 149, 62 -> 59). */
export function roundToNearest9(x) {
  return Math.round((x + 1) / 10) * 10 - 1;
}

/**
 * @param {number} price   existing one-time price from products data
 * @param {boolean} isDesktop
 * @returns pricing model for the page template
 */
export function computePricing(price, isDesktop) {
  if (isDesktop) {
    return { kind: 'desktop', once: price };
  }
  const { MIN_MONTHLY, MONTHLY_DIVISOR, YEARLY_MONTHS, LIFETIME_MULTIPLIER } = PRICING_PARAMS;
  const monthly = Math.max(MIN_MONTHLY, Math.round(price / MONTHLY_DIVISOR));
  const yearly = YEARLY_MONTHS * monthly;
  const lifetime = roundToNearest9(price * LIFETIME_MULTIPLIER);
  return { kind: 'web', monthly, yearly, lifetime };
}
