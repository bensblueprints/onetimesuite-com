/* One-off verification for the blogPost2 re-index (2026-07-27).
   Asserts over ALL regenerated *-pricing-is-out-of-control posts:
   - body word count >= 500 (keep-reading nav stripped)
   - pricing math table + compRows comparison table present
   - title <= 60 chars, all titles unique
   - no `noindex` anywhere in the page
   - slug present in sitemap.xml
   - FAQPage + BlogPosting JSON-LD parse
   Run: node scripts/verify-post2.js */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'public');

const products = [...require('../src/products.js'), ...require('../src/products-51-100.js'), ...require('../src/extra-products.js')];
const bySlug = {};
products.forEach(p => { bySlug[p.slug] = p; });
const blogAppSlugs = fs.readdirSync(path.join(ROOT, 'src'))
  .filter(f => /^blog-chunk\d+\.js$/.test(f)).sort()
  .flatMap(f => require(path.join(ROOT, 'src', f)));
const slugify = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '');

const sitemap = fs.readFileSync(path.join(OUT, 'sitemap.xml'), 'utf8');
const titles = new Set();
let fails = 0, words = [];
const fail = (...a) => { fails++; console.log('FAIL', ...a); };

blogAppSlugs.forEach(s => {
  const p = bySlug[s];
  if (!p) return fail('no product', s);
  const slug = `${s}-${slugify(p.competitor)}-pricing-is-out-of-control`;
  const fp = path.join(OUT, 'blog', slug, 'index.html');
  if (!fs.existsSync(fp)) return fail('missing page', slug);
  const html = fs.readFileSync(fp, 'utf8');

  if (/noindex/i.test(html)) fail('noindex still present', slug);
  if (!sitemap.includes(`/blog/${slug}/`)) fail('not in sitemap', slug);

  const m = html.match(/<article class="post-body">([\s\S]*?)<\/article>/);
  if (!m) return fail('no article body', slug);
  const body = m[1].replace(/<nav class="keep-reading"[\s\S]*?<\/nav>/, '');
  const text = body.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
  const wc = text.split(' ').length;
  words.push([wc, slug]);
  if (wc < 500) fail('word count < 500:', wc, slug);

  if (!/Cost after 3 years/.test(body)) fail('no pricing math table', slug);
  if (!body.includes(`<th class="us">${p.brand}</th><th>${p.competitor.replace(/&/g, '&amp;')}</th>`)) fail('no compRows table', slug);

  const t = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const title = t ? t[1].replace(/<[^>]+>/g, '').trim() : '';
  if (title.length > 60) fail('title > 60:', title.length, title);
  if (titles.has(title)) fail('duplicate title:', title);
  titles.add(title);

  // JSON-LD blocks all parse; BlogPosting + FAQPage present
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  const types = [];
  blocks.forEach(b => {
    try {
      const j = JSON.parse(b[1]);
      (Array.isArray(j) ? j : [j]).forEach(x => types.push(x['@type']));
    } catch (e) { fail('JSON-LD parse error', slug, e.message); }
  });
  if (!types.includes('BlogPosting')) fail('no BlogPosting schema', slug);
  if (!types.includes('FAQPage')) fail('no FAQPage schema', slug);
});

words.sort((a, b) => a[0] - b[0]);
console.log(`\nchecked ${titles.size} posts | word count min/median/max: ${words[0][0]} / ${words[Math.floor(words.length / 2)][0]} / ${words[words.length - 1][0]}`);
console.log('shortest:', words.slice(0, 3).map(w => w.join(':')).join(', '));
console.log(fails ? `\n${fails} FAILURES` : '\nALL CHECKS PASSED');
process.exit(fails ? 1 : 0);
