/*
 * split-seo.js — one-time splitter. Reads the hand-written SEO post batch
 * (seo-posts-batch1) and writes each post as content/seo/<slug>.md with a
 * small front-matter block. The output is committed; build.js reads content/seo/.
 *
 * Run: node scripts/split-seo.js <path-to-batch.md>
 */
const fs = require('fs');
const path = require('path');

const SRC = process.argv[2] || 'C:/Users/ADMIN/Desktop/onetime-suite/blog/seo-posts-batch1-linkleaf-bloomrecorder-wispertalk.md';
const OUT = path.join(__dirname, '..', 'content', 'seo');
fs.mkdirSync(OUT, { recursive: true });

const raw = fs.readFileSync(SRC, 'utf8');

/* URL for each post, in document order */
const SLUGS = [
  'linktree-alternative',
  'self-hosted-linktree-alternative',
  'beacons-alternative',
  'loom-alternative',
  'open-source-loom-alternative',
  'vidyard-alternative',
  'wispr-flow-alternative',
  'wispertalk-vs-wispr-flow',
];

/* internal anchor -> published path */
const ANCHORS = {
  '#post-1--linktree-alternative': '/linktree-alternative/',
  '#post-2--self-hostable-linktree-alternative': '/self-hosted-linktree-alternative/',
  '#post-3--beacons-alternative': '/beacons-alternative/',
  '#post-1--loom-alternative': '/loom-alternative/',
  '#post-2--open-source-loom-alternative': '/open-source-loom-alternative/',
  '#post-3--vidyard-alternative': '/vidyard-alternative/',
  '#post-1--wispr-flow-alternative': '/wispr-flow-alternative/',
  '#post-2--lifetime-vs-monthly': '/wispertalk-vs-wispr-flow/',
};

/* Every "### Post N — ..." section up to the template/corrections appendix */
const bodyEnd = raw.indexOf('## Reusable "Alternative Page" Template');
const main = raw.slice(0, bodyEnd);
const sections = main.split(/^### Post \d+ — .*$/m).slice(1);
if (sections.length !== SLUGS.length) {
  console.error(`Expected ${SLUGS.length} posts, found ${sections.length}`);
  process.exit(1);
}

sections.forEach((sec, i) => {
  const slug = SLUGS[i];
  const title = sec.match(/\*\*SEO title:\*\*\s*(.+)/)[1].trim();
  const metaDesc = sec.match(/\*\*Meta description:\*\*\s*(.+)/)[1].trim();

  /* body = from the first "# " H1 to the trailing "---" separator.
     Group-final sections run on into the next "## PRODUCT" block (the split
     is on "### Post" only) — cut at the double "---" group boundary, then
     strip ALL trailing separators. */
  let body = sec.slice(sec.indexOf('\n# ') + 1);
  body = body.split(/\n---+\s*\n---+/)[0];
  body = body.replace(/(\n---+\s*)+$/g, '').trim();

  /* drop the editorial "Repositioned" note (meta-commentary, not for publishing) */
  body = body.replace(/^> \*\*Repositioned:\*\*.*\n+/m, '');

  /* rewrite internal anchors to live URLs */
  for (const [a, url] of Object.entries(ANCHORS)) {
    body = body.split(`(${a})`).join(`(${url})`);
  }

  const fm = `---\nslug: ${slug}\ntitle: ${title}\ndescription: ${metaDesc}\n---\n\n`;
  fs.writeFileSync(path.join(OUT, `${slug}.md`), fm + body + '\n', 'utf8');
  console.log('wrote content/seo/' + slug + '.md');
});
