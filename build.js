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
const AVAILABLE_SLUGS = new Set(['bloomrecorder', 'wispertalk', 'linkleaf', 'captionly']);
const availableProducts = allProducts.filter(p => AVAILABLE_SLUGS.has(p.slug));
const upcomingProducts = allProducts.filter(p => !AVAILABLE_SLUGS.has(p.slug));

/* Desktop (Electron, no server) vs web-hosted (self-hosted on your own VPS) */
const DESKTOP_SLUGS = new Set([
  'pdfsmith', 'cutaway', 'whisperdesk', 'shrinkray', 'clipdeck', 'sigcraft', 'streakly', 'deepdesk',
  'quillpad', 'wrangle', 'reelsnag', 'voicebarn', 'textract', 'memeforge', 'orgtree', 'renewcheck',
  'paletteforge', 'iconforge', 'bloomrecorder', 'wispertalk',
  ...launched.filter(l => l.kind === 'desktop').map(l => l.slug),
  ...products51.filter(p => p.kind === 'desktop').map(p => p.slug),
]);
/* Products with a free in-browser demo at /<slug>/demo/ (src/<slug>-demo.html) */
const DEMOS = new Set(['iconforge', 'sigcraft', 'pdfsmith', 'wrangle', 'textract', 'memeforge', 'paletteforge', 'shrinkray', 'bloomrecorder', 'quillpad', 'captionly']);

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

const fmt = n => '$' + n.toLocaleString('en-US');
const art = name => (/^[aeiou]/i.test(name) ? 'an' : 'a');
function esc(s) { return String(s).replace(/&(?![a-z#0-9]+;)/g, '&amp;'); }
function attr(s) { return String(s).replace(/&(?![a-z#0-9]+;)/g, '&amp;').replace(/"/g, '&quot;'); }

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
const ytId = slug => ytVideos[slug] && ytVideos[slug].videoId;

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
      <a class="wordmark" href="/">OneTime<span class="tm">Suite</span></a>
      <input type="checkbox" id="navtoggle" class="nav-toggle" aria-hidden="true">
      <label for="navtoggle" class="hamburger" aria-label="Menu"><span></span><span></span><span></span></label>
      <div class="nav-links">
      <a class="nav-link" href="/#available">Available now</a>
      <a class="nav-link" href="/#coming-soon">Coming soon</a>
      <a class="nav-link" href="/${BUNDLE.slug}/">The bundle</a>
      <a class="nav-link" href="/comparison/">Comparisons</a>
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
          <a class="wordmark" href="/" style="margin:0 0 0.8rem;display:inline-block;">OneTime<span class="tm">Suite</span></a>
          <p class="blurb">${allProducts.length} apps that replace subscription SaaS. Pay once, own forever. Almost all of them are MIT source on GitHub — build them yourself if you'd rather.</p>
        </div>
        <div>
          <h4>Apps</h4>
          <a href="/#available">Available now (${availableProducts.length})</a>
          <a href="/#coming-soon">Coming soon (${allProducts.length - availableProducts.length + comingSoon.length})</a>
          <a href="/${BUNDLE.slug}/">${BUNDLE.name} — ${fmt(BUNDLE.price)}</a>
        </div>
        <div>
          <h4>Read</h4>
          <a href="/comparison/">All comparisons</a>
          <a href="/loom-alternative/">Loom alternative</a>
          <a href="/linktree-alternative/">Linktree alternative</a>
          <a href="/wispr-flow-alternative/">Wispr Flow alternative</a>
          <a href="/inkseal/compliance/">E-signature compliance</a>
        </div>
        <div>
          <h4>Get it</h4>
          <a href="${WHOP}" rel="noopener">Buy on Whop</a>
          <a href="https://dashboard.onetimesuite.com/" rel="noopener">Log in — your library</a>
          <a href="${GH}" rel="noopener">Source on GitHub</a>
        </div>
        <div>
          <h4>Legal</h4>
          <a href="/terms/">Terms of use</a>
          <a href="/privacy/">Privacy</a>
        </div>
      </div>
      <div class="bottom">
        <span>&copy; 2026 OneTimeSuite · by <a href="https://advancedmarketing.co" rel="noopener">Advanced Marketing</a></span>
        <span>Pay once. Own it forever.</span>
      </div>
    </div>
  </footer>`;

function page({ title, desc, canonical, ogType = 'website', jsonld = [], body }) {
  const ld = jsonld.map(o => `  <script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index, follow">
  <title>${esc(title)}</title>
  <meta name="description" content="${attr(desc)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:title" content="${attr(title)}">
  <meta property="og:description" content="${attr(desc)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="OneTimeSuite">
  <meta name="twitter:card" content="summary">
  <link rel="alternate" type="application/rss+xml" title="OneTimeSuite — Pay-Once vs Subscription" href="/rss.xml">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='22' fill='%23e8420c'/%3E%3Ctext x='50' y='68' font-size='52' font-family='monospace' font-weight='700' fill='white' text-anchor='middle'%3E%241%3C/text%3E%3C/svg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;800&family=Instrument+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/site.css?v=${CSS_V}">
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-QJ65NLXTY5"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-QJ65NLXTY5');</script>
${ld}
</head>
<body>
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

/* URL registry for sitemap + link check */
const urls = [];
function reg(relPath) { urls.push(relPath); }

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

  const soonCardsFor = list => list.map(p => `
        <div class="p-card soon" aria-label="${attr(p.brand)} — coming soon">
          <span class="tape" aria-hidden="true"><b>&#128679; Coming soon</b></span>
          <span class="ico" aria-hidden="true">${p.icon}</span>
          <h3>${esc(p.brand)}</h3>
          <p class="one">${esc(p.one)}</p>
          <div class="foot">
            <span class="sticker sm"><span class="amt">$${p.price}</span><span class="once">planned</span></span>
            <span class="replaces">will replace ${esc(p.vs)}<br>${esc(p.vsPrice)}</span>
          </div>
          ${p.repoLive ? '<p class="soon-note">code already live on GitHub — product page on the way</p>' : ''}
        </div>`).join('');

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
  const toSoon = p => ({ brand: p.brand, icon: p.icon, one: p.oneliner, price: p.price, vs: p.competitor, vsPrice: p.compPrice });
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
    title: `OneTimeSuite — ${allProducts.length + comingSoon.length}-App Pay-Once Catalog: ${availableProducts.length} Available Now, the Rest Coming Soon`,
    desc: `${availableProducts.length} pay-once apps available today (${availableProducts.map(p => p.brand).join(', ')}) and ${soonTotal} more coming — all replacing monthly SaaS bills: PDF tools, screen recording, dictation, analytics, invoicing, email campaigns, uptime monitoring and more. One-time prices from $15, or everything (including every future app) for ${fmt(BUNDLE.price)}.`,
    canonical: `${SITE}/`,
    jsonld: [{
      '@context': 'https://schema.org', '@type': 'ItemList',
      itemListElement: allProducts.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/${p.slug}/`, name: p.brand })),
    }],
    body,
  }));
  reg('/');
})();

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

    <section aria-label="Screenshot">
      <div class="wrap" style="max-width:920px;">
        ${shotFrame(p)}
        <p class="mono-note" style="margin-top:0.7rem;">${hasShot(p.slug) ? `${p.brand}, as it actually looks — a real screenshot, not a mockup.` : `${p.brand} screenshot is being captured — the app is shipped and real.`}</p>
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
    </section>` : hasClip(p.slug) ? `
    <section aria-label="Demo video">
      <div class="wrap" style="max-width:920px;">
        <video controls preload="metadata" width="1280" height="720" style="width:100%;border:1.5px solid var(--ink);border-radius:12px;background:#000;">
          <source src="/assets/clips/${p.slug}.mp4" type="video/mp4">
        </video>
        <p class="mono-note" style="margin-top:0.7rem;">${p.brand} in action — a real demo, not a mockup.</p>
      </div>
    </section>` : ''}

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
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: p.faq.map(q => ({ '@type': 'Question', name: q[0], acceptedAnswer: { '@type': 'Answer', text: q[1] } })),
      },
    ],
    body,
  }));
  reg(`/${p.slug}/`);
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
          <a class="btn btn-solid" href="${BUNDLE.checkoutUrl}" rel="noopener">Get the bundle on Whop — ${fmt(BUNDLE.price)} &rarr;</a>
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
          <a class="btn btn-solid" href="${BUNDLE.checkoutUrl}" rel="noopener">Get the bundle on Whop — ${fmt(BUNDLE.price)} &rarr;</a>
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
    }],
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
            <li>Something wrong with your purchase? Email <a href="mailto:ben@advancedmarketing.co">ben@advancedmarketing.co</a> and we'll sort out a fix or a refund.</li>
          </ul>
          <h2>The website</h2>
          <ul>
            <li>Content on onetimesuite.com (comparisons, pricing of competitors, feature claims) is provided in good faith and checked at the date shown on each page, but competitors change prices and plans — verify anything you're relying on.</li>
            <li>Nothing on this site is legal, financial or compliance advice. In particular, e-signature legal sufficiency depends on your jurisdiction and document type — see the <a href="/inkseal/compliance/">Inkseal compliance page</a> and consult a lawyer for regulated documents.</li>
          </ul>
          <h2>Liability</h2>
          <p>To the maximum extent permitted by law, our total liability for any claim connected to the site or the software is limited to the amount you paid us for the product concerned.</p>
          <h2>Contact</h2>
          <p>Questions about these terms: <a href="mailto:ben@advancedmarketing.co">ben@advancedmarketing.co</a>. OneTimeSuite is operated by <a href="https://advancedmarketing.co" rel="noopener">Advanced Marketing</a>.</p>`,
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
          <p>Privacy questions: <a href="mailto:ben@advancedmarketing.co">ben@advancedmarketing.co</a>.</p>`,
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
  const raw = fs.readFileSync(path.join(SEO_DIR, f), 'utf8');
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
    }],
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
  const title = `Looking for ${art(post.competitor)} ${post.competitor} Alternative? Meet ${p.brand} — Pay Once, Own It Forever (2026)`;
  const url = `${SITE}/comparison/${post.slug}/`;
  const related = posts.filter(x => x.product === post.product && x.slug !== post.slug);

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
    }],
    body,
  }));
  reg(`/comparison/${post.slug}/`);
});

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

fs.writeFileSync(path.join(OUT, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`, 'utf8');

fs.writeFileSync(path.join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(u => `  <url><loc>${SITE}${u}</loc></url>`).join('\n') +
  `\n</urlset>\n`, 'utf8');

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
if (fs.existsSync(CLIPS_SRC)) {
  const clipsOut = path.join(OUT, 'assets', 'clips');
  fs.mkdirSync(clipsOut, { recursive: true });
  for (const f of fs.readdirSync(CLIPS_SRC)) {
    if (/\.mp4$/i.test(f)) fs.copyFileSync(path.join(CLIPS_SRC, f), path.join(clipsOut, f));
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

console.log(`Done: 1 hub + ${allProducts.length} products + 1 bundle + 1 comparison hub + ${posts.length} generated posts + ${seoPosts.length} SEO posts + 404 = ${urls.length + 1} pages`);

/* v2 landing pages overlay (2026-07-16): prebuilt React+Framer Motion product
 * pages from site-v2/ (committed in v2-pages/) replace the generated product
 * pages. Node 22 fs.cpSync, no deps. Hub, comparison posts, sitemap untouched. */
{
  const V2 = path.join(__dirname, 'v2-pages');
  if (fs.existsSync(V2)) {
    let n = 0;
    for (const entry of fs.readdirSync(V2)) {
      if (entry === 'index.html' || entry === '404.html') continue; // never clobber the hub
      fs.cpSync(path.join(V2, entry), path.join(OUT, entry), { recursive: true, force: true });
      n++;
    }
    console.log(`v2 overlay: ${n} entries copied over public/`);
  }
}
