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

/* Launch-state counts for the shared footer — mirrors AVAILABLE_SLUGS /
   availableProducts / comingSoon in ../build.js. Keep in sync. */
const launchedBrands = new Set(launched.map(l => l.brand.toLowerCase()));
const comingSoon = require(path.join(REPO, 'src', 'coming-soon.js')).filter(p => !launchedBrands.has(p.brand.toLowerCase()));
const AVAILABLE_SLUGS = new Set(['bloomrecorder', 'wispertalk', 'linkleaf', 'captionly', 'clip-pipeline', 'viral-invoice', 'orgtree', 'sigcraft',
  'cutaway', 'contractly', 'deepdesk', 'docsmithapi', 'iconforge', 'keyloop', 'maptrail', 'memeforge', 'mockcraft', 'paletteforge', 'pdfsmith',
  'quillpad', 'quotewell', 'reelsnag', 'renewcheck', 'shrinkray', 'streakly', 'textract', 'voicebarn', 'whisperdesk', 'wrangle',
  'boardly', 'bookslot', 'bravowall', 'castport', 'chatlet', 'chatterbox', 'docwell', 'doortracker', 'droplink', 'famping', 'formforge', 'hawkwatch',
  'hearback', 'hookscope', 'inkpress', 'inkseal', 'keymaster', 'ledgerly', 'overlayr', 'pingcron', 'postbird', 'queuecraft', 'serpdeck', 'shipnotes',
  'signboard', 'snapfleet', 'snipvault', 'statfox', 'timevault', 'upwatch', 'vaultkeeper', 'billcraft', 'trimly', 'cardsmith', 'postdock', 'scantrail',
]);
const availableCount = allProducts.filter(p => AVAILABLE_SLUGS.has(p.slug)).length;
/* Shared chrome meta injected into every page (footer counts). */
const SITE_META = {
  totalApps: allProducts.length,
  available: availableCount,
  comingSoon: allProducts.length - availableCount + comingSoon.length,
};

/* ---------- per-app satellite link sets (mirror src/sections/*) ---------- */
const matrix = require(path.join(REPO, 'src', 'seo-matrix.js'));

/* slug -> category slug (first category that claims the app — same as
   seo-matrix.js and sections/apps-directory.js). */
const categoryByApp = {};
for (const c of matrix.categories) for (const s of c.appSlugs) if (!(s in categoryByApp)) categoryByApp[s] = c.slug;
const categoryBySlug = Object.fromEntries(matrix.categories.map(c => [c.slug, c]));

/* Canonical competitor per app: first name-sorted competitor entry whose apps
   list contains the slug — mirrors vs-compare.js's pair iteration order. */
const matrixCompetitors = [...(matrix.competitors || [])].sort((a, b) => a.name.localeCompare(b.name));
const compForApp = slug => matrixCompetitors.find(c => c.apps.includes(slug)) || null;

/* personasFor / platformsFor — exact mirrors of sections/apps-directory.js. */
const broadestPersonas = [...matrix.personas]
  .sort((a, b) => ((matrix.personaCategoryFit[b.slug] || []).length - (matrix.personaCategoryFit[a.slug] || []).length)
    || a.slug.localeCompare(b.slug))
  .slice(0, 2);
const personasForApp = slug => {
  const cat = categoryByApp[slug];
  if (!cat) return broadestPersonas;
  return matrix.personas.filter(per => (matrix.personaCategoryFit[per.slug] || []).includes(cat)).slice(0, 4);
};
const platformsForApp = p => (p.kind ? matrix.platforms.filter(pl => (pl.kinds || []).includes(p.kind)) : matrix.platforms);

/** All satellite SEO pages that exist for a product, root-relative. */
function siteLinksFor(p) {
  const comp = compForApp(p.slug);
  const cat = categoryByApp[p.slug] ? categoryBySlug[categoryByApp[p.slug]] : null;
  return {
    vs: comp ? `/vs/${p.slug}-vs-${comp.slug}/` : null,
    compare: comp ? `/compare/${p.slug}-vs-${comp.slug}/` : null,
    alternatives: comp ? `/alternatives/${comp.slug}/` : null,
    compName: comp ? comp.name : null,
    profile: `/apps/${p.slug}/`,
    updates: `/apps/${p.slug}/updates/`,
    personas: personasForApp(p.slug).map(per => ({ slug: per.slug, name: per.name, url: `/apps/${p.slug}/for/${per.slug}/` })),
    platforms: platformsForApp(p).map(pl => ({ slug: pl.slug, name: pl.name, url: `/apps/${p.slug}/on/${pl.slug}/` })),
    solve: matrix.problems.filter(pr => pr.appSlugs.includes(p.slug)).map(pr => ({ slug: pr.slug, title: pr.title, url: `/solve/${pr.slug}/` })),
    category: cat ? { slug: cat.slug, name: cat.name, url: `/categories/${cat.slug}/` } : null,
  };
}

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

/* Every desktop app gets a Downloads section, whether or not its installers are
   published yet. The section resolves assets from <repo>-releases/releases/latest
   at page load, so a page starts as "installers coming soon" and turns into real
   buttons the moment that release exists — no site edit, no redeploy.
   Apps that predate the -releases convention are listed here. */
const RELEASES_REPO_OVERRIDES = {
  wispertalk: 'wispertalk-releases',
  bloomrecorder: 'bloomrecorder-releases',
  orgtree: 'wholeteam-mvp',
};

function autoDownloads(p) {
  if (!DESKTOP_SLUGS.has(p.slug)) return null; // web/self-hosted apps have no installer
  const repo = RELEASES_REPO_OVERRIDES[p.slug] || (p.repo ? `${String(p.repo).replace(/-mvp$/, '')}-releases` : null);
  if (!repo) return null;
  return {
    repo: `bensblueprints/${repo}`,
    version: '',
    title: `Download ${p.brand}`,
    sub: 'Version {version} — install, then sign in with Whop. Your purchase unlocks it; there is no licence key to enter.',
    editions: [{
      key: 'app',
      name: p.brand,
      role: 'Windows and macOS. Buy once, download any time — this page always links the current build.',
      assets: {},
    }],
  };
}

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
    downloads: p.downloads || autoDownloads(p),
    site: SITE_META,
    siteLinks: siteLinksFor(p),
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
