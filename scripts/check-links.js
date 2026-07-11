/*
 * check-links.js — verifies that every internal href/src in public/ resolves
 * to a file that exists. Run after build: node scripts/check-links.js
 */
const fs = require('fs');
const path = require('path');

const PUB = path.join(__dirname, '..', 'public');

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else yield full;
  }
}

let checked = 0, broken = 0;
for (const file of walk(PUB)) {
  if (!file.endsWith('.html')) continue;
  const html = fs.readFileSync(file, 'utf8');
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(m => m[1]);
  for (const ref of refs) {
    if (/^(https?:|mailto:|data:|#)/.test(ref)) continue;
    const clean = ref.split('#')[0].split('?')[0];
    if (!clean) continue;
    const target = clean.startsWith('/') ? path.join(PUB, clean) : path.join(path.dirname(file), clean);
    checked++;
    const ok = clean.endsWith('/')
      ? fs.existsSync(path.join(target, 'index.html'))
      : (fs.existsSync(target) || fs.existsSync(path.join(target, 'index.html')));
    if (!ok) { broken++; console.error('BROKEN', ref, 'in', path.relative(PUB, file)); }
  }
}
console.log(`checked ${checked} internal refs, ${broken} broken`);
process.exit(broken ? 1 : 0);
