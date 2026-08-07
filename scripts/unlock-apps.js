/* unlock-apps.js — strip Whop licence gating from the suite's own source.
 *
 * For the physical-drive edition: the buyer paid for the drive, so nothing on
 * it should ask them to prove a Whop purchase. This is your own software, so
 * this is just a build flavour — but it is a real code change, so:
 *
 *   - it writes a .bak beside every file it touches
 *   - it is idempotent (already-patched files are skipped)
 *   - `--restore` puts everything back
 *   - run with no flags it only REPORTS, and changes nothing
 *
 * IMPORTANT: this patches SOURCE. The .exe installers in `Windows Installers/`
 * are compiled Electron bundles — patching source does not change an already
 * built installer. Any app patched here must be rebuilt (`npm run dist`) before
 * its installer reflects the change. The script tells you which ones need it.
 *
 *   node scripts/unlock-apps.js                 # report only
 *   node scripts/unlock-apps.js --apply         # patch
 *   node scripts/unlock-apps.js --restore       # undo
 */

const fs = require('fs');
const path = require('path');

const SUITE = path.resolve(__dirname, '..', '..', '..');
const WEB_APPS = path.join(SUITE, 'Web Apps');

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const RESTORE = args.includes('--restore');

const MARK = 'OTS-DRIVE-EDITION';

/* Each rule: a file (relative to <App>/code), a test for "is it gated", and a
   patch. Kept explicit per app rather than a blanket regex — a blind
   find/replace across 66 apps is how you silently break six of them. */
const RULES = [
  {
    app: 'Inkseal',
    file: 'server/license.js',
    why: 'first document free, then a $59 Whop licence key validated against Whop\'s API',
    detect: src => /export function isLicensed\(\)\s*\{\s*return !!getLicense\(\)\.key;/.test(src),
    patch: src => src.replace(
      /export function isLicensed\(\)\s*\{\s*return !!getLicense\(\)\.key;\s*\}/,
      `export function isLicensed() {\n  /* ${MARK}: drive edition ships fully licensed — no key, no Whop check. */\n  return true;\n}`
    ),
  },
  {
    app: 'Inkseal',
    file: 'server/license.js',
    why: 'free-envelope quota still counts down even when licensed',
    detect: src => /export const FREE_ENVELOPE_LIMIT = 1;/.test(src),
    patch: src => src.replace(
      /export const FREE_ENVELOPE_LIMIT = 1;/,
      `export const FREE_ENVELOPE_LIMIT = Infinity; // ${MARK}: no free-tier cap`
    ),
  },
  {
    app: 'Linkleaf',
    file: 'server/whop.js',
    why: 'hosted multi-tenant mode checks Whop subscriptions',
    /* Linkleaf's single-tenant self-hosted mode is already ungated; only the
       multi-tenant hosted server consults Whop. Neutralise the check rather
       than delete the module, so app-multi.js keeps its imports. */
    detect: src => !src.includes(MARK),
    patch: src =>
      `/* ${MARK}: drive edition — every subscription check reports active.\n` +
      `   The original module is preserved below the export override. */\n` +
      src.replace(
        /module\.exports\s*=\s*\{/,
        `module.exports = {\n  __driveEdition: true,\n  hasActiveSubscription: async () => true,\n  verifySubscription: async () => ({ active: true, plan: 'drive' }),`
      ),
  },
];

/* Apps that only NAME Whop in docs/marketing — nothing to unlock, but the
   copy should not tell a drive buyer to go to Whop. Reported, never patched
   automatically, because rewriting marketing prose is a judgement call. */
function docMentions() {
  const out = [];
  let apps = [];
  try { apps = fs.readdirSync(WEB_APPS, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name); } catch { return out; }
  for (const app of apps) {
    const readme = path.join(WEB_APPS, app, 'code', 'README.md');
    try {
      if (/whop/i.test(fs.readFileSync(readme, 'utf8'))) out.push(app);
    } catch { /* no readme */ }
  }
  return out;
}

/* ---------------- run ------------------------------------------------------ */

const touched = new Set();
let patched = 0, skipped = 0, restored = 0, absent = 0;

for (const rule of RULES) {
  const fp = path.join(WEB_APPS, rule.app, 'code', rule.file);
  const bak = fp + '.bak';

  if (RESTORE) {
    if (fs.existsSync(bak)) {
      fs.copyFileSync(bak, fp);
      fs.unlinkSync(bak);
      console.log(`restored  ${rule.app}/${rule.file}`);
      restored++;
    }
    continue;
  }

  let src;
  try { src = fs.readFileSync(fp, 'utf8'); } catch { console.log(`missing   ${rule.app}/${rule.file}`); absent++; continue; }

  if (src.includes(MARK) && !rule.detect(src)) { console.log(`already   ${rule.app}/${rule.file}`); skipped++; continue; }
  if (!rule.detect(src)) { console.log(`no gate   ${rule.app}/${rule.file} — pattern not found, left alone`); skipped++; continue; }

  console.log(`${APPLY ? 'PATCH   ' : 'would   '}  ${rule.app}/${rule.file}\n            ${rule.why}`);
  if (APPLY) {
    const next = rule.patch(src);
    if (next === src) { console.log('            (patch made no change — check the rule)'); skipped++; continue; }
    if (!fs.existsSync(bak)) fs.copyFileSync(fp, bak);
    fs.writeFileSync(fp, next, 'utf8');
    patched++;
    touched.add(rule.app);
  } else {
    touched.add(rule.app);
  }
}

if (RESTORE) {
  console.log(`\nrestored ${restored} file(s).`);
} else {
  const mentions = docMentions();
  console.log(`\n${APPLY ? 'patched' : 'would patch'}: ${APPLY ? patched : RULES.length - skipped - absent} file(s) across ${touched.size} app(s) — ${[...touched].join(', ') || 'none'}`);
  console.log(`skipped: ${skipped} · missing: ${absent}`);

  if (touched.size) {
    console.log(`\nREBUILD REQUIRED — source is patched but the shipped installers are not.`);
    for (const app of touched) console.log(`  cd "Web Apps/${app}/code" && npm install && npm run dist`);
    console.log(`Then re-copy the new .exe into "Windows Installers/<App>/" and re-run`);
    console.log(`scripts/app-inventory.js so the drive folder picks it up.`);
  }

  console.log(`\n${mentions.length} app README(s) still point buyers at Whop (copy only, no gate):`);
  console.log('  ' + mentions.join(', '));
  console.log('  These are docs, not code — reword them for the drive edition if you care.');

  if (!APPLY) console.log(`\nNothing was changed. Re-run with --apply to patch, --restore to undo.`);
}
