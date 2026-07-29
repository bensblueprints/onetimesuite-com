/* seo-matrix.js — the factory data backbone for the programmatic SEO sections.
 *
 * `competitors` is BUILT PROGRAMMATICALLY from the product catalog (dedupe +
 * split + enrich), so it stays in sync when products are added. The rest
 * (personas, platforms, problems, categories, graveyard, personaCategoryFit)
 * is curated editorial data — keep app slugs pointing at real catalog slugs.
 *
 * Consumed by build.js's section auto-loader as ctx.matrix.
 */
const fs = require('fs');
const path = require('path');

const products = require('./products.js');
const products51 = require('./products-51-100.js');
const extras = require('./extra-products.js');

/* Mirror build.js's merge: base + 51–100 wave + auto-promoted src/launched/*.json
 * + shipped extras (BloomRecorder, WisperTalk, ...). */
const all = [...products, ...products51];
const seen = new Set(all.map(p => p.slug));
const LAUNCHED_DIR = path.join(__dirname, 'launched');
if (fs.existsSync(LAUNCHED_DIR)) {
  for (const f of fs.readdirSync(LAUNCHED_DIR).filter(f => f.endsWith('.json'))) {
    const l = JSON.parse(fs.readFileSync(path.join(LAUNCHED_DIR, f), 'utf8'));
    if (l && l.slug && !seen.has(l.slug)) { all.push(l); seen.add(l.slug); }
  }
}
for (const e of extras) if (!seen.has(e.slug)) { all.push(e); seen.add(e.slug); }

/* ---------- categories (curated) ---------- */
const categories = [
  {
    slug: 'video-audio', name: 'Video & Audio',
    desc: 'Record, caption, transcribe and ship video and audio without a monthly bill — screen recorders, caption generators, transcription and podcast hosting you pay for once.',
    appSlugs: ['bloomrecorder', 'bloommeeting', 'bloomclipper', 'captionly', 'clip-pipeline', 'wispertalk', 'whisperdesk', 'voicebarn', 'castport', 'reelsnag'],
  },
  {
    slug: 'business-ops', name: 'Business Operations',
    desc: 'Helpdesks, scheduling, forms, HR and client management — the back-office SaaS stack, replaced with pay-once tools you host yourself.',
    appSlugs: ['deskly', 'bookslot', 'boardly', 'chatlet', 'docwell', 'formforge', 'orgtree', 'hirestack', 'clientdesk', 'sigcraft', 'shiftly', 'roster'],
  },
  {
    slug: 'marketing-seo', name: 'Marketing & SEO',
    desc: 'Social scheduling, link tools, QR codes, analytics and rank tracking — the marketer\'s subscription pile, swapped for one-time alternatives.',
    appSlugs: ['postdock', 'linkleaf', 'scantrail', 'cardsmith', 'statfox', 'serpdeck', 'postbird', 'utmcraft', 'reflink', 'starstack', 'citewatch', 'trimly', 'hawkwatch', 'bravowall'],
  },
  {
    slug: 'developer-tools', name: 'Developer Tools',
    desc: 'API docs, webhooks, cron monitoring, secrets and backup tooling — pay-once and self-hosted utilities for people who ship software.',
    appSlugs: ['wrangle', 'hookscope', 'snapfleet', 'pingcron', 'vaultkeeper', 'keymaster', 'docsmithapi', 'snipvault', 'logbin', 'certwatch', 'secretbox', 'maptrail', 'linkguard', 'queuecraft'],
  },
  {
    slug: 'productivity', name: 'Productivity',
    desc: 'Notes, habits, focus, reading and personal admin — calm desktop apps that keep working even if you never open your wallet again.',
    appSlugs: ['quillpad', 'streakly', 'deepdesk', 'feedloft', 'inkpress', 'renewcheck', 'snapreceipt', 'ledgerlitehome', 'lessonforge', 'quizcraft', 'timevault'],
  },
  {
    slug: 'design-graphics', name: 'Design & Graphics',
    desc: 'Background removal, image compression, icons, palettes, mockups and decks — creative tools with no credits and no cloud lock-in.',
    appSlugs: ['cutaway', 'shrinkray', 'iconforge', 'paletteforge', 'memeforge', 'mockcraft', 'postcraft', 'slidecraft', 'resumecraft', 'pitchcraft'],
  },
  {
    slug: 'finance-admin', name: 'Finance & Admin',
    desc: 'Invoicing, quotes, contracts, e-signatures and expense tracking — the paperwork layer of a business, owned outright.',
    appSlugs: ['billcraft', 'viral-invoice', 'ledgerly', 'quotewell', 'contractly', 'inkseal', 'billoop', 'textract'],
  },
  {
    slug: 'security-backup', name: 'Security & Backup',
    desc: 'Passwords, secrets, certificates, uptime and backups — infrastructure you control instead of renting by the seat.',
    appSlugs: ['vaultly', 'keyloop', 'secretbox', 'certwatch', 'syncvault', 'upwatch', 'upkeepstatus', 'logbin'],
  },
];

const categoryByApp = {};
for (const c of categories) for (const s of c.appSlugs) if (!(s in categoryByApp)) categoryByApp[s] = c.slug;

/* ---------- competitors (programmatic) ---------- */
const slugify = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '');
/* Hand-tuned slugs where the raw competitor label is a description, not a brand. */
const SLUG_ALIASES = {
  'sslmate-style-ssl-monitors': 'sslmate',
  'downloader-subscription-sites': 'download-sites',
};

/* Parse a monthly USD price out of compPrice strings like '$12–15/mo',
 * '$7.99/user/mo', 'from $99/mo'. Returns null for yearly/per-ticket/vague
 * prices ('£199/yr', '2.7% + $0.79/ticket', '$100s/mo'). */
function parsePriceMo(compPrice) {
  const m = /\$(\d+(?:\.\d+)?)(?:\s*[–—-]\s*\$?\d+(?:\.\d+)?)?\s*\/(?:[a-z]+\/)*mo/i.exec(String(compPrice || ''));
  return m ? Number(m[1]) : null;
}

/* Build the competitor index: split 'A / B' labels into separate entries,
 * dedupe repeats (e.g. Hotjar, Typeform) merging their apps lists. */
const compMap = new Map(); // slug -> { slug, name, category, priceMo, priceYr, apps }
for (const p of all) {
  if (!p.competitor) continue;
  for (const name of String(p.competitor).split(/\s+\/\s+/).map(s => s.trim()).filter(Boolean)) {
    const slug = SLUG_ALIASES[slugify(name)] || slugify(name);
    let c = compMap.get(slug);
    if (!c) {
      c = { slug, name, category: categoryByApp[p.slug] || 'other', priceMo: null, priceYr: null, apps: [] };
      compMap.set(slug, c);
    }
    if (c.priceMo == null) c.priceMo = parsePriceMo(p.compPrice);
    if (c.priceYr == null && typeof p.compYr === 'number') c.priceYr = p.compYr;
    if (!c.apps.includes(p.slug)) c.apps.push(p.slug);
  }
}
const competitors = [...compMap.values()].sort((a, b) => a.name.localeCompare(b.name));

/* ---------- personas (curated) ---------- */
const personas = [
  {
    slug: 'creators', name: 'Content Creators',
    blurb: 'Creators bleed money on per-month editing, caption and thumbnail tools that charge more the more they publish. Pay-once apps let them produce unlimited content without a meter running.',
  },
  {
    slug: 'youtubers', name: 'YouTubers',
    blurb: 'YouTubers pay monthly for screen recording, captions, clipping and scheduling before the channel earns a cent. One-time tools fix the cost of production at the price of a single video\'s ad revenue.',
  },
  {
    slug: 'coaches', name: 'Coaches & Course Creators',
    blurb: 'Coaches juggle booking links, course platforms, community tools and invoicing — easily $200+/mo before their first client. Pay-once software turns that stack into a fixed, owned asset.',
  },
  {
    slug: 'agencies', name: 'Agencies',
    blurb: 'Agencies pay per-seat and per-client fees that scale with their success. Self-hosted, pay-once tools replace per-seat pricing with a flat cost that margins actually survive.',
  },
  {
    slug: 'freelancers', name: 'Freelancers',
    blurb: 'Freelancers expense a dozen subscriptions — proposals, contracts, invoices, time tracking — against irregular income. Owning the tools outright removes a whole line of fixed costs.',
  },
  {
    slug: 'developers', name: 'Developers',
    blurb: 'Developers rent API docs, monitoring, secrets and webhook plumbing by the month for side projects that earn nothing yet. Self-hosted pay-once utilities cost less than one month of the SaaS they replace.',
  },
  {
    slug: 'podcasters', name: 'Podcasters',
    blurb: 'Podcasters pay monthly for hosting, transcription and audiograms forever, even for a back catalog that no longer grows. Pay-once audio tools cap the cost of a show at a single payment.',
  },
  {
    slug: 'small-business-owners', name: 'Small Business Owners',
    blurb: 'Small businesses get nickel-and-dimed by per-user pricing on helpdesks, forms, signatures and scheduling. One-time software makes the toolset a capital expense instead of a creeping payroll line.',
  },
];

/* ---------- platforms (curated) ----------
 * `kinds` filters which products get a platform page: a section should only
 * emit /<app>/on/<platform>/ when the product's `kind` is in `kinds`.
 * Products with no `kind` field are treated as available on ALL platforms. */
const platforms = [
  {
    slug: 'mac', name: 'Mac', kinds: ['desktop'],
    blurb: 'Native desktop builds for macOS — install once, run offline, no browser tab or subscription required.',
  },
  {
    slug: 'windows', name: 'Windows', kinds: ['desktop'],
    blurb: 'Signed Windows installers with one-click setup — the full app runs locally on your PC, no account needed.',
  },
  {
    slug: 'linux', name: 'Linux', kinds: ['desktop'],
    blurb: 'Build from the open source or run the desktop build on Linux — same pay-once license, no telemetry.',
  },
  {
    slug: 'web-browser', name: 'Web Browser', kinds: ['web', 'desktop'],
    blurb: 'Runs in any modern browser — nothing to install, works the same on any machine you log in from.',
  },
  {
    slug: 'self-hosted-vps', name: 'Self-Hosted VPS', kinds: ['web'],
    blurb: 'Host it on your own $5 VPS — your data, your domain, your rules, with no per-seat pricing ever.',
  },
  {
    slug: 'docker', name: 'Docker', kinds: ['web'],
    blurb: 'Ship as a container you can docker-compose up anywhere — reproducible deploys with zero vendor lock-in.',
  },
];

/* ---------- problems: 24 jobs-to-be-done (curated) ---------- */
const problems = [
  {
    slug: 'record-screen-for-clients', title: 'record-screen-for-clients',
    h1: 'Record your screen for clients without a subscription',
    intro: 'Client walkthroughs, bug reports and async updates all need fast screen recordings — but the popular recorders charge per user, per month, forever. These pay-once tools record, caption and package video updates for a single flat price.',
    appSlugs: ['bloomrecorder', 'captionly', 'clip-pipeline'],
  },
  {
    slug: 'caption-videos-automatically', title: 'caption-videos-automatically',
    h1: 'Caption videos automatically without a monthly plan',
    intro: 'Captions drive watch time, but auto-caption apps bill monthly and cap your minutes. These tools transcribe and burn in captions locally or on your own server, with no minute limits and no renewal.',
    appSlugs: ['captionly', 'clip-pipeline', 'bloomrecorder'],
  },
  {
    slug: 'transcribe-audio-to-text', title: 'transcribe-audio-to-text',
    h1: 'Transcribe audio to text on your own machine',
    intro: 'Meetings, interviews and voice notes pile up, and cloud transcription charges per minute while uploading everything. These pay-once apps transcribe locally, so sensitive audio never leaves your device.',
    appSlugs: ['whisperdesk', 'wispertalk'],
  },
  {
    slug: 'download-social-media-clips', title: 'download-social-media-clips',
    h1: 'Download social media clips without a downloader subscription',
    intro: 'Saving your own reels, shorts and TikToks for repurposing shouldn\'t cost $15 a month on a sketchy downloader site. These tools grab and repurpose clips for a one-time price.',
    appSlugs: ['reelsnag', 'clip-pipeline'],
  },
  {
    slug: 'remove-image-backgrounds', title: 'remove-image-backgrounds',
    h1: 'Remove image backgrounds without credits or uploads',
    intro: 'Product shots and portraits need clean cutouts, but the leading background remover charges per image and uploads every photo. These apps run the same class of AI locally — unlimited images, full resolution, one payment.',
    appSlugs: ['cutaway', 'postcraft'],
  },
  {
    slug: 'compress-photos-without-quality-loss', title: 'compress-photos-without-quality-loss',
    h1: 'Compress photos without a per-image subscription',
    intro: 'Site speed and email limits demand smaller images, but online compressors cap batches and watermark free tiers. These desktop tools crush file sizes locally, in unlimited batches.',
    appSlugs: ['shrinkray', 'cutaway'],
  },
  {
    slug: 'edit-pdfs-offline', title: 'edit-pdfs-offline',
    h1: 'Edit PDFs offline without uploading your documents',
    intro: 'Merging, splitting and signing PDFs online means uploading contracts to someone else\'s server and paying monthly for the privilege. These tools do the same jobs entirely on your machine.',
    appSlugs: ['pdfsmith', 'textract'],
  },
  {
    slug: 'schedule-meetings-without-back-and-forth', title: 'schedule-meetings-without-back-and-forth',
    h1: 'Schedule meetings without the back-and-forth — or the per-seat fee',
    intro: 'Booking links kill scheduling ping-pong, but the big schedulers charge per user every month. These pay-once tools give you booking pages and intake forms you own.',
    appSlugs: ['bookslot', 'formforge'],
  },
  {
    slug: 'build-forms-and-surveys', title: 'build-forms-and-surveys',
    h1: 'Build forms and surveys you actually own',
    intro: 'Form builders gate response counts and branding behind ever-pricier tiers. These self-hosted alternatives collect unlimited responses for a single payment.',
    appSlugs: ['formforge', 'quizcraft', 'hearback', 'pulsecheck'],
  },
  {
    slug: 'send-invoices-and-get-paid', title: 'send-invoices-and-get-paid',
    h1: 'Send invoices and get paid without monthly accounting software',
    intro: 'Invoicing tools charge monthly whether you bill one client or fifty. These apps generate professional invoices, quotes and payment reminders for one flat price.',
    appSlugs: ['billcraft', 'viral-invoice', 'quotewell', 'billoop'],
  },
  {
    slug: 'manage-clients-and-leads', title: 'manage-clients-and-leads',
    h1: 'Manage clients and leads without a per-seat CRM',
    intro: 'CRMs and client portals price by the seat, so growth literally costs you money. These pay-once tools track clients, jobs and field teams for a flat fee.',
    appSlugs: ['clientdesk', 'doortracker', 'deskly', 'bookslot'],
  },
  {
    slug: 'schedule-social-media-posts', title: 'schedule-social-media-posts',
    h1: 'Schedule social media posts without per-channel pricing',
    intro: 'Social schedulers charge per channel per month, which adds up fast across clients. These tools schedule and package your social content for a one-time cost.',
    appSlugs: ['postdock', 'linkleaf', 'cardsmith'],
  },
  {
    slug: 'monitor-website-uptime', title: 'monitor-website-uptime',
    h1: 'Monitor website uptime without renting a monitoring seat',
    intro: 'Uptime monitoring is a cron job and an HTTP request — yet the incumbents bill monthly per monitor. These self-hosted tools watch your sites, certs and cron jobs for a single payment.',
    appSlugs: ['upwatch', 'pingcron', 'certwatch', 'upkeepstatus'],
  },
  {
    slug: 'host-a-public-status-page', title: 'host-a-public-status-page',
    h1: 'Host a public status page without the monthly bill',
    intro: 'A status page builds trust during incidents, but hosted status pages start around $29 a month for a basically static site. These tools let you publish one you own.',
    appSlugs: ['upkeepstatus', 'upwatch'],
  },
  {
    slug: 'create-short-links', title: 'create-short-links',
    h1: 'Create short links on your own domain',
    intro: 'Link shorteners hold your redirect history hostage behind monthly plans. These pay-once tools run short links and UTM campaigns from infrastructure you control.',
    appSlugs: ['trimly', 'redirectly', 'utmcraft'],
  },
  {
    slug: 'build-a-link-in-bio-page', title: 'build-a-link-in-bio-page',
    h1: 'Build a link-in-bio page without a monthly plan',
    intro: 'Link-in-bio tools charge monthly to host what is essentially one page of links. These apps give you the same page — branded, trackable — for a one-time price.',
    appSlugs: ['linkleaf', 'trimly', 'scantrail'],
  },
  {
    slug: 'generate-qr-codes', title: 'generate-qr-codes',
    h1: 'Generate QR codes that don\'t expire behind a paywall',
    intro: 'QR generators famously let codes "expire" unless you keep paying. These tools create permanent, trackable QR codes you own outright.',
    appSlugs: ['scantrail', 'menuly'],
  },
  {
    slug: 'design-email-signatures', title: 'design-email-signatures',
    h1: 'Design email signatures without per-user pricing',
    intro: 'Signature managers bill per user per month for a snippet of HTML. These tools generate polished, on-brand signatures and email assets for a single payment.',
    appSlugs: ['sigcraft', 'postbird'],
  },
  {
    slug: 'write-a-knowledge-base', title: 'write-a-knowledge-base',
    h1: 'Write a knowledge base without docs-platform pricing',
    intro: 'Hosted docs platforms charge per seat and per month for what is your own content. These pay-once tools publish docs, wikis and help centers you host yourself.',
    appSlugs: ['docwell', 'docsmithapi', 'deskly', 'inkpress'],
  },
  {
    slug: 'add-live-chat-to-your-site', title: 'add-live-chat-to-your-site',
    h1: 'Add live chat to your site without per-agent pricing',
    intro: 'Live chat is table stakes for support, but the incumbents charge per agent forever. These self-hosted tools put chat and comments on your site for a one-time cost.',
    appSlugs: ['chatlet', 'chatterbox', 'deskly'],
  },
  {
    slug: 'run-a-kanban-board', title: 'run-a-kanban-board',
    h1: 'Run a kanban board without paying per seat',
    intro: 'Project boards are lists and cards — yet the big tools charge per user every month. These pay-once apps give your team boards and time tracking with no seat fees.',
    appSlugs: ['boardly', 'timevault'],
  },
  {
    slug: 'track-time-and-bill-hours', title: 'track-time-and-bill-hours',
    h1: 'Track time and bill hours without a timesheet subscription',
    intro: 'Time trackers charge monthly per person, then hold your history in their cloud. These tools log hours locally and turn them straight into invoices.',
    appSlugs: ['timevault', 'punchcard', 'billcraft'],
  },
  {
    slug: 'build-habits-and-stay-focused', title: 'build-habits-and-stay-focused',
    h1: 'Build habits and stay focused without renting a routine',
    intro: 'Habit and focus apps charge monthly for streak counters and website blockers. These pay-once desktop tools keep your routines — and your data — on your own machine.',
    appSlugs: ['streakly', 'deepdesk', 'feedloft'],
  },
  {
    slug: 'keep-a-private-notes-system', title: 'keep-a-private-notes-system',
    h1: 'Keep a private notes system without sync fees',
    intro: 'Note apps lock sync and export behind subscriptions, holding your own writing hostage. These pay-once tools store notes and snippets as local files you can back up anywhere.',
    appSlugs: ['quillpad', 'snipvault', 'docwell'],
  },
];

/* ---------- graveyard: tools that moved from one-time/free to subscription ----------
 * FACT CHECK RULE: state pricing-model facts only — dates, prices, plan names.
 * No speculation about motives, no disparagement. Neutral tone. */
const graveyard = [
  {
    slug: 'adobe-creative-suite', name: 'Adobe Creative Suite',
    was: 'Perpetual license (CS6 Master Collection, ~$2,599)', now: '$55–90/mo Creative Cloud subscription', year: 2013,
    story: 'In May 2013 Adobe announced it would stop selling perpetual licenses for its creative tools and move to Creative Cloud subscriptions. CS6 remained the last version available as a one-time purchase. Creative Cloud plans now run roughly $55–90 per month depending on the tier.',
    alternativeSlugs: ['postcraft', 'slidecraft', 'cutaway', 'iconforge'],
  },
  {
    slug: 'sketch', name: 'Sketch',
    was: 'Perpetual license with free updates', now: 'License renewal required to keep receiving updates', year: 2020,
    story: 'Sketch was the poster child of pay-once Mac software: buy a license, get updates. In 2020 it moved to a model where the license includes one year of updates, and renewing is required to keep receiving new versions — a subscription in all but name.',
    alternativeSlugs: ['iconforge', 'paletteforge', 'mockcraft'],
  },
  {
    slug: 'notion-ai', name: 'Notion AI',
    was: 'Free core app; AI launched as an optional add-on', now: '$10/seat/mo AI add-on, later bundled into pricier plans', year: 2023,
    story: 'Notion\'s core app has a free tier, but when Notion AI launched in 2023 it was priced as a per-seat monthly add-on (around $8–10 per member). Notion later bundled AI into its higher-priced plans, raising the effective price for teams that wanted it.',
    alternativeSlugs: ['quillpad', 'snipvault', 'docwell'],
  },
  {
    slug: 'loom', name: 'Loom',
    was: 'Free tier plus affordable Pro', now: 'Acquired by Atlassian; free Starter plan capped at 25 five-minute videos', year: 2023,
    story: 'Loom popularized instant screen recording with a generous free tier. Atlassian acquired Loom in 2023; the free Starter plan remains capped at 25 videos per person and five minutes per video, with paid plans starting around $12.50 per user per month billed yearly.',
    alternativeSlugs: ['bloomrecorder', 'captionly', 'clip-pipeline'],
  },
  {
    slug: 'ulysses', name: 'Ulysses',
    was: 'One-time purchase (~$44.99 for the Mac app)', now: '$5.99/mo subscription', year: 2017,
    story: 'Ulysses, the much-loved Markdown writing app, switched from a one-time purchase to a subscription in August 2017. The move was one of the earliest high-profile examples of a paid-once Mac app going subscription-only.',
    alternativeSlugs: ['quillpad', 'inkpress'],
  },
  {
    slug: '1password', name: '1Password',
    was: 'Standalone one-time licenses sold alongside the subscription', now: 'Subscription-only ($2.99+/mo)', year: 2021,
    story: '1Password long offered a standalone license you bought once. With 1Password 8 in 2021–2022, AgileBits dropped standalone licenses entirely, making a membership subscription the only way to use the current app.',
    alternativeSlugs: ['keyloop', 'vaultly'],
  },
  {
    slug: 'parallels', name: 'Parallels Desktop',
    was: 'One-time purchase with paid major upgrades', now: 'Subscription-first ($99.99/yr Standard)', year: 2018,
    story: 'Parallels Desktop was traditionally sold as a one-time purchase with paid upgrades between major versions. The company shifted to a subscription-first model, with the Standard edition listed at $99.99 per year, and new macOS compatibility tied to staying current.',
    alternativeSlugs: ['wrangle', 'maptrail', 'keyloop'],
  },
  {
    slug: 'postman', name: 'Postman',
    was: 'Free desktop API client', now: 'Free tier limited to 3 users; paid plans $12+/user/mo', year: 2021,
    story: 'Postman started as a free, local-first API client. Over 2021–2023 it moved to a cloud-account-required model with collaboration features priced per user — paid plans start around $12–14 per user per month, and the free tier is capped at three users.',
    alternativeSlugs: ['hookscope', 'docsmithapi', 'wrangle'],
  },
];

/* ---------- persona → category fit ---------- */
const personaCategoryFit = {
  'creators': ['video-audio', 'design-graphics', 'marketing-seo'],
  'youtubers': ['video-audio', 'marketing-seo', 'design-graphics'],
  'coaches': ['business-ops', 'video-audio', 'marketing-seo'],
  'agencies': ['marketing-seo', 'business-ops', 'design-graphics', 'developer-tools'],
  'freelancers': ['business-ops', 'finance-admin', 'productivity', 'design-graphics'],
  'developers': ['developer-tools', 'security-backup', 'productivity'],
  'podcasters': ['video-audio', 'marketing-seo', 'productivity'],
  'small-business-owners': ['business-ops', 'finance-admin', 'marketing-seo', 'security-backup'],
};

module.exports = {
  competitors,
  personas,
  platforms,
  problems,
  categories,
  graveyard,
  personaCategoryFit,
};
