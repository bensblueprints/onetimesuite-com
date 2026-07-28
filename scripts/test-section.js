#!/usr/bin/env node
/* test-section.js — smoke-test harness for src/sections/*.js SEO factory modules.
 *
 * Usage:
 *   node scripts/test-section.js <section-file>   e.g. src/sections/vs-compare.js
 *   node scripts/test-section.js --all            run every file in src/sections/
 *
 * Loads the real factory data (seo-matrix, sales-data, schema, product catalog),
 * builds a mock sectionCtx (write/reg collect in memory — NOTHING is written to
 * public/), runs the section, then validates its output:
 *   - at least one page written
 *   - no duplicate routes
 *   - every emitted page >= 500 chars of HTML
 *   - every internal href starts with '/'
 *   - every route matches ^[a-z0-9\-/]+$
 * Exit code 1 on any failure. Multiple agents can run this in parallel safely.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://onetimesuite.com';

/* --- real factory data (same modules build.js loads) --- */
const matrix = require(path.join(ROOT, 'src', 'seo-matrix.js'));
const sales = require(path.join(ROOT, 'src', 'sales-data.js'));
const schema = require(path.join(ROOT, 'src', 'seo', 'schema.js'));
const products = require(path.join(ROOT, 'src', 'products.js'));
const products51 = require(path.join(ROOT, 'src', 'products-51-100.js'));
const extras = require(path.join(ROOT, 'src', 'extra-products.js'));
const allProducts = [...products, ...products51, ...extras];
const bySlug = Object.fromEntries(allProducts.map(p => [p.slug, p]));

/* --- minimal stand-ins for build.js helpers (same signatures) --- */
const esc = s => String(s).replace(/&(?![a-z#0-9]+;)/g, '&amp;');
const attr = s => esc(s).replace(/"/g, '&quot;');
const ldJson = o => JSON.stringify(o).replace(/</g, '\\u003c');
const fitTitle = t => String(t);
const fitDesc = d => String(d);
const fmt = n => '$' + Number(n).toLocaleString('en-US');
const art = name => (/^[aeiou]/i.test(name) ? 'an' : 'a');
const crumbs = items => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: url })),
});
const ORG_LD = { '@type': 'Organization', name: 'OneTimeSuite', url: SITE };
const pricePair = p => `<span class="price-pair"><span class="was">${esc(p.compPrice || '')} forever</span> <span class="sticker"><span class="amt">$${p.price}</span><span class="once">once</span></span></span>`;
const shotFrame = p => `<div class="shot-frame"><div class="placeholder">${p.icon || ''}</div></div>`;

function makeCtx() {
  const written = new Map(); // rel -> html
  const dupes = [];
  const registered = [];     // [rel, set]
  const ctx = {
    SITE,
    esc, attr, fitTitle, fitDesc, fmt, art,
    crumbs, ORG_LD, ldJson, pricePair, shotFrame,
    allProducts, bySlug,
    availableProducts: allProducts, upcomingProducts: [],
    bundleValue: 0, bundleSavings: 0,
    matrix, sales, schema,
    youtubeVideos: {},
    page({ title, desc, canonical, ogType, jsonld = [], body, robots }) {
      const ld = jsonld.map(o => `<script type="application/ld+json">${ldJson(o)}</script>`).join('\n');
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${esc(title)}</title>
  <meta name="description" content="${attr(desc)}">
  ${canonical ? `<link rel="canonical" href="${attr(canonical)}">` : ''}
  ${robots ? `<meta name="robots" content="${attr(robots)}">` : ''}
${ld}
</head>
<body>
${body}
</body>
</html>`;
    },
    write(rel, html) {
      const key = rel === '' ? '/' : rel;
      if (written.has(key)) dupes.push(key);
      written.set(key, html);
    },
    reg(rel, set = 'pages') { registered.push([rel, set]); },
  };
  return { ctx, written, dupes, registered };
}

function checkSection(file) {
  const name = path.basename(file);
  const failures = [];
  const { ctx, written, dupes, registered } = makeCtx();
  try {
    require(file)(ctx);
  } catch (err) {
    console.log(`FAIL ${name}: threw — ${err.message}`);
    return false;
  }

  const routes = [...written.keys()].map(rel => (rel === '/' ? '/' : `/${rel.replace(/^\/+|\/+$/g, '')}/`));

  if (written.size === 0) failures.push('zero pages written');
  for (const d of dupes) failures.push(`duplicate route: /${d}/`);

  for (const [rel, html] of written) {
    const route = rel === '/' ? '/' : `/${rel.replace(/^\/+|\/+$/g, '')}/`;
    if (html.length < 500) failures.push(`page too small (${html.length} chars): ${route}`);
    if (!/^[a-z0-9\-/]+$/.test(route)) failures.push(`route has illegal chars: ${route}`);
    /* internal hrefs must be site-rooted absolute paths */
    const hrefs = html.match(/href="([^"]*)"/g) || [];
    for (const h of hrefs) {
      const v = h.slice(6, -1);
      if (!v) continue;
      if (v.startsWith('/') || v.startsWith('http://') || v.startsWith('https://') ||
          v.startsWith('#') || v.startsWith('mailto:') || v.startsWith('data:') || v.startsWith('tel:')) continue;
      failures.push(`non-rooted href "${v}" on ${route}`);
    }
  }

  console.log(`${failures.length ? 'FAIL' : 'PASS'} ${name}: ${written.size} pages written, ${registered.length} registered`);
  console.log(`  sample routes: ${routes.slice(0, 5).join(', ')}${routes.length > 5 ? ' …' : ''}`);
  for (const f of failures.slice(0, 20)) console.log(`  FAIL: ${f}`);
  if (failures.length > 20) console.log(`  … and ${failures.length - 20} more failures`);
  return failures.length === 0;
}

const arg = process.argv[2];
if (!arg) {
  console.error('usage: node scripts/test-section.js <section-file> | --all');
  process.exit(1);
}

let ok = true;
if (arg === '--all') {
  const dir = path.join(ROOT, 'src', 'sections');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort() : [];
  if (!files.length) {
    console.log('PASS --all: no section modules in src/sections/ (nothing to test)');
    process.exit(0);
  }
  for (const f of files) ok = checkSection(path.join(dir, f)) && ok;
} else {
  const file = path.resolve(process.cwd(), arg);
  if (!fs.existsSync(file)) {
    console.error(`not found: ${file}`);
    process.exit(1);
  }
  ok = checkSection(file);
}
process.exit(ok ? 0 : 1);
