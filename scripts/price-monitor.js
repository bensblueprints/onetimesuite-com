/*
 * price-monitor.js — competitor pricing-page change detector. Zero dependencies.
 *
 * Usage:
 *   node scripts/price-monitor.js             # compare against snapshot, print report
 *   node scripts/price-monitor.js --update    # report, then write the fresh snapshot
 *   node scripts/price-monitor.js --json      # machine-readable report to stdout
 *   node scripts/price-monitor.js --help      # this text
 *
 * First run (no scripts/price-snapshots.json yet) records a baseline
 * automatically and writes the snapshot.
 *
 * Suggested weekly cron (runs the report; add --update to roll the baseline):
 *   0 9 * * 1  cd /path/to/onetimesuite-com && node scripts/price-monitor.js --update
 *
 * HONEST-USE RULE: a CHANGED result only means the page's text differs since
 * the last snapshot — pricing pages A/B test, localize, and shuffle copy all
 * the time. Before publishing ANY content about a competitor price change,
 * open the real page in a browser and verify the new price by hand. Never
 * publish "X raised prices" based on this script's output alone.
 *
 * Exit code is 0 unless the CLI args are invalid; per-URL network errors are
 * reported as ERROR rows, never fatal.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const WATCH_FILE = path.join(__dirname, 'price-watch.json');
const SNAP_FILE = path.join(__dirname, 'price-snapshots.json');
const TIMEOUT_MS = 15000;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const HELP = `price-monitor.js — competitor pricing-page change detector

Usage:
  node scripts/price-monitor.js             compare against snapshot, print report
  node scripts/price-monitor.js --update    report, then write the fresh snapshot
  node scripts/price-monitor.js --json      machine-readable report to stdout
  node scripts/price-monitor.js --help      show this text

First run (no snapshot file) records a baseline and writes the snapshot.
Exit code is 0 unless args are invalid; network errors are reported per-URL.

Reminder: verify any detected change manually on the real page before
publishing content about it.`;

/* ---------- args ---------- */
function parseArgs(argv) {
  const opts = { update: false, json: false, help: false };
  for (const a of argv) {
    if (a === '--update') opts.update = true;
    else if (a === '--json') opts.json = true;
    else if (a === '--help' || a === '-h') opts.help = true;
    else return null;
  }
  return opts;
}

/* ---------- page -> normalized text + dollar amounts ---------- */
function normalizeHtml(html) {
  let t = html
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ');
  t = t
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#36;|&dollar;/gi, '$')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
  return t.replace(/\s+/g, ' ').trim();
}

/* Unique sorted numeric dollar amounts, e.g. '$12.50' -> 12.5 */
function extractDollarAmounts(text) {
  const amounts = new Set();
  for (const m of text.matchAll(/\$\s?(\d[\d,]*(?:\.\d{1,2})?)/g)) {
    const n = Number(m[1].replace(/,/g, ''));
    if (Number.isFinite(n)) amounts.add(n);
  }
  return [...amounts].sort((a, b) => a - b);
}

function hash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/* ---------- fetch one watch entry ---------- */
async function fetchEntry(entry) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(entry.url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const text = normalizeHtml(html);
    return {
      entry,
      ok: true,
      snapshot: {
        hash: hash(text),
        dollarAmounts: extractDollarAmounts(text),
        fetchedAt: new Date().toISOString(),
        status: res.status,
      },
    };
  } catch (err) {
    const msg = err && err.name === 'AbortError' ? `timeout after ${TIMEOUT_MS / 1000}s` : String(err && err.message || err);
    return { entry, ok: false, error: msg };
  } finally {
    clearTimeout(timer);
  }
}

/* ---------- diff helpers ---------- */
function diffAmounts(oldList, newList) {
  const oldSet = new Set(oldList || []);
  const newSet = new Set(newList || []);
  return {
    added: [...newSet].filter(n => !oldSet.has(n)).sort((a, b) => a - b),
    removed: [...oldSet].filter(n => !newSet.has(n)).sort((a, b) => a - b),
  };
}

const fmtAmounts = list => (list && list.length ? list.map(n => '$' + n).join(', ') : '(none)');

/* ---------- main ---------- */
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

  const watch = JSON.parse(fs.readFileSync(WATCH_FILE, 'utf8'));
  const hadSnapshot = fs.existsSync(SNAP_FILE);
  const prev = hadSnapshot ? JSON.parse(fs.readFileSync(SNAP_FILE, 'utf8')) : {};

  const results = await Promise.all(watch.map(fetchEntry));

  const report = [];
  const nextSnap = {};
  for (const r of results) {
    const key = r.entry.url;
    if (!r.ok) {
      report.push({ name: r.entry.name, url: key, replacedBy: r.entry.replacedBy, status: 'ERROR', error: r.error });
      if (prev[key]) nextSnap[key] = prev[key]; // keep last good snapshot on error
      continue;
    }
    const old = prev[key];
    if (!old) {
      report.push({ name: r.entry.name, url: key, replacedBy: r.entry.replacedBy, status: 'NEW', dollarAmounts: r.snapshot.dollarAmounts });
    } else if (old.hash === r.snapshot.hash) {
      report.push({ name: r.entry.name, url: key, replacedBy: r.entry.replacedBy, status: 'UNCHANGED', dollarAmounts: r.snapshot.dollarAmounts });
    } else {
      const { added, removed } = diffAmounts(old.dollarAmounts, r.snapshot.dollarAmounts);
      report.push({
        name: r.entry.name, url: key, replacedBy: r.entry.replacedBy, status: 'CHANGED',
        oldAmounts: old.dollarAmounts, newAmounts: r.snapshot.dollarAmounts, added, removed,
        fetchedAtWas: old.fetchedAt,
      });
    }
    nextSnap[key] = r.snapshot;
  }

  if (opts.json) {
    console.log(JSON.stringify({ baseline: !hadSnapshot, generatedAt: new Date().toISOString(), results: report }, null, 2));
  } else {
    if (!hadSnapshot) {
      console.log('No existing snapshot — recording BASELINE for all watch URLs.\n');
    } else {
      console.log(`PRICE CHANGE REPORT — ${report.length} pages checked\n`);
    }
    for (const r of report) {
      const ours = r.replacedBy ? ` (ours: /${r.replacedBy}/)` : '';
      if (r.status === 'ERROR') {
        console.log(`ERROR     ${r.name}${ours}\n          ${r.error}`);
      } else if (r.status === 'NEW') {
        console.log(`NEW       ${r.name}${ours}\n          amounts: ${fmtAmounts(r.dollarAmounts)}`);
      } else if (r.status === 'UNCHANGED') {
        console.log(`UNCHANGED ${r.name}${ours}`);
      } else {
        console.log(`CHANGED   ${r.name}${ours}`);
        console.log(`          old: ${fmtAmounts(r.oldAmounts)}`);
        console.log(`          new: ${fmtAmounts(r.newAmounts)}`);
        console.log(`          added: ${fmtAmounts(r.added)} | removed: ${fmtAmounts(r.removed)}`);
      }
    }
    const counts = {};
    for (const r of report) counts[r.status] = (counts[r.status] || 0) + 1;
    console.log('\nsummary: ' + Object.entries(counts).map(([k, v]) => `${v} ${k.toLowerCase()}`).join(', '));
    console.log('Reminder: verify any CHANGED result manually on the live page before publishing.');
  }

  if (!hadSnapshot || opts.update) {
    fs.writeFileSync(SNAP_FILE, JSON.stringify(nextSnap, null, 2) + '\n');
    if (!opts.json) console.log(hadSnapshot ? `snapshot updated -> ${path.relative(process.cwd(), SNAP_FILE)}`
                                           : `baseline recorded -> ${path.relative(process.cwd(), SNAP_FILE)}`);
  }
  process.exit(0);
}

main().catch(err => {
  // Only reachable for non-network failures (bad JSON, fs errors).
  console.error('fatal:', err && err.message || err);
  process.exit(0);
});
