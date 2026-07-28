/*
 * submit-index.js — indexing helper for onetimesuite.com. Zero dependencies.
 *
 * What it does:
 *   1. IndexNow (Bing / Yandex / other participating engines): submits URLs
 *      to https://api.indexnow.org/indexnow.
 *   2. Google: prints the honest truth. There is NO general auto-submit API —
 *      see the note printed at the end of every run.
 *
 * Usage:
 *   node scripts/submit-index.js /vs/loom-vs-bloomrecorder/ /apps/bloomrecorder/
 *   node scripts/submit-index.js --since 7      # submit all sitemap URLs (see caveat below)
 *   node scripts/submit-index.js --help
 *
 * Setup (one time):
 *   1. Generate a key:  node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
 *   2. Host it: put the key (and nothing else) in public/<key>.txt so it is
 *      served at https://onetimesuite.com/<key>.txt, and rebuild/deploy.
 *   3. Set the env var before running:  INDEXNOW_KEY=<key> node scripts/submit-index.js ...
 *
 * URL sources:
 *   - Paths passed on the CLI (normalized to https://onetimesuite.com<path>).
 *   - With --since <days>: every URL from public/sitemap-pages.xml,
 *     sitemap-apps.xml, sitemap-blog.xml and sitemap-vs.xml (parsed with a
 *     regex — no XML lib). CAVEAT: our sitemaps carry no <lastmod>, so
 *     --since CANNOT filter by date — it submits ALL sitemap URLs. IndexNow
 *     dedupes on its side; submitting already-indexed URLs is harmless.
 *   Without --since, only the paths listed on the CLI are submitted.
 *
 * Exit code: 0 on success or when setup is missing (instructions printed);
 * 1 on invalid args or when there is nothing to submit.
 */
const fs = require('fs');
const path = require('path');

const PUB = path.join(__dirname, '..', 'public');
const SITEMAPS = ['sitemap-pages.xml', 'sitemap-apps.xml', 'sitemap-blog.xml', 'sitemap-vs.xml'];
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const FALLBACK_SITE = 'https://onetimesuite.com';
const BATCH_SIZE = 10000; // IndexNow per-request limit

const HELP = `submit-index.js — indexing helper for onetimesuite.com

Usage:
  node scripts/submit-index.js <path> [<path> ...]   submit these paths via IndexNow
  node scripts/submit-index.js --since <days>        submit ALL sitemap URLs
                                                     (sitemaps have no <lastmod>,
                                                     so date filtering is impossible)
  node scripts/submit-index.js --help                show this text

Requires INDEXNOW_KEY in the environment. Run without it to see setup steps.`;

const GOOGLE_NOTE = `
--- Google (no auto-submit — this is the honest truth) ---
Google has no general "please index this" API for normal pages:
  - The sitemap index is already linked in robots.txt, and Google Search
    Console auto-discovers and crawls it. That is the standard channel.
  - For instant indexing of a specific URL, use GSC > URL Inspection >
    "Request Indexing" — manually, per URL.
  - The Google Indexing API only officially supports JobPosting and livestream
    (BroadcastEvent) content — neither applies to this site.
Do not trust tools that claim to auto-submit pages to Google.`;

function printSetupInstructions() {
  console.log(`INDEXNOW_KEY is not set — IndexNow is not configured yet.

One-time setup:
  1. Generate a key:
       node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
  2. Host the key file: create public/<key>.txt containing ONLY the key
     (no newline needed), so it deploys to https://onetimesuite.com/<key>.txt
       node -e "require('fs').writeFileSync('public/<key>.txt','<key>')"
       node build.js   # then deploy public/
  3. Export the env var and re-run:
       INDEXNOW_KEY=<key> node scripts/submit-index.js /some-new-page/
  (On Windows cmd.exe use: set INDEXNOW_KEY=<key> — in PowerShell: $env:INDEXNOW_KEY='<key>')
`);
  console.log(GOOGLE_NOTE);
}

/* ---------- args ---------- */
function parseArgs(argv) {
  const opts = { since: null, paths: [], help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') opts.help = true;
    else if (a === '--since') {
      const n = Number(argv[++i]);
      if (!Number.isFinite(n) || n <= 0) return null;
      opts.since = n;
    } else if (a.startsWith('--')) return null;
    else opts.paths.push(a);
  }
  return opts;
}

/* ---------- URL collection ---------- */
function siteFromSitemaps() {
  for (const f of SITEMAPS) {
    const p = path.join(PUB, f);
    if (!fs.existsSync(p)) continue;
    const m = /<loc>(https?:\/\/[^/<]+)\//.exec(fs.readFileSync(p, 'utf8'));
    if (m) return m[1];
  }
  return FALLBACK_SITE;
}

function urlsFromSitemaps() {
  const urls = new Set();
  for (const f of SITEMAPS) {
    const p = path.join(PUB, f);
    if (!fs.existsSync(p)) {
      console.log(`note: ${f} not found in public/ — skipping`);
      continue;
    }
    const xml = fs.readFileSync(p, 'utf8');
    for (const m of xml.matchAll(/<loc>\s*(https?:\/\/[^<\s]+)\s*<\/loc>/g)) urls.add(m[1]);
  }
  return [...urls].sort();
}

function normalizePath(site, p) {
  let clean = String(p).trim();
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
  if (!clean.startsWith('/')) clean = '/' + clean;
  if (!clean.endsWith('/') && !/\.[a-z0-9]+$/i.test(clean)) clean += '/';
  return site + clean;
}

/* ---------- IndexNow submit ---------- */
async function submitBatch(key, host, keyLocation, urlList) {
  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key, keyLocation, urlList }),
  });
  return res.status;
}

const STATUS_MEANING = {
  200: 'OK — URLs accepted',
  202: 'Accepted — key validation pending',
  400: 'Bad request (check payload)',
  403: 'Forbidden (key not valid for host)',
  422: 'Unprocessable (URLs do not match host)',
  429: 'Too many requests — slow down',
};

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts) {
    console.error('invalid args — see --help');
    process.exit(1);
  }
  if (opts.help) {
    console.log(HELP);
    process.exit(0);
  }

  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    printSetupInstructions();
    process.exit(0);
  }

  const site = siteFromSitemaps();
  const host = new URL(site).host;
  const urls = new Set(opts.paths.map(p => normalizePath(site, p)));

  if (opts.since != null) {
    console.log(`--since ${opts.since}: sitemaps carry no <lastmod>, so date filtering is`);
    console.log('impossible — submitting ALL URLs from the sitemaps instead.');
    for (const u of urlsFromSitemaps()) urls.add(u);
  }

  if (urls.size === 0) {
    console.error('nothing to submit. Pass page paths on the CLI, e.g.:');
    console.error('  node scripts/submit-index.js /vs/loom-vs-bloomrecorder/');
    console.error('or use --since <days> to submit all sitemap URLs.');
    process.exit(1);
  }

  const urlList = [...urls].sort();
  console.log(`submitting ${urlList.length} URL(s) to IndexNow (host: ${host})`);

  let failed = false;
  for (let i = 0; i < urlList.length; i += BATCH_SIZE) {
    const batch = urlList.slice(i, i + BATCH_SIZE);
    try {
      const status = await submitBatch(key, host, `${site}/${key}.txt`, batch);
      const meaning = STATUS_MEANING[status] || 'unexpected status';
      console.log(`batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} URLs): HTTP ${status} — ${meaning}`);
      if (status >= 400) failed = true;
    } catch (err) {
      console.log(`batch ${Math.floor(i / BATCH_SIZE) + 1}: request failed — ${err && err.message || err}`);
      failed = true;
    }
  }

  console.log(GOOGLE_NOTE);
  process.exit(failed ? 1 : 0);
}

main().catch(err => {
  console.error('fatal:', err && err.message || err);
  process.exit(1);
});
