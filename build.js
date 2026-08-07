/*
 * build.js — static site generator for onetimesuite.com
 *
 * Node built-ins only. Outputs into public/:
 *   /                         hub
 *   /<slug>/                  56 product pages
 *   /onetime-suite-bundle/    $997 all-access bundle
 *   /comparison/              blog hub (76 generated + 8 standalone posts)
 *   /comparison/<slug>/       76 comparison posts
 *   /<post-slug>/             8 hand-written SEO posts (root level)
 *   sitemap.xml, robots.txt, 404.html
 *
 * Run: node build.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'public');
const SITE = 'https://onetimesuite.com';
const WHOP = 'https://whop.com/benjisaiempire';
const GH = 'https://github.com/bensblueprints';

/* Real Whop product listings (slug -> { productUrl, checkoutUrl, ... }).
   Source of truth: onetime-suite/whop-publish-results.json. */
const whopLinks = require('./src/whop-links.json');
/* Tiered Whop pricing for the web apps — prices.lifetime is the one-time
   (lifetime) price shown for web-hosted apps; desktop apps use `price`. */
const tierCheckouts = require('./src/tier-checkouts.json');
/* Apps with their own pre-existing checkout — never remap to whopLinks. */
const OWN_CHECKOUT = new Set(['wispertalk', 'bloomrecorder']);

const products = require('./src/products.js');
/* Products 51–100 wave (45 newly-launched apps), full landing-page shape with a
   `kind` field. They join the catalog, the bundle receipt, hub grids, sitemap
   and ItemList exactly like the original products.js entries. */
const products51 = require('./src/products-51-100.js');
const posts = [
  ...require('./src/posts-1.js'), ...require('./src/posts-2.js'), ...require('./src/posts-3.js'),
  ...require('./src/posts-4.js'), ...require('./src/posts-5.js'), ...require('./src/posts-6.js'),
];
const CSS_V = require('crypto').createHash('md5').update(fs.readFileSync(path.join(__dirname, 'src', 'site.css'))).digest('hex').slice(0, 8);
const bySlug = Object.fromEntries(products.map(p => [p.slug, p]));

/* merge in the products 51–100 wave */
for (const p of products51) {
  if (!p.slug || !p.brand || !p.features || !p.faq) throw new Error('bad products-51-100 entry: ' + JSON.stringify(p).slice(0, 80));
  if (bySlug[p.slug]) throw new Error('products-51-100 slug collides with existing product: ' + p.slug);
  products.push(p);
  bySlug[p.slug] = p;
}

/* Newly launched apps (products 51–100 wave): drop each app's landing-data.json
   into src/launched/ (with a "kind": "desktop"|"web" field) and it becomes a
   full catalog product — bundle receipt included — and its caution-taped
   coming-soon card is removed automatically (matched by brand). */
const LAUNCHED_DIR = path.join(ROOT, 'src', 'launched');
const launched = fs.existsSync(LAUNCHED_DIR)
  ? fs.readdirSync(LAUNCHED_DIR).filter(f => f.endsWith('.json'))
      .map(f => JSON.parse(fs.readFileSync(path.join(LAUNCHED_DIR, f), 'utf8')))
  : [];
for (const l of launched) {
  if (!l.slug || !l.brand || !l.features || !l.faq) throw new Error('bad launched entry: ' + JSON.stringify(l).slice(0, 80));
  if (bySlug[l.slug]) throw new Error('launched slug collides with existing product: ' + l.slug);
  products.push(l);
  bySlug[l.slug] = l;
}

/* planned catalog (products 51–100 + Dealstack) — caution-taped cards, no pages */
const launchedBrands = new Set(launched.map(l => l.brand.toLowerCase()));
const comingSoon = require('./src/coming-soon.js').filter(p => !launchedBrands.has(p.brand.toLowerCase()));
const soonDesktop = comingSoon.filter(p => p.kind === 'desktop');
const soonWeb = comingSoon.filter(p => p.kind === 'web');

/* Shipped apps that live outside products.js (BloomRecorder, WisperTalk) —
   first-class product pages, but NOT part of the $997 bundle receipt. */
const extras = require('./src/extra-products.js');
const allProducts = [...products, ...extras];
for (const p of extras) if (!bySlug[p.slug]) bySlug[p.slug] = p;

/* Public launch state: only these are purchasable today — every other catalog
   app is shown as a caution-taped "Coming soon" card on the hub. */
const AVAILABLE_SLUGS = new Set(['bloomrecorder', 'wispertalk', 'linkleaf', 'captionly', 'clip-pipeline', 'viral-invoice', 'wholeteam', 'sigcraft',
  /* 2026-07-27 launch wave — 21 desktop apps (one-time price, matches Whop): */
  'cutaway', 'contractly', 'deepdesk', 'docsmithapi', 'iconforge', 'keyloop', 'maptrail', 'memeforge', 'mockcraft', 'paletteforge', 'pdfsmith',
  'quillpad', 'quotewell', 'reelsnag', 'renewcheck', 'shrinkray', 'streakly', 'textract', 'voicebarn', 'whisperdesk', 'wrangle',
  /* 2026-07-27 launch wave — 36 web apps (tiered; price = Whop lifetime tier): */
  'boardly', 'bookslot', 'bravowall', 'castport', 'chatlet', 'chatterbox', 'docwell', 'doortracker', 'droplink', 'famping', 'formforge', 'hawkwatch',
  'hearback', 'hookscope', 'inkpress', 'inkseal', 'keymaster', 'ledgerly', 'overlayr', 'pingcron', 'postbird', 'queuecraft', 'serpdeck', 'shipnotes',
  'signboard', 'snapfleet', 'snipvault', 'statfox', 'timevault', 'upwatch', 'vaultkeeper', 'billcraft', 'trimly', 'cardsmith', 'postdock', 'scantrail',
  /* 2026-07-29 — Bloom family desktop launches: */
  'bloommeeting', 'bloomclipper',
  /* 2026-08-07 — desktop launch wave (installers built, Whop plans live): */
  'resumecraft', 'ledgerlitehome', 'postcraft', 'slidecraft', 'syncvault', 'snapreceipt',
]);
const availableProducts = allProducts.filter(p => AVAILABLE_SLUGS.has(p.slug));
const upcomingProducts = allProducts.filter(p => !AVAILABLE_SLUGS.has(p.slug));

/* Desktop (Electron, no server) vs web-hosted (self-hosted on your own VPS) */
const DESKTOP_SLUGS = new Set([
  'pdfsmith', 'cutaway', 'whisperdesk', 'shrinkray', 'clipdeck', 'sigcraft', 'streakly', 'deepdesk',
  'quillpad', 'wrangle', 'reelsnag', 'voicebarn', 'textract', 'memeforge', 'wholeteam', 'renewcheck',
  'paletteforge', 'iconforge', 'bloomrecorder', 'wispertalk', 'clip-pipeline', 'bloommeeting', 'bloomclipper',
  ...launched.filter(l => l.kind === 'desktop').map(l => l.slug),
  ...products51.filter(p => p.kind === 'desktop').map(p => p.slug),
]);
/* Products with a free in-browser demo at /<slug>/demo/ (src/<slug>-demo.html) */
const DEMOS = new Set(['iconforge', 'sigcraft', 'pdfsmith', 'wrangle', 'textract', 'memeforge', 'paletteforge', 'shrinkray', 'bloomrecorder', 'quillpad', 'captionly', 'cutaway']);

const desktopProducts = allProducts.filter(p => DESKTOP_SLUGS.has(p.slug));
const webProducts = allProducts.filter(p => !DESKTOP_SLUGS.has(p.slug));

const BUNDLE = {
  slug: 'onetime-suite-bundle',
  name: 'OneTimeSuite Complete',
  price: 997,
  tagline: 'Every app in the suite. One payment. Own it all, forever.',
  checkoutUrl: (whopLinks['onetimesuite-complete'] && whopLinks['onetimesuite-complete'].checkoutUrl) || 'https://whop.com/checkout/plan_5Mv4jYmDfZH3a',
};
const bundleValue = products.reduce((s, p) => s + p.price, 0); // à-la-carte total of the full catalog (computed)
const bundleSavings = bundleValue - BUNDLE.price;              // savings vs the flat $997 bundle

/* Rewrite a whop.com checkout URL to our on-site embedded checkout page
   (/checkout/<slug>/?plan=...) so the buyer stays on onetimesuite.com and we
   control the post-purchase redirect to /thanks/<slug>/. Non-checkout URLs
   (product pages, own sites) pass through untouched. */
const localCheckout = (slug, url) => {
  const m = /whop\.com\/checkout\/(plan_[A-Za-z0-9]+)/.exec(url || '');
  return m ? `/checkout/${slug}/?plan=${m[1]}` : url;
};

const fmt = n => '$' + n.toLocaleString('en-US');
const art = name => (/^[aeiou]/i.test(name) ? 'an' : 'a');
function esc(s) { return String(s).replace(/&(?![a-z#0-9]+;)/g, '&amp;'); }
function attr(s) { return String(s).replace(/&(?![a-z#0-9]+;)/g, '&amp;').replace(/"/g, '&quot;'); }

/* SEO clamps — titles ≤60 chars, meta descriptions 120–160 chars (2026-07-27
   audit). Titles: drop the " | OneTimeSuite[ Blog]" suffix first, then cut at
   the last clause boundary that keeps ≥20 chars — never mid-word. Keep the
   differentiating brand/competitor BEFORE the first separator in title
   patterns so a clause cut can never collapse two pages to the same title.
   Descriptions: long ones trim at a sentence (then word) boundary; short ones
   pad with standard suffixes that fit.
   The `limit` args let page() reserve room for HTML-entity expansion
   (& -> &amp; = +4 chars, " -> &quot; = +5), since the escaped form is what
   ships in the HTML source. */
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
/* Ellipsis-only variant: keeps as much of the differentiating tail as fits
   instead of dropping the whole clause. Used when the clause cut collides
   with another page's title (e.g. "X vs Y: <angle A>" and "X vs Y: <angle B>"
   both collapsing to "X vs Y"). */
function fitTitleKeepTail(t, limit = 60) {
  t = String(t).replace(/\s+/g, ' ').trim().replace(/\s*\|\s*OneTimeSuite( Blog)?\s*$/, '');
  if (t.length <= limit) return t;
  const cut = t.slice(0, limit - 3);
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

/* ---------- screenshots ---------- */
const SHOTS_SRC = path.join(ROOT, 'assets', 'shots');
const shotsAvailable = new Set(
  fs.existsSync(SHOTS_SRC)
    ? fs.readdirSync(SHOTS_SRC).filter(f => /\.png$/i.test(f)).map(f => f.replace(/\.png$/i, ''))
    : []
);
const hasShot = slug => shotsAvailable.has(slug);

/* ---------- retail box art (assets/boxes/<slug>.png) ---------- */
const BOXES_SRC = path.join(ROOT, 'assets', 'boxes');
const boxesAvailable = new Set(
  fs.existsSync(BOXES_SRC)
    ? fs.readdirSync(BOXES_SRC).filter(f => /\.png$/i.test(f)).map(f => f.replace(/\.png$/i, ''))
    : []
);
const hasBox = slug => boxesAvailable.has(slug);

/* ---------- per-product demo clips (assets/clips/<slug>.mp4) ---------- */
const CLIPS_SRC = path.join(ROOT, 'assets', 'clips');
const clipsAvailable = new Set(
  fs.existsSync(CLIPS_SRC)
    ? fs.readdirSync(CLIPS_SRC).filter(f => /\.mp4$/i.test(f)).map(f => f.replace(/\.mp4$/i, ''))
    : []
);
const hasClip = slug => clipsAvailable.has(slug);

/* YouTube demo videos (slug -> videoId), preferred over self-hosted clips.
   Source of truth: repoclips/state/youtube-uploads.json — re-copy to
   src/youtube-videos.json after each upload batch. Videos must be UNLISTED
   (private videos show "Video unavailable" when embedded). */
const YT_FILE = path.join(ROOT, 'src', 'youtube-videos.json');
const ytVideos = fs.existsSync(YT_FILE) ? JSON.parse(fs.readFileSync(YT_FILE, 'utf8')) : {};
const ytIdRaw = slug => ytVideos[slug] && ytVideos[slug].videoId;

/* 2026-07-21: a bulk privacy update (unlisted -> public) via the YouTube API
   reset status.embeddable to false on these 50 videos, so their iframes show
   "Video unavailable". Pages for these slugs fall back to the self-hosted
   clip in assets/clips/. Re-enable embedding in YouTube Studio per video,
   then remove its id from this set to restore the YouTube embed. */
const EMBED_BROKEN = new Set([
  '7BlTtgEW5oA','Rsoi0ZVkXFg','a8r-iXod_XU','oO5OjjYrboQ','o7Ph5Pq1i5g',
  'c_q_6zE-nz4','SgLQcPcjDa4','s-tVw-L3eZs','o_8R3InZ6yw','DFPpzOu4JkE',
  'emwpnjA3n2I','xKq4q1Rzs4Y','1iLdbqt3gX8','8LeRHcoEr54','6kvAG33EPn0',
  'r84rn66_1n8','pVbEn-KGEM0','x1poMK9BTEI','G4F8dlssBFI','8zJ4wfGOFv0',
  'jmRXnMZF3Q0','h4Oh4jZKOF0','lakJ6DOLxn8','bnz4GO8a07s','_gcsKHLCKZQ',
  'kttAi5p5KtU','eYhZH25RdR4','Raa8KaetOGE','HJi2TpalIEI','fYaScy6mVP0',
  'rLtZ4VWCQks','4o-DQQs0EEc','jeocVdn4ONQ','UeSNaFgUaxE','6T-FFr_wW9Y',
  '5BUlJ42-wQY','hrvgMD2cv1k','WwCDUD6Gbk8','kQw-TSAIoyA','KwYyLOuPWLE',
  'i5e3cB-gVOM','75sV6MLZ5m4','2o3V9KwSQ3s','0hGdEOsGVqQ','vPS7GAF_-4A',
  'hbXjB7XSIoU','FpIYvC1d3zg','jQNvJHoS9sE','tDML8XEbAPY','EToxD4Q8BTs',
]);
const ytId = slug => {
  const v = ytIdRaw(slug);
  return v && !EMBED_BROKEN.has(v) ? v : undefined;
};

/* VideoObject JSON-LD so Google associates each demo video with its page
   (needed for Google Video indexing alongside video-sitemap.xml) */
const videoLd = p => {
  const vid = ytId(p.slug);
  const raw = ytIdRaw(p.slug);
  if (!vid && !hasClip(p.slug)) return null;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: `${p.brand} demo — pay once, own it forever`,
    description: p.tagline || p.brand,
    thumbnailUrl: [raw ? `https://i.ytimg.com/vi/${raw}/hqdefault.jpg` : `${SITE}/assets/shots/${p.slug}.png`],
    uploadDate: ((ytVideos[p.slug] && ytVideos[p.slug].at) || '2026-07-15T00:00:00Z').slice(0, 10),
  };
  if (vid) {
    ld.embedUrl = `https://www.youtube-nocookie.com/embed/${vid}`;
    ld.contentUrl = `https://www.youtube.com/watch?v=${vid}`;
  } else {
    ld.contentUrl = `${SITE}/assets/clips/${p.slug}.mp4`;
  }
  return ld;
};
const videoLdScript = p => {
  const ld = videoLd(p);
  return ld ? `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>` : '';
};

/* ---------- competitor columns for the 76 comparison posts ---------- */
const POST_TABLE = {
  'smallpdf-alternative':            { price: '$12–15/mo', yr3: '~$432–540', limits: 'Task/file limits on free tier', cloud: 'Uploaded to their servers', offline: 'No', src: 'Closed' },
  'ilovepdf-alternative':            { price: '~$4–7/mo', yr3: '~$144–252', limits: 'File-size & task limits on free tier', cloud: 'Uploaded to their servers', offline: 'Partial (desktop app)', src: 'Closed' },
  'adobe-acrobat-online-alternative':{ price: '$12.99–19.99/mo', yr3: '~$468–720', limits: 'One free task, then paywall', cloud: 'Adobe cloud', offline: 'Desktop app only (subscription)', src: 'Closed' },
  'remove-bg-alternative':           { price: '$9/mo (40 credits)', yr3: '~$324', limits: '40 credits/mo; free tier capped at 0.25 MP', cloud: 'Every image uploaded', offline: 'No', src: 'Closed' },
  'photoroom-alternative':           { price: '~$9.99/mo', yr3: '~$270+', limits: 'Watermarks / export caps on free tier', cloud: 'Processed on their servers', offline: 'No', src: 'Closed' },
  'otter-ai-alternative':            { price: '$16.99/mo', yr3: '~$300–612', limits: '1,200 min/mo, 90 min/file (Pro)', cloud: 'Audio uploaded to their cloud', offline: 'No', src: 'Closed' },
  'rev-alternative':                 { price: '$0.25/min AI (or subscription)', yr3: 'Depends on volume — $15/hr of audio', limits: 'Pay per minute, always', cloud: 'Audio uploaded & staff-handled', offline: 'No', src: 'Closed' },
  'descript-transcription-alternative': { price: '~$16–24/mo', yr3: '~$576–864', limits: 'Transcription hours metered monthly', cloud: 'Projects sync to their cloud', offline: 'Limited', src: 'Closed' },
  'tinypng-alternative':             { price: 'Yearly sub + $0.009/image API', yr3: 'Grows with volume', limits: '20 images/batch, 5 MB/file free; 75 MB cap', cloud: 'Every image uploaded', offline: 'No', src: 'Closed' },
  'kraken-io-alternative':           { price: '$5–79+/mo by MB quota', yr3: '~$180–2,800', limits: 'Metered by megabyte', cloud: 'Every image uploaded', offline: 'No', src: 'Closed' },
  'loom-alternative':                { price: '$15/mo (Business)', yr3: '~$540', limits: '5-min cap + watermark on free', cloud: 'Videos live on their servers', offline: 'No', src: 'Closed' },
  'camtasia-alternative':            { price: '~$179+/yr', yr3: '~$540+', limits: 'Subscription required for updates', cloud: 'Local (heavy desktop suite)', offline: 'Yes', src: 'Closed' },
  'screen-studio-alternative':       { price: '$100+ one-time + paid update renewals', yr3: 'License + renewals', limits: 'macOS only', cloud: 'Local', offline: 'Yes', src: 'Closed' },
  'uptimerobot-alternative':         { price: '$8/mo (Solo)', yr3: '~$288', limits: '50 monitors on paid tier', cloud: 'Their cloud', offline: 'n/a (hosted)', src: 'Closed' },
  'pingdom-alternative':             { price: '$10+/mo', yr3: '~$360+', limits: 'Metered by check volume', cloud: 'Their cloud', offline: 'n/a (hosted)', src: 'Closed' },
  'statuscake-alternative':          { price: '~$20+/mo (Superior)', yr3: '~$740+', limits: 'Monitors & intervals rationed by tier', cloud: 'Their cloud', offline: 'n/a (hosted)', src: 'Closed' },
  'bitly-alternative':               { price: '$29/mo for custom domain', yr3: '~$1,044', limits: 'Links & QR codes capped per plan', cloud: 'Their servers', offline: 'No', src: 'Closed' },
  'rebrandly-alternative':           { price: '$13–32+/mo', yr3: '~$468–1,150+', limits: 'Links, clicks & seats metered', cloud: 'Their cloud', offline: 'No', src: 'Closed' },
  'short-io-alternative':            { price: '$19–99/mo', yr3: '~$684–3,564', limits: 'Links & analytics retention by tier', cloud: 'Their cloud', offline: 'No', src: 'Closed' },
  'freshbooks-alternative':          { price: '$19/mo (Lite)', yr3: '~$684', limits: '5 billable clients on Lite', cloud: 'Their cloud', offline: 'No', src: 'Closed' },
  'invoice-ninja-alternative':       { price: 'Free (4 clients) / ~$10–12/mo hosted', yr3: '$0–432', limits: '4 clients free; self-host = Laravel stack', cloud: 'Hosted, or your server', offline: 'Self-host: yes', src: 'Open source' },
  'calendly-alternative':            { price: '$10/user/mo (Standard)', yr3: '~$360/user', limits: '1 event type on free tier', cloud: 'Their cloud', offline: 'No', src: 'Closed' },
  'cal-com-alternative':             { price: 'Free solo hosted / ~$15/user/mo teams', yr3: '$0–540/user', limits: 'Self-host = heavy Next.js + Postgres', cloud: 'Hosted, or your server', offline: 'Self-host: yes', src: 'Open source' },
  'typeform-alternative':            { price: '$29/mo (Basic)', yr3: '~$1,044', limits: '100 responses/mo on Basic', cloud: 'Their cloud', offline: 'No', src: 'Closed' },
  'jotform-alternative':             { price: '~$34+/mo (Bronze)', yr3: '~$1,224+', limits: 'Submissions, storage & views capped', cloud: 'Their cloud', offline: 'No', src: 'Closed' },
  'wisestamp-alternative':           { price: '$6/mo/user', yr3: '~$216/user', limits: 'Per-user pricing; ad injected on free tier', cloud: 'Their cloud account', offline: 'No', src: 'Closed' },
  'buffer-alternative':              { price: '$6/channel/mo', yr3: '~$1,080 (5 channels)', limits: 'Pay per channel; post caps on cheap tiers', cloud: 'Their cloud', offline: 'No', src: 'Closed' },
  'hootsuite-alternative':           { price: '$99/mo (Professional)', yr3: '~$3,564', limits: 'Channels & seats capped by plan', cloud: 'Their cloud', offline: 'No', src: 'Closed' },
  'linktree-alternative':            { price: '$5–9/mo', yr3: '~$180–324', limits: 'Branding + feature gates on free tier', cloud: 'Their servers', offline: 'No', src: 'Closed' },
  'beacons-alternative':             { price: '~$10/mo (Pro)', yr3: '~$360', limits: 'Transaction fees + upsells on free tier', cloud: 'Their cloud', offline: 'No', src: 'Closed' },
  'qr-tiger-alternative':            { price: '$15+/mo', yr3: '~$540+', limits: 'Dynamic codes capped; codes die if you stop paying', cloud: 'Their cloud (qrco.de)', offline: 'No', src: 'Closed' },
  'flowcode-alternative':            { price: '~$12–30+/mo', yr3: '~$432–1,080+', limits: 'Code limits + feature gates by plan; codes need active plan', cloud: 'Their cloud', offline: 'No', src: 'Closed' },
  'bannerbear-alternative':          { price: '$49/mo (Starter)', yr3: '~$1,764', limits: '1,000 renders & 10 templates/mo on Starter', cloud: 'Every render through their servers', offline: 'No', src: 'Closed' },
  'placid-alternative':              { price: '$19+/mo', yr3: '~$684+', limits: 'Monthly render quota by plan', cloud: 'Templates & renders in their cloud', offline: 'No', src: 'Closed' },
  'plausible-alternative':           { price: '$9–19/mo, tiered by traffic', yr3: '~$324–684', limits: '10k–100k pageviews/mo per tier', cloud: 'Their EU cloud (or heavy self-host stack)', offline: 'n/a (hosted)', src: 'Open source (AGPL), hosted paid' },
  'google-analytics-alternative':    { price: 'Free (you pay with visitor data)', yr3: '$0 cash — plus consent banners & compliance risk', limits: 'Data sampling; 14-month retention default', cloud: 'Google’s servers', offline: 'No', src: 'Closed' },
  'canny-alternative':               { price: '$79/mo', yr3: '~$2,844', limits: 'Features & integrations gated by plan', cloud: 'Their cloud', offline: 'No', src: 'Closed' },
  'headway-alternative':             { price: '~$29/mo for custom branding', yr3: '~$1,044', limits: 'Changelog only — no roadmap or voting', cloud: 'Their cloud', offline: 'No', src: 'Closed' },
  'hotjar-alternative':              { price: '$32/mo (Surveys entry plan)', yr3: '~$1,152', limits: '500 survey responses/mo on entry plan', cloud: 'Their cloud, third-party script', offline: 'No', src: 'Closed' },
  'gitbook-alternative':             { price: '$79/site/mo (Premium)', yr3: '~$2,844 per site', limits: 'Per-site pricing; branding gated by tier', cloud: 'Their cloud', offline: 'No', src: 'Closed' },
  'helpscout-docs-alternative':      { price: '$22+/user/mo (bundled in Plus)', yr3: '~$792+ per user', limits: 'Docs inseparable from help-desk seats', cloud: 'Their cloud', offline: 'No', src: 'Closed' },
  'trello-alternative':              { price: '$5/user/mo (Standard)', yr3: '~$180/user ($1,800 for a team of 10)', limits: '10-board cap free; attachments & export plan-gated', cloud: 'Atlassian’s cloud', offline: 'No', src: 'Closed' },
  'toggl-alternative':               { price: '$10/user/mo (Starter)', yr3: '~$360/user', limits: 'Rates & rounding on paid tiers', cloud: 'Their cloud', offline: 'Partial (apps cache)', src: 'Closed' },
  'clockify-alternative':            { price: 'Free core / $4.99–14.99/user/mo', yr3: '$0–540/user', limits: 'Rounding, rates & invoicing gated by paid tiers', cloud: 'Their cloud only', offline: 'Partial (apps cache)', src: 'Closed' },
  'habitify-alternative':            { price: '~$5/mo (Premium)', yr3: '~$180', limits: 'Habit cap on free tier; premium gates', cloud: 'Their cloud, behind an account', offline: 'Partially', src: 'Closed' },
  'centered-alternative':            { price: '~$10/mo', yr3: '~$360', limits: 'Features tied to account & subscription', cloud: 'Their cloud', offline: 'Partly', src: 'Closed' },
  'notion-alternative':              { price: '$12/mo per seat', yr3: '~$432/seat', limits: 'Per-seat pricing; AI is extra', cloud: 'Their cloud, proprietary block format', offline: 'Partial, unreliable', src: 'Closed' },
  'obsidian-sync-alternative':       { price: '$4–8/mo (app itself free)', yr3: '~$144–288', limits: 'Sync is the paid part; commercial license extra', cloud: 'E2E-encrypted relay (their servers)', offline: 'App yes; sync needs internet', src: 'Closed (app); files are yours' },
  'crisp-alternative':               { price: '$95/mo (Plus, per workspace)', yr3: '~$3,420', limits: 'Seats & features by plan; per-workspace pricing', cloud: 'Their cloud', offline: 'No', src: 'Closed' },
  'intercom-alternative':            { price: '$39+/seat/mo + usage-based AI fees', yr3: '~$1,404+ per seat', limits: 'Per-seat + per-resolution + add-on modules', cloud: 'Their cloud', offline: 'No', src: 'Closed' },
  'cronitor-alternative':            { price: '$10/mo solo, $50/mo team', yr3: '~$360–1,800', limits: 'Monitors tiered by plan', cloud: 'Their cloud', offline: 'n/a (hosted)', src: 'Closed' },
  'healthchecks-alternative':        { price: 'Free (20 checks) / $20/mo Business', yr3: '$0–720', limits: '20 checks free; tiered above', cloud: 'Hosted, or your Django/Postgres server', offline: 'Self-host: yes', src: 'Open source (BSD)' },
  'urlbox-alternative':              { price: '$19/mo (2,000 renders)', yr3: '~$684+', limits: 'Renders metered monthly', cloud: 'Every URL through their servers', offline: 'No', src: 'Closed' },
  'devutils-alternative':            { price: '~$29 one-time license', yr3: 'License (+ paid major updates)', limits: 'macOS only — no Windows version', cloud: 'Local', offline: 'Yes', src: 'Closed' },
  'simplebackups-alternative':       { price: '$29+/mo', yr3: '~$1,044+', limits: 'Backup jobs tiered by plan', cloud: 'Your DB credentials on their cloud', offline: 'No', src: 'Closed' },
  'launchlist-alternative':          { price: '$29/mo (Pro)', yr3: '~$1,044', limits: 'Waitlists & subscribers tiered; free tier capped', cloud: 'Your list in their cloud, their sender', offline: 'No', src: 'Closed' },
  'senja-alternative':               { price: '$19/mo Starter, $39/mo Pro', yr3: '~$684–1,404', limits: '15 testimonials on free tier', cloud: 'Their cloud, their widget servers', offline: 'No', src: 'Closed' },
  'distill-alternative':             { price: '$12/mo Starter, $28/mo Pro', yr3: '~$432–1,008', limits: 'Monitors & check frequency metered', cloud: 'Their cloud (free tier = browser-open only)', offline: 'Extension while browser open', src: 'Closed' },
  'mailchimp-alternative':           { price: '~$20/mo @ 1k contacts, $100+/mo @ 10k', yr3: '~$720–3,600+ (grows with list)', limits: 'Priced per contact (incl. unsubscribed); sends capped', cloud: 'Their cloud', offline: 'No', src: 'Closed' },
  'sendy-alternative':               { price: '$69 one-time + SES usage', yr3: '$69 + ~$0.10/1k emails', limits: 'Amazon SES only; PHP/MySQL stack', cloud: 'Your server (sending via SES)', offline: 'Self-host: yes', src: 'Closed (license key)' },
  'keygen-alternative':              { price: 'from $99/mo hosted', yr3: '~$3,564+', limits: 'Licenses & usage metered by tier', cloud: 'Keys & activations in their cloud (CE self-host = Ruby+Postgres+Redis)', offline: 'CE self-host: yes', src: 'Fair-code CE available' },
  'gumroad-alternative':             { price: '10% + 50¢ per sale', yr3: '~$3,000 at $10k/yr sales', limits: 'Cut scales with your revenue; server-only license checks', cloud: 'Their platform holds customers, keys & files', offline: 'No', src: 'Source-visible (restrictive license)' },
  'transistor-alternative':          { price: '$19–99/mo', yr3: '~$684–3,564', limits: '20k downloads/mo on Starter', cloud: 'Audio + feed on their infra', offline: 'No', src: 'Closed' },
  'buzzsprout-alternative':          { price: '$12–24/mo by upload hours', yr3: '~$432–864', limits: 'Upload hours metered; free tier deletes episodes after 90 days', cloud: 'Audio & feed on their servers', offline: 'No', src: 'Closed' },
  'ghost-alternative':               { price: '$9/mo (Starter)', yr3: '~$324', limits: '1 staff user & limited integrations on Starter', cloud: 'Ghost(Pro) cloud (self-host = MySQL + Node DIY)', offline: 'No', src: 'Open source (hosted paid)' },
  'feedly-alternative':              { price: '$8/mo (Pro)', yr3: '~$288', limits: 'Source caps & search gated on free tier', cloud: 'Subscriptions & reading data in their cloud', offline: 'Partial (mobile apps cache)', src: 'Closed' },
  'inoreader-alternative':           { price: '~$7.50–9.99/mo (Pro)', yr3: '~$270–360', limits: 'Rules, monitoring & search gated by tier', cloud: 'Their cloud', offline: 'Partial (apps cache)', src: 'Closed' },
  'wetransfer-alternative':          { price: '$12/mo (Pro)', yr3: '~$432', limits: 'Free tier ~2–3GB; no resumable uploads', cloud: 'Files stored on their servers until expiry', offline: 'No', src: 'Closed' },
  'docusign-alternative':            { price: '$10–25/mo', yr3: '~$360–900', limits: '5 envelopes/mo on Personal', cloud: 'Documents & audit trail in their cloud', offline: 'No', src: 'Closed' },
  'pandadoc-alternative':            { price: '$19–49/user/mo', yr3: '~$684–1,764 per user', limits: 'CRM hooks & approvals gated to higher tiers', cloud: 'Their cloud; history tied to active plan', offline: 'No', src: 'Closed' },
  'streamelements-alternative':      { price: 'Free core (SE.Pay fees + premium upsells)', yr3: '$0 cash + fees on tips', limits: 'Overlays render from their cloud — outages hit your stream', cloud: 'Overlays & configs on their servers', offline: 'No', src: 'Closed' },
  'yodeck-alternative':              { price: '$8/screen/mo', yr3: '~$1,440 (5 screens)', limits: 'Per-screen billing from screen 2; player app/Pi image required', cloud: 'Content & schedules in their cloud', offline: 'Players cache locally', src: 'Closed' },
  'accuranker-alternative':          { price: '$129+/mo', yr3: '~$4,644+', limits: '1,000 keywords on the entry plan', cloud: 'Your keyword strategy in their cloud', offline: 'No', src: 'Closed' },
  'hyvor-talk-alternative':          { price: '$8–24+/mo, tiered by pageviews', yr3: '~$288–864+', limits: 'Pageview tiers; SSO & extras on higher plans', cloud: 'Comments on their EU cloud', offline: 'No', src: 'Closed' },
  'disqus-alternative':              { price: 'Free (ads + tracking) / $12/mo Plus / $95/mo Pro', yr3: '$0–3,420 (+ ads on your readers)', limits: 'Ads & third-party trackers on free tier; heavy embed', cloud: 'Comment history on their servers', offline: 'No', src: 'Closed' },
  'expensify-alternative':           { price: '~$5+/user/mo', yr3: '~$180+ per user', limits: 'Per-seat pricing; cancel = lose access to history', cloud: 'Receipt photos uploaded to their cloud', offline: 'No', src: 'Closed' },
};

/* ============================================================
 * chrome
 * ============================================================ */
const NAV = `
  <nav class="site-nav" aria-label="Main navigation">
    <div class="wrap">
      <a class="wordmark" href="/"><img class="wordmark-mark" src="/ots-mark.png" alt="" width="30" height="34">OneTime<span class="tm">Suite</span></a>
      <input type="checkbox" id="navtoggle" class="nav-toggle" aria-hidden="true">
      <label for="navtoggle" class="hamburger" aria-label="Menu"><span></span><span></span><span></span></label>
      <div class="nav-links">
      <a class="nav-link" href="/#available">Available now</a>
      <a class="nav-link" href="/apps/">Apps</a>
      <a class="nav-link" href="/vs/">Compare</a>
      <a class="nav-link" href="/solve/">Solve</a>
      <a class="nav-link" href="/calculator/">Calculator</a>
      <a class="nav-link" href="/${BUNDLE.slug}/">The bundle</a>
      <a class="nav-link" href="/webinar/">Webinar</a>
      <a class="nav-link" href="/blog/">Blog</a>
      <a class="nav-link nav-login" href="https://dashboard.onetimesuite.com/" rel="noopener">Log in</a>
      </div>
      <a class="nav-buy" href="${WHOP}" rel="noopener">Buy on Whop</a>
    </div>
  </nav>`;

const FOOTER = `
  <footer class="site-footer">
    <div class="wrap">
      <div class="cols">
        <div>
          <a class="wordmark" href="/" style="margin:0 0 0.8rem;display:inline-flex;"><img class="wordmark-mark" src="/ots-mark.png" alt="" width="30" height="34">OneTime<span class="tm">Suite</span></a>
          <p class="blurb">${allProducts.length} apps that replace subscription SaaS. Pay once, own forever. Almost all of them are MIT source on GitHub — build them yourself if you'd rather.</p>
        </div>
        <div>
          <h2>Apps</h2>
          <a href="/apps/">All apps directory</a>
          <a href="/#available">Available now (${availableProducts.length})</a>
          <a href="/#coming-soon">Coming soon (${allProducts.length - availableProducts.length + comingSoon.length})</a>
          <a href="/categories/">Browse by category</a>
          <a href="/${BUNDLE.slug}/">${BUNDLE.name} — ${fmt(BUNDLE.price)}</a>
        </div>
        <div>
          <h2>Compare</h2>
          <a href="/vs/">Versus pages</a>
          <a href="/compare/">Price comparisons</a>
          <a href="/alternatives/">Alternatives A–Z</a>
          <a href="/comparison/">Comparison posts</a>
          <a href="/loom-alternative/">Loom alternative</a>
          <a href="/wispr-flow-alternative/">Wispr Flow alternative</a>
          <a href="/blog/">Blog</a>
        </div>
        <div>
          <h2>The suite</h2>
          <a href="/webinar/">Watch the webinar</a>
          <a href="/calculator/">Savings calculator</a>
          <a href="/price-tracker/">Price tracker</a>
          <a href="/solve/">Solve a problem</a>
          <a href="/research/">Research</a>
          <a href="/manifesto/">The manifesto</a>
          <a href="/graveyard/">Subscription graveyard</a>
          <a href="/stacks/">User stacks</a>
          <a href="/events/">Events</a>
          <a href="/press/">Press kit</a>
        </div>
        <div>
          <h2>Get it</h2>
          <a href="${WHOP}" rel="noopener">Buy on Whop</a>
          <a href="https://dashboard.onetimesuite.com/" rel="noopener">Log in — your library</a>
          <a href="${GH}" rel="noopener">Source on GitHub</a>
          <a href="/savings/">Savings snapshot</a>
        </div>
        <div>
          <h2>Legal</h2>
          <a href="/terms/">Terms of use</a>
          <a href="/privacy/">Privacy</a>
          <a href="/inkseal/compliance/">E-signature compliance</a>
        </div>
      </div>
      <div class="bottom">
        <span>&copy; 2026 OneTimeSuite · by <a href="https://advancedmarketing.co" rel="noopener">Advanced Marketing</a></span>
        <span>Pay once. Own it forever.</span>
      </div>
    </div>
  </footer>`;

/* ---------- Meta Pixel (set META_PIXEL_ID env in Coolify to enable) ----------
   PageView on every page + InitiateCheckout on any click-out to whop.com
   (with the product slug + one-time price). The actual Purchase event is sent
   server-side from the Whop payment.succeeded webhook via the Conversions API
   (ots-track service) — the hosted checkout completes on whop.com, so the
   browser pixel can never see it. */
const META_PIXEL_ID = process.env.META_PIXEL_ID || '';
const PIXEL = META_PIXEL_ID ? (() => {
  const prices = {};
  for (const p of allProducts) prices[p.slug] = p.price;
  prices[BUNDLE.slug] = BUNDLE.price;
  return `
  <script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');
  (function(){var P=${JSON.stringify(prices)};document.addEventListener('click',function(e){var a=e.target&&e.target.closest?e.target.closest('a[href*="whop.com"]'):null;if(!a||!window.fbq)return;var s=location.pathname.split('/').filter(Boolean)[0]||'home';fbq('track','InitiateCheckout',{content_type:'product',content_ids:[s],value:P[s]||0,currency:'USD'});});})();</script>
  <noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1"></noscript>`;
})() : '';

/* Google Tag Manager — container loads on every page (head as high as
   possible + noscript right after <body>, per Google's install docs).
   Conversion tags fire off the GA4-shaped `purchase` dataLayer event
   pushed on /thanks/<slug>/ (see the thanks-page script). */
const GTM_ID = 'GTM-MR2LSDGH';
const GTM_HEAD = `<!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','${GTM_ID}');</script>
  <!-- End Google Tag Manager -->`;
const GTM_BODY = `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;

/* ---------- JSON-LD helpers ----------
   ldJson: compact JSON, every `<` escaped (</script>-safe).
   crumbs(): BreadcrumbList from [name, url] pairs.
   Shared Organization node reused across pages. */
const ldJson = o => JSON.stringify(o).replace(/</g, '\\u003c');
const ORG_LD = {
  '@type': 'Organization', name: 'OneTimeSuite', url: SITE,
  sameAs: ['https://github.com/bensblueprints'],
};
const crumbs = items => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, url], i) => ({
    '@type': 'ListItem', position: i + 1, name, item: url,
  })),
});

/* ---------- social-share thumbnails (assets/og/<key>.jpg) ----------
   Generated by scripts/generate-og.js (run it after a build when pages are
   added — new pages fall back to the site-wide home card until then).
   Key = URL path with "/" -> "__", "home" for the root. */
const OG_SRC = path.join(ROOT, 'assets', 'og');
const ogAvailable = new Set(
  fs.existsSync(OG_SRC) ? fs.readdirSync(OG_SRC).filter(f => f.endsWith('.jpg')) : []
);
function ogImageFor(canonical) {
  let key = 'home';
  try {
    const p = new URL(canonical).pathname.replace(/^\/|\/$/g, '');
    key = p ? p.replace(/\//g, '__') : 'home';
  } catch { /* leave fallback */ }
  if (!ogAvailable.has(key + '.jpg')) key = 'home';
  return ogAvailable.has(key + '.jpg') ? `${SITE}/og/${key}.jpg` : null;
}

/* Clamped-title registry (title -> canonical). If two different pages would
   clamp to the same title, the later one falls back to the ellipsis cut so the
   differentiating clause survives (2026-07-29 audit: 5 blog/vs pairs). */
const seenTitles = new Map();
function page({ title, desc, canonical, ogType = 'website', jsonld = [], body, robots = 'index, follow' }) {
  /* Reserve room for HTML-entity expansion (esc/attr below) so the escaped
     form in the HTML source is what actually meets the length limits. */
  const tMargin = (String(title).match(/&/g) || []).length * 4;
  const dMargin = (String(desc).match(/&/g) || []).length * 4 + (String(desc).match(/"/g) || []).length * 5;
  const rawTitle = title;
  title = fitTitle(title, 60 - tMargin);
  if (seenTitles.has(title) && seenTitles.get(title) !== canonical) {
    const alt = fitTitleKeepTail(rawTitle, 60 - tMargin);
    if (!seenTitles.has(alt) || seenTitles.get(alt) === canonical) title = alt;
    else console.warn('DUPLICATE TITLE (unresolved):', title, canonical);
  }
  seenTitles.set(title, canonical);
  const ogImg = ogImageFor(canonical);
  desc = fitDesc(desc, 160 - dMargin);
  /* ldJson escapes `<` as < so no value (FAQ answers, headlines) can
     ever break out of the script block with a literal "</script>". */
  const ld = jsonld.map(o => `  <script type="application/ld+json">${ldJson(o)}</script>`).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  ${GTM_HEAD}
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="${robots}">
  <title>${esc(title)}</title>
  <meta name="description" content="${attr(desc)}">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <script defer src="https://stats.onetimesuite.com/a.js" data-site="87d907ee"></script>
  <meta property="og:type" content="${ogType}">
  <meta property="og:title" content="${attr(title)}">
  <meta property="og:description" content="${attr(desc)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="OneTimeSuite">${ogImg ? `
  <meta property="og:image" content="${ogImg}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:image" content="${ogImg}">` : ''}
  <meta name="twitter:card" content="${ogImg ? 'summary_large_image' : 'summary'}">
  <link rel="alternate" type="application/rss+xml" title="OneTimeSuite — Pay-Once vs Subscription" href="/rss.xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;800&family=Instrument+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/site.css?v=${CSS_V}">
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-QJ65NLXTY5"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-QJ65NLXTY5');</script>${PIXEL}
${ld}
</head>
<body>
${GTM_BODY}
${NAV}
  <main id="main-content">
${body}
  </main>
${FOOTER}
</body>
</html>
`;
}

function write(rel, html) {
  const dir = rel === '' ? OUT : path.join(OUT, rel);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
}

/* sticker + struck-through subscription price */
function pricePair(p, big = false) {
  return `<span class="price-pair">
    <span class="was">${esc(p.compPrice)} forever</span>
    <span class="sticker${big ? ' big' : ''}"><span class="amt">$${p.price}</span><span class="once">once</span></span>
  </span>`;
}

/* screenshot in thin ink-line browser chrome */
function shotFrame(p) {
  return hasShot(p.slug)
    ? `<div class="shot-frame">
        <div class="bar"><i></i><i></i><i></i></div>
        <img src="/assets/shots/${p.slug}.png" alt="${attr(p.brand)} screenshot" loading="lazy" width="1440" height="720">
      </div>`
    : `<div class="shot-frame">
        <div class="bar"><i></i><i></i><i></i></div>
        <div class="placeholder"><span class="ico" aria-hidden="true">${p.icon}</span><span class="note">Screenshot on the way</span></div>
      </div>`;
}

/* URL registry for sitemap + link check.
 * reg(rel, set) files each URL into a named sitemap set (pages/apps/blog/vs)
 * for the split sitemap files; `urls` keeps the full list for the page-count
 * summary line. */
const urls = [];
const urlSets = { pages: [], apps: [], blog: [], vs: [] };
function reg(relPath, set = 'pages') { urls.push(relPath); (urlSets[set] ||= []).push(relPath); }

/* ============================================================
 * 1. hub  /
 * ============================================================ */
(function hub() {
  const cardsFor = list => list.map(p => `
        <a class="p-card" href="/${p.slug}/">
          <span class="avail"><span class="dot" aria-hidden="true"></span>Available now</span>
          <span class="ico" aria-hidden="true">${p.icon}</span>
          <h3>${p.brand}</h3>
          <p class="one">${esc(p.oneliner)}</p>
          <div class="foot">
            <span class="sticker sm"><span class="amt">$${p.price}</span><span class="once">once</span></span>
            <span class="replaces">replaces ${esc(p.competitor)}<br>${esc(p.compPrice)}</span>
          </div>
        </a>`).join('');

  /* Cards with a slug have a live product page (with a working Whop buy
     button) — render those as real links so the "coming soon" tape doesn't
     block the sale. Slug-less entries (Dealstack etc.) stay inert divs. */
  const soonCardsFor = list => list.map(p => {
    const inner = `
          <span class="tape" aria-hidden="true"><b>&#128679; Coming soon</b></span>
          <span class="ico" aria-hidden="true">${p.icon}</span>
          <h3>${esc(p.brand)}</h3>
          <p class="one">${esc(p.one)}</p>
          <div class="foot">
            <span class="sticker sm"><span class="amt">$${p.price}</span><span class="once">planned</span></span>
            <span class="replaces">will replace ${esc(p.vs)}<br>${esc(p.vsPrice)}</span>
          </div>
          ${p.repoLive ? '<p class="soon-note">code already live on GitHub — product page on the way</p>' : ''}`;
    return p.slug ? `
        <a class="p-card soon linked" href="/${p.slug}/" aria-label="${attr(p.brand)} — coming soon, page available">${inner}
          <p class="soon-note">early access — see the page &amp; buy now</p>
        </a>` : `
        <div class="p-card soon" aria-label="${attr(p.brand)} — coming soon">${inner}
        </div>`;
  }).join('');

  const showRow = (p, i) => `
      <div class="show-row${i % 2 ? ' flip' : ''}">
        <div class="media">${shotFrame(p)}</div>
        <div>
          <div class="brand-line"><span class="ico" aria-hidden="true">${p.icon}</span><span class="name">${p.brand}</span></div>
          <h3><a href="/${p.slug}/">${esc(p.tagline)}</a></h3>
          <p class="tag">${esc(p.oneliner)}</p>
          <ul>${p.features.slice(0, 3).map(f => `<li>${esc(f[1])} — ${esc(f[2])}</li>`).join('')}</ul>
          <div class="meta">
            ${pricePair(p)}
            <a class="link" href="/${p.slug}/">See ${p.brand} &rarr;</a>
          </div>
        </div>
      </div>`;

  /* shipped-but-not-yet-launched products rendered in the coming-soon card shape */
  const toSoon = p => ({ slug: p.slug, brand: p.brand, icon: p.icon, one: p.oneliner, price: p.price, vs: p.competitor, vsPrice: p.compPrice });
  const soonDesktopAll = [...upcomingProducts.filter(p => DESKTOP_SLUGS.has(p.slug)).map(toSoon), ...soonDesktop];
  const soonWebAll = [...upcomingProducts.filter(p => !DESKTOP_SLUGS.has(p.slug)).map(toSoon), ...soonWeb];
  const soonTotal = soonDesktopAll.length + soonWebAll.length;

  const showcase = availableProducts.filter(p => hasShot(p.slug));

  const teaserPosts = [
    ['/loom-alternative/', 'BloomRecorder: The Loom Alternative You Buy Once ($29, No Subscription)'],
    ['/linktree-alternative/', 'LinkLeaf: The Free, Open-Source Linktree Alternative (No Monthly Fee)'],
    ['/wispr-flow-alternative/', 'WisperTalk: The Wispr Flow Alternative You Buy Once ($49 Lifetime)'],
    ['/comparison/notion-alternative/', 'Looking for a Notion Alternative? Meet Quillpad'],
    ['/comparison/mailchimp-alternative/', 'Looking for a Mailchimp Alternative? Meet Postbird'],
  ];

  const body = `
    <section class="hero" aria-label="OneTimeSuite">
      <div class="wrap">
        <span class="stamp">One price on the sticker · No renewal date</span>
        <h1>Buy software the way you buy a hammer. Once.</h1>
        <p class="lead">A ${allProducts.length + comingSoon.length}-app catalog that replaces your subscription SaaS — PDF tools, screen recording, dictation, analytics, invoicing, email campaigns, uptime monitoring and more. <strong>${availableProducts.length} apps are available right now</strong> — ${availableProducts.map(p => p.brand).join(', ')} — and the other ${soonTotal} are in final release prep. Every one is a one-time purchase — nearly all with MIT source on GitHub. No accounts with us, no telemetry, no meter.</p>
        <div class="btn-row">
          <a class="btn btn-solid" href="${WHOP}" rel="noopener">Buy on Whop &rarr;</a>
          <a class="btn btn-ghost" href="/${BUNDLE.slug}/">The ${fmt(BUNDLE.price)} everything bundle</a>
          <a class="btn btn-ghost" href="/savings/">What am I overpaying? &rarr;</a>
        </div>
      </div>
    </section>

    <section aria-label="Watch: The Open Source Exit">
      <div class="wrap" style="max-width:920px;">
        <div class="section-head">
          <span class="stamp">Watch — 4 minutes</span>
          <h2>The Open Source Exit: breaking the SaaS rent cycle</h2>
        </div>
        <video controls preload="metadata" poster="/assets/video/open-source-exit-poster.jpg" style="width:100%;border:1.5px solid var(--ink);border-radius:12px;background:#000;">
          <source src="/assets/video/open-source-exit.mp4" type="video/mp4">
        </video>
      </div>
    </section>

    <section aria-label="Available now">
      <div class="wrap">
        <div class="cat-head" id="available" style="scroll-margin-top:80px;">
          <h2>Available now</h2>
          <span class="count">${availableProducts.length} apps · buy today, own forever</span>
        </div>
        <div class="card-grid">${cardsFor(availableProducts)}
        </div>
      </div>
    </section>

    <section aria-label="Coming soon">
      <div class="wrap">
        <div class="section-head" id="coming-soon" style="scroll-margin-top:80px;">
          <span class="stamp">&#128679; On the build sheet</span>
          <h2>Coming soon — ${soonTotal} more apps</h2>
          <p>The full ${allProducts.length + comingSoon.length}-app catalog is on the way. Every app below joins the ${fmt(BUNDLE.price)} bundle at no extra cost the day it ships — buy the bundle now and you own all of them too.</p>
        </div>
        ${soonDesktopAll.length ? `<div class="cat-head">
          <h2 style="font-size:1.35rem;">Desktop</h2>
          <span class="count">${soonDesktopAll.length} coming soon</span>
        </div>
        <div class="card-grid">${soonCardsFor(soonDesktopAll)}
        </div>` : ''}
        ${soonWebAll.length ? `<div class="cat-head">
          <h2 style="font-size:1.35rem;">Web-hosted</h2>
          <span class="count">${soonWebAll.length} coming soon</span>
        </div>
        <div class="card-grid">${soonCardsFor(soonWebAll)}
        </div>` : ''}
      </div>
    </section>

    ${showcase.length ? `<section aria-label="Screenshots">
      <div class="wrap">
        <div class="section-head">
          <span class="stamp blue">As it actually looks</span>
          <h2>Real screenshots, not mockups</h2>
          <p>Every available app, as it actually looks.</p>
        </div>
        <div class="show-rows">${showcase.map(showRow).join('')}
        </div>
      </div>
    </section>` : ''}

    <section aria-label="The bundle">
      <div class="wrap">
        <div class="bundle-box">
          <div>
            <span class="stamp">All ${products.length} catalog apps · one receipt</span>
            <h2 style="margin:0.4rem 0 0.7rem;">${BUNDLE.name}</h2>
            <p style="color:var(--ink-soft);">Bought one at a time, the ${products.length}-app catalog adds up to <span class="price-fig" style="font-family:var(--mono);">${fmt(bundleValue)}</span>. The bundle is ${fmt(BUNDLE.price)} flat — ${fmt(bundleSavings)} off — and every app we ship later joins it for free.</p>
            <div class="btn-row" style="margin-top:1.3rem;">
              <a class="btn btn-solid" href="/${BUNDLE.slug}/">See what's inside &rarr;</a>
              <a class="btn btn-ghost" href="${WHOP}" rel="noopener">Buy it on Whop</a>
            </div>
          </div>
          <span class="price-pair">
            <span class="was">${fmt(bundleValue)} à la carte</span>
            <span class="sticker big"><span class="amt">${fmt(BUNDLE.price)}</span><span class="once">once · everything</span></span>
          </span>
        </div>
      </div>
    </section>

    <section aria-label="From the blog">
      <div class="wrap">
        <div class="section-head">
          <span class="stamp blue">Reading material</span>
          <h2>Honest comparisons</h2>
          <p>${posts.length + 8} straight-shooting breakdowns of subscription tools vs their pay-once replacements. When the subscription is the right call, we say so.</p>
        </div>
        <div class="post-list">
          ${teaserPosts.map(([href, t]) => `<a href="${href}"><h3>${esc(t)}</h3></a>`).join('\n          ')}
        </div>
        <p style="margin-top:1.2rem;"><a href="/comparison/">Browse all ${posts.length + 8} comparisons &rarr;</a></p>
      </div>
    </section>

    <section aria-label="Get the suite" class="center">
      <div class="wrap">
        <span class="stamp">Checkout</span>
        <h2>Stop renting your tools</h2>
        <p style="color:var(--ink-soft);margin:0.8rem auto 1.6rem;">One-time prices from $15. Signed installers on Whop, MIT source on GitHub. Your hardware does the work — why pay rent on it?</p>
        <div class="btn-row" style="justify-content:center;">
          <a class="btn btn-solid" href="${WHOP}" rel="noopener">Buy on Whop &rarr;</a>
          <a class="btn btn-ghost" href="${GH}" rel="noopener">Browse the source</a>
        </div>
      </div>
    </section>`;

  write('', page({
    title: `OneTimeSuite — ${allProducts.length + comingSoon.length}-App Pay-Once Catalog, ${availableProducts.length} Available Now`,
    desc: `${availableProducts.length} pay-once apps available today (${availableProducts.map(p => p.brand).join(', ')}) and ${soonTotal} more coming — all replacing monthly SaaS bills: PDF tools, screen recording, dictation, analytics, invoicing, email campaigns, uptime monitoring and more. One-time prices from $15, or everything (including every future app) for ${fmt(BUNDLE.price)}.`,
    canonical: `${SITE}/`,
    jsonld: [
      { '@context': 'https://schema.org', '@type': 'WebSite', name: 'OneTimeSuite', url: `${SITE}/` },
      { '@context': 'https://schema.org', ...ORG_LD },
      {
        '@context': 'https://schema.org', '@type': 'ItemList',
        itemListElement: availableProducts.map((p, i) => ({
          '@type': 'ListItem', position: i + 1, name: p.brand, url: `${SITE}/${p.slug}/`,
          item: {
            '@type': 'Product', name: p.brand, url: `${SITE}/${p.slug}/`,
            offers: { '@type': 'Offer', price: String(p.price), priceCurrency: 'USD', url: `${SITE}/${p.slug}/` },
          },
        })),
      },
    ],
    body,
  }));
  reg('/');
})();

/* ---------- shared data, hoisted above the product generator ----------
   slugify, blogAppSlugs, blogExtraComps and ROUNDUPS were originally defined
   down in the blog section (§7b) — the "Everything about {Brand}" cluster
   section below needs them while the v1 product pages are generated. */
const slugify = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '');

const blogAppSlugs = fs.readdirSync(path.join(ROOT, 'src'))
  .filter(f => /^blog-chunk\d+\.js$/.test(f))
  .sort()
  .flatMap(f => require(path.join(ROOT, 'src', f)));

/* --- researched extra competitors (src/blog-competitors.js, optional):
   { productSlug: [{ name, price, yr3 }] } — verified pricing from the
   2026-07-21 competitor-research pass. Each entry yields one extra
   "<competitor> alternative" post via blogPost6. --- */
const BLOG_COMP_FILE = path.join(ROOT, 'src', 'blog-competitors.js');
const blogExtraComps = fs.existsSync(BLOG_COMP_FILE) ? require(BLOG_COMP_FILE) : {};

/* ---------- catalog roundups: 5 long-form "pay-once tools" posts ----------
   Together these five articles link EVERY product page in the catalog (104
   apps), each app in exactly one category. Slugs follow
   /blog/<category>-pay-once-tools/. Apps not yet launched are linked but
   marked "coming soon" — never oversold. */
const ROUNDUPS = [
  {
    slug: 'video-audio-media-pay-once-tools',
    title: '22 Video, Audio & Media Tools You Buy Once (2026)',
    metaDesc: '22 video, audio and media tools you buy once — screen recording, captions, transcription, compression and design. One-time prices, no subscriptions.',
    intro: 'Video and audio tools are where subscriptions sting the most: caption apps, screen recorders, voice tools and podcast hosts all charge monthly for work your own machine can do. The 22 tools below cover recording, remote guests, clipping, transcription, captions, compression, voiceover and design — each one a single payment, most with MIT source on GitHub. Most of them ship as desktop apps, so your footage and audio never leave your hard drive. Every price on this page is the whole price.',
    choose: [
      'Start with the job you do weekly — a recorder, captioner or transcriber you use daily pays for itself within a month or two of the subscription it replaces.',
      'Prefer the desktop apps (Captionly, WhisperDesk, BloomRecorder) when footage is client-confidential — nothing leaves the machine, ever.',
      'Switching mid-project? Read the linked comparison pages first — each one maps the competitor’s feature set honestly, including what it still does better.',
    ],
    faq: [
      ['Do desktop media apps need a powerful GPU?', 'No. The AI features — background removal, transcription, captions — are tuned to run on ordinary CPUs, and the models ship inside the installer. A batch just takes a few seconds per file instead of a credit per file.'],
      ['What happens to my files with pay-once media tools?', 'Nothing. The desktop apps in this category process everything locally and make no network calls. Your footage, audio and images stay on your own disk — which is the whole point.'],
      ['Is a one-time purchase really “lifetime”?', 'Yes. There is no license server to phone home and no renewal date; the app keeps working offline, forever. Updates to the packaged installer are included.'],
      ['Can I still share videos without a cloud link?', 'Yes — export MP4 or GIF and share it however you already share files. And if you specifically need a podcast feed and player pages, Castport covers hosting without the per-month meter.'],
    ],
    apps: ['captionly', 'bloomrecorder', 'bloommeeting', 'bloomclipper', 'voicebarn', 'cutaway', 'castport', 'reelsnag', 'memeforge', 'clip-pipeline', 'shrinkray', 'wispertalk', 'overlayr', 'signboard', 'snapfleet', 'iconforge', 'paletteforge', 'mockcraft', 'postcraft', 'cardsmith', 'slidecraft', 'whisperdesk'],
  },
  {
    slug: 'productivity-business-ops-pay-once-tools',
    title: '21 Productivity & Business Tools You Buy Once (2026)',
    metaDesc: '21 productivity and business ops tools with one-time pricing — invoicing, scheduling, time tracking, receipts, hiring and shifts. Pay once, own forever.',
    intro: 'The average small business rents its calendar, its invoicing, its time tracking and even its org chart — a stack of monthly bills for software that mostly shuffles records around. These 21 apps run the back office for a one-time price: scheduling, billing, receipts, shifts, hiring, onboarding and more. Most are self-hosted web apps, so client and employee data stays on your own server instead of a vendor’s. Buy once and the ops budget stops creeping up every year.',
    choose: [
      'Pick the biggest bill first — invoicing, scheduling and time tracking are usually the largest recurring line items in a small-business stack.',
      'Self-hosted web apps need a cheap VPS; if you’d rather not run one, start with the desktop apps in the list (WholeTeam, Snapreceipt, Streakly).',
      'If three or more of these apply, the $997 everything bundle covers the whole catalog and usually beats buying the big licenses à la carte.',
    ],
    faq: [
      ['What does “self-hosted” mean for a business app?', 'The app runs on a cheap VPS you control instead of the vendor’s cloud. Setup is a one-time job; after that your client, invoice and scheduling data lives on your own server, under your own backups.'],
      ['Can these really replace tools like FreshBooks or Calendly?', 'For the core jobs — invoicing, scheduling, time tracking, receipts, shift planning — yes. Where a competitor still wins (very large teams, deep integrations), the per-app comparison pages say so plainly.'],
      ['Do I pay per employee or per seat?', 'No. Every price here is a flat one-time payment, whether two people use the tool or twenty. There is no per-seat multiplier to outgrow.'],
      ['What if an app I want is marked “coming soon”?', 'It is in final release prep and launches without the price changing. The $997 bundle includes every catalog app, so bundle owners get each one the day it ships.'],
    ],
    apps: ['boardly', 'ledgerly', 'billcraft', 'bookslot', 'formforge', 'timevault', 'wholeteam', 'snapreceipt', 'hirestack', 'shiftly', 'punchcard', 'roster', 'renewcheck', 'streakly', 'deepdesk', 'ledgerlitehome', 'rampcheck', 'doortracker', 'famping', 'eventcraft', 'remindly'],
  },
  {
    slug: 'marketing-social-seo-pay-once-tools',
    title: '21 Marketing, Social & SEO Tools You Buy Once (2026)',
    metaDesc: '21 marketing, social and SEO tools you buy once — social scheduling, email campaigns, rank tracking, links, reviews and analytics. No monthly meter.',
    intro: 'Marketing SaaS is priced like a tax on growth: per channel, per contact, per keyword, per seat. This roundup collects 21 pay-once tools for social scheduling, email campaigns, rank tracking, link management, QR codes, reviews and analytics. They replace metered plans with software you host or install yourself — one receipt, no per-channel multipliers. If your marketing stack costs more every year for doing the same job, start here.',
    choose: [
      'Match the tool to the channel you actually use — one scheduler you open every day beats a rented suite you log into twice a month.',
      'Self-hosted analytics and rank tracking keep your traffic and keyword strategy off third-party clouds (and out of their training data).',
      'Watch the “typical competitor cost” column for per-channel and per-contact pricing — that multiplier is exactly what a one-time price kills.',
    ],
    faq: [
      ['Will a pay-once tool keep up with platform changes?', 'The apps are actively maintained and updates are included in the one-time price. Because most are self-hosted or open source, you are never waiting on a vendor’s pricing-tier decisions either.'],
      ['Is self-hosted analytics as useful as Plausible or GA?', 'Statfox tracks the same core metrics — pageviews, referrers, popular pages — without cookies or consent banners, and your traffic data never leaves your server.'],
      ['Why are competitor costs so much higher for marketing tools?', 'Marketing SaaS usually meters the thing that grows — channels, contacts, keywords, seats. A one-time price has no multiplier, so the gap widens every month your audience grows.'],
      ['Can I migrate my existing subscribers, links or posts?', 'Yes — import and export are standard across these apps, and the per-app pages and FAQs cover the specifics for each tool.'],
    ],
    apps: ['postbird', 'postdock', 'serpdeck', 'linkleaf', 'scantrail', 'statfox', 'utmcraft', 'reflink', 'hearback', 'bravowall', 'starstack', 'pulsecheck', 'askback', 'citewatch', 'chatterbox', 'splitpoint', 'queuecraft', 'redirectly', 'trimly', 'chatlet', 'listcraft'],
  },
  {
    slug: 'documents-writing-signatures-pay-once-tools',
    title: '21 Writing, Docs & Signature Tools You Buy Once (2026)',
    metaDesc: '21 document, writing and e-signature tools with one-time prices — PDF, OCR, contracts, proposals, resumes and publishing. Pay once, sign forever.',
    intro: 'Documents are the original subscription trap: PDF editors, e-signature platforms and proposal tools charge monthly to handle files you already own. These 21 apps cover PDFs, OCR, contracts, signatures, resumes, pitches, changelogs and publishing for a flat one-time price. Several run fully offline, so contracts and sensitive paperwork never touch a third-party server. Pay once, sign forever.',
    choose: [
      'If the paperwork is confidential — contracts, HR documents, client records — prefer the offline desktop apps; nothing is uploaded, ever.',
      'Check signature and record-keeping requirements for your jurisdiction; the e-signature tools here cover standard ESIGN/eIDAS-style workflows.',
      'Before cancelling a vendor, open the linked comparison page for your current tool and check feature parity line by line.',
    ],
    faq: [
      ['Are pay-once e-signatures legally valid?', 'The signature tools here produce signed PDFs with audit trails suitable for standard ESIGN/UETA and eIDAS-style workflows — the Inkseal compliance page on this site walks through the details.'],
      ['Do the PDF and OCR tools work offline?', 'Yes — the desktop apps in this category (PDFsmith, Textract, Quillpad) run entirely on your machine. Documents never leave your disk, which matters for contracts and client paperwork.'],
      ['What if I need a feature the one-time app lacks?', 'Each app’s comparison page lists exactly what the subscription competitor still does better. For most document jobs — merge, sign, convert, publish — parity is already there.'],
      ['Can I use these for commercial client work?', 'Yes — one payment, no per-seat or per-document fees, and most ship MIT source, so you can even build and modify them yourself.'],
    ],
    apps: ['pdfsmith', 'textract', 'inkpress', 'inkseal', 'quillpad', 'shipnotes', 'docwell', 'docsmithapi', 'resumecraft', 'pitchcraft', 'contractly', 'quotewell', 'sigcraft', 'feedloft', 'droplink', 'lessonforge', 'quizcraft', 'forumly', 'voicebox', 'viral-invoice', 'menuly'],
  },
  {
    slug: 'developer-it-admin-pay-once-tools',
    title: '21 Developer & IT Admin Tools You Buy Once (2026)',
    metaDesc: '21 developer and IT admin tools you buy once — uptime, cron, SSL, logs, backups, secrets and status pages. Self-hosted, one-time pricing.',
    intro: 'Dev tooling has quietly become a rental market: monitoring, secrets managers, backups, status pages and snippet libraries all bill monthly. These 21 tools cover uptime, cron, SSL, logs, backups, licensing, link infrastructure and incident pages for a one-time price. Most are self-hosted — which for infrastructure tooling is the point, because your monitoring should not depend on another company’s uptime. Own the tool, own the alert.',
    choose: [
      'Self-hosting is the default here — a $5 VPS runs most of these; weigh that one line item against the subscription you are cancelling.',
      'Prioritize the tools that page you: uptime, cron and certificate monitors earn their keep the first outage they catch.',
      'Most of these ship MIT source on GitHub, so you can audit the exact code that watches your infrastructure before you deploy it.',
    ],
    faq: [
      ['What do I need to self-host these tools?', 'A small VPS (or a homelab box) and about ten minutes per app. Docker-based setups are the norm, and each product page documents the exact steps.'],
      ['Is self-hosted monitoring reliable if my server goes down?', 'Run the monitor on separate infrastructure from what it watches — a $5 VPS in another region is the standard pattern, and it still costs less than one month of most monitoring subscriptions.'],
      ['Are source-available dev tools safe to run in production?', 'Most ship MIT-licensed source you can audit before deploying — the opposite of a black-box agent. The secrets tools (Vaultly, Secretbox) encrypt at rest; details are on each product page.'],
      ['What happens when a “coming soon” dev tool launches?', 'It flips to available on this site and joins the bundle automatically. Bundle owners get every catalog app, including future launches, at no extra cost.'],
    ],
    apps: ['upwatch', 'pingcron', 'hookscope', 'wrangle', 'vaultkeeper', 'hawkwatch', 'keymaster', 'snipvault', 'upkeepstatus', 'vaultly', 'keyloop', 'secretbox', 'certwatch', 'logbin', 'clickmap', 'maptrail', 'linkguard', 'billoop', 'syncvault', 'deskly', 'clientdesk'],
  },
];

/* ---------- "Everything about {Brand}" content-cluster section ----------
   Hub-and-spoke internal linking: every product page links its whole content
   cluster — the blog posts, the /comparison/ page, the demo, the savings
   calculator, the one catalog roundup the app appears in and the GitHub repo.
   Shared by the v1 product generator (§2) and the v2 overlay pass (end of
   file). Every spoke is guarded by the same condition that registered the
   target page, so the section never links a 404. Self-contained inline styles
   (paper/ink/orange palette) because v1 and v2 pages load different CSS. */
const COMP_POST_SLUGS = new Set(posts.map(x => x.slug));
const ROUNDUP_SHORT = {
  'video-audio-media-pay-once-tools': 'video, audio &amp; media',
  'productivity-business-ops-pay-once-tools': 'productivity &amp; business ops',
  'marketing-social-seo-pay-once-tools': 'marketing, social &amp; SEO',
  'documents-writing-signatures-pay-once-tools': 'writing, docs &amp; signatures',
  'developer-it-admin-pay-once-tools': 'developer &amp; IT admin',
};
function productClusterSection(p) {
  const compSlug = slugify(p.competitor);
  const hasBlog = blogAppSlugs.includes(p.slug); // the 5-post blog cluster only exists for these
  const compare = [];
  if (hasBlog) compare.push(
    [`/blog/${p.slug}-best-${compSlug}-alternative-2026/`, `Best ${esc(p.competitor)} alternative in 2026`],
    [`/blog/${p.slug}-vs-${compSlug}-open-source-vs-subscription/`, `${esc(p.brand)} vs ${esc(p.competitor)}: open source vs subscription`],
    [`/blog/${p.slug}-free-open-source-alternatives-to-${compSlug}/`, `Free &amp; open-source alternatives to ${esc(p.competitor)}`],
    [`/blog/${p.slug}-${compSlug}-pricing-is-out-of-control/`, `${esc(p.competitor)} pricing: the 3-year math`],
  );
  if (COMP_POST_SLUGS.has(`${compSlug}-alternative`))
    compare.push([`/comparison/${compSlug}-alternative/`, `The full ${esc(p.competitor)} comparison`]);
  const guides = [];
  if (hasBlog) {
    guides.push([`/blog/${p.slug}-how-to-switch-from-${compSlug}/`, `How to switch from ${esc(p.competitor)}`]);
    for (const comp of (blogExtraComps[p.slug] || [])) {
      const cSlug = slugify(comp.name);
      if (cSlug === compSlug) continue; // blogPost6 skips the primary competitor
      guides.push([`/blog/${p.slug}-${cSlug}-alternative-pay-once/`, `${esc(comp.name)} alternative you pay for once`]);
    }
  }
  const tools = [];
  if (DEMOS.has(p.slug)) tools.push([`/${p.slug}/demo/`, `Try the free ${esc(p.brand)} demo`]);
  tools.push(['/savings/', `See what ${esc(p.competitor)} costs you over 3 years`]);
  const roundup = ROUNDUPS.find(r => r.apps.includes(p.slug));
  if (roundup) tools.push([`/blog/${roundup.slug}/`, `See ${esc(p.brand)} in our ${ROUNDUP_SHORT[roundup.slug] || 'catalog'} roundup`]);
  const source = (!p.closedSource && p.repo)
    ? [[`${GH}/${p.repo}`, `Source on GitHub — bensblueprints/${p.repo}`, ' rel="noopener"']]
    : [];

  const group = (label, links) => links.length ? `
        <div>
          <h3 style="font-family:ui-monospace,monospace;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:#85888f;margin:0 0 0.55rem;">${label}</h3>
          <ul style="list-style:none;margin:0;padding:0;display:grid;gap:0.45rem;">
            ${links.map(([href, text, rel]) => `<li><a href="${href}"${rel || ''} style="color:#2b4bdd;text-decoration:none;font-size:0.92rem;line-height:1.35;">${text}</a></li>`).join('\n            ')}
          </ul>
        </div>` : '';
  return `<section class="content-cluster" aria-label="Everything about ${attr(p.brand)}" style="max-width:920px;margin:2.5rem auto;padding:1.5rem 1.4rem;background:#ffffff;border:1.5px solid #17191d;border-radius:12px;box-shadow:4px 4px 0 rgba(23,25,29,0.12);">
      <h2 style="font-size:1.3rem;margin:0 0 1.1rem;color:#17191d;">Everything about ${esc(p.brand)} <span style="font-family:ui-monospace,monospace;font-size:0.72rem;font-weight:500;color:#e8420c;letter-spacing:0.06em;">&mdash; every page we have on it</span></h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:1.4rem;">${group('Compare &amp; pricing', compare)}${group('Guides', guides)}${group('Try &amp; tools', tools)}${group('Source', source)}
      </div>
    </section>`;
}

/* ============================================================
 * 2. product pages  /<slug>/
 * ============================================================ */
allProducts.forEach(p => {
  const isDesktop = DESKTOP_SLUGS.has(p.slug);
  const relatedPosts = posts.filter(x => x.product === p.slug);
  const isClosed = !!p.closedSource;                 // paid, closed-source (WisperTalk)
  const whopLink = OWN_CHECKOUT.has(p.slug) ? null : whopLinks[p.slug];
  const buy = (whopLink && whopLink.productUrl) || p.buyUrl || WHOP; // some apps have their own checkout
  const buyHost = /(^|\/\/)whop\.com\//.test(buy) ? 'Whop' : buy.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const stampText = p.stamp || (isDesktop ? 'Desktop app · runs offline' : 'Web app · self-hosted on your server');
  const seoRelated = p.seoRelated || [];

  const compTable = `
      <div class="tbl-wrap">
        <table class="receipt">
          <thead><tr><th></th><th class="us">${p.brand}</th><th>${esc(p.competitor)}</th></tr></thead>
          <tbody>
            ${p.compRows.map(r => `<tr><td>${esc(r[0])}</td><td class="us">${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('\n            ')}
          </tbody>
        </table>
      </div>`;

  const body = `
    <section class="hero" aria-label="${attr(p.brand)}">
      <div class="wrap">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">OneTimeSuite</a> / <a href="/#${isDesktop ? 'desktop' : 'web-hosted'}">${isDesktop ? 'Desktop apps' : 'Web-hosted apps'}</a> / ${p.brand}</nav>
        <div style="display:flex;gap:2.5rem;align-items:flex-start;flex-wrap:wrap;">
        <div style="flex:1 1 480px;min-width:0;">
        <div style="display:flex;align-items:center;gap:0.7rem;flex-wrap:wrap;">
          <span class="avail lg"><span class="dot" aria-hidden="true"></span>Available now</span>
          <span class="stamp">${stampText}</span>
        </div>
        <h1>${p.icon} ${p.brand}</h1>
        <p class="lead">${esc(p.tagline)}</p>
        <p style="color:var(--ink-soft);max-width:62ch;margin-bottom:1.8rem;">${esc(p.heroLead)}</p>
        <div style="display:flex;align-items:center;gap:1.6rem;flex-wrap:wrap;margin-bottom:1.8rem;">
          ${pricePair(p, true)}
        </div>
        <div class="btn-row">
          <a class="btn btn-solid" href="${buy}" rel="noopener">Get ${p.brand} on ${buyHost} — $${p.price} &rarr;</a>
          ${DEMOS.has(p.slug) ? `<a class="btn btn-ghost" href="/${p.slug}/demo/">Try the free web demo</a>` : ''}
          ${isClosed ? '' : `<a class="btn btn-ghost" href="${GH}/${p.repo}" rel="noopener">Source on GitHub</a>`}
        </div>
        </div>
        ${hasBox(p.slug) ? `<div style="flex:0 0 280px;max-width:280px;margin-inline:auto;"><img src="/assets/boxes/${p.slug}.png" alt="${attr(p.brand)} retail software box" width="280" height="373" style="width:100%;height:auto;filter:drop-shadow(0 18px 30px rgba(0,0,0,0.18));" loading="eager"></div>` : ''}
        </div>
      </div>
    </section>

    ${ytId(p.slug) ? `
    <section aria-label="Demo video">
      <div class="wrap" style="max-width:920px;">
        <div style="position:relative;padding-top:56.25%;border:1.5px solid var(--ink);border-radius:12px;overflow:hidden;background:#000;">
          <iframe src="https://www.youtube-nocookie.com/embed/${ytId(p.slug)}" title="${attr(p.brand)} demo video"
            style="position:absolute;inset:0;width:100%;height:100%;border:0;"
            loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
        </div>
        <p class="mono-note" style="margin-top:0.7rem;">${p.brand} in action — a real demo, not a mockup.</p>
      </div>
    </section>
    ${videoLdScript(p)}` : hasClip(p.slug) ? `
    <section aria-label="Demo video">
      <div class="wrap" style="max-width:920px;">
        <video controls preload="metadata" width="1280" height="720" style="width:100%;border:1.5px solid var(--ink);border-radius:12px;background:#000;">
          <source src="/assets/clips/${p.slug}.mp4" type="video/mp4">
        </video>
        <p class="mono-note" style="margin-top:0.7rem;">${p.brand} in action — a real demo, not a mockup.</p>
      </div>
    </section>
    ${videoLdScript(p)}` : ''}

    <section aria-label="Screenshot">
      <div class="wrap" style="max-width:920px;">
        ${shotFrame(p)}
        <p class="mono-note" style="margin-top:0.7rem;">${hasShot(p.slug) ? `${p.brand}, as it actually looks — a real screenshot, not a mockup.` : `${p.brand} screenshot is being captured — the app is shipped and real.`}</p>
      </div>
    </section>

    <section aria-label="Features">
      <div class="wrap">
        <div class="section-head">
          <span class="stamp blue">What's in the box</span>
          <h2>Features</h2>
        </div>
        <div class="feat-grid">
          ${p.features.map(f => `<div class="feat"><div class="fi" aria-hidden="true">${f[0]}</div><h3>${esc(f[1])}</h3><p>${esc(f[2])}</p></div>`).join('\n          ')}
        </div>
      </div>
    </section>

    <section aria-label="Comparison with ${attr(p.competitor)}">
      <div class="wrap">
        <div class="section-head">
          <span class="stamp">The receipt</span>
          <h2>${p.brand} vs ${esc(p.competitor)}</h2>
          <p>${esc(p.competitor)} at ${esc(p.compPrice)} runs roughly <span style="font-family:var(--mono);">$${p.compYr}/year</span> — $${(p.compYr * 2).toLocaleString('en-US')} over two years. ${p.brand} is <span class="price-fig" style="font-family:var(--mono);">$${p.price}</span>, once.</p>
        </div>
        ${compTable}
        <p style="color:var(--ink-soft);margin-top:1.2rem;font-size:0.95rem;">${esc(p.payback)}</p>
      </div>
    </section>

    <section aria-label="How it works">
      <div class="wrap">
        <div class="section-head">
          <span class="stamp blue">Setup</span>
          <h2>Three steps, no subscription</h2>
        </div>
        <div class="steps">
          ${p.steps.map((s, i) => `<div class="step"><span class="n">STEP 0${i + 1}</span><h3>${esc(s[0])}</h3><p>${esc(s[1])}</p></div>`).join('\n          ')}
        </div>
      </div>
    </section>

    <section aria-label="Frequently asked questions">
      <div class="wrap-narrow">
        <div class="section-head">
          <span class="stamp">FAQ</span>
          <h2>Honest answers</h2>
        </div>
        ${p.faq.map(q => `<div class="faq-item"><h3>${esc(q[0])}</h3><p>${esc(q[1])}</p></div>`).join('\n        ')}
        ${(relatedPosts.length || seoRelated.length) ? `
        <p class="mono-note" style="margin-top:1.6rem;">Deep-dive comparisons:</p>
        <div class="related-strip">
          ${[
            ...relatedPosts.map(x => `<a href="/comparison/${x.slug}/">${esc(x.competitor)} alternative</a>`),
            ...seoRelated.map(([href, label]) => `<a href="${href}">${esc(label)}</a>`),
          ].join('\n          ')}
        </div>` : ''}
      </div>
    </section>

    <section aria-label="Everything about ${attr(p.brand)}">
      <div class="wrap" style="max-width:960px;">
        ${productClusterSection(p)}
      </div>
    </section>

    <section aria-label="Get ${attr(p.brand)}" class="center">
      <div class="wrap">
        <h2>Own ${p.brand} forever</h2>
        <p style="color:var(--ink-soft);margin:0.8rem auto 1.6rem;">$${p.price} once. ${isDesktop ? 'Signed installer, 1-click setup, updates included.' : 'Deploy on your own server — your data never leaves it.'} No renewal, ${isClosed ? 'no meter, no annual price creep — a lifetime license you actually own.' : "no account with us, no meter. Or build it yourself from the MIT source — it's the same app."}</p>
        <div class="btn-row" style="justify-content:center;">
          <a class="btn btn-solid" href="${buy}" rel="noopener">Get it on ${buyHost} — $${p.price} &rarr;</a>
          ${isClosed ? `<a class="btn btn-ghost" href="/comparison/">Read the honest comparisons</a>` : `<a class="btn btn-ghost" href="${GH}/${p.repo}" rel="noopener">View source on GitHub</a>`}
        </div>
      </div>
    </section>`;

  write(p.slug, page({
    title: `${p.brand} — ${p.competitor} Alternative, $${p.price} One-Time | OneTimeSuite`,
    desc: `${p.oneliner} Pay once ($${p.price}), own it forever. Replaces ${p.competitor} (${p.compPrice}).${isClosed ? '' : ' MIT source on GitHub.'}`,
    canonical: `${SITE}/${p.slug}/`,
    ogType: 'product',
    jsonld: [
      {
        '@context': 'https://schema.org', '@type': 'Product',
        name: p.brand, description: p.oneliner,
        brand: { '@type': 'Brand', name: 'OneTimeSuite' },
        url: `${SITE}/${p.slug}/`,
        image: hasShot(p.slug) ? `${SITE}/assets/shots/${p.slug}.png` : undefined,
        offers: { '@type': 'Offer', price: String(p.price), priceCurrency: 'USD', availability: 'https://schema.org/InStock', url: buy },
      },
      {
        '@context': 'https://schema.org', '@type': 'SoftwareApplication',
        name: p.brand,
        applicationCategory: isDesktop ? 'UtilitiesApplication' : 'WebApplication',
        operatingSystem: isDesktop ? 'Windows' : 'Self-hosted (your own server)',
        offers: { '@type': 'Offer', price: String(p.price), priceCurrency: 'USD', url: `${SITE}/${p.slug}/` },
      },
      {
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: p.faq.map(q => ({ '@type': 'Question', name: q[0], acceptedAnswer: { '@type': 'Answer', text: q[1] } })),
      },
      crumbs([['OneTimeSuite', `${SITE}/`], [p.brand, `${SITE}/${p.slug}/`]]),
    ],
    body,
  }));
  reg(`/${p.slug}/`, 'apps');
});

/* ============================================================
 * 3. bundle  /onetime-suite-bundle/
 * ============================================================ */
(function bundlePage() {
  const rows = products.map(p => `
            <tr><td>${p.icon} <a href="/${p.slug}/">${p.brand}</a></td><td>replaces ${esc(p.competitor)}</td><td class="price-fig">$${p.price}</td></tr>`).join('');

  const body = `
    <section class="hero" aria-label="${BUNDLE.name}">
      <div class="wrap">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">OneTimeSuite</a> / ${BUNDLE.name}</nav>
        <span class="stamp">All ${products.length} apps · one receipt</span>
        <h1>${BUNDLE.name}</h1>
        <p class="lead">${esc(BUNDLE.tagline)}</p>
        <div style="display:flex;align-items:center;gap:1.6rem;flex-wrap:wrap;margin:1.4rem 0 1.8rem;">
          <span class="price-pair">
            <span class="was">${fmt(bundleValue)} à la carte</span>
            <span class="sticker big"><span class="amt">${fmt(BUNDLE.price)}</span><span class="once">once · everything</span></span>
          </span>
        </div>
        <div class="btn-row">
          <a class="btn btn-solid" href="${localCheckout(BUNDLE.slug, BUNDLE.checkoutUrl)}" rel="noopener">Get the bundle — ${fmt(BUNDLE.price)} &rarr;</a>
          <a class="btn btn-ghost" href="/">Browse apps individually</a>
        </div>
      </div>
    </section>

    <section aria-label="The math">
      <div class="wrap">
        <div class="section-head">
          <span class="stamp blue">The math</span>
          <h2>${fmt(bundleValue)} of software for ${fmt(BUNDLE.price)}</h2>
          <p>Buy every app in the suite separately and the receipt totals ${fmt(bundleValue)}. The bundle is ${fmt(BUNDLE.price)} flat — <span class="price-fig" style="font-family:var(--mono);">${fmt(bundleSavings)}</span> off — and it's still a one-time payment, not a subscription. Every future app we ship joins the bundle at no extra cost.</p>
        </div>
        <p style="color:var(--ink-soft);">This isn't a curated starter pack — it's the entire catalog. Replace SmallPDF, Loom, Otter.ai, Bitly, Calendly, Typeform, Mailchimp, Trello, Notion and dozens more with software you install once and own outright.</p>
      </div>
    </section>

    <section aria-label="Full price list">
      <div class="wrap">
        <div class="section-head">
          <span class="stamp">The receipt, itemized</span>
          <h2>Everything included</h2>
        </div>
        <div class="tbl-wrap">
          <table class="receipt">
            <thead><tr><th>App</th><th>Replaces</th><th class="us">À la carte</th></tr></thead>
            <tbody>${rows}
              <tr class="total"><td colspan="2">Bundle — everything above, once</td><td class="price-fig">${fmt(BUNDLE.price)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section aria-label="How it works">
      <div class="wrap">
        <div class="section-head">
          <span class="stamp blue">How it works</span>
          <h2>One purchase, every installer</h2>
        </div>
        <div class="steps">
          <div class="step"><span class="n">STEP 01</span><h3>Buy once on Whop</h3><p>One payment of ${fmt(BUNDLE.price)} — no seats, no per-app pricing, no renewal.</p></div>
          <div class="step"><span class="n">STEP 02</span><h3>Download everything</h3><p>Signed Windows installers for the ${desktopProducts.length} desktop apps, deployable builds for the ${webProducts.length} web apps, plus MIT source on GitHub for all of them.</p></div>
          <div class="step"><span class="n">STEP 03</span><h3>Install as you go</h3><p>Not everything at once — install an app the day you actually need it, at zero incremental cost.</p></div>
        </div>
      </div>
    </section>

    <section aria-label="Frequently asked questions">
      <div class="wrap-narrow">
        <div class="section-head">
          <span class="stamp">FAQ</span>
          <h2>Honest answers</h2>
        </div>
        <div class="faq-item"><h3>Do I have to install every app right away?</h3><p>No — the bundle is a license to the whole catalog. Install what you need now and grab the rest later, whenever you need it, at no extra cost.</p></div>
        <div class="faq-item"><h3>What happens when new apps ship?</h3><p>They join the bundle automatically. The suite adds new apps regularly, and bundle owners get every one of them included, forever, with no upsell.</p></div>
        <div class="faq-item"><h3>Is this really cheaper than buying a few apps individually?</h3><p>Honestly — if you only need 2–3 apps, buying those individually may cost less than ${fmt(BUNDLE.price)}. The bundle earns its price once you'd want more than a handful, or want the option to grab any future app for free.</p></div>
        <div class="faq-item"><h3>Is the source code included too?</h3><p>Yes — every app in the suite is MIT-licensed on GitHub regardless of how you buy it. The bundle price buys the packaged installers, 1-click setup and updates across the whole catalog.</p></div>
        <div class="faq-item"><h3>Do DoorTracker and FamPing's introductory prices apply inside the bundle?</h3><p>The bundle price is fixed regardless of any individual app's current price — you get both, and everything else, at the flat ${fmt(BUNDLE.price)} regardless of where their individual introductory pricing stands.</p></div>
      </div>
    </section>

    <section aria-label="Get the bundle" class="center">
      <div class="wrap">
        <h2>Own the whole suite</h2>
        <p style="color:var(--ink-soft);margin:0.8rem auto 1.6rem;">${fmt(BUNDLE.price)} once. Every app, every future release, installers and MIT source. No renewal, no per-app upsell, no meter.</p>
        <div class="btn-row" style="justify-content:center;">
          <a class="btn btn-solid" href="${localCheckout(BUNDLE.slug, BUNDLE.checkoutUrl)}" rel="noopener">Get the bundle — ${fmt(BUNDLE.price)} &rarr;</a>
          <a class="btn btn-ghost" href="/">Browse apps individually</a>
        </div>
      </div>
    </section>`;

  write(BUNDLE.slug, page({
    title: `${BUNDLE.name} — All ${products.length} Apps, ${fmt(BUNDLE.price)} One-Time | OneTimeSuite`,
    desc: `${BUNDLE.tagline} All ${products.length} apps for ${fmt(BUNDLE.price)} — a ${fmt(bundleValue)} value, ${fmt(bundleSavings)} off. One payment, every installer, every future app included.`,
    canonical: `${SITE}/${BUNDLE.slug}/`,
    ogType: 'product',
    jsonld: [{
      '@context': 'https://schema.org', '@type': 'Product',
      name: BUNDLE.name, description: BUNDLE.tagline,
      brand: { '@type': 'Brand', name: 'OneTimeSuite' },
      url: `${SITE}/${BUNDLE.slug}/`,
      offers: { '@type': 'Offer', price: String(BUNDLE.price), priceCurrency: 'USD', availability: 'https://schema.org/InStock', url: BUNDLE.checkoutUrl },
    },
      crumbs([['OneTimeSuite', `${SITE}/`], [BUNDLE.name, `${SITE}/${BUNDLE.slug}/`]]),
    ],
    body,
  }));
  reg(`/${BUNDLE.slug}/`);
})();

/* ============================================================
 * 3b. legal + compliance pages  /terms/ /privacy/ /inkseal/compliance/
 * ============================================================ */
function docPage({ rel, crumb, stamp, h1, title, desc, article }) {
  const body = `
    <section class="hero" aria-label="${attr(h1)}" style="padding-bottom:2.5rem;">
      <div class="wrap-narrow">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">OneTimeSuite</a> / ${crumb}</nav>
        <span class="stamp">${stamp}</span>
        <h1 style="font-size:clamp(1.9rem,4.4vw,3rem);">${esc(h1)}</h1>
      </div>
    </section>

    <section aria-label="Document body" style="padding-top:2.5rem;">
      <div class="wrap-narrow">
        <article class="post-body">
          <p class="post-meta">OneTimeSuite · Last updated July 2026</p>
          ${article}
        </article>
      </div>
    </section>`;
  write(rel, page({ title, desc, canonical: `${SITE}/${rel}/`, ogType: 'article', body }));
  reg(`/${rel}/`);
}

docPage({
  rel: 'terms', crumb: 'Terms of use', stamp: 'Legal', h1: 'Terms of use',
  title: 'Terms of Use | OneTimeSuite',
  desc: 'Terms of use for onetimesuite.com and OneTimeSuite software purchases: MIT-licensed source, one-time licenses, as-is installers, refunds.',
  article: `
          <p>These terms cover your use of onetimesuite.com and your purchase of OneTimeSuite software. They're written to be read, not to scare you.</p>
          <h2>The software</h2>
          <ul>
            <li><strong>Source code is MIT-licensed.</strong> Nearly every app in the suite has its full source published on <a href="${GH}" rel="noopener">GitHub</a> under the MIT license. The MIT license — not these terms — governs the source code: you can use, modify and redistribute it per that license, free, forever.</li>
            <li><strong>What you're buying.</strong> A purchase buys the packaged, signed installers (or deployable builds), 1-click setup, updates, and where applicable a license key — convenience on top of the free source.</li>
            <li><strong>Installers are sold as-is.</strong> The packaged software is provided "as is", without warranty of any kind, express or implied, to the maximum extent permitted by law. We work hard to make it good; we don't promise it's fit for any particular purpose.</li>
            <li><strong>One license per person.</strong> A purchase is a lifetime license for you — install it on your own machines and servers. It isn't a site license or a right to resell, redistribute or share the packaged builds or license keys.</li>
          </ul>
          <h2>Purchases and refunds</h2>
          <ul>
            <li>Checkout and payment are handled by <a href="https://whop.com" rel="noopener">Whop</a> under Whop's own terms and policies.</li>
            <li>Something wrong with your purchase? Email ben [at] advancedmarketing [dot] co and we'll sort out a fix or a refund.</li>
          </ul>
          <h2>The website</h2>
          <ul>
            <li>Content on onetimesuite.com (comparisons, pricing of competitors, feature claims) is provided in good faith and checked at the date shown on each page, but competitors change prices and plans — verify anything you're relying on.</li>
            <li>Nothing on this site is legal, financial or compliance advice. In particular, e-signature legal sufficiency depends on your jurisdiction and document type — see the <a href="/inkseal/compliance/">Inkseal compliance page</a> and consult a lawyer for regulated documents.</li>
          </ul>
          <h2>Liability</h2>
          <p>To the maximum extent permitted by law, our total liability for any claim connected to the site or the software is limited to the amount you paid us for the product concerned.</p>
          <h2>Contact</h2>
          <p>Questions about these terms: ben [at] advancedmarketing [dot] co. OneTimeSuite is operated by <a href="https://advancedmarketing.co" rel="noopener">Advanced Marketing</a>.</p>`,
});

docPage({
  rel: 'privacy', crumb: 'Privacy', stamp: 'Legal', h1: 'Privacy policy',
  title: 'Privacy Policy | OneTimeSuite',
  desc: 'OneTimeSuite privacy policy: static site, no accounts, no tracking cookies. Whop handles checkout under its own policy; the dashboard uses one session cookie.',
  article: `
          <p>Short version: this site barely collects anything, and the apps we sell are built not to phone home.</p>
          <h2>onetimesuite.com (this site)</h2>
          <ul>
            <li><strong>Static site.</strong> These pages are plain generated HTML. There are no user accounts on onetimesuite.com.</li>
            <li><strong>No tracking cookies.</strong> onetimesuite.com sets no tracking or advertising cookies and runs no third-party analytics scripts.</li>
            <li><strong>Server logs.</strong> Like any web server, ours keeps standard access logs (IP address, requested URL, user agent) for security and operations.</li>
            <li><strong>Fonts.</strong> Pages load webfonts from Google Fonts, which means your browser requests files from Google's servers subject to Google's privacy policy.</li>
          </ul>
          <h2>Checkout (Whop)</h2>
          <p>Purchases happen on <a href="https://whop.com" rel="noopener">Whop</a>. Whop collects and processes your checkout and payment data under <a href="https://whop.com/privacy" rel="noopener">Whop's own privacy policy</a> — we never see your card details.</p>
          <h2>dashboard.onetimesuite.com (your library)</h2>
          <p>The customer dashboard signs you in via Whop OAuth and then uses a single session cookie to keep you logged in. That cookie exists to make login work; it isn't used for tracking or advertising.</p>
          <h2>The apps themselves</h2>
          <p>OneTimeSuite apps run on your own machine or server. They don't require an account with us and don't send telemetry. Your documents and data stay on your hardware.</p>
          <h2>Contact</h2>
          <p>Privacy questions: ben [at] advancedmarketing [dot] co.</p>`,
});

docPage({
  rel: 'inkseal/compliance', crumb: '<a href="/inkseal/">Inkseal</a> / Compliance', stamp: 'E-signature compliance',
  h1: 'Inkseal e-signature compliance',
  title: 'Inkseal E-Signature Compliance — ESIGN, UETA & eIDAS (Simple Electronic Signatures) | OneTimeSuite',
  desc: 'How Inkseal supports ESIGN Act, UETA and eIDAS simple-electronic-signature requirements: intent, consent, record association, hash-chained audit trail, retention — and its honest limits (no QES, no KBA, no certifications).',
  article: `
          <p>How <a href="/inkseal/">Inkseal</a> supports the requirements commonly associated with the <strong>US ESIGN Act</strong>, <strong>UETA</strong> and <strong>eIDAS</strong> (at the <em>simple electronic signature</em> level) — and, just as importantly, what it does <strong>not</strong> do. Every claim below maps to code you can read in the <a href="${GH}/inkseal" rel="noopener">MIT-licensed source</a>.</p>

          <h2>What kind of signature Inkseal produces</h2>
          <p>Inkseal produces <strong>simple electronic signatures (SES)</strong>: a drawn or typed signature embedded into the PDF, backed by a tamper-evident audit trail. It does <strong>not</strong> produce Advanced or Qualified Electronic Signatures (eIDAS AES/QES) — there are no certificate-based digital signatures and no Qualified Trust Service Provider. There is no Knowledge-Based Authentication (KBA) or government-ID verification: signer identity rests on control of the unique signing link, typically delivered to the signer's email. Inkseal holds <strong>no SOC 2, ISO 27001 or GDPR certification</strong> and claims none.</p>
          <p>Under ESIGN/UETA, simple electronic signatures are broadly enforceable for everyday agreements (NDAs, leases, contracts, internal approvals). Legal sufficiency always depends on your jurisdiction and document type — some documents (wills, certain notarized or court filings, some regulated financial or healthcare documents) have special requirements. <strong>Consult a lawyer before relying on any e-signature tool for regulated documents.</strong></p>

          <h2>How Inkseal maps to the core requirements</h2>
          <h3>1. Intent to sign</h3>
          <p>Each signer performs explicit, deliberate actions — opening their unique link, drawing or typing a signature into each field, clicking a final complete action — and every one is recorded as a distinct audit event. A signer can also formally decline, recorded with their stated reason.</p>
          <h3>2. Consent to do business electronically</h3>
          <p>Before completing, every signer must check an explicit "I agree to sign electronically" box. The server refuses completion without it, and the consent is recorded as its own timestamped audit event with the signer's email, IP address and browser user agent.</p>
          <h3>3. Association of signature with the record</h3>
          <p>Signatures are flattened into the PDF itself at the exact placed coordinates, producing a single final file. The audit trail is cryptographically rooted in the document: the hash chain's genesis value is the SHA-256 of the original uploaded PDF, and the completion event records the SHA-256 of the final signed PDF.</p>
          <h3>4. Tamper-evident audit trail</h3>
          <p>Every event — created, sent, viewed, consented, each field signed, signer completed, envelope completed, declined, voided — records the UTC timestamp, actor and signer email, IP address and user agent, and is chained with sha256(prev_hash + event). Any modification breaks the chain from that point forward; a one-click Verify recomputes the whole chain and reports exactly where it breaks.</p>
          <h3>5. Certificate of Completion</h3>
          <p>Every final PDF has an appended certificate page listing the envelope ID, original document SHA-256, completion time, every signer with their email / consent time / signing time, and the full audit trail with chain hashes.</p>
          <h3>6. Record retention and copies</h3>
          <p>The final PDF and complete audit trail are retained in your own database and data directory — you self-host, so retention isn't subject to a vendor subscription lapsing. With SMTP configured, every signer with an email address automatically receives a copy of the completed document.</p>

          <h2>Honest limitations</h2>
          <ul>
            <li><strong>Identity assurance is link-based.</strong> Whoever controls the signing link (and typically the email inbox it was sent to) can sign. No 2FA, KBA or ID verification.</li>
            <li><strong>Tamper-evident, not tamper-proof.</strong> A database administrator could rewrite the whole chain from genesis; the hash chain proves internal consistency. Archive the completed PDF (which embeds the certificate) somewhere the DB admin can't reach for stronger guarantees.</li>
            <li><strong>No qualified timestamps.</strong> Event times come from your server's clock.</li>
            <li><strong>Not QES.</strong> If a counterparty or regulation requires eIDAS Advanced or Qualified signatures, Inkseal is not sufficient.</li>
          </ul>
          <p>When in doubt about whether a simple electronic signature is legally sufficient for your document and jurisdiction, ask a lawyer.</p>

          <div class="cta-card">
            <h3>Try Inkseal — first document free</h3>
            <p>Run one envelope end to end free, then $59 once for unlimited documents forever. MIT source on GitHub.</p>
            <div class="btn-row">
              <a class="btn btn-solid" href="/inkseal/">See Inkseal &rarr;</a>
              <a class="btn btn-ghost" href="${GH}/inkseal" rel="noopener">Read the source</a>
            </div>
          </div>`,
});

/* ============================================================
 * 4. markdown -> HTML (for the 8 hand-written SEO posts)
 * ============================================================ */
function inlineMd(s) {
  return s
    .replace(/&(?![a-z#0-9]+;)/g, '&amp;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) =>
      `<a href="${u}"${/^https?:/.test(u) ? ' rel="noopener"' : ''}>${t}</a>`);
}

function mdToHtml(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    /* table */
    if (line.trim().startsWith('|') && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      const header = line.trim().slice(1, -1).split('|').map(c => c.trim());
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(lines[i].trim().slice(1, -1).split('|').map(c => c.trim()));
        i++;
      }
      out.push('<div class="tbl-wrap"><table class="receipt">');
      out.push('<thead><tr>' + header.map(c => `<th>${inlineMd(c)}</th>`).join('') + '</tr></thead>');
      out.push('<tbody>' + rows.map(r => '<tr>' + r.map(c => `<td>${inlineMd(c)}</td>`).join('') + '</tr>').join('\n') + '</tbody>');
      out.push('</table></div>');
      continue;
    }

    /* blockquote */
    if (line.startsWith('> ')) {
      const buf = [];
      while (i < lines.length && lines[i].startsWith('> ')) { buf.push(lines[i].slice(2)); i++; }
      out.push(`<blockquote><p>${inlineMd(buf.join(' '))}</p></blockquote>`);
      continue;
    }

    /* list */
    if (/^\s*-\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) { buf.push(lines[i].replace(/^\s*-\s+/, '')); i++; }
      out.push('<ul>' + buf.map(x => `<li>${inlineMd(x)}</li>`).join('\n') + '</ul>');
      continue;
    }

    /* headings */
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      const lvl = h[1].length;
      out.push(`<h${lvl}>${inlineMd(h[2])}</h${lvl}>`);
      i++;
      continue;
    }

    /* paragraph (join soft-wrapped lines) */
    const buf = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#|\||>|\s*-\s)/.test(lines[i])) { buf.push(lines[i]); i++; }
    out.push(`<p>${inlineMd(buf.join(' '))}</p>`);
  }
  return out.join('\n');
}

/* ============================================================
 * 5. the 8 hand-written SEO posts (root-level URLs)
 * ============================================================ */
const SEO_DIR = path.join(ROOT, 'content', 'seo');
const seoPosts = fs.readdirSync(SEO_DIR).filter(f => f.endsWith('.md')).map(f => {
  const raw = fs.readFileSync(path.join(SEO_DIR, f), 'utf8').replace(/\r\n/g, '\n');
  const m = raw.match(/^---\nslug: (.+)\ntitle: (.+)\ndescription: (.+)\n---\n/);
  if (!m) throw new Error('bad front matter in ' + f);
  return { slug: m[1].trim(), title: m[2].trim(), metaDesc: m[3].trim(), md: raw.slice(m[0].length).trim() };
});

/* stable ordering for hub listing */
const SEO_ORDER = [
  'linktree-alternative', 'self-hosted-linktree-alternative', 'beacons-alternative',
  'loom-alternative', 'open-source-loom-alternative', 'vidyard-alternative',
  'wispr-flow-alternative', 'wispertalk-vs-wispr-flow',
];
seoPosts.sort((a, b) => SEO_ORDER.indexOf(a.slug) - SEO_ORDER.indexOf(b.slug));

seoPosts.forEach(post => {
  /* pull the md H1 out — it becomes the page headline */
  const h1m = post.md.match(/^# (.+)$/m);
  const headline = h1m ? h1m[1] : post.title;
  const bodyMd = post.md.replace(/^# .+$/m, '').trim();
  const articleHtml = mdToHtml(bodyMd);
  const url = `${SITE}/${post.slug}/`;

  const body = `
    <section class="hero" aria-label="Article" style="padding-bottom:2.5rem;">
      <div class="wrap-narrow">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">OneTimeSuite</a> / <a href="/comparison/">Comparisons</a> / ${esc(post.title.split(/[—:]/)[0].trim())}</nav>
        <span class="stamp">Honest comparison · verified July 2026</span>
        <h1 style="font-size:clamp(1.9rem,4.4vw,3rem);">${inlineMd(headline)}</h1>
      </div>
    </section>

    <section aria-label="Article body" style="padding-top:2.5rem;">
      <div class="wrap-narrow">
        <article class="post-body">
          <p class="post-meta">OneTimeSuite · Updated July 2026 · Part of the <a href="/comparison/">pay-once vs subscription</a> series</p>
          ${articleHtml}
          <div class="cta-card">
            <h3>The whole suite works this way</h3>
            <p>${allProducts.length} pay-once apps that replace subscription SaaS — one price on the sticker, paid once. Browse the suite, or grab the ${products.length}-app catalog for ${fmt(BUNDLE.price)}.</p>
            <div class="btn-row">
              <a class="btn btn-solid" href="/">Browse the suite &rarr;</a>
              <a class="btn btn-ghost" href="${WHOP}" rel="noopener">Buy on Whop</a>
            </div>
          </div>
        </article>
      </div>
    </section>`;

  write(post.slug, page({
    title: post.title,
    desc: post.metaDesc,
    canonical: url,
    ogType: 'article',
    jsonld: [{
      '@context': 'https://schema.org', '@type': 'Article',
      headline: post.title,
      description: post.metaDesc,
      author: { '@type': 'Organization', name: 'OneTimeSuite', url: SITE },
      publisher: { '@type': 'Organization', name: 'OneTimeSuite' },
      mainEntityOfPage: url,
      datePublished: '2026-07-11', dateModified: '2026-07-11',
    },
      crumbs([['OneTimeSuite', `${SITE}/`], ['Comparisons', `${SITE}/comparison/`], [post.title.split(/[—:]/)[0].trim(), url]]),
    ],
    body,
  }));
  reg(`/${post.slug}/`);
});

/* ============================================================
 * 6. comparison hub  /comparison/
 * ============================================================ */
(function compHub() {
  const standalone = `
      <div style="margin-bottom:3rem;">
        <div class="cat-head"><h2>Latest, hand-written</h2><span class="count">${seoPosts.length} posts · verified July 2026</span></div>
        <div class="post-list">
          ${seoPosts.map(x => `<a href="/${x.slug}/"><h3>${esc(x.title)}</h3><p>${esc(x.metaDesc)}</p></a>`).join('\n          ')}
        </div>
      </div>`;

  const groups = products.map(p => {
    const list = posts.filter(x => x.product === p.slug);
    if (!list.length) return '';
    return `
      <div style="margin-bottom:2.4rem;">
        <h2 style="font-size:1.3rem;margin-bottom:0.9rem;">${p.icon} ${p.brand} <span class="mono-note">— replaces ${esc(p.competitor)} · <a href="/${p.slug}/">product page</a></span></h2>
        <div class="post-list">
          ${list.map(x => `<a href="/comparison/${x.slug}/"><h3>Looking for ${art(x.competitor)} ${esc(x.competitor)} Alternative? Meet ${p.brand}</h3><p>${esc(x.metaDesc)}</p></a>`).join('\n          ')}
        </div>
      </div>`;
  }).join('');

  const body = `
    <section class="hero" aria-label="Comparison blog">
      <div class="wrap">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">OneTimeSuite</a> / Comparisons</nav>
        <span class="stamp">${posts.length + seoPosts.length} honest breakdowns</span>
        <h1>Subscription vs pay-once</h1>
        <p class="lead">Straight-shooting breakdowns of popular SaaS tools: what they do well, where the subscription model hurts, and when a pay-once app is (and isn't) the better buy. If the competitor is the right choice for you, we say so.</p>
      </div>
    </section>

    <section aria-label="All comparison posts">
      <div class="wrap">${standalone}${groups}
      </div>
    </section>

    <section aria-label="Get the suite" class="center">
      <div class="wrap">
        <h2>Pay once. Own it forever.</h2>
        <p style="color:var(--ink-soft);margin:0.8rem auto 1.6rem;">The whole suite is on Whop — one-time prices from $15, MIT source on GitHub.</p>
        <div class="btn-row" style="justify-content:center;">
          <a class="btn btn-solid" href="/">Browse the suite &rarr;</a>
          <a class="btn btn-ghost" href="${WHOP}" rel="noopener">Buy on Whop</a>
        </div>
      </div>
    </section>`;

  write('comparison', page({
    title: `SaaS Alternatives — ${posts.length + seoPosts.length} Honest Pay-Once Comparisons (2026) | OneTimeSuite`,
    desc: `Honest comparisons of ${posts.length + seoPosts.length} subscription tools — Loom, Linktree, Notion, Mailchimp, Trello, Calendly, Typeform, DocuSign, Wispr Flow and more — vs their pay-once desktop and self-hosted replacements.`,
    canonical: `${SITE}/comparison/`,
    jsonld: [{
      '@context': 'https://schema.org', '@type': 'ItemList',
      itemListElement: [
        ...seoPosts.map((x, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/${x.slug}/` })),
        ...posts.map((x, i) => ({ '@type': 'ListItem', position: seoPosts.length + i + 1, url: `${SITE}/comparison/${x.slug}/` })),
      ],
    }],
    body,
  }));
  reg('/comparison/');
})();

/* ============================================================
 * 7. the 76 generated comparison posts  /comparison/<slug>/
 * ============================================================ */
posts.forEach(post => {
  const p = bySlug[post.product];
  const t = POST_TABLE[post.slug];
  if (!p || !t) { console.warn('SKIPPED post (missing product or table):', post.slug); return; }
  const title = `Looking for ${art(post.competitor)} ${post.competitor} Alternative? Meet ${p.brand}`;
  const url = `${SITE}/comparison/${post.slug}/`;
  const related = posts.filter(x => x.product === post.product && x.slug !== post.slug);
  /* Other apps in the suite that replace the SAME competitor — the
     "More <competitor> alternatives" internal-links block. */
  const sameComp = posts.filter(x => x.competitor === post.competitor && x.product !== post.product && bySlug[x.product]);

  const table = `
        <div class="tbl-wrap">
          <table class="receipt">
            <thead><tr><th></th><th class="us">${p.brand}</th><th>${esc(post.competitor)}</th></tr></thead>
            <tbody>
              <tr><td>Price</td><td class="us"><span class="price-fig">$${p.price} once</span></td><td>${esc(t.price)}</td></tr>
              <tr><td>Cost over 3 years</td><td class="us"><span class="price-fig">$${p.price}</span></td><td>${esc(t.yr3)}</td></tr>
              <tr><td>Where your data lives</td><td class="us">Your machine / your server</td><td>${esc(t.cloud)}</td></tr>
              <tr><td>Usage limits</td><td class="us">None — unlimited use</td><td>${esc(t.limits)}</td></tr>
              <tr><td>Works offline</td><td class="us">Yes</td><td>${esc(t.offline)}</td></tr>
              <tr><td>Source code</td><td class="us">MIT, on GitHub</td><td>${esc(t.src)}</td></tr>
            </tbody>
          </table>
        </div>`;

  const body = `
    <section class="hero" aria-label="Article" style="padding-bottom:2.5rem;">
      <div class="wrap-narrow">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">OneTimeSuite</a> / <a href="/comparison/">Comparisons</a> / ${esc(post.competitor)} alternative</nav>
        <span class="stamp">Honest comparison · 2026</span>
        <h1 style="font-size:clamp(1.9rem,4.4vw,3rem);">Looking for ${art(post.competitor)} ${esc(post.competitor)} alternative? Meet ${p.brand} — pay once, own it forever</h1>
      </div>
    </section>

    <section aria-label="Article body" style="padding-top:2.5rem;">
      <div class="wrap-narrow">
        <article class="post-body">
          <p class="post-meta">OneTimeSuite · Updated 2026 · Part of the <a href="/comparison/">pay-once vs subscription</a> series</p>

          ${post.intro.map(x => `<p>${esc(x)}</p>`).join('\n          ')}

          <h2>What ${esc(post.competitor)} does well</h2>
          <p>${esc(post.good.lead)}</p>
          <ul>
            ${post.good.items.map(x => `<li>${esc(x)}</li>`).join('\n            ')}
          </ul>
          <p>${esc(post.good.after)}</p>

          <h2>Where the subscription model hurts</h2>
          ${post.hurts.map(x => `<p>${esc(x)}</p>`).join('\n          ')}

          <h2>${p.brand}: the pay-once alternative</h2>
          <p><a href="/${p.slug}/">${p.brand}</a> is a $${p.price}, one-time purchase. ${esc(p.tagline)} ${esc(post.meetExtra)}</p>
          <p>The source code is MIT-licensed at <a href="${GH}/${p.repo}" rel="noopener">github.com/bensblueprints/${p.repo}</a> — free to build and run yourself, forever. Buying the packaged version on Whop gets you the signed installer, 1-click setup and updates. Either way, there is no account, no telemetry and no renewal date.</p>
          <h3>Head to head</h3>
          ${table}

          <h2>Who should stay with ${esc(post.competitor)}</h2>
          ${post.stay.map(x => `<p>${esc(x)}</p>`).join('\n          ')}

          <h3>When ${esc(post.competitor)} is the better choice</h3>
          <p>Being straight about it: ${p.brand} is not the right answer for everyone. ${esc(post.competitor)} genuinely earns its subscription when:</p>
          <ul>
            <li><strong>Your team is past a handful of seats.</strong> ${esc(post.competitor)}'s collaboration features — shared workspaces, permissions, admin controls — are built for larger teams, and its per-seat pricing buys real coordination tooling a single-user desktop app doesn't try to replicate.</li>
            <li><strong>Its ecosystem is load-bearing for you.</strong> If your workflow runs on ${esc(post.competitor)}'s integrations, automations or third-party add-ons, switching means rebuilding that plumbing — a real cost that can outweigh the subscription.</li>
            <li><strong>You have enterprise requirements.</strong> SSO/SAML, audit logs, SLAs, compliance paperwork and a vendor to call when something breaks — that's what the subscription actually buys at the high tiers, and a pay-once app doesn't come with it.</li>
          </ul>
          <p>If none of those describe you, the subscription is mostly a toll booth — read on.</p>

          <h2>Making the switch</h2>
          ${p.steps.map((s, i) => `<p><strong>Step ${i + 1} — ${esc(s[0])}.</strong> ${esc(s[1])}</p>`).join('\n          ')}

          <h2>Common questions</h2>
          ${p.faq.slice(0, 3).map(q => `<p><strong>${esc(q[0])}</strong><br>${esc(q[1])}</p>`).join('\n          ')}

          <h2>The bottom line</h2>
          <p>Subscriptions make sense when a service does ongoing work for you — hosting, syncing, multi-region infrastructure, human labor. They make much less sense when the work happens on your own hardware and the monthly bill is just a toll booth. ${p.brand} is our bet that for this job, most people are better served owning the tool: $${p.price} once, ${esc(p.payback.charAt(0).toLowerCase() + p.payback.slice(1))}</p>
          <p>${p.brand} is part of <a href="/">OneTimeSuite</a> — ${products.length} desktop and self-hosted apps built on the same principle: your hardware does the work, so you should not pay rent on it. Every app is a one-time purchase with MIT-licensed source on GitHub, no accounts and no telemetry. Want everything at once? <a href="/${BUNDLE.slug}/">${BUNDLE.name}</a> bundles the whole suite for a single flat ${fmt(BUNDLE.price)}.</p>

          <div class="cta-card">
            <h3>Try ${p.brand} — $${p.price}, one time</h3>
            <p>Signed installer on Whop, or build it free from the MIT source. Your call.</p>
            <div class="btn-row">
              <a class="btn btn-solid" href="/${p.slug}/">See ${p.brand} features &rarr;</a>
              <a class="btn btn-ghost" href="${WHOP}" rel="noopener">Get it on Whop</a>
            </div>
          </div>

          <nav class="related-strip" aria-label="More ${attr(post.competitor)} alternatives" style="margin-top:1.6rem;">
            <p style="font-size:0.9rem;"><strong>More ${esc(post.competitor)} alternatives:</strong>
              ${[
                ...sameComp.map(x => `<a href="/comparison/${x.slug}/">${esc(bySlug[x.product].brand)}</a>`),
                `<a href="/${p.slug}/">${p.brand} — product page</a>`,
                `<a href="/">OneTimeSuite — the whole pay-once suite</a>`,
              ].join(' · ')}
            </p>
          </nav>

          ${related.length
            ? `<p style="font-size:0.9rem;">Related comparisons: ${related.map(x => `<a href="/comparison/${x.slug}/">${esc(x.competitor)} alternative</a>`).join(' · ')} — or browse <a href="/">the whole pay-once suite</a>.</p>`
            : `<p style="font-size:0.9rem;">Browse <a href="/">the whole pay-once suite</a> or <a href="/comparison/">all comparisons</a>.</p>`}
        </article>
      </div>
    </section>`;

  write(`comparison/${post.slug}`, page({
    title,
    desc: post.metaDesc,
    canonical: url,
    ogType: 'article',
    jsonld: [{
      '@context': 'https://schema.org', '@type': 'Article',
      headline: title,
      description: post.metaDesc,
      author: { '@type': 'Organization', name: 'OneTimeSuite', url: SITE },
      publisher: { '@type': 'Organization', name: 'OneTimeSuite' },
      mainEntityOfPage: url,
      datePublished: '2026-07-06', dateModified: '2026-07-11',
      about: { '@type': 'Product', name: p.brand, offers: { '@type': 'Offer', price: String(p.price), priceCurrency: 'USD' } },
    },
      {
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: p.faq.map(q => ({ '@type': 'Question', name: q[0], acceptedAnswer: { '@type': 'Answer', text: q[1] } })),
      },
      crumbs([['OneTimeSuite', `${SITE}/`], ['Comparisons', `${SITE}/comparison/`], [`${post.competitor} alternative`, url]]),
    ],
    body,
  }));
  reg(`/comparison/${post.slug}/`);
});


/* ============================================================
 * SECTION 7c: programmatic SEO factory — auto-discovered section modules
 * Each module in src/sections/*.js exports function(ctx) and emits pages via
 * ctx.write/ctx.page/ctx.reg. See docs/seo-factory/CONTRACT.md for the API,
 * the route registry and the content rules. Routes must use non-colliding
 * prefixes (/vs/, /apps/, /compare/, ...) — the v2-pages overlay copies over
 * public/ at the end of the build.
 * ============================================================ */
{
  const sectionCtx = {
    /* core emitters */
    write, page, reg,
    /* escaping + text */
    esc, attr, fitTitle, fitDesc, fmt, art,
    /* constants */
    SITE, WHOP, GH,
    /* layout + jsonld helpers */
    crumbs, ORG_LD, ldJson, pricePair, shotFrame,
    /* catalog */
    allProducts, availableProducts, upcomingProducts, bySlug,
    products, products51, extras, comingSoon,
    desktopProducts, webProducts, DESKTOP_SLUGS, AVAILABLE_SLUGS, DEMOS,
    BUNDLE, bundleValue, bundleSavings, localCheckout,
    /* slugs that actually get an on-site /checkout/<slug>/ page (Whop plan
       exists) — mirrors the rule in the checkout section below; sections must
       never link /checkout/<slug>/ for off-site-checkout apps (wispertalk…). */
    checkoutSlugs: new Set(allProducts
      .filter(p => (whopLinks[p.slug] && whopLinks[p.slug].planId) || /whop\.com\/checkout\/plan_[A-Za-z0-9]+/.test(p.buyUrl || ''))
      .map(p => p.slug)),
    /* media */
    hasShot, hasBox, hasClip, ytId, ytIdRaw, youtubeVideos: ytVideos,
    videoLd, videoLdScript,
    /* content collections (declared above) */
    posts, seoPosts,
    /* factory data + schema generators */
    matrix: require('./src/seo-matrix.js'),
    sales: require('./src/sales-data.js'),
    schema: require('./src/seo/schema.js'),
  };
  const SECTIONS_DIR = path.join(ROOT, 'src', 'sections');
  if (fs.existsSync(SECTIONS_DIR)) {
    const sectionFiles = fs.readdirSync(SECTIONS_DIR).filter(f => f.endsWith('.js')).sort();
    for (const f of sectionFiles) {
      try {
        require(path.join(SECTIONS_DIR, f))(sectionCtx);
        console.log(`section ${f}: ok`);
      } catch (err) {
        throw new Error(`section module src/sections/${f} failed: ${err.message}`, { cause: err });
      }
    }
  }
}


/* ============================================================
 * 7a-bis. /savings/ — the subscription audit calculator.
 * One tile per distinct competitor (icon from assets/complogos/, downloaded
 * 2026-07-21 via Google's favicon service — swap for Brandfetch API logos
 * when a key exists). Click tiles -> live yearly / 3-year totals vs the
 * one-time cost of the matching OneTimeSuite apps. Pure client-side JS.
 * ============================================================ */
{
  const LOGO_DIR = path.join(ROOT, 'assets', 'complogos');
  const logoFiles = new Set(fs.existsSync(LOGO_DIR) ? fs.readdirSync(LOGO_DIR) : []);
  const slugC = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '');
  const byComp = new Map();
  const perSeatRe = /\/\s*user|\/\s*seat|per\s*user|per\s*seat/i;
  const addTile = (name, priceStr, yearly, app) => {
    if (!name || !yearly) return;
    if (!byComp.has(name)) byComp.set(name, { n: name, m: priceStr, y: Math.round(yearly), ps: perSeatRe.test(priceStr || '') ? 1 : 0, apps: [] });
    const t = byComp.get(name);
    if (app && !t.apps.some(a => a.s === app.s)) t.apps.push(app);
  };
  allProducts.forEach(p => {
    if (!p.competitor || !p.compYr) return;
    addTile(p.competitor, p.compPrice, p.compYr, { b: p.brand, s: p.slug, pr: p.price });
  });
  /* the researched extra competitors join the grid too (verified pricing,
     2026-07-21 pass); yearly cost from yr3/3 or parsed from the price string */
  const XCOMP_FILE = path.join(ROOT, 'src', 'blog-competitors.js');
  const SVCOMP_FILE = path.join(ROOT, 'src', 'savings-competitors.js');
  /* merged copy — never mutate the required modules: blog-competitors.js is
     require()d again by the blog engine (same cached object) and must NOT
     grow the savings-only entries, or they'd all become blog posts */
  const extraComps = {};
  for (const src of [XCOMP_FILE, SVCOMP_FILE]) {
    if (!fs.existsSync(src)) continue;
    for (const [s, list] of Object.entries(require(src))) {
      extraComps[s] = [...(extraComps[s] || []), ...list];
    }
  }
  const parseYearly = s => {
    const mo = /\$\s*([\d,.]+)\s*(?:\/|per\s*)?\s*(?:user\s*\/?\s*)?mo/i.exec(s || '');
    if (mo) return parseFloat(mo[1].replace(/,/g, '')) * 12;
    const yr = /\$\s*([\d,.]+)\s*(?:\/|per\s*)?\s*(?:yr|year)/i.exec(s || '');
    return yr ? parseFloat(yr[1].replace(/,/g, '')) : 0;
  };
  for (const [pSlug, list] of Object.entries(extraComps)) {
    const p = bySlug[pSlug];
    for (const c of list) {
      addTile(c.name, c.price, c.yr3 ? c.yr3 / 3 : parseYearly(c.price),
        p ? { b: p.brand, s: p.slug, pr: p.price } : null);
    }
  }
  const tiles = [...byComp.values()].filter(t => t.apps.length).map(c => ({
    ...c, logo: logoFiles.has(`${slugC(c.n)}.png`) ? `/assets/complogos/${slugC(c.n)}.png` : null,
  })).sort((a, b) => b.y - a.y);
  if (fs.existsSync(LOGO_DIR)) {
    const logosOut = path.join(OUT, 'assets', 'complogos');
    fs.mkdirSync(logosOut, { recursive: true });
    for (const f of logoFiles) if (f.endsWith('.png')) fs.copyFileSync(path.join(LOGO_DIR, f), path.join(logosOut, f));
  }
  const DATA = JSON.stringify(tiles).replace(/</g, '\\u003c');
  const body = `
    <section class="hero" aria-label="Subscription audit">
      <div class="wrap">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">OneTimeSuite</a> / Savings</nav>
        <span class="stamp">the subscription audit</span>
        <h1>Click what you pay for.<br>Watch what you'd save.</h1>
        <p class="lead">Tap every tool below that charges you monthly. We'll total the bill — and show what the same jobs cost as pay-once software you own forever.</p>
      </div>
    </section>

    <section aria-label="Pick your subscriptions">
      <div class="wrap">
        <div style="display:flex;align-items:center;gap:0.7rem;flex-wrap:wrap;margin-bottom:1.2rem;">
          <label for="sv-seats" style="font-weight:600;">How many people on your team?</label>
          <input id="sv-seats" type="number" min="1" max="500" value="1" inputmode="numeric"
            style="width:5.5rem;padding:0.45rem 0.6rem;border:1.5px solid var(--ink);border-radius:8px;font:inherit;font-family:var(--mono);">
          <span class="mono-note">per-user tools multiply by this — pay-once apps never do</span>
        </div>
        <div style="margin-bottom:1rem;display:flex;align-items:center;gap:0.7rem;flex-wrap:wrap;">
          <input id="sv-search" type="search" placeholder="Search by name — Loom, QuickBooks, Canva…" autocomplete="off"
            style="width:100%;max-width:420px;padding:0.6rem 0.85rem;border:1.5px solid var(--ink);border-radius:8px;font:inherit;">
          <span id="sv-count" class="mono-note"></span>
        </div>
        <div id="sv-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:0.8rem;"></div>
        <div style="margin-top:1.2rem;display:flex;gap:0.6rem;flex-wrap:wrap;align-items:center;border:1.5px dashed var(--ink);border-radius:10px;padding:0.9rem 1rem;">
          <span style="font-weight:600;">Paying for something we didn't list?</span>
          <input id="sv-cname" placeholder="Tool name" style="padding:0.45rem 0.6rem;border:1.5px solid var(--ink);border-radius:8px;font:inherit;width:11rem;">
          <input id="sv-cprice" type="number" min="1" max="10000" placeholder="$ / month" inputmode="numeric" style="padding:0.45rem 0.6rem;border:1.5px solid var(--ink);border-radius:8px;font:inherit;font-family:var(--mono);width:7rem;">
          <label style="display:flex;align-items:center;gap:0.3rem;"><input id="sv-cseat" type="checkbox"> per user</label>
          <button id="sv-cadd" type="button" class="btn btn-ghost" style="cursor:pointer;">Add it to the bill</button>
        </div>
      </div>
    </section>

    <section aria-label="Your savings">
      <div class="wrap">
        <div id="sv-bar" style="position:sticky;bottom:0;background:var(--paper);border:1.5px solid var(--ink);border-radius:12px;padding:1.1rem 1.4rem;margin-top:1.6rem;box-shadow:0 -6px 24px rgba(0,0,0,0.08);">
          <p id="sv-none" style="margin:0;color:var(--ink-soft);">Nothing selected yet — click the tools you pay for.</p>
          <div id="sv-out" style="display:none;">
            <p style="margin:0 0 0.4rem;font-size:1.05rem;">You're paying about <strong id="sv-yr" style="font-family:var(--mono);"></strong>/year — <strong id="sv-3yr" style="font-family:var(--mono);"></strong> over 3 years.</p>
            <p style="margin:0 0 0.8rem;">The same jobs, pay-once: <strong id="sv-once" style="font-family:var(--mono);"></strong> total — one price no matter how many people use it. <span class="stamp blue" style="font-size:0.95rem;">You keep <span id="sv-save" style="font-family:var(--mono);"></span> over 3 years</span></p>
            <div id="sv-apps" style="font-size:0.92rem;color:var(--ink-soft);margin-bottom:0.9rem;"></div>
            <div class="btn-row">
              <a class="btn btn-solid" href="${WHOP}" rel="noopener">Get the whole suite — $${BUNDLE.price} once &rarr;</a>
              <a class="btn btn-ghost" href="/">Browse all apps</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <script>
    (function () {
      var DATA = ${DATA};
      var grid = document.getElementById('sv-grid');
      var sel = new Set();
      var seats = 1;
      var fmt = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
      document.getElementById('sv-seats').addEventListener('input', function () {
        seats = Math.max(1, Math.min(500, parseInt(this.value, 10) || 1));
        render();
      });
      var tiles = [];
      var search = document.getElementById('sv-search');
      var countEl = document.getElementById('sv-count');
      function updateCount(shown) {
        countEl.textContent = shown === tiles.length
          ? tiles.length + ' tools' : 'showing ' + shown + ' of ' + tiles.length;
      }
      function applyFilter() {
        var q = search.value.trim().toLowerCase(), shown = 0;
        tiles.forEach(function (t) {
          var hit = !q || t.name.indexOf(q) !== -1;
          t.el.style.display = hit ? '' : 'none';
          if (hit) shown++;
        });
        updateCount(shown);
      }
      search.addEventListener('input', applyFilter);
      function makeTile(c, i) {
        var el = document.createElement('button');
        el.type = 'button';
        el.setAttribute('aria-pressed', 'false');
        el.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:0.5rem;padding:0.9rem 0.6rem;border:1.5px solid var(--ink);border-radius:10px;background:#fff;cursor:pointer;text-align:center;font:inherit;';
        el.innerHTML = (c.logo
          ? '<img src="' + c.logo + '" alt="" width="40" height="40" loading="lazy" style="border-radius:8px;">'
          : '<span style="width:40px;height:40px;border-radius:8px;background:var(--ink);color:var(--paper);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.2rem;">' + c.n.charAt(0) + '</span>')
          + '<span style="font-weight:600;font-size:0.88rem;line-height:1.2;"></span>'
          + '<span style="font-family:var(--mono);font-size:0.78rem;color:var(--ink-soft);"></span>';
        el.children[1].textContent = c.n;
        el.children[2].textContent = c.m;
        el.addEventListener('click', function () {
          if (sel.has(i)) { sel.delete(i); el.style.background = '#fff'; el.style.outline = 'none'; el.setAttribute('aria-pressed', 'false'); }
          else { sel.add(i); el.style.background = '#eef1ff'; el.style.outline = '2px solid var(--accent)'; el.setAttribute('aria-pressed', 'true'); }
          /* after every pick: show the full grid again, ready for the next search */
          search.value = '';
          applyFilter();
          search.focus();
          render();
        });
        grid.appendChild(el);
        tiles.push({ el: el, name: c.n.toLowerCase() });
      }
      DATA.forEach(makeTile);
      updateCount(tiles.length);
      /* long-tail: let people add any tool we don't list */
      document.getElementById('sv-cadd').addEventListener('click', function () {
        var name = document.getElementById('sv-cname').value.trim();
        var mo = parseFloat(document.getElementById('sv-cprice').value);
        var perSeat = document.getElementById('sv-cseat').checked;
        if (!name || !mo || mo <= 0) return;
        var c = { n: name, m: '$' + mo + (perSeat ? '/user' : '') + '/mo', y: Math.round(mo * 12), ps: perSeat ? 1 : 0, apps: [], logo: null };
        DATA.push(c);
        makeTile(c, DATA.length - 1);
        tiles[tiles.length - 1].el.click();
        document.getElementById('sv-cname').value = '';
        document.getElementById('sv-cprice').value = '';
        document.getElementById('sv-cseat').checked = false;
      });
      function render() {
        var none = document.getElementById('sv-none'), out = document.getElementById('sv-out');
        if (!sel.size) { none.style.display = ''; out.style.display = 'none'; return; }
        none.style.display = 'none'; out.style.display = '';
        var yr = 0, once = 0, seen = new Set(), links = [];
        sel.forEach(function (i) {
          var c = DATA[i]; yr += c.y * (c.ps ? seats : 1);
          c.apps.forEach(function (a) {
            if (seen.has(a.s)) return; seen.add(a.s);
            once += a.pr;
            links.push('<a href="/' + a.s + '/">' + a.b + ' ($' + a.pr + ' once)</a>');
          });
        });
        document.getElementById('sv-yr').textContent = fmt(yr);
        document.getElementById('sv-3yr').textContent = fmt(yr * 3);
        document.getElementById('sv-once').textContent = fmt(once);
        document.getElementById('sv-save').textContent = fmt(yr * 3 - once);
        var unmatched = 0;
        sel.forEach(function (i) { if (!DATA[i].apps.length) unmatched++; });
        document.getElementById('sv-apps').innerHTML = 'Your replacements: ' + (links.join(' &middot; ') || '&mdash;')
          + (unmatched ? ' <span style="opacity:0.75;">(' + unmatched + ' selected tool' + (unmatched > 1 ? 's' : '') + ' without a OneTimeSuite match count toward your bill but not the replacement total.)</span>' : '');
      }
    })();
    </script>`;
  write('savings', page({
    title: 'How Much Are Subscriptions Costing You? | OneTimeSuite Savings Calculator',
    desc: 'Click the SaaS tools you pay for and see the 3-year bill — then what the same jobs cost as pay-once software you own forever.',
    canonical: `${SITE}/savings/`,
    body,
  }));
  reg('/savings/');
  console.log(`savings calculator: ${tiles.length} competitor tiles (${tiles.filter(t => t.logo).length} with logos)`);
}


/* ============================================================
 * 7b. blog  /blog/  and  /blog/<post-slug>/
 * Data-driven, 5 posts/app, chunked like posts-1..6.js: drop a
 * src/blog-chunk<N>.js (module.exports = [productSlug, ...]) and its
 * 5 posts/app appear here automatically — no build.js edit needed.
 * slugify, blogAppSlugs, blogExtraComps and ROUNDUPS are hoisted above §2 —
 * the product-page cluster section needs them before the blog pass runs.
 * ============================================================ */
function blogBuyLink(p) {
  const whopLink = OWN_CHECKOUT.has(p.slug) ? null : whopLinks[p.slug];
  return (whopLink && whopLink.productUrl) || p.buyUrl || WHOP;
}

function blogCta(p, buy, repoUrl) {
  return `
          <div class="cta-card">
            <h3>Try ${esc(p.brand)} — $${p.price}, once</h3>
            <p>${esc(p.oneliner)}</p>
            <div class="btn-row">
              <a class="btn btn-solid" href="/${p.slug}/">See ${esc(p.brand)} &rarr;</a>
              <a class="btn btn-ghost" href="${buy}" rel="noopener">Get it on Whop &mdash; $${p.price}</a>
              ${p.closedSource ? '' : `<a class="btn btn-ghost" href="${repoUrl}" rel="noopener">Free on GitHub</a>`}
            </div>
          </div>`;
}

function blogTable(p) {
  return `
        <div class="tbl-wrap">
          <table class="receipt">
            <thead><tr><th></th><th class="us">${esc(p.brand)}</th><th>${esc(p.competitor)}</th></tr></thead>
            <tbody>
              ${p.compRows.map(r => `<tr><td>${esc(r[0])}</td><td class="us">${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('\n              ')}
            </tbody>
          </table>
        </div>`;
}

const blogPostList = []; // { slug, product, title, metaDesc } — for the /blog/ hub
const BLOG_DATE = '2026-07-21';

/* Blog formulas that ship with `noindex,follow` — add a formula key here to
   keep a whole variant linked and crawlable (posts still funnel readers to
   the product pages and pass PageRank) but out of the search index and out of
   sitemap.xml. Currently empty: the 'pricing-is-out-of-control' formula was
   upgraded 2026-07-27 from a thin rant into a full pricing-analysis article
   (pricing math tables, compRows, steps, FAQ) and re-indexed. */
const NOINDEX_BLOG_FORMULAS = new Set([]);

function writeBlogPost({ slug, product, title, metaDesc, articleHtml, formula, faq }) {
  const url = `${SITE}/blog/${slug}/`;
  const noindex = NOINDEX_BLOG_FORMULAS.has(formula);
  const crumbLabel = title.split(/[—:]/)[0].trim();
  const body = `
    <section class="hero" aria-label="Article" style="padding-bottom:2.5rem;">
      <div class="wrap-narrow">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">OneTimeSuite</a> / <a href="/blog/">Blog</a> / ${esc(crumbLabel)}</nav>
        <span class="stamp">OneTimeSuite Blog &middot; 2026</span>
        <h1 style="font-size:clamp(1.9rem,4.4vw,3rem);">${esc(title)}</h1>
      </div>
    </section>

    <section aria-label="Article body" style="padding-top:2.5rem;">
      <div class="wrap-narrow">
        <article class="post-body">
          <p class="post-meta">OneTimeSuite Blog &middot; Published ${BLOG_DATE}</p>
          ${articleHtml}
        </article>
      </div>
    </section>`;

  write(`blog/${slug}`, page({
    title: `${title} | OneTimeSuite Blog`,
    desc: metaDesc,
    canonical: url,
    ogType: 'article',
    robots: noindex ? 'noindex, follow' : 'index, follow',
    jsonld: [{
      '@context': 'https://schema.org', '@type': 'BlogPosting',
      headline: title,
      description: metaDesc,
      author: { '@type': 'Organization', name: 'OneTimeSuite', url: SITE },
      publisher: { '@type': 'Organization', name: 'OneTimeSuite' },
      mainEntityOfPage: url,
      datePublished: BLOG_DATE, dateModified: BLOG_DATE,
    },
      /* FAQPage schema only for formulas that actually render the product's
         FAQ on the page (currently blogPost2) — Google ignores FAQ markup
         for questions that aren't visible in the body. */
      ...(Array.isArray(faq) && faq.length ? [{
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: faq.map(q => ({ '@type': 'Question', name: q[0], acceptedAnswer: { '@type': 'Answer', text: q[1] } })),
      }] : []),
      crumbs([['OneTimeSuite', `${SITE}/`], ['Blog', `${SITE}/blog/`], [crumbLabel, url]]),
    ],
    body,
  }));
  /* noindexed posts stay out of the sitemap but stay on the /blog/ hub and in
     the interlink pass — crawlable via links, just not submitted for indexing */
  if (!noindex) reg(`/blog/${slug}/`, 'blog');
  blogPostList.push({ slug, product, title, metaDesc });
}

/* --- the 5 post formulas, each built from the product's own real numbers --- */
function blogPost1({ p, buy, repoUrl, compSlug }) {
  const top5 = p.features.slice(0, 5);
  const faq3 = p.faq.slice(0, 3);
  const articleHtml = `
          <p>${esc(p.heroLead)}</p>
          <p>If you've searched for a <strong>${esc(p.competitor)} alternative</strong>, ${esc(p.brand)} is the pay-once option worth putting at the top of the list: <a href="/${p.slug}/">${esc(p.brand)}</a> is $${p.price}, one time, and covers the same core job ${esc(p.competitor)} charges ${esc(p.compPrice)} for.</p>

          <h2>What makes ${esc(p.brand)} the pick for 2026</h2>
          <ul>
            ${top5.map(f => `<li><strong>${esc(f[1])}</strong> — ${esc(f[2])}</li>`).join('\n            ')}
          </ul>

          <h2>${esc(p.brand)} vs ${esc(p.competitor)}, at a glance</h2>
          ${blogTable(p)}
          <p style="color:var(--ink-soft);font-size:0.95rem;">${esc(p.payback)}</p>

          <h2>Common questions</h2>
          ${faq3.map(q => `<p><strong>${esc(q[0])}</strong><br>${esc(q[1])}</p>`).join('\n          ')}

          <h2>The bottom line</h2>
          <p>${esc(p.brand)} won't out-feature ${esc(p.competitor)} on every axis — no subscription tool with a bigger team and a bigger roadmap loses on everything. But for the core job, $${p.price} once against ${esc(p.compPrice)} forever is a trade most people should at least look at. ${esc(p.brand)} is part of <a href="/">OneTimeSuite</a>, a catalog of pay-once apps that replace subscription SaaS.</p>
          ${blogCta(p, buy, repoUrl)}`;
  writeBlogPost({
    slug: `${p.slug}-best-${compSlug}-alternative-2026`,
    product: p.slug,
    formula: 'best-alternative-2026',
    title: `Best ${p.competitor} Alternative in 2026: ${p.brand}`,
    metaDesc: `${p.brand} is a $${p.price} one-time purchase that replaces ${p.competitor} (${p.compPrice}). ${p.oneliner}`,
    articleHtml,
  });
}

/* Formula upgraded 2026-07-27: was a thin ~330-word "Pricing Is Out of
   Control" rant (noindexed for it), now a full pricing-analysis article —
   multi-year cost tables computed from compPrice/compYr, the product's own
   compRows/steps/faq, a balanced when-to-stay section and FAQPage schema.
   Slugs kept as-is: the old URLs may already have impressions. */
function blogPost2({ p, buy, repoUrl, compSlug, yr3 }) {
  const perUnit = p.compPrice.match(/\/\s*(user|seat|agent|rep|screen|channel)s?\b|per\s+(user|seat)/i);
  const unitNoun = perUnit ? (perUnit[1] || perUnit[2]).toLowerCase() : null;
  const unitPriceMatch = p.compPrice.replace(/,/g, '').match(/\$\s*(\d+(?:\.\d+)?)/);
  const unitMo = unitPriceMatch ? parseFloat(unitPriceMatch[1]) : null;
  /* ranges ("$5–$9/user/mo") and floors ("$19+/user/mo") price from the
     lower bound — say so rather than pretending the number is exact */
  const isRange = /[+\u2013-]|from/i.test(p.compPrice);
  const unitYr = unitMo ? unitMo * 12 : null;
  const impliedSeats = (unitNoun && unitMo) ? Math.round(p.compYr / unitYr) : 0;

  const costTable = `
        <div class="tbl-wrap">
          <table class="receipt">
            <thead><tr><th></th><th class="us">${esc(p.brand)}</th><th>${esc(p.competitor)}</th></tr></thead>
            <tbody>
              <tr><td>Sticker price</td><td class="us"><span class="price-fig">${fmt(p.price)} once</span></td><td>${esc(p.compPrice)}</td></tr>
              <tr><td>Cost after 1 year</td><td class="us"><span class="price-fig">${fmt(p.price)}</span></td><td>${fmt(p.compYr)}</td></tr>
              <tr><td>Cost after 2 years</td><td class="us"><span class="price-fig">${fmt(p.price)}</span></td><td>${fmt(p.compYr * 2)}</td></tr>
              <tr><td>Cost after 3 years</td><td class="us"><span class="price-fig">${fmt(p.price)}</span></td><td>${fmt(yr3)}</td></tr>
            </tbody>
          </table>
        </div>`;

  const seatsTable = (unitNoun && unitMo) ? `
          <p>${esc(p.competitor)} bills per ${unitNoun}, so the total scales with headcount${isRange ? ' — and the figures below use the low end of the advertised range' : ''}:</p>
          <div class="tbl-wrap">
            <table class="receipt">
              <thead><tr><th>${esc(p.competitor)} ${unitNoun}s</th><th>Per year</th><th>Over 3 years</th></tr></thead>
              <tbody>
                ${[1, 5, 10].map(n => `<tr><td>${n} ${unitNoun}${n > 1 ? 's' : ''}</td><td>${fmt(unitYr * n)}</td><td>${fmt(unitYr * 3 * n)}</td></tr>`).join('\n                ')}
              </tbody>
            </table>
          </div>` : '';

  const costLead = unitNoun
    ? `<p>${esc(p.competitor)} prices per ${unitNoun} — ${esc(p.compPrice)} — so the subscription grows with every ${unitNoun} you add. The comparison below uses the catalog's annual figure of <span class="price-fig" style="font-family:var(--mono);">${fmt(p.compYr)}</span>${impliedSeats >= 2 && impliedSeats <= 200 ? `, which works out to roughly ${impliedSeats} ${unitNoun}s at that rate` : ''}; the per-${unitNoun} table underneath shows how the bill scales either way.</p>`
    : `<p>At ${esc(p.compPrice)}, one ${esc(p.competitor)} subscription adds up to <span class="price-fig" style="font-family:var(--mono);">${fmt(p.compYr)}</span> every year — <span class="price-fig" style="font-family:var(--mono);">${fmt(yr3)}</span> over a three-year window, for software you stop owning the day you cancel. ${esc(p.brand)} is <span class="price-fig" style="font-family:var(--mono);">${fmt(p.price)}</span> the day you buy it, and the meter never runs again.</p>`;

  /* 1-2 other posts covering the SAME competitor (different apps) — the
     pricing-analysis cluster cross-links so the posts reinforce each other */
  const compMates = blogAppSlugs
    .filter(s => s !== p.slug && bySlug[s] && bySlug[s].competitor === p.competitor)
    .slice(0, 2);
  const compPageSlug = `${compSlug}-alternative`;
  const hasCompPage = posts.some(x => x.slug === compPageSlug);

  const articleHtml = `
          <p>${esc(p.heroLead)}</p>
          <p>This is the full pricing breakdown: what ${esc(p.competitor)} actually costs over one, two and three years, what ${esc(p.brand)} gives you for ${fmt(p.price)} paid once, and the honest cases where the subscription is still the right call.</p>

          <h2>What ${esc(p.competitor)} actually costs you</h2>
          ${costLead}
          ${costTable}
          ${seatsTable}
          ${yr3 > p.price ? `<p>Three years in, the gap is <span class="price-fig" style="font-family:var(--mono);">${fmt(yr3 - p.price)}</span> — and every year after that adds another ${fmt(p.compYr)} to the subscription side of the ledger.</p>` : ''}

          <h2>${esc(p.brand)} vs ${esc(p.competitor)}, feature by feature</h2>
          <p>Price is only half the story — here's how the two line up on the things that decide day-to-day use:</p>
          ${blogTable(p)}

          <h2>What you get for ${fmt(p.price)}, once</h2>
          <p>${esc(p.oneliner)} The highlights:</p>
          <ul>
            ${p.features.slice(0, 4).map(f => `<li>${esc(f[0])} <strong>${esc(f[1])}</strong> — ${esc(f[2])}</li>`).join('\n            ')}
          </ul>
          <p style="color:var(--ink-soft);font-size:0.95rem;">${esc(p.payback)}</p>

          <h2>Switching is ${p.steps.length} steps</h2>
          <ol>
            ${p.steps.map(s => `<li><strong>${esc(s[0])}.</strong> ${esc(s[1])}</li>`).join('\n            ')}
          </ol>

          <h2>When paying ${esc(p.competitor)} is still the right call</h2>
          <p>Being straight about it: the subscription earns its keep in three situations. If your team is large enough that ${esc(p.competitor)}'s collaboration features, permissions and admin controls are genuinely load-bearing; if your workflow is built on its integrations and leaving means rebuilding that plumbing; or if you have enterprise requirements — SSO, audit logs, SLAs, a vendor to call — that a pay-once app doesn't come with. Everyone else is paying ${esc(p.compPrice)} for a job that runs fine on hardware they already own.</p>
          <p>If that's you, <a href="/${p.slug}/">${esc(p.brand)} is ${fmt(p.price)}, once</a>. For the deeper dive, read the <a href="/blog/${p.slug}-vs-${compSlug}-open-source-vs-subscription/">${esc(p.brand)} vs ${esc(p.competitor)} head-to-head</a>${hasCompPage ? ` or the <a href="/comparison/${compPageSlug}/">full ${esc(p.competitor)} comparison</a>` : ''}.</p>

          <h2>Frequently asked questions</h2>
          ${p.faq.map(q => `<p><strong>${esc(q[0])}</strong><br>${esc(q[1])}</p>`).join('\n          ')}

          <h2>More on ${esc(p.competitor)} pricing</h2>
          <p>${[
            `<a href="/${p.slug}/">${esc(p.brand)} — product page, demo &amp; full feature list</a>`,
            ...compMates.map(s => `<a href="/blog/${s}-${compSlug}-pricing-is-out-of-control/">${esc(bySlug[s].brand)} vs ${esc(p.competitor)} pricing</a>`),
            `<a href="/blog/">All OneTimeSuite pricing breakdowns</a>`,
          ].join(' &middot; ')}</p>
          ${blogCta(p, buy, repoUrl)}`;

  /* Title: numbers-first and unique per app (brand is unique). Fall back to
     shorter variants when brand + competitor names run long — hard cap 60. */
  const yr3fmt = fmt(yr3);
  let title = `${p.brand} vs ${p.competitor} pricing: ${yr3fmt} vs ${fmt(p.price)} once`;
  if (title.length > 60) title = `${p.brand} vs ${p.competitor} pricing: ${yr3fmt} vs ${fmt(p.price)}`;
  if (title.length > 60) title = `${p.brand} vs ${p.competitor}: the 3-year pricing math`;
  if (title.length > 60) title = `${p.brand} pricing vs ${p.competitor}`;
  if (title.length > 60) console.warn('blogPost2 TITLE OVER 60 CHARS:', title.length, title);

  writeBlogPost({
    slug: `${p.slug}-${compSlug}-pricing-is-out-of-control`,
    product: p.slug,
    formula: 'pricing-is-out-of-control',
    title,
    metaDesc: `${p.competitor} costs ${p.compPrice} — ${yr3fmt} over 3 years. ${p.brand} does the same core job for ${fmt(p.price)}, once. The full pricing math, feature table and switch steps.`,
    articleHtml,
    faq: p.faq,
  });
}

function blogPost3({ p, buy, repoUrl, compSlug }) {
  /* Only pull a real FAQ answer when the QUESTION is actually about
     migrating/importing — matching on the full answer text too easily
     grabs an unrelated line (e.g. any answer that happens to say "export"). */
  const migrationFaq = p.faq.find(q => /\bmigrat|\bimport\b|\bswitch(ing)? from|\bmove (my|your) data/i.test(q[0]));
  const articleHtml = `
          <p>Switching from ${esc(p.competitor)} to <a href="/${p.slug}/">${esc(p.brand)}</a> is mostly a matter of following the same three steps every OneTimeSuite app uses — buy once, deploy or install, bring your workflow over.</p>

          ${p.steps.map((s, i) => `<h2>Step ${i + 1}: ${esc(s[0])}</h2>\n          <p>${esc(s[1])}</p>`).join('\n\n          ')}

          <h2>What to expect during the switch</h2>
          <p>${migrationFaq ? esc(migrationFaq[1]) : `${esc(p.brand)} covers the same core workflow as ${esc(p.competitor)}, so most people are productive within the first session — see the full feature list and FAQ on the <a href="/${p.slug}/">product page</a> before you commit.`}</p>

          <h2>Why make the switch at all</h2>
          <p>${esc(p.competitor)} runs ${esc(p.compPrice)}, forever. ${esc(p.brand)} is $${p.price}, once. ${esc(p.payback)}</p>
          ${blogCta(p, buy, repoUrl)}`;
  writeBlogPost({
    slug: `${p.slug}-how-to-switch-from-${compSlug}`,
    product: p.slug,
    formula: 'how-to-switch',
    title: `How to Switch from ${p.competitor} to ${p.brand}`,
    metaDesc: `A step-by-step guide to moving from ${p.competitor} (${p.compPrice}) to ${p.brand} — a $${p.price} one-time purchase that ${p.oneliner.charAt(0).toLowerCase()}${p.oneliner.slice(1)}`,
    articleHtml,
  });
}

function blogPost4({ p, buy, repoUrl, compSlug }) {
  /* Pull the one FAQ item that's an honest concession about the competitor,
     if the product's own FAQ has one — never the last FAQ item by default,
     since for most apps that's an unrelated "is this a subscription in
     disguise?" answer, not a statement about what the competitor does well. */
  const compRe = new RegExp(p.competitor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const concessionCue = /genuinely (wins|good|the better fit)|is a solid product|honest trade-?off|we'd rather say so/i;
  const honestLimit = p.faq.find(q => compRe.test(q[1]) && concessionCue.test(q[1]));
  const articleHtml = `
          <p>${esc(p.brand)} and ${esc(p.competitor)} solve the same problem from opposite directions: one is source-available software you can own outright for $${p.price}, the other is a subscription at ${esc(p.compPrice)} run entirely on someone else's servers.</p>

          <h2>Head to head</h2>
          ${blogTable(p)}

          <h2>What ${esc(p.brand)} does well</h2>
          <ul>
            ${p.features.slice(0, 4).map(f => `<li><strong>${esc(f[1])}</strong> — ${esc(f[2])}</li>`).join('\n            ')}
          </ul>

          <h2>What ${esc(p.competitor)} still does better</h2>
          <p>${honestLimit ? esc(honestLimit[1]) : `There's a real reason ${esc(p.competitor)} costs what it does: a bigger team, broader integrations and dedicated support behind it. If that ecosystem is genuinely what you need, it's worth paying for.`}</p>

          <h2>Which one should you pick</h2>
          <p>If your workflow depends on ${esc(p.competitor)}'s specific integrations or you'd rather not run anything yourself, stay put — that's a legitimate call. If you're comfortable owning the tool and want to stop paying ${esc(p.compPrice)} for a job your own hardware can do, ${esc(p.brand)} pays for itself and then some: ${esc(p.payback.charAt(0).toLowerCase())}${esc(p.payback.slice(1))}</p>
          ${blogCta(p, buy, repoUrl)}`;
  writeBlogPost({
    slug: `${p.slug}-vs-${compSlug}-open-source-vs-subscription`,
    product: p.slug,
    formula: 'open-source-vs-subscription',
    title: `${p.brand} vs ${p.competitor}: Open Source vs Subscription`,
    metaDesc: `${p.brand} ($${p.price} once) vs ${p.competitor} (${p.compPrice}) — an honest head-to-head on price, features and who should actually switch.`,
    articleHtml,
  });
}

function blogPost5({ p, buy, repoUrl, compSlug, siblings }) {
  const rest = siblings.map((s, i) => {
    const sBuy = blogBuyLink(s);
    return `
          <h3>${i + 2}. ${esc(s.brand)} — ${esc(s.oneliner)}</h3>
          <p>Replaces ${esc(s.competitor)} (${esc(s.compPrice)}). <span class="price-fig" style="font-family:var(--mono);">$${s.price}</span> once. <a href="/${s.slug}/">See ${esc(s.brand)} &rarr;</a></p>`;
  }).join('\n');
  const articleHtml = `
          <p>Looking for a free or open-source alternative to ${esc(p.competitor)}? <strong>${esc(p.brand)}</strong> is the closest direct swap — MIT-licensed source on GitHub, or a $${p.price} one-time packaged install. Since you're already auditing what you pay ${esc(p.competitor)} every month, here are four more pay-once tools from the same catalog worth a look while you're at it — different jobs, same idea: buy the software once instead of renting it forever.</p>

          <h2>1. ${esc(p.brand)} — replaces ${esc(p.competitor)}</h2>
          <p>${esc(p.oneliner)} $${p.price} once vs ${esc(p.competitor)}'s ${esc(p.compPrice)}. Free on GitHub, or the packaged installer on Whop.</p>
          <p><a href="/${p.slug}/">See ${esc(p.brand)} &rarr;</a> &middot; <a href="${repoUrl}" rel="noopener">Source on GitHub</a></p>
          ${rest}

          <h2>Why this list is worth bookmarking</h2>
          <p>Every app above is a one-time purchase with MIT-licensed source, no accounts with us and no telemetry. None of them are trying to be the next ${esc(p.competitor)} — they're trying to be the last subscription you pay for that specific job.</p>
          ${blogCta(p, buy, repoUrl)}`;
  writeBlogPost({
    slug: `${p.slug}-free-open-source-alternatives-to-${compSlug}`,
    product: p.slug,
    formula: 'free-open-source-alternatives',
    title: `${p.brand} — Free and Open-Source Alternatives to ${p.competitor}`,
    metaDesc: `${p.brand} leads this list of 5 free and open-source, pay-once alternatives to ${p.competitor} and other subscription SaaS.`,
    articleHtml,
  });
}

function blogPost6({ p, buy, repoUrl, compSlug }, comp) {
  const cSlug = slugify(comp.name);
  if (cSlug === compSlug) return; // primary competitor already has the 5-post cluster
  const yr3Line = comp.yr3
    ? ` That's roughly <span class="price-fig" style="font-family:var(--mono);">$${(+comp.yr3).toLocaleString('en-US')}</span> over three years.`
    : '';
  const articleHtml = `
          <p>${esc(comp.name)} is one of the better-known subscription tools in its space — and at ${esc(comp.price)}, one of the recurring line items people most often look to replace. If you're searching for a <strong>${esc(comp.name)} alternative</strong> you pay for once and own forever, <a href="/${p.slug}/">${esc(p.brand)}</a> is the OneTimeSuite answer: $${p.price}, one time.</p>

          <h2>Why people go looking for an alternative</h2>
          <p>${esc(comp.name)} runs ${esc(comp.price)}, and like most SaaS the bill never stops — cancel and you typically lose access to your own history.${yr3Line} ${esc(p.brand)} flips that model: ${esc(p.oneliner)}</p>

          <h2>What ${esc(p.brand)} covers</h2>
          <ul>
            ${p.features.slice(0, 5).map(f => `<li><strong>${esc(f[1])}</strong> — ${esc(f[2])}</li>`).join('\n            ')}
          </ul>

          <h2>The honest trade-off</h2>
          <p>${esc(comp.name)} will keep shipping features, integrations and managed infrastructure that a pay-once tool won't chase — if that ecosystem is genuinely load-bearing for your workflow, staying is a fair call. For the core job, the math favors owning the tool: $${p.price} once against ${esc(comp.price)} forever. ${esc(p.payback)}</p>

          <h2>Also worth reading</h2>
          <p>${esc(p.brand)}'s main head-to-head is with ${esc(p.competitor)} — see the <a href="/blog/${p.slug}-vs-${compSlug}-open-source-vs-subscription/">detailed comparison</a> or the <a href="/${p.slug}/">product page</a> for the full feature list, FAQ and demo video.</p>
          ${blogCta(p, buy, repoUrl)}`;
  writeBlogPost({
    slug: `${p.slug}-${cSlug}-alternative-pay-once`,
    product: p.slug,
    formula: 'pay-once-alternative',
    title: `${p.brand} — ${comp.name} Alternative You Pay for Once`,
    metaDesc: `${p.brand} is a $${p.price} one-time purchase that replaces ${comp.name} (${comp.price}). ${p.oneliner}`,
    articleHtml,
  });
}

blogAppSlugs.forEach(productSlug => {
  const p = bySlug[productSlug];
  if (!p) { console.warn('SKIPPED blog product (not found):', productSlug); return; }
  const buy = blogBuyLink(p);
  const repoUrl = `${GH}/${p.repo}`;
  const compSlug = slugify(p.competitor);
  const yr3 = p.compYr * 3;

  const idx = blogAppSlugs.indexOf(productSlug);
  const siblings = [];
  for (let i = 1; siblings.length < 4 && i < blogAppSlugs.length; i++) {
    const sSlug = blogAppSlugs[(idx + i) % blogAppSlugs.length];
    const s = bySlug[sSlug];
    if (sSlug !== productSlug && s) siblings.push(s);
  }

  const ctx = { p, buy, repoUrl, compSlug, yr3, siblings };
  blogPost1(ctx);
  blogPost2(ctx);
  blogPost3(ctx);
  blogPost4(ctx);
  blogPost5(ctx);
  (blogExtraComps[productSlug] || []).forEach(comp => blogPost6(ctx, comp));
});

/* ---------- catalog roundups: the five ROUNDUPS posts (the ROUNDUPS array
   itself is hoisted above §2 — the product-page cluster section links each
   app's roundup, so it must exist before the v1 generator runs). ---------- */
const ROUNDUP_POSTS = []; // { slug, title, metaDesc } — for the /blog/ hub top section
const roundupPrice = slug => {
  const t = tierCheckouts[slug];
  if (t && t.prices && t.prices.lifetime != null) return t.prices.lifetime;
  const w = whopLinks[slug];
  if (w && w.price != null) return w.price;
  return bySlug[slug].price;
};
/* Guard: the five lists must partition the catalog exactly — every one of the
   104 apps in exactly one roundup. Throws at build time, not after deploy. */
{
  const flat = ROUNDUPS.flatMap(r => r.apps);
  const seen = new Set();
  for (const s of flat) {
    if (!bySlug[s]) throw new Error('roundup references unknown slug: ' + s);
    if (seen.has(s)) throw new Error('slug in two roundups: ' + s);
    seen.add(s);
  }
  const missing = allProducts.map(p => p.slug).filter(s => !seen.has(s));
  if (missing.length) throw new Error('slugs missing from roundups: ' + missing.join(', '));
}

const compPostSlugsForRoundup = new Set(posts.map(x => x.slug));
ROUNDUPS.forEach(cat => {
  const soonNote = ' <span style="font-size:0.8em;font-weight:500;color:var(--ink-soft);">· coming soon</span>';
  const appSection = slug => {
    const p = bySlug[slug];
    const avail = AVAILABLE_SLUGS.has(slug);
    const price = roundupPrice(slug);
    const compSlug = `${slugify(p.competitor)}-alternative`;
    const hasComp = compPostSlugsForRoundup.has(compSlug);
    const feat = p.features.slice(0, 2)
      .map(f => `<li>${esc(f[0])} <strong>${esc(f[1])}</strong> — ${esc(f[2])}</li>`).join('\n            ');
    return `
          <h3>${p.icon} <a href="/${p.slug}/">${esc(p.brand)}</a>${avail ? '' : soonNote}</h3>
          <p>${esc(p.oneliner)}</p>
          <ul>
            ${feat}
          </ul>
          <p>Replaces ${esc(p.competitor)} (${esc(p.compPrice)}) — ${esc(p.brand)} is <span class="price-fig" style="font-family:var(--mono);">$${price}</span>, once.${avail ? '' : ` ${esc(p.brand)} is in final release prep — it joins the catalog (and the ${fmt(BUNDLE.price)} bundle) at launch, at the same one-time price.`}</p>
          <p><a href="/${p.slug}/">See ${esc(p.brand)} &rarr;</a>${hasComp ? ` &middot; <a href="/comparison/${compSlug}/">the ${esc(p.competitor)} alternative comparison</a>` : ''}</p>`;
  };

  const nAvail = cat.apps.filter(s => AVAILABLE_SLUGS.has(s)).length;
  const tableRows = cat.apps.map(slug => {
    const p = bySlug[slug];
    const avail = AVAILABLE_SLUGS.has(slug);
    return `<tr><td class="us"><a href="/${p.slug}/">${p.icon} ${esc(p.brand)}</a>${avail ? '' : soonNote}</td><td>${esc(p.competitor)}</td><td>${esc(p.compPrice)}</td><td><span class="price-fig">$${roundupPrice(slug)}</span> once</td></tr>`;
  }).join('\n              ');

  const others = ROUNDUPS.filter(r => r.slug !== cat.slug)
    .map(r => `<a href="/blog/${r.slug}/">${esc(r.title)}</a>`).join(' &middot; ');

  const articleHtml = `
          <p>${esc(cat.intro)}</p>
          <p>${nAvail} of the ${cat.apps.length} are available to buy today; the rest are marked “coming soon” and join the catalog — and the <a href="/${BUNDLE.slug}/">${fmt(BUNDLE.price)} bundle</a> — as they ship.</p>

          <h2>The ${cat.apps.length} tools, side by side</h2>
          <div class="tbl-wrap">
            <table class="receipt">
              <thead><tr><th>App</th><th>Replaces</th><th>Typical competitor cost</th><th>One-time price</th></tr></thead>
              <tbody>
              ${tableRows}
              </tbody>
            </table>
          </div>

          <h2>The tools, one by one</h2>
          ${cat.apps.map(appSection).join('\n')}

          <h2>How to choose</h2>
          <ul>
            ${cat.choose.map(c => `<li>${esc(c)}</li>`).join('\n            ')}
          </ul>

          <h2>Frequently asked questions</h2>
          ${cat.faq.map(q => `<p><strong>${esc(q[0])}</strong><br>${esc(q[1])}</p>`).join('\n          ')}

          <h2>More pay-once suites</h2>
          <p>This is one of five roundups covering the whole ${allProducts.length}-app OneTimeSuite catalog. The other four: ${others}.</p>`;

  writeBlogPost({
    slug: cat.slug,
    product: null,
    formula: 'catalog-roundup',
    title: cat.title,
    metaDesc: cat.metaDesc,
    articleHtml,
    faq: cat.faq,
  });
  ROUNDUP_POSTS.push({ slug: cat.slug, title: cat.title, metaDesc: cat.metaDesc });
});

/* ---------- /blog/ hub ---------- */
(function blogHub() {
  /* The 5 catalog roundups lead the hub — they're the strongest posts and
     together they link every product page. */
  const roundupBlock = ROUNDUP_POSTS.length ? `
      <div style="margin-bottom:2.4rem;">
        <h2 style="font-size:1.3rem;margin-bottom:0.9rem;">🧭 Catalog roundups <span class="mono-note">&mdash; all ${allProducts.length} pay-once apps, grouped by job</span></h2>
        <div class="post-list">
          ${ROUNDUP_POSTS.map(x => `<a href="/blog/${x.slug}/"><h3>${esc(x.title)}</h3><p>${esc(x.metaDesc)}</p></a>`).join('\n          ')}
        </div>
      </div>` : '';

  const groups = blogAppSlugs.map(slug => {
    const p = bySlug[slug];
    if (!p) return '';
    const list = blogPostList.filter(x => x.product === slug);
    if (!list.length) return '';
    return `
      <div style="margin-bottom:2.4rem;">
        <h2 style="font-size:1.3rem;margin-bottom:0.9rem;">${p.icon} ${esc(p.brand)} <span class="mono-note">&mdash; replaces ${esc(p.competitor)} &middot; <a href="/${p.slug}/">product page</a></span></h2>
        <div class="post-list">
          ${list.map(x => `<a href="/blog/${x.slug}/"><h3>${esc(x.title)}</h3><p>${esc(x.metaDesc)}</p></a>`).join('\n          ')}
        </div>
      </div>`;
  }).join('');

  const body = `
    <section class="hero" aria-label="Blog">
      <div class="wrap">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">OneTimeSuite</a> / Blog</nav>
        <span class="stamp">${blogPostList.length} posts</span>
        <h1>The OneTimeSuite Blog</h1>
        <p class="lead">Switch guides, pricing breakdowns and honest head-to-heads for every app in the suite &mdash; who should switch, who should stay, and what it actually costs either way.</p>
      </div>
    </section>

    <section aria-label="All blog posts">
      <div class="wrap">${roundupBlock}${groups || '<p>New posts are on the way.</p>'}
      </div>
    </section>

    <section aria-label="Get the suite" class="center">
      <div class="wrap">
        <h2>Pay once. Own it forever.</h2>
        <p style="color:var(--ink-soft);margin:0.8rem auto 1.6rem;">The whole suite is on Whop &mdash; one-time prices from $15, MIT source on GitHub.</p>
        <div class="btn-row" style="justify-content:center;">
          <a class="btn btn-solid" href="/">Browse the suite &rarr;</a>
          <a class="btn btn-ghost" href="${WHOP}" rel="noopener">Buy on Whop</a>
        </div>
      </div>
    </section>`;

  write('blog', page({
    title: `The OneTimeSuite Blog — Switch Guides and Pricing Breakdowns`,
    desc: `Switch guides, pricing breakdowns and open-source-vs-subscription comparisons for every app in the OneTimeSuite catalog.`,
    canonical: `${SITE}/blog/`,
    jsonld: [{
      '@context': 'https://schema.org', '@type': 'ItemList',
      itemListElement: blogPostList.map((x, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/blog/${x.slug}/`, name: x.title })),
    }],
    body,
  }));
  reg('/blog/');
})();

/* ---------- interlink pass: "keep reading" spiderweb ----------
   Injected after all posts are written so every blog post can link to its
   whole cluster, the product page, the matching /comparison/ post and two
   neighbouring apps' clusters — and every /comparison/ post links back into
   the blog. Purely additive: existing URLs and markup are never changed. */
{
  const byProduct = {};
  blogPostList.forEach(x => (byProduct[x.product] = byProduct[x.product] || []).push(x));
  const productOrder = Object.keys(byProduct);
  const compPostSlugs = new Set(posts.map(x => x.slug));
  const injectBefore = (fp, marker, block) => {
    if (!fs.existsSync(fp)) return false;
    let html = fs.readFileSync(fp, 'utf8');
    if (html.includes('keep-reading') || !html.includes(marker)) return false;
    fs.writeFileSync(fp, html.replace(marker, block + marker), 'utf8');
    return true;
  };
  let nBlog = 0, nComp = 0;

  blogPostList.forEach(x => {
    const p = bySlug[x.product];
    if (!p) return;
    const sibs = byProduct[x.product].filter(y => y.slug !== x.slug).slice(0, 5);
    const compSlug = `${slugify(p.competitor)}-alternative`;
    const i = productOrder.indexOf(x.product);
    const neighbors = [1, 2]
      .map(o => byProduct[productOrder[(i + o) % productOrder.length]])
      .map(list => list && list[0]).filter(y => y && y.product !== x.product);
    const links = [
      `<a href="/${p.slug}/">${esc(p.brand)}: product page, demo video &amp; FAQ</a>`,
      ...(compPostSlugs.has(compSlug) ? [`<a href="/comparison/${compSlug}/">${esc(p.competitor)} alternative — the full comparison</a>`] : []),
      ...sibs.map(y => `<a href="/blog/${y.slug}/">${esc(y.title)}</a>`),
      ...neighbors.map(y => `<a href="/blog/${y.slug}/">${esc(y.title)}</a>`),
    ];
    const block = `<nav class="keep-reading" aria-label="Keep reading" style="margin-top:2.4rem;border-top:1.5px solid var(--ink);padding-top:1.4rem;">
            <h2>Keep reading</h2>
            <ul>
              ${links.map(l => `<li>${l}</li>`).join('\n              ')}
            </ul>
          </nav>\n        `;
    if (injectBefore(path.join(OUT, 'blog', x.slug, 'index.html'), '</article>', block)) nBlog++;
  });

  posts.forEach(x => {
    const cluster = byProduct[x.product];
    if (!cluster || !cluster.length) return;
    const p = bySlug[x.product];
    const links = [
      ...cluster.slice(0, 3).map(y => `<a href="/blog/${y.slug}/">${esc(y.title)}</a>`),
      `<a href="/blog/">The OneTimeSuite Blog</a>`,
    ];
    const block = `<nav class="keep-reading" aria-label="Keep reading" style="margin-top:2.4rem;border-top:1.5px solid var(--ink);padding-top:1.4rem;">
            <h2>More on ${esc(p ? p.brand : x.product)}</h2>
            <ul>
              ${links.map(l => `<li>${l}</li>`).join('\n              ')}
            </ul>
          </nav>\n        `;
    if (injectBefore(path.join(OUT, 'comparison', x.slug, 'index.html'), '</article>', block)) nComp++;
  });

  console.log(`interlink pass: ${nBlog} blog posts + ${nComp} comparison posts got keep-reading blocks`);
}

/* ============================================================
 * 8. 404, robots, sitemap, static assets
 * ============================================================ */
fs.writeFileSync(path.join(OUT, '404.html'), page({
  title: 'Page not found | OneTimeSuite',
  desc: 'That page does not exist. Browse the pay-once suite instead.',
  canonical: `${SITE}/404.html`,
  body: `
    <section class="hero center">
      <div class="wrap">
        <span class="stamp">404 · not on the shelf</span>
        <h1>This page isn't in stock</h1>
        <p class="lead" style="margin-left:auto;margin-right:auto;">The URL you followed doesn't exist. The ${allProducts.length} pay-once apps, however, do.</p>
        <div class="btn-row" style="justify-content:center;">
          <a class="btn btn-solid" href="/">Browse the suite &rarr;</a>
          <a class="btn btn-ghost" href="/comparison/">Read the comparisons</a>
        </div>
      </div>
    </section>`,
}), 'utf8');

/* /lead/ + /survey/ + /admin/ — self-contained pages (inline CSS/JS), noindex,
   not in the sitemap. /lead/ captures emails for the promised GitHub link and
   redirects to /survey/ (what-tools-do-you-use); /admin/ is the
   password-protected dashboard talking to server/api.js. */
write('lead', require('./src/lead-page.js'));
write('survey', require('./src/survey-page.js'));
write('admin', require('./src/admin-page.js'));

fs.writeFileSync(path.join(OUT, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\nSitemap: ${SITE}/video-sitemap.xml\n`, 'utf8');

/* Split sitemaps: one urlset per reg() set (pages/apps/blog/vs) plus a
 * sitemap index at sitemap.xml that also references the video sitemap.
 * Empty sets are skipped; video-sitemap.xml is written separately below. */
const sitemapBody = list =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  list.map(u => `  <url><loc>${SITE}${u}</loc></url>`).join('\n') +
  `\n</urlset>\n`;
const sitemapSets = Object.keys(urlSets).filter(k => urlSets[k].length);
for (const k of sitemapSets) {
  fs.writeFileSync(path.join(OUT, `sitemap-${k}.xml`), sitemapBody(urlSets[k]), 'utf8');
}
fs.writeFileSync(path.join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  sitemapSets.map(k => `  <sitemap><loc>${SITE}/sitemap-${k}.xml</loc></sitemap>`).join('\n') +
  `\n  <sitemap><loc>${SITE}/video-sitemap.xml</loc></sitemap>\n</sitemapindex>\n`, 'utf8');
console.log(`sitemap index: ${sitemapSets.map(k => `${k}=${urlSets[k].length}`).join(' ')} + video-sitemap.xml`);

/* rss.xml — all blog content, newest batch first */
const xmlEsc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rssItems = [
  ...seoPosts.map(x => ({
    title: x.title, url: `${SITE}/${x.slug}/`, desc: x.metaDesc,
    date: 'Fri, 11 Jul 2026 00:00:00 GMT',
  })),
  ...posts.filter(x => bySlug[x.product]).map(x => {
    const p = bySlug[x.product];
    return {
      title: `Looking for ${art(x.competitor)} ${x.competitor} Alternative? Meet ${p.brand} — Pay Once, Own It Forever`,
      url: `${SITE}/comparison/${x.slug}/`, desc: x.metaDesc,
      date: 'Mon, 06 Jul 2026 00:00:00 GMT',
    };
  }),
];
fs.writeFileSync(path.join(OUT, 'rss.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>\n` +
  `<title>OneTimeSuite — Pay-Once vs Subscription</title>\n` +
  `<link>${SITE}/comparison/</link>\n` +
  `<description>Honest comparisons of subscription SaaS tools vs pay-once desktop and self-hosted alternatives.</description>\n` +
  `<language>en</language>\n` +
  rssItems.map(i => `<item><title>${xmlEsc(i.title)}</title><link>${i.url}</link><guid>${i.url}</guid><pubDate>${i.date}</pubDate><description>${xmlEsc(i.desc)}</description></item>`).join('\n') +
  `\n</channel></rss>\n`, 'utf8');

/* video-sitemap.xml — one <video:video> entry per product page with a demo
   video (YouTube embed, or self-hosted clip fallback for EMBED_BROKEN ids) */
const videoProducts = allProducts.filter(p => ytId(p.slug) || hasClip(p.slug));
fs.writeFileSync(path.join(OUT, 'video-sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n` +
  videoProducts.map(p => {
    const vid = ytId(p.slug);
    const raw = ytIdRaw(p.slug);
    const thumb = raw ? `https://i.ytimg.com/vi/${raw}/hqdefault.jpg` : `${SITE}/assets/shots/${p.slug}.png`;
    const locTag = vid
      ? `<video:player_loc>https://www.youtube-nocookie.com/embed/${vid}</video:player_loc>`
      : `<video:content_loc>${SITE}/assets/clips/${p.slug}.mp4</video:content_loc>`;
    return `  <url><loc>${SITE}/${p.slug}/</loc><video:video>` +
      `<video:thumbnail_loc>${thumb}</video:thumbnail_loc>` +
      `<video:title>${xmlEsc(`${p.brand} demo — pay once, own it forever`)}</video:title>` +
      `<video:description>${xmlEsc(p.tagline || p.brand)}</video:description>` +
      locTag +
      `<video:publication_date>${(ytVideos[p.slug] && ytVideos[p.slug].at) || '2026-07-15T00:00:00Z'}</video:publication_date>` +
      `</video:video></url>`;
  }).join('\n') + `\n</urlset>\n`, 'utf8');
console.log(`video-sitemap.xml: ${videoProducts.length} video entries`);

/* css + screenshots */
fs.mkdirSync(path.join(OUT, 'css'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'src', 'site.css'), path.join(OUT, 'css', 'site.css'));
const shotsOut = path.join(OUT, 'assets', 'shots');
fs.mkdirSync(shotsOut, { recursive: true });
for (const f of fs.readdirSync(SHOTS_SRC)) {
  if (/\.png$/i.test(f)) fs.copyFileSync(path.join(SHOTS_SRC, f), path.join(shotsOut, f));
}
if (fs.existsSync(BOXES_SRC)) {
  const boxesOut = path.join(OUT, 'assets', 'boxes');
  fs.mkdirSync(boxesOut, { recursive: true });
  for (const f of fs.readdirSync(BOXES_SRC)) {
    if (/\.png$/i.test(f)) fs.copyFileSync(path.join(BOXES_SRC, f), path.join(boxesOut, f));
  }
}
if (ogAvailable.size) {
  const ogOut = path.join(OUT, 'og');
  fs.mkdirSync(ogOut, { recursive: true });
  for (const f of ogAvailable) fs.copyFileSync(path.join(OG_SRC, f), path.join(ogOut, f));
}
if (fs.existsSync(CLIPS_SRC)) {
  const clipsOut = path.join(OUT, 'assets', 'clips');
  fs.mkdirSync(clipsOut, { recursive: true });
  for (const f of fs.readdirSync(CLIPS_SRC)) {
    if (/\.mp4$/i.test(f)) fs.copyFileSync(path.join(CLIPS_SRC, f), path.join(clipsOut, f));
  }
}

/* root-level static files (favicons, site.webmanifest) from assets/root/ */
const ROOT_STATIC = path.join(ROOT, 'assets', 'root');
if (fs.existsSync(ROOT_STATIC)) {
  for (const f of fs.readdirSync(ROOT_STATIC)) {
    fs.copyFileSync(path.join(ROOT_STATIC, f), path.join(OUT, f));
  }
}

/* iconforge in-browser demo (self-contained page + vendored jszip) */
const JS_SRC = path.join(ROOT, 'assets', 'js');
if (fs.existsSync(JS_SRC)) {
  const jsOut = path.join(OUT, 'assets', 'js');
  fs.mkdirSync(jsOut, { recursive: true });
  for (const f of fs.readdirSync(JS_SRC)) fs.copyFileSync(path.join(JS_SRC, f), path.join(jsOut, f));
}
const VIDEO_SRC = path.join(ROOT, 'assets', 'video');
if (fs.existsSync(VIDEO_SRC)) {
  const vOut = path.join(OUT, 'assets', 'video');
  fs.mkdirSync(vOut, { recursive: true });
  for (const f of fs.readdirSync(VIDEO_SRC)) fs.copyFileSync(path.join(VIDEO_SRC, f), path.join(vOut, f));
}
const ADS_SRC = path.join(ROOT, 'assets', 'ads');
if (fs.existsSync(ADS_SRC)) {
  const adsOut = path.join(OUT, 'assets', 'ads');
  fs.mkdirSync(adsOut, { recursive: true });
  for (const f of fs.readdirSync(ADS_SRC)) fs.copyFileSync(path.join(ADS_SRC, f), path.join(adsOut, f));
}
/* central ad server: /ads/ad.js + /ads/ads.json (CORS-open in nginx) */
const ADSRV_SRC = path.join(ROOT, 'ads');
if (fs.existsSync(ADSRV_SRC)) {
  const adsrvOut = path.join(OUT, 'ads');
  fs.mkdirSync(adsrvOut, { recursive: true });
  for (const f of fs.readdirSync(ADSRV_SRC)) fs.copyFileSync(path.join(ADSRV_SRC, f), path.join(adsrvOut, f));
}
for (const demoSlug of DEMOS) {
  const demoSrc = path.join(ROOT, 'src', `${demoSlug}-demo.html`);
  if (fs.existsSync(demoSrc)) {
    fs.mkdirSync(path.join(OUT, demoSlug, 'demo'), { recursive: true });
    fs.copyFileSync(demoSrc, path.join(OUT, demoSlug, 'demo', 'index.html'));
  }
}

/* ============================================================
 * On-site embedded checkout + per-product thank-you pages
 *   /checkout/<slug>/?plan=plan_X  — Whop checkout embed, stays on our domain
 *   /thanks/<slug>/                — post-purchase congrats + browser Purchase
 * The embed's onComplete hands us (planId, receiptId); receiptId equals the
 * Whop payment id the ots-track webhook sends to the Conversions API, so the
 * browser Purchase (eventID = receiptId) and the server Purchase dedupe in
 * Meta instead of double-counting. Both page types are noindex.
 * ============================================================ */
{
  let tierCheckouts = {};
  try { tierCheckouts = require('./src/tier-checkouts.json'); } catch {}

  const planFromUrl = url => { const m = /whop\.com\/checkout\/(plan_[A-Za-z0-9]+)/.exec(url || ''); return m ? m[1] : null; };
  const targets = [];
  for (const p of allProducts) {
    const wl = whopLinks[p.slug];
    const defaultPlan = (wl && wl.planId) || planFromUrl(p.buyUrl);
    /* No plan = sells off-site (own checkout, e.g. wispertalk.com). No embed
       page, but it still gets /thanks/<slug>/ as a conversion landing page —
       point the off-site checkout's success redirect at it. */
    const planPrices = defaultPlan ? { [defaultPlan]: p.price } : {};
    const tc = tierCheckouts[p.slug];
    if (defaultPlan && tc && tc.prices) {
      if (tc.monthlyPlanId) planPrices[tc.monthlyPlanId] = tc.prices.monthly;
      if (tc.yearlyPlanId) planPrices[tc.yearlyPlanId] = tc.prices.yearly;
      if (tc.lifetimePlanId) planPrices[tc.lifetimePlanId] = tc.prices.lifetime;
    }
    targets.push({ slug: p.slug, brand: p.brand, icon: p.icon, price: p.price, isDesktop: DESKTOP_SLUGS.has(p.slug), defaultPlan, planPrices, retryUrl: p.buyUrl || `/${p.slug}/` });
  }
  targets.push({
    slug: BUNDLE.slug, brand: BUNDLE.name, icon: '🧰', price: BUNDLE.price, isDesktop: false,
    defaultPlan: planFromUrl(BUNDLE.checkoutUrl) || 'plan_5Mv4jYmDfZH3a',
    planPrices: { [planFromUrl(BUNDLE.checkoutUrl) || 'plan_5Mv4jYmDfZH3a']: BUNDLE.price },
  });

  for (const t of targets) {
    const checkoutBody = !t.defaultPlan ? '' : `
    <section aria-label="Checkout">
      <div class="wrap" style="max-width:680px;">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">OneTimeSuite</a> / <a href="/${t.slug === BUNDLE.slug ? 'onetime-suite-bundle' : t.slug}/">${t.brand}</a> / Checkout</nav>
        <h1 style="margin-bottom:0.4rem;">${t.icon} Get ${esc(t.brand)}</h1>
        <p class="mono-note" style="margin-bottom:1.6rem;">Secure checkout by Whop — pay once, own it forever. You'll get your receipt and access by email.</p>
        <div id="whop-checkout"
          data-whop-checkout-plan-id="${t.defaultPlan}"
          data-whop-checkout-return-url="https://onetimesuite.com/thanks/${t.slug}/"
          data-whop-checkout-on-complete="otsCheckoutComplete"
          style="min-height:560px;"></div>
      </div>
    </section>
    <script>
      (function(){
        var m = /[?&]plan=(plan_[A-Za-z0-9]+)/.exec(location.search);
        if (m) document.getElementById('whop-checkout').setAttribute('data-whop-checkout-plan-id', m[1]);
        window.otsCheckoutComplete = function(planId, receiptId){
          location.href = '/thanks/${t.slug}/?status=success&plan_id=' + encodeURIComponent(planId || '') + '&receipt_id=' + encodeURIComponent(receiptId || '');
        };
        if (window.fbq) fbq('track', 'InitiateCheckout', { content_type: 'product', content_ids: ['${t.slug}'], value: ${t.price}, currency: 'USD' });
      })();
    </script>
    <script async defer src="https://js.whop.com/static/checkout/loader.js"></script>`;
    if (t.defaultPlan) write(`checkout/${t.slug}`, page({
      title: `Checkout — ${t.brand} | OneTimeSuite`,
      desc: `Secure one-time-purchase checkout for ${t.brand}.`,
      canonical: `${SITE}/checkout/${t.slug}/`,
      robots: 'noindex, nofollow',
      body: checkoutBody,
    }));

    const thanksBody = `
    <section aria-label="Thank you" class="center">
      <div class="wrap" style="max-width:680px;">
        <div id="ots-thanks-ok">
          <p style="font-size:3.4rem;margin-bottom:0.4rem;" aria-hidden="true">${t.icon}</p>
          <h1>You own ${esc(t.brand)} now. 🎉</h1>
          <p style="color:var(--ink-soft);margin:1rem auto 1.6rem;">That's it — no renewal, no meter, no monthly bill. Your receipt and ${t.isDesktop ? 'download instructions' : 'setup instructions'} are on their way to your email from Whop (check spam if it's not there in a couple of minutes).</p>
          <div class="btn-row" style="justify-content:center;">
            <a class="btn btn-solid" href="https://whop.com/orders/" rel="noopener">View your order on Whop &rarr;</a>
            <a class="btn btn-ghost" href="/${t.slug === BUNDLE.slug ? 'onetime-suite-bundle' : t.slug}/">Back to ${esc(t.brand)}</a>
          </div>
          <p class="mono-note" style="margin-top:2rem;">While you're here — the <a href="/onetime-suite-bundle/">${fmt(BUNDLE.price)} bundle</a> gets you every app in the suite, including every future release.</p>
        </div>
        <div id="ots-thanks-err" style="display:none;">
          <h1>Payment didn't go through</h1>
          <p style="color:var(--ink-soft);margin:1rem auto 1.6rem;">No charge was made. You can try again — it takes under a minute.</p>
          <div class="btn-row" style="justify-content:center;">
            <a class="btn btn-solid" href="${t.defaultPlan ? `/checkout/${t.slug}/` : t.retryUrl}"${t.defaultPlan ? '' : ' rel="noopener"'}>Try again &rarr;</a>
          </div>
        </div>
      </div>
    </section>
    <script>
      (function(){
        var q = new URLSearchParams(location.search);
        if (q.get('status') === 'error') {
          document.getElementById('ots-thanks-ok').style.display = 'none';
          document.getElementById('ots-thanks-err').style.display = '';
          return;
        }
        var prices = ${JSON.stringify(t.planPrices)};
        var rid = q.get('receipt_id') || q.get('receiptId') || q.get('receipt') || '';
        var plan = q.get('plan_id') || q.get('planId') || '';
        var val = prices[plan] || ${t.price};
        var key = 'ots_purchase_' + (rid || '${t.slug}');
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, '1');
          if (window.fbq) fbq('track', 'Purchase',
            { content_type: 'product', content_ids: ['${t.slug}'], value: val, currency: 'USD' },
            rid ? { eventID: rid } : undefined);
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({ ecommerce: null });
          window.dataLayer.push({
            event: 'purchase',
            transaction_id: rid || key,
            value: val,
            currency: 'USD',
            ecommerce: {
              transaction_id: rid || key,
              value: val,
              currency: 'USD',
              items: [{ item_id: '${t.slug}', item_name: ${JSON.stringify(t.brand)}, price: val, quantity: 1 }]
            }
          });
        }
      })();
    </script>`;
    write(`thanks/${t.slug}`, page({
      title: `Thank you — ${t.brand} | OneTimeSuite`,
      desc: `Purchase confirmation for ${t.brand}.`,
      canonical: `${SITE}/thanks/${t.slug}/`,
      robots: 'noindex, nofollow',
      body: thanksBody,
    }));
  }
  const nCheckout = targets.filter(t => t.defaultPlan).length;
  console.log(`embedded checkout: ${nCheckout} /checkout/ + ${targets.length} /thanks/ pages (${targets.length - nCheckout} own-checkout thanks-only)`);
}

console.log(`Done: 1 hub + ${allProducts.length} products + 1 bundle + 1 comparison hub + ${posts.length} generated posts + ${seoPosts.length} SEO posts + 404 = ${urls.length + 1} pages`);

/* v2 landing pages overlay (2026-07-16): prebuilt React+Framer Motion product
 * pages from site-v2/ (committed in v2-pages/) replace the generated product
 * pages. Node 22 fs.cpSync, no deps. Hub, comparison posts, sitemap untouched. */
{
  /* Move the demo-video section (the one holding the YouTube iframe) from its
     spot deep in the page to directly after the hero — right under the header
     and buy buttons. The v2 pages never nest <section> tags, so plain index
     surgery on the flat HTML is safe. */
  const relocateDemoVideo = html => {
    const ifr = html.indexOf('youtube-nocookie.com/embed');
    if (ifr === -1) return html;
    const secStart = html.lastIndexOf('<section', ifr);
    const secEnd = html.indexOf('</section>', ifr);
    const firstSec = html.indexOf('<section');
    if (secStart === -1 || secEnd === -1 || secStart === firstSec) return html;
    const videoSec = html.slice(secStart, secEnd + 10);
    const rest = html.slice(0, secStart) + html.slice(secEnd + 10);
    const heroEnd = rest.indexOf('</section>') + 10;
    return rest.slice(0, heroEnd) + videoSec + rest.slice(heroEnd);
  };
  /* VideoObject JSON-LD for v2 pages: resolve the product from the embedded
     videoId, since the v2 HTML is prebuilt and carries no slug metadata */
  const slugByVid = Object.fromEntries(
    Object.entries(ytVideos).map(([s, v]) => [v.videoId, s]));
  const anyBySlug = Object.fromEntries(allProducts.map(p => [p.slug, p]));
  /* SoftwareApplication + FAQPage JSON-LD for overlaid v2 product pages (same
     nodes the v1 generator emits) — skipped per-type if the prebuilt page
     already carries that block. */
  const injectProductLd = (html, slug) => {
    const p = anyBySlug[slug];
    if (!p || !html.includes('</head>')) return html;
    const blocks = [];
    if (!html.includes('"SoftwareApplication"')) {
      blocks.push({
        '@context': 'https://schema.org', '@type': 'SoftwareApplication',
        name: p.brand,
        applicationCategory: DESKTOP_SLUGS.has(slug) ? 'UtilitiesApplication' : 'WebApplication',
        operatingSystem: DESKTOP_SLUGS.has(slug) ? 'Windows' : 'Self-hosted (your own server)',
        offers: { '@type': 'Offer', price: String(p.price), priceCurrency: 'USD', url: `${SITE}/${slug}/` },
      });
    }
    if (!html.includes('"FAQPage"') && Array.isArray(p.faq)) {
      blocks.push({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: p.faq.map(q => ({ '@type': 'Question', name: q[0], acceptedAnswer: { '@type': 'Answer', text: q[1] } })),
      });
    }
    if (!blocks.length) return html;
    return html.replace('</head>', blocks.map(o => `<script type="application/ld+json">${ldJson(o)}</script>`).join('\n') + '\n</head>');
  };
  const injectVideoLd = html => {
    if (html.includes('"VideoObject"') || !html.includes('</head>')) return html;
    const vm = html.match(/youtube-nocookie\.com\/embed\/([A-Za-z0-9_-]{6,})/);
    const p = vm && anyBySlug[slugByVid[vm[1]]];
    return p ? html.replace('</head>', `${videoLdScript(p)}\n</head>`) : html;
  };
  /* Swap iframes whose video has embedding disabled (EMBED_BROKEN) for the
     self-hosted clip so the page never shows "Video unavailable" */
  const fixBrokenEmbed = html =>
    html.replace(/<iframe[^>]*youtube-nocookie\.com\/embed\/([A-Za-z0-9_-]{6,})[^>]*><\/iframe>/g, (m, id) => {
      const slug = slugByVid[id];
      if (!EMBED_BROKEN.has(id) || !slug || !hasClip(slug)) return m;
      return `<video controls preload="metadata" src="/assets/clips/${slug}.mp4" style="position:absolute;inset:0;width:100%;height:100%;border:0;background:#000;"></video>`;
    });
  /* "Everything about {Brand}" content-cluster on each v2 product page —
     the same section the v1 generator emits (shared productClusterSection),
     injected before the footer of the page's root index.html only. Replaces
     the old 4-link "From the blog" block with the full hub-and-spoke cluster:
     blog posts, comparison page, demo, savings calculator, roundup, source. */
  const injectCluster = (html, slug) => {
    const p = anyBySlug[slug];
    if (!p || html.includes('content-cluster') || !html.includes('<footer')) return html;
    return html.replace('<footer', productClusterSection(p) + '\n    <footer');
  };
  const patchHtml = (dir, rootSlug) => {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const fp = path.join(dir, f.name);
      if (f.isDirectory()) { patchHtml(fp, null); continue; }
      if (!f.name.endsWith('.html')) continue;
      let html = fs.readFileSync(fp, 'utf8');
      html = relocateDemoVideo(html);
      html = injectVideoLd(html);
      html = fixBrokenEmbed(html);
      /* SEO clamps on the prebuilt v2 pages (2026-07-27 audit): titles ≤60,
         meta descriptions 120–160 — same rules as page(). */
      html = html.replace(/<title>([^<]*)<\/title>/, (m, t) => `<title>${fitTitle(t)}</title>`);
      html = html.replace(/<meta property="og:title" content="([^"]*)"\s*\/?>/, (m, t) => m.replace(t, fitTitle(t)));
      html = html.replace(/<meta name="description" content="([^"]*)"\s*\/?>/, (m, d) => m.replace(d, fitDesc(d)));
      html = html.replace(/<meta property="og:description" content="([^"]*)"\s*\/?>/, (m, d) => m.replace(d, fitDesc(d)));
      /* social-share thumbnail (assets/og) — v2 pages ship without one */
      if (!html.includes('property="og:image"') && html.includes('</head>')) {
        const rel = path.relative(OUT, path.dirname(fp)).replace(/\\/g, '/');
        const img = ogImageFor(`${SITE}/${rel}/`);
        if (img) html = html.replace('</head>',
          `<meta property="og:image" content="${img}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${img}">\n</head>`);
      }
      if (rootSlug && f.name === 'index.html') html = injectCluster(html, rootSlug);
      if (rootSlug && f.name === 'index.html') html = injectProductLd(html, rootSlug);
      if (!html.includes('rel="icon"') && html.includes('</head>')) {
        html = html.replace('</head>',
          `<link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"><link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest">\n</head>`);
      }
      if (!html.includes('stats.onetimesuite.com/a.js') && html.includes('</head>')) {
        html = html.replace('</head>',
          `<script defer src="https://stats.onetimesuite.com/a.js" data-site="87d907ee"></script>\n</head>`);
      }
      if (PIXEL && html.includes('</head>')) html = html.replace('</head>', `${PIXEL}\n</head>`);
      if (!html.includes('googletagmanager.com/gtm.js') && html.includes('</head>')) {
        html = html.replace('</head>', `${GTM_HEAD}\n</head>`);
      }
      if (!html.includes('googletagmanager.com/ns.html')) {
        html = html.replace(/<body([^>]*)>/, `<body$1>\n${GTM_BODY}`);
      }
      fs.writeFileSync(fp, html, 'utf8');
    }
  };
  const V2 = path.join(__dirname, 'v2-pages');
  if (fs.existsSync(V2)) {
    let n = 0;
    for (const entry of fs.readdirSync(V2)) {
      if (entry === 'index.html' || entry === '404.html') continue; // never clobber the hub
      fs.cpSync(path.join(V2, entry), path.join(OUT, entry), { recursive: true, force: true });
      patchHtml(path.join(OUT, entry), entry);
      n++;
    }
    console.log(`v2 overlay: ${n} entries copied over public/ (video section hoisted, cluster sections injected, pixel ${PIXEL ? 'injected' : 'off'})`);
  }
}

/* ==========================================================================
 * server catalog — public/_data/catalog.json
 *
 * The set of apps a 100%-off webinar coupon may be minted against. Emitted at
 * build time so it can never drift from AVAILABLE_SLUGS, and guarded so that a
 * mistake fails the BUILD rather than showing up as a free bundle in prod.
 *
 * Whop plan id resolution, in order:
 *   1. tier-checkouts.json .lifetimePlanId  — lifetime ONLY. A 100%-off promo
 *      applied to a monthly plan is a free recurring subscription.
 *   2. whop-links.json .planId
 *   3. a plan id embedded in an extra product's buyUrl
 * Anything unresolved must be listed in NO_WHOP_PLAN with a reason.
 * ====================================================================== */
{
  const BUNDLE_PLAN_ID = 'plan_5Mv4jYmDfZH3a';

  /* Live slugs that intentionally have no Whop plan and so cannot be given
     away by a Whop promo code. Keep the reason — this list is load-bearing. */
  const NO_WHOP_PLAN = {
    wispertalk: 'sold off-Whop on wispertalk.com — a Whop promo code cannot apply',
    bloommeeting: 'whop product page only, no plan id resolved yet',
    bloomclipper: 'whop product page only, no plan id resolved yet',
    'viral-invoice': 'whop product page only, no plan id resolved yet',
  };

  const planFromUrl = u => { const m = /\/checkout\/(plan_[A-Za-z0-9]+)/.exec(String(u || '')); return m ? m[1] : null; };

  const rows = [];
  const unresolved = [];

  for (const p of allProducts) {
    if (!AVAILABLE_SLUGS.has(p.slug)) continue;

    const tc = tierCheckouts[p.slug];
    const wl = whopLinks[p.slug];
    let planId = null;
    let price = p.price;

    if (tc && tc.lifetimePlanId) {
      planId = tc.lifetimePlanId;
      if (tc.prices && tc.prices.lifetime != null) price = tc.prices.lifetime;
    } else if (wl && wl.planId) {
      planId = wl.planId;
      if (wl.price != null) price = wl.price;
    } else {
      planId = planFromUrl(p.buyUrl);
    }

    if (!planId) {
      if (!NO_WHOP_PLAN[p.slug]) unresolved.push(p.slug);
      continue;
    }
    if (planId === BUNDLE_PLAN_ID) {
      throw new Error(`catalog: the $997 bundle plan leaked into the coupon whitelist via "${p.slug}"`);
    }
    rows.push({
      slug: p.slug,
      brand: p.brand,
      icon: p.icon || '',
      price,
      planId,
      productId: (wl && wl.productId) || null,
      kind: DESKTOP_SLUGS.has(p.slug) ? 'desktop' : 'web',
      demo: DEMOS.has(p.slug),
    });
  }

  if (unresolved.length) {
    throw new Error(
      `catalog: ${unresolved.length} available app(s) have no Whop plan and are not declared in ` +
      `NO_WHOP_PLAN: ${unresolved.join(', ')}. Add the plan id, or declare why it has none.`);
  }
  if (rows.some(r => r.planId === BUNDLE_PLAN_ID)) throw new Error('catalog: bundle plan present after build');

  const dir = path.join(OUT, '_data');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'catalog.json'), JSON.stringify(rows, null, 1), 'utf8');

  /* Marketing copy for the email sequence. Separate file from catalog.json so
     the coupon path stays a small, auditable list of plan ids. Covers every
     LIVE app (not just the coupon-eligible ones) — a spotlight email only
     needs a product page to link to, not a Whop plan. */
  const emailRows = allProducts
    .filter(p => AVAILABLE_SLUGS.has(p.slug))
    .map(p => ({
      slug: p.slug,
      brand: p.brand,
      icon: p.icon || '',
      price: p.price,
      kind: DESKTOP_SLUGS.has(p.slug) ? 'desktop' : 'web',
      demo: DEMOS.has(p.slug),
      tagline: p.tagline || '',
      oneliner: p.oneliner || p.tagline || '',
      competitor: p.competitor || '',
      compPrice: p.compPrice || '',
      compYr: p.compYr || 0,
      payback: p.payback || '',
      features: (p.features || []).slice(0, 3).map(f => (Array.isArray(f) ? [f[1], f[2]] : [String(f), ''])),
    }));
  fs.writeFileSync(path.join(dir, 'email-catalog.json'), JSON.stringify(emailRows, null, 1), 'utf8');

  const yearly = emailRows.reduce((s, r) => s + (r.compYr || 0), 0);
  const once = emailRows.reduce((s, r) => s + r.price, 0);
  fs.writeFileSync(path.join(dir, 'email-totals.json'), JSON.stringify({
    liveCount: emailRows.length, onceTotal: once, competitorYearly: yearly,
    bundlePrice: BUNDLE.price, bundleValue, bundleSavings,
  }, null, 1), 'utf8');
  console.log(`email catalog: ${emailRows.length} live app(s) · $${once} once vs $${yearly}/yr rented`);

  const noPlan = Object.keys(NO_WHOP_PLAN).filter(s => AVAILABLE_SLUGS.has(s));
  console.log(`server catalog: ${rows.length} coupon-eligible app(s) -> public/_data/catalog.json` +
    ` · ${noPlan.length} live app(s) excluded (no Whop plan): ${noPlan.join(', ')}`);
}
