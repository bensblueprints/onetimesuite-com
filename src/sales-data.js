/* Suite pricing model for the 100-days launch — baked into the site at build
 * time by the SEO factory sections (price tracker, calculator, press, etc.).
 *
 * !!! WARNING — PUBLIC DATA !!!
 * Everything in this file is rendered verbatim on public pages
 * (onetimesuite.com/price-tracker/, /calculator/, /press/, ...).
 * Only enter REAL sales data. Never estimate, never inflate, never backfill
 * numbers to make the curve look better. Fake sales counts are fraud.
 *
 * How the model works:
 *   - The suite starts at basePrice ($97).
 *   - Every sale raises the price by incrementPerSale ($1), up to cap ($997)
 *     during the 100-days launch window.
 *   - After all 100 apps ship (hundredDaysComplete = true), the price becomes
 *     postLaunchPrice ($1997) and the counter model ends.
 *
 * Update protocol on each sale: bump salesCount by 1, append a priceHistory
 * entry if the price changed, set updatedAt to the current date, rebuild.
 */
module.exports = {
  basePrice: 97,              // starting suite price (USD)
  incrementPerSale: 1,        // +$1 per sale
  cap: 997,                   // price cap during the 100 days
  postLaunchPrice: 1997,      // price after all 100 apps ship
  hundredDaysComplete: false, // flip true when the 100 days are done
  salesCount: 0,              // !!! UPDATE WITH REAL SALES ONLY — rendered publicly
  priceHistory: [],           // [{ date:'2026-07-28', price:97, note:'Launch' }] — real entries only
  updatedAt: '2026-07-28',    // last time this file was updated
};
