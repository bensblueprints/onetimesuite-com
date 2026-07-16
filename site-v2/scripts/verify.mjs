/* One-off verification: load pilot pages, capture console errors + screenshots. */
import { chromium } from 'file:///C:/Users/ADMIN/AppData/Roaming/npm/node_modules/playwright/index.mjs';

const browser = await chromium.launch();
for (const slug of ['captionly', 'inkseal']) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await page.goto(`http://127.0.0.1:5217/${slug}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const heroVisible = await page.locator('h1').isVisible();
  const pricingCards = await page.locator('#pricing a[href*="whop.com"], #pricing a[href*="checkout"]').count();
  await page.screenshot({ path: `scripts/shot-${slug}-top.png` });
  await page.locator('#pricing').scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await page.screenshot({ path: `scripts/shot-${slug}-pricing.png` });
  console.log(`${slug}: h1 visible=${heroVisible}, pricing CTAs=${pricingCards}, console errors=${errors.length}`);
  errors.slice(0, 5).forEach(e => console.log('  ERR: ' + e.slice(0, 200)));
  await page.close();
}
await browser.close();
