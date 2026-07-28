/* One-off: audit README table prices against products data (Whop-aligned). */
const fs = require('fs');
const prods = [...require('../src/products.js'), ...require('../src/products-51-100.js'), ...require('../src/extra-products.js')];
const readme = fs.readFileSync(require('path').join(__dirname, '..', 'README.md'), 'utf8');
const rowRe = /\|\s*\d+\s*\|\s*\*\*([^*]+)\*\*\s*\|[^|]+\|[^|]+\|\s*\$(\d+)\s*\|/g;
let m, parsed = 0; const bad = [];
while ((m = rowRe.exec(readme))) {
  parsed++;
  const p = prods.find(x => x.brand === m[1].trim());
  if (p && p.price !== Number(m[2])) bad.push(`${p.slug}: README $${m[2]} -> products.js $${p.price}`);
}
console.log('README rows parsed:', parsed);
console.log(bad.length ? bad.join('\n') : 'no mismatches');

/* Also scan docs/playbooks for price mentions of mismatching apps. */
if (bad.length) {
  const slugs = bad.map(b => b.split(':')[0]);
  const brands = slugs.map(s => prods.find(p => p.slug === s).brand);
  for (const f of fs.readdirSync(require('path').join(__dirname, '..', 'docs', 'playbooks'))) {
    const t = fs.readFileSync(require('path').join(__dirname, '..', 'docs', 'playbooks', f), 'utf8');
    for (const b of brands) {
      const hits = [...t.matchAll(new RegExp(b + '[^\\n]*\\$\\d+', 'gi'))].map(x => x[0].trim());
      if (hits.length) console.log(`\n${f} [${b}]:\n  ` + hits.slice(0, 6).join('\n  '));
    }
  }
}
