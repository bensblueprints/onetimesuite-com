/* app-inventory.js — split the live catalog into desktop vs cloud, match each
 * desktop app to its newest Windows installer on disk, and emit:
 *   1. a flat folder of every working desktop installer (hard links, so it
 *      costs no extra disk on the same volume)
 *   2. WEB-APPS.md — every cloud/self-hosted app with its links
 *
 * Read-only against the catalog; only writes into the output folder.
 *
 *   node scripts/app-inventory.js [--out "<folder>"] [--copy]
 *
 * --copy forces real copies instead of hard links (needed across volumes).
 */

const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..');
const SUITE = path.resolve(REPO, '..', '..');           // "One Time Suite"
const WIN = path.join(SUITE, 'Windows Installers');
const MAC = path.join(SUITE, 'Mac Installers');

const args = process.argv.slice(2);
const argOf = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const OUT = argOf('--out') || path.join(SUITE, 'Desktop Apps — Install All');
const FORCE_COPY = args.includes('--copy');

/* ---------------- catalog ------------------------------------------------- */

const src = fs.readFileSync(path.join(REPO, 'build.js'), 'utf8');
function slugSet(name) {
  const m = new RegExp(name + '\\s*=\\s*new Set\\(\\[([\\s\\S]*?)\\]\\)').exec(src);
  return m ? [...m[1].matchAll(/'([a-z0-9-]+)'/g)].map(x => x[1]) : [];
}
const AVAILABLE = slugSet('const AVAILABLE_SLUGS');
const DESKTOP = new Set(slugSet('const DESKTOP_SLUGS'));

const products = [
  ...require(path.join(REPO, 'src/products.js')),
  ...require(path.join(REPO, 'src/products-51-100.js')),
  ...require(path.join(REPO, 'src/extra-products.js')),
];
const bySlug = Object.fromEntries(products.map(p => [p.slug, p]));

const liveDesktop = AVAILABLE.filter(s => DESKTOP.has(s)).map(s => bySlug[s]).filter(Boolean);
const liveCloud = AVAILABLE.filter(s => !DESKTOP.has(s)).map(s => bySlug[s]).filter(Boolean);

/* ---------------- installer matching -------------------------------------- */

const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

function installerFolders(root) {
  try { return fs.readdirSync(root, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name); }
  catch { return []; }
}

/* Newest file matching ext anywhere under dir. Folders hold several versions;
   we ship the most recently written one. */
function newestFile(dir, exts) {
  let best = null;
  const walk = d => {
    let entries; try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const fp = path.join(d, e.name);
      if (e.isDirectory()) { walk(fp); continue; }
      if (!exts.some(x => e.name.toLowerCase().endsWith(x))) continue;
      const st = fs.statSync(fp);
      if (!best || st.mtimeMs > best.mtimeMs) best = { path: fp, size: st.size, mtimeMs: st.mtimeMs, name: e.name };
    }
  };
  walk(dir);
  return best;
}

const winFolders = installerFolders(WIN);
const macFolders = installerFolders(MAC);

function matchFolder(folders, product) {
  const cands = [product.brand, product.slug, String(product.brand).replace(/\s+/g, '')];
  for (const c of cands) {
    const hit = folders.find(f => norm(f) === norm(c));
    if (hit) return hit;
  }
  return folders.find(f => norm(f).startsWith(norm(product.brand))) || null;
}

/* Walk EVERY live app, not just the ones the site markets as desktop: 44 apps
   sold as "cloud" also ship a working Windows build, and an installer that
   exists is an installer the customer can run. */
const rows = [];
for (const p of [...liveDesktop, ...liveCloud]) {
  const wf = matchFolder(winFolders, p);
  const mf = matchFolder(macFolders, p);
  rows.push({
    product: p,
    siteKind: DESKTOP.has(p.slug) ? 'desktop' : 'cloud',
    win: wf ? newestFile(path.join(WIN, wf), ['.exe']) : null,
    winFolder: wf,
    mac: mf ? newestFile(path.join(MAC, mf), ['.dmg']) : null,
  });
}

const withInstaller = rows.filter(r => r.win);
const missing = rows.filter(r => !r.win && r.siteKind === 'desktop');
const cloudOnly = rows.filter(r => !r.win && r.siteKind === 'cloud');

/* Installer folders that match no live app — built and installable, but not
   listed for sale on the site yet. */
const matchedFolders = new Set(rows.filter(r => r.winFolder).map(r => r.winFolder));
const unlisted = winFolders
  .filter(f => !matchedFolders.has(f))
  .map(f => ({ folder: f, win: newestFile(path.join(WIN, f), ['.exe']) }))
  .filter(r => r.win);

/* ---------------- emit ---------------------------------------------------- */

fs.mkdirSync(OUT, { recursive: true });

let linked = 0, copied = 0, skipped = 0;
for (const r of withInstaller) {
  const ext = path.extname(r.win.name) || '.exe';
  const dest = path.join(OUT, `${String(r.product.brand).replace(/[\\/:*?"<>|]/g, '-')}${ext}`);
  if (fs.existsSync(dest)) { skipped++; continue; }
  try {
    if (FORCE_COPY) { fs.copyFileSync(r.win.path, dest); copied++; }
    else { fs.linkSync(r.win.path, dest); linked++; }
  } catch {
    try { fs.copyFileSync(r.win.path, dest); copied++; } catch { /* leave it out of the manifest below */ }
  }
}

const gb = n => (n / 1024 / 1024 / 1024).toFixed(2);
const mb = n => Math.round(n / 1024 / 1024);
const totalBytes = withInstaller.reduce((s, r) => s + r.win.size, 0);

/* INSTALL-THESE.md — everything you can actually install on this machine */
const markedDesktop = withInstaller.filter(r => r.siteKind === 'desktop');
const alsoDesktop = withInstaller.filter(r => r.siteKind === 'cloud');

const tableRow = (r, i) => {
  const p = r.product;
  const file = String(p.brand).replace(/[\\/:*?"<>|]/g, '-') + path.extname(r.win.name);
  return `| ${i + 1} | **${p.brand}** | ${p.competitor || '—'} | $${p.price} | \`${file}\` | ${mb(r.win.size)} MB | ${r.mac ? 'yes' : '—'} |`;
};

const installDoc = `# Desktop apps — install all

Every app here is a **one-time purchase you own forever**. No account, no
licence server, no expiry, no meter. It runs on your machine and keeps running.

**${withInstaller.length} Windows installers · ${gb(totalBytes)} GB.**
The files are hard links into \`Windows Installers/\`, so this folder costs
essentially no extra disk and deleting it never touches the originals.

Install in any order — each is a standard installer: double-click, next, done.

## Sold as desktop apps (${markedDesktop.length})

| # | App | Replaces | Price | Installer | Size | Mac |
|---|-----|----------|-------|-----------|------|-----|
${markedDesktop.map(tableRow).join('\n')}

## Sold as cloud apps, but they ship a desktop build too (${alsoDesktop.length})

These are listed on the site as self-hosted web apps, yet each one also has a
working Windows build sitting in \`Windows Installers/\`. If you'd rather not
stand up a server, install it here and it runs locally.

| # | App | Replaces | Price | Installer | Size | Mac |
|---|-----|----------|-------|-----------|------|-----|
${alsoDesktop.map(tableRow).join('\n')}
${missing.length ? `\n## Sold as desktop but no installer on this machine (${missing.length})\n\n${missing.map(r => `- **${r.product.brand}** (\`${r.product.slug}\`)`).join('\n')}\n` : ''}
${cloudOnly.length ? `\n## Cloud-only — no Windows build (${cloudOnly.length})\n\n${cloudOnly.map(r => `- **${r.product.brand}** (\`${r.product.slug}\`) — see WEB-APPS.md`).join('\n')}\n` : ''}
${unlisted.length ? `\n## Built and installable, but NOT listed for sale on the site (${unlisted.length})\n\nThese have working installers on disk and no product page. Adding their slug to\n\`AVAILABLE_SLUGS\` in \`build.js\` and rebuilding is what puts them on sale.\n\n${unlisted.map(r => `- **${r.folder}** — \`${r.win.name}\` (${mb(r.win.size)} MB)`).join('\n')}\n` : ''}
---

Generated by \`scripts/app-inventory.js\` · catalog source: \`build.js\` AVAILABLE_SLUGS + DESKTOP_SLUGS
`;
fs.writeFileSync(path.join(OUT, 'INSTALL-THESE.md'), installDoc, 'utf8');

/* WEB-APPS.md — the cloud side */
const webDoc = `# Cloud / self-hosted apps — ${liveCloud.length} live

These are **server** apps, not desktop installs. Same deal as everything else:
the software is a one-time purchase and self-hosting is free forever. Hosting
is the only thing that ever costs anything, and only if you'd rather not run
the box yourself.

Each one runs on a $5 VPS (Node + SQLite, single process, Docker file included).

| # | App | Replaces | Their price | Yours | Product page | Source | Desktop build |
|---|-----|----------|-------------|-------|--------------|--------|---------------|
${liveCloud.map((p, i) => {
  const r = rows.find(x => x.product.slug === p.slug);
  return `| ${i + 1} | **${p.brand}** | ${p.competitor || '—'} | ${p.compPrice || '—'} | $${p.price} once | [/${p.slug}/](https://onetimesuite.com/software/${p.slug}/) | ${p.repo ? `[${p.repo}](https://github.com/bensblueprints/${p.repo})` : '—'} | ${r && r.win ? 'yes' : '—'} |`;
}).join('\n')}

**${liveCloud.filter(p => { const r = rows.find(x => x.product.slug === p.slug); return r && r.win; }).length} of these ${liveCloud.length} also ship a Windows desktop build** — see
\`INSTALL-THESE.md\`. Worth knowing when someone says they don't want to run a
server.

## Local copies on this machine

Cloned source for the self-hosted apps lives in \`Web Apps/<App>/code/\`, each
with an \`INFO.md\` carrying its test + VPS migration checklist.

## Running one

\`\`\`sh
cd "Web Apps/<App>/code"
npm install
npm start
\`\`\`

Most listen on their own port and open at \`http://localhost:<port>/\`.

---

Generated by \`scripts/app-inventory.js\` · catalog source: \`build.js\` AVAILABLE_SLUGS
`;
fs.writeFileSync(path.join(OUT, 'WEB-APPS.md'), webDoc, 'utf8');

console.log(`live desktop apps : ${liveDesktop.length}`);
console.log(`  installers found: ${withInstaller.length} (${gb(totalBytes)} GB)`);
console.log(`  no installer    : ${missing.length}${missing.length ? ' -> ' + missing.map(r => r.product.brand).join(', ') : ''}`);
console.log(`  mac builds      : ${withInstaller.filter(r => r.mac).length}`);
console.log(`live cloud apps   : ${liveCloud.length}`);
console.log(`linked ${linked} · copied ${copied} · already present ${skipped}`);
console.log(`out: ${OUT}`);
