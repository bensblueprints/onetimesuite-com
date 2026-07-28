/* scripts/generate-og.js — social-share thumbnails (1200×630) for every page.
 *
 * Run AFTER `node build.js` (it reads the built pages in public/):
 *   node scripts/generate-og.js            render new/changed pages only
 *   node scripts/generate-og.js --force    re-render everything
 *
 * For each public/…/index.html it renders an HTML card in the site's
 * price-sticker design — page title, section stamp, price sticker when the
 * page maps to a product, and Ben's cutout (assets/og-src/ben-cutout.png) —
 * and screenshots it with Playwright to assets/og/<key>.jpg, where <key> is
 * the URL path with "/" → "__" ("home" for the root). build.js copies
 * assets/og → public/og and emits the matching og:image tags.
 *
 * A manifest (assets/og/manifest.json) records each key's input hash so
 * unchanged pages are skipped on re-runs. Deps: playwright (npx fallback).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const PUB = path.join(ROOT, 'public');
const OUT = path.join(ROOT, 'assets', 'og');
const CUTOUT = path.join(ROOT, 'assets', 'og-src', 'ben-cutout.png');
const FORCE = process.argv.includes('--force');

/* product lookup for price stickers (same data build.js uses) */
const products = [...require('../src/products.js'), ...require('../src/products-51-100.js')];
const LAUNCHED_DIR = path.join(ROOT, 'src', 'launched');
if (fs.existsSync(LAUNCHED_DIR)) {
  for (const f of fs.readdirSync(LAUNCHED_DIR).filter(f => f.endsWith('.json'))) {
    products.push(JSON.parse(fs.readFileSync(path.join(LAUNCHED_DIR, f), 'utf8')));
  }
}
const bySlug = {};
for (const p of products) if (p.slug && !(p.slug in bySlug)) bySlug[p.slug] = p;

const KICKERS = [
  [/^$/, 'Pay once · own forever'],
  [/^apps(\/|$)/, 'App directory'],
  [/^vs(\/|$)/, 'Head-to-head'],
  [/^compare(\/|$)/, 'Pricing breakdown'],
  [/^alternatives(\/|$)/, 'Pay-once alternatives'],
  [/^blog(\/|$)/, 'Blog'],
  [/^comparison(\/|$)/, 'Comparison'],
  [/^research(\/|$)/, 'Data report'],
  [/^solve(\/|$)/, 'Solve a problem'],
  [/^categories(\/|$)/, 'By category'],
  [/^checkout(\/|$)/, 'Checkout'],
  [/^events(\/|$)/, 'Events'],
  [/^graveyard(\/|$)/, 'The subscription graveyard'],
  [/^stacks(\/|$)/, 'User stacks'],
  [/^savings|^calculator/, 'Run your numbers'],
];

function pageMeta(rel) {
  const segs = rel.split('/').filter(Boolean);
  const kicker = (KICKERS.find(([re]) => re.test(rel)) || [])[1];
  /* product slug: /<slug>/, /apps/<slug>/..., /checkout/<slug>/ */
  let p = null;
  if (segs.length && bySlug[segs[0]]) p = bySlug[segs[0]];
  else if ((segs[0] === 'apps' || segs[0] === 'checkout') && bySlug[segs[1]]) p = bySlug[segs[1]];
  return {
    kicker: kicker || (p ? 'Pay-once app' : 'OneTimeSuite'),
    price: p && typeof p.price === 'number' ? p.price : null,
  };
}

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

function cardHtml({ title, kicker, price }, cutoutUrl) {
  const size = title.length > 72 ? 52 : title.length > 44 ? 60 : 70;
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;800&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:1200px; height:630px; background:#f4f5f2; overflow:hidden;
         font-family:"Bricolage Grotesque",sans-serif; color:#17191d; position:relative; }
  .frame { position:absolute; inset:20px; border:2px solid #17191d; border-radius:18px; }
  .accent { position:absolute; left:20px; right:20px; bottom:20px; height:12px;
            background:#e8420c; border-radius:0 0 16px 16px; }
  .content { position:absolute; left:64px; top:58px; width:600px; z-index:2; }
  .brand { font-family:"IBM Plex Mono",monospace; font-weight:600; font-size:24px;
           letter-spacing:0.08em; display:flex; align-items:center; gap:14px; }
  .brand .mark { width:40px; height:40px; background:#e8420c; border-radius:9px; color:#fff;
                 display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:700; }
  .kicker { font-family:"IBM Plex Mono",monospace; font-weight:600; font-size:19px;
            text-transform:uppercase; letter-spacing:0.14em; color:#4b4e55;
            border:1.5px solid #17191d; border-radius:7px; display:inline-block;
            padding:7px 14px 8px; margin-top:44px; background:#fff; }
  h1 { font-weight:800; font-size:${size}px; line-height:1.06; letter-spacing:-0.015em;
       margin-top:26px; text-wrap:balance; display:-webkit-box; -webkit-line-clamp:4;
       -webkit-box-orient:vertical; overflow:hidden; }
  .sticker { position:absolute; left:64px; bottom:64px; display:inline-flex; flex-direction:column;
             align-items:center; font-family:"IBM Plex Mono",monospace; background:#e8420c; color:#fff;
             padding:14px 26px 15px; border-radius:14px; transform:rotate(-3deg);
             box-shadow:0 2px 0 rgba(23,25,29,0.18); line-height:1.05; }
  .sticker .amt { font-weight:600; font-size:44px; letter-spacing:-0.02em; }
  .sticker .once { font-size:15px; font-weight:500; text-transform:uppercase; letter-spacing:0.16em; margin-top:6px; }
  .tag { position:absolute; left:64px; bottom:78px; font-family:"IBM Plex Mono",monospace;
         font-weight:500; font-size:21px; color:#4b4e55; letter-spacing:0.02em; }
  .ben { position:absolute; right:40px; bottom:32px; height:505px; z-index:1;
         filter:drop-shadow(-6px 8px 18px rgba(23,25,29,0.22)); }
</style></head><body>
  <div class="frame"></div>
  <div class="content">
    <div class="brand"><span class="mark">$1</span>ONETIMESUITE.COM</div>
    <span class="kicker">${esc(kicker)}</span>
    <h1>${esc(title)}</h1>
  </div>
  ${price != null
    ? `<div class="sticker"><span class="amt">$${price}</span><span class="once">once · yours forever</span></div>`
    : `<div class="tag">Pay once. Own it forever.</div>`}
  <img class="ben" src="${cutoutUrl}">
  <div class="accent"></div>
</body></html>`;
}

(async () => {
  if (!fs.existsSync(CUTOUT)) throw new Error('missing ' + CUTOUT);
  fs.mkdirSync(OUT, { recursive: true });
  const manifestPath = path.join(OUT, 'manifest.json');
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
  const cutoutUrl = 'data:image/png;base64,' + fs.readFileSync(CUTOUT).toString('base64');

  /* collect pages */
  const pages = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const fp = path.join(d, e.name);
      if (e.isDirectory()) walk(fp);
      else if (e.name === 'index.html') pages.push(fp);
    }
  })(PUB);

  const jobs = [];
  for (const fp of pages) {
    const rel = path.relative(PUB, path.dirname(fp)).replace(/\\/g, '/');
    const key = rel ? rel.replace(/\//g, '__') : 'home';
    const html = fs.readFileSync(fp, 'utf8');
    const m = html.match(/<title>([^<]*)<\/title>/);
    if (!m) continue;
    const title = m[1].replace(/\s*\|\s*OneTimeSuite( Blog)?\s*$/, '')
      .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    const meta = pageMeta(rel);
    const hash = crypto.createHash('md5').update(JSON.stringify([title, meta, 3])).digest('hex').slice(0, 12);
    const outFile = path.join(OUT, key + '.jpg');
    if (process.env.OG_FILTER && !key.includes(process.env.OG_FILTER)) continue;
    if (!FORCE && manifest[key] === hash && fs.existsSync(outFile)) continue;
    jobs.push({ key, title, meta, hash, outFile });
  }
  console.log(`pages: ${pages.length}, to render: ${jobs.length}`);
  if (!jobs.length) return;

  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  let done = 0;
  for (const j of jobs) {
    await page.setContent(cardHtml({ title: j.title, ...j.meta }, cutoutUrl), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: j.outFile, type: 'jpeg', quality: 84 });
    manifest[j.key] = j.hash;
    if (++done % 100 === 0) {
      console.log(`${done}/${jobs.length}`);
      fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    }
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  await browser.close();
  console.log(`rendered ${done} thumbnails -> assets/og/`);
})();
