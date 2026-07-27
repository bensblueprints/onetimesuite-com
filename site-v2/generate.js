/*
 * generate.js — prerender static product pages from the existing catalog data.
 *
 * Reads ../src/products.js, ../src/products-51-100.js, ../src/extra-products.js
 * (and ../src/launched/*.json if present), computes pricing tiers (src/pricing.js),
 * renders each page with the SSR bundle, and writes dist/<slug>/index.html
 * alongside the hashed client assets vite already emitted into dist/.
 *
 * Usage (after `npm run build`, or just `npm run all`):
 *   node generate.js                 -> pilot pages only (captionly, inkseal)
 *   node generate.js --all           -> every product in the catalog
 *   node generate.js slugA slugB ... -> specific slugs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { computePricing } from './src/pricing.js';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..');
const DIST = path.join(HERE, 'dist');

const PILOTS = ['captionly', 'inkseal'];

/* ------------------------------------------------ load catalog (same as build.js) */
const products = require(path.join(REPO, 'src', 'products.js'));
const products51 = require(path.join(REPO, 'src', 'products-51-100.js'));
const extras = require(path.join(REPO, 'src', 'extra-products.js'));
const whopLinks = require(path.join(REPO, 'src', 'whop-links.json'));
// per-tier checkout URLs from the live Whop pricing restructure (2026-07-16)
let tierUrlsRaw = {};
try { tierUrlsRaw = require(path.join(REPO, 'src', 'tier-checkouts.json')); } catch {}
const tierUrls = Object.fromEntries(Object.entries(tierUrlsRaw).map(([slug, r]) => [slug, {
  monthly: r.monthlyCheckoutUrl || null,
  yearly: r.yearlyCheckoutUrl || null,
  lifetime: r.lifetimePlanId ? `https://whop.com/checkout/${r.lifetimePlanId}` : null,
}]));
const ytVideos = require(path.join(REPO, 'src', 'youtube-videos.json'));

const LAUNCHED_DIR = path.join(REPO, 'src', 'launched');
const launched = fs.existsSync(LAUNCHED_DIR)
  ? fs.readdirSync(LAUNCHED_DIR).filter(f => f.endsWith('.json'))
      .map(f => JSON.parse(fs.readFileSync(path.join(LAUNCHED_DIR, f), 'utf8')))
  : [];

const allProducts = [...products, ...products51, ...launched, ...extras];

/* Related-tools picks: prefer apps competing with the same SaaS, else the
   same desktop/web kind. Deterministic — walk catalog order starting just
   after the current product and wrap around, so the same input always
   produces the same links. */
const catalogMeta = allProducts.map(p => ({
  slug: p.slug,
  brand: p.brand,
  icon: p.icon || '📦',
  tagline: p.tagline,
  competitor: String(p.competitor || '').toLowerCase(),
  isDesktop: null, // filled after DESKTOP_SLUGS is defined
}));

function relatedFor(slug) {
  const i = catalogMeta.findIndex(m => m.slug === slug);
  if (i === -1) return [];
  const me = catalogMeta[i];
  const ordered = [...catalogMeta.slice(i + 1), ...catalogMeta.slice(0, i)];
  const picks = [];
  const passes = [
    m => me.competitor && m.competitor === me.competitor,
    m => m.isDesktop === me.isDesktop,
  ];
  for (const pass of passes) {
    for (const m of ordered) {
      if (picks.length >= 4) break;
      if (!picks.includes(m) && pass(m)) picks.push(m);
    }
    if (picks.length >= 3) break;
  }
  return picks.slice(0, 4).map(({ slug: s, brand, icon, tagline }) => ({ slug: s, brand, icon, tagline }));
}

/** JSON-LD @graph for a normalized product page. */
function jsonLd(p) {
  const url = `https://onetimesuite.com/${p.slug}/`;
  const price = p.pricing.kind === 'desktop' ? p.pricing.once : p.pricing.lifetime;
  const graph = [
    {
      '@type': 'SoftwareApplication',
      '@id': `${url}#app`,
      name: p.brand,
      applicationCategory: 'BusinessApplication',
      operatingSystem: p.isDesktop ? 'Windows, macOS' : 'self-hosted',
      url,
      description: p.oneliner,
      offers: {
        '@type': 'Offer',
        price: String(price),
        priceCurrency: 'USD',
        url,
      },
    },
  ];
  if (p.faq.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      mainEntity: p.faq.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }
  if (p.videoId) {
    const yt = ytVideos[p.slug] || {};
    graph.push({
      '@type': 'VideoObject',
      '@id': `${url}#video`,
      name: `${p.brand} demo`,
      embedUrl: `https://www.youtube.com/embed/${p.videoId}`,
      thumbnailUrl: `https://i.ytimg.com/vi/${p.videoId}/hqdefault.jpg`,
      ...(yt.at ? { uploadDate: String(yt.at).slice(0, 10) } : {}),
    });
  }
  graph.push({
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://onetimesuite.com/' },
      { '@type': 'ListItem', position: 2, name: 'Available now', item: 'https://onetimesuite.com/#available' },
      { '@type': 'ListItem', position: 3, name: p.brand, item: url },
    ],
  });
  return { '@context': 'https://schema.org', '@graph': graph };
}

/* Desktop vs web — mirrors DESKTOP_SLUGS in ../build.js */
const DESKTOP_SLUGS = new Set([
  'pdfsmith', 'cutaway', 'whisperdesk', 'shrinkray', 'clipdeck', 'sigcraft', 'streakly', 'deepdesk',
  'quillpad', 'wrangle', 'reelsnag', 'voicebarn', 'textract', 'memeforge', 'orgtree', 'renewcheck',
  'paletteforge', 'iconforge', 'bloomrecorder', 'wispertalk',
  ...launched.filter(l => l.kind === 'desktop').map(l => l.slug),
  ...products51.filter(p => p.kind === 'desktop').map(p => p.slug),
]);
catalogMeta.forEach(m => { m.isDesktop = DESKTOP_SLUGS.has(m.slug); });

/* Apps with their own pre-existing checkout — never remap to whopLinks. */
const OWN_CHECKOUT = new Set(['wispertalk', 'bloomrecorder']);
const WHOP = 'https://whop.com/benjisaiempire';

/* Published installer releases (public -mvp repos) + in-browser demos. */
const RELEASE_URLS = {
  captionly: 'https://github.com/bensblueprints/video-clip-captioner-mvp/releases/tag/v1.0.0',
  bloomrecorder: 'https://github.com/bensblueprints/bloomrecorder/releases/tag/v1.0.0',
};
const DEMO_SLUGS = new Set(['captionly', 'cutaway']);

const slugify = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const pair = (arr, keys) => (arr || []).map(row => Object.fromEntries(keys.map((k, i) => [k, row[i]])));

/* Send buyers through our on-site embedded checkout (/checkout/<slug>/?plan=X)
   instead of straight to whop.com — keeps the pixel on our domain and lets the
   post-purchase redirect land on /thanks/<slug>/. Non-checkout URLs (product
   pages, own sites) pass through untouched. */
const localCheckout = (slug, url) => {
  const m = /whop\.com\/checkout\/(plan_[A-Za-z0-9]+)/.exec(url || '');
  return m ? `/checkout/${slug}/?plan=${m[1]}` : url;
};

/** Normalize a raw catalog entry into the flat shape ProductPage expects. */
function normalize(p) {
  const isDesktop = DESKTOP_SLUGS.has(p.slug);
  const wl = OWN_CHECKOUT.has(p.slug) ? null : whopLinks[p.slug];
  const buyUrl = localCheckout(p.slug, (wl && (wl.checkoutUrl || wl.productUrl)) || p.buyUrl || WHOP);
  const yt = ytVideos[p.slug];
  return {
    slug: p.slug,
    brand: p.brand,
    icon: p.icon || '📦',
    repo: p.repo || null,
    price: p.price,
    tagline: p.tagline,
    oneliner: p.oneliner,
    heroLead: p.heroLead,
    competitor: p.competitor || 'the SaaS version',
    competitorSlug: slugify(p.competitor || 'saas'),
    compPrice: p.compPrice || 'a monthly subscription',
    isDesktop,
    stampText: p.stamp || (isDesktop ? 'Desktop app · runs offline' : 'Web app · self-hosted on your server'),
    buyUrl,
    releaseUrl: RELEASE_URLS[p.slug] || null,
    demoUrl: DEMO_SLUGS.has(p.slug) ? `/${p.slug}/demo/` : null,
    tierUrls: tierUrls[p.slug]
      ? Object.fromEntries(Object.entries(tierUrls[p.slug]).map(([k, u]) => [k, localCheckout(p.slug, u)]))
      : null,
    videoId: (yt && yt.videoId) || null,
    pricing: computePricing(p.price, isDesktop, (tierUrlsRaw[p.slug] && tierUrlsRaw[p.slug].prices) || undefined),
    features: pair(p.features, ['icon', 'title', 'desc']),
    compRows: pair(p.compRows, ['label', 'us', 'them']),
    steps: pair(p.steps, ['title', 'desc']),
    faq: pair(p.faq, ['q', 'a']),
    payback: p.payback || null,
    downloads: p.downloads || null,
  };
}

/* ------------------------------------------------ render */
/* SEO clamps (2026-07-27 audit): titles ≤60 chars, meta descriptions
   120–160 chars. Same rules as ../build.js fitTitle/fitDesc — keep both
   copies in sync. */
function fitTitle(t, limit = 60) {
  t = String(t).replace(/\s+/g, ' ').trim();
  if (t.length <= limit) return t;
  const base = t.replace(/\s*\|\s*OneTimeSuite( Blog)?\s*$/, '');
  if (base.length <= limit) return base;
  let best = -1, keep = 0;
  for (const sep of [' — ', ': ', '? ', ' · ', ' | ']) {
    const i = base.lastIndexOf(sep);
    if (i >= 20 && i <= limit && i > best) { best = i; keep = sep === '? ' ? 1 : 0; }
  }
  if (best !== -1) return base.slice(0, best + keep);
  const cut = base.slice(0, limit - 3);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:—–-]+$/, '') + '…';
}
function fitDesc(d, limit = 160) {
  d = String(d).replace(/\s+/g, ' ').trim();
  if (d.length > limit) {
    const cut = d.slice(0, limit - 2);
    const dot = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
    if (dot >= 80) d = cut.slice(0, dot + 1);
    else d = cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:—–-]+$/, '') + '…';
  }
  if (d.length < 120) {
    for (const pad of [
      ' Pay once, own it forever — no subscription, no renewal.',
      ' Part of the OneTimeSuite pay-once catalog.',
      ' Pay once, own it forever.',
    ]) {
      if (d.length >= 120) break;
      if (d.length + pad.length <= limit) d += pad;
    }
  }
  return d;
}

const templatePath = path.join(DIST, 'index.html');
if (!fs.existsSync(templatePath)) {
  console.error('dist/index.html not found — run `npm run build` first (or `npm run all`).');
  process.exit(1);
}
const template = fs.readFileSync(templatePath, 'utf8');
const { render } = await import(pathToUrl(path.join(HERE, 'dist-ssr', 'entry-server.js')));

function pathToUrl(pth) {
  return 'file://' + pth.replace(/\\/g, '/');
}

const args = process.argv.slice(2);
const wanted = args.includes('--all')
  ? allProducts.map(p => p.slug)
  : args.length ? args : PILOTS;

let written = 0;
for (const slug of wanted) {
  const raw = allProducts.find(p => p.slug === slug);
  if (!raw) { console.error(`!! no product with slug "${slug}" — skipped`); continue; }
  const product = normalize(raw);
  product.related = relatedFor(slug);
  /* Reserve room for escapeHtml() entity expansion so the escaped form in
     the HTML source meets the length limits (same rule as ../build.js). */
  const rawTitle = product.brand + ' — ' + product.tagline;
  const tMargin = (rawTitle.match(/&/g) || []).length * 4 + (rawTitle.match(/"/g) || []).length * 5;
  const dMargin = (String(product.oneliner).match(/&/g) || []).length * 4 + (String(product.oneliner).match(/"/g) || []).length * 5;
  const head = [
    `<title>${escapeHtml(fitTitle(rawTitle, 60 - tMargin))}</title>`,
    `<meta name="description" content="${escapeHtml(fitDesc(product.oneliner, 160 - dMargin))}" />`,
    `<link rel="canonical" href="https://onetimesuite.com/${product.slug}/" />`,
    `<meta property="og:title" content="${escapeHtml(fitTitle(rawTitle, 60 - tMargin))}" />`,
    `<meta property="og:description" content="${escapeHtml(fitDesc(product.oneliner, 160 - dMargin))}" />`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd(product)).replace(/</g, '\\u003c')}</script>`,
  ].join('\n    ');

  const html = template
    .replace('<!--app-head-->', head)
    .replace('<!--app-html-->', render(product))
    .replace(/window\.__PRODUCT__\s*=\s*(\/\*product-json\*\/\s*)?null/, () =>
      `window.__PRODUCT__ = ${JSON.stringify(product).replace(/</g, '\\u003c')}`);

  const outDir = path.join(DIST, product.slug);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  written++;
  console.log(`ok  /${product.slug}/  (${product.pricing.kind}: ${
    product.pricing.kind === 'desktop'
      ? '$' + product.pricing.once + ' once'
      : `$${product.pricing.monthly}/mo · $${product.pricing.yearly}/yr · $${product.pricing.lifetime} lifetime`
  })`);
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

console.log(`\n${written}/${wanted.length} pages written to ${DIST}`);
