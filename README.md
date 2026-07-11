# onetimesuite.com

The native website for **OneTimeSuite** — 58 pay-once apps that replace
subscription SaaS (20 desktop apps + 38 self-hosted web apps), sold on
[Whop](https://whop.com/onetime-suite) with MIT source on
[github.com/bensblueprints](https://github.com/bensblueprints) for all
but WisperTalk (closed-source, sold at wispertalk.com).

Its own brand ("the price sticker" — retail ownership, receipts, single
light paper theme), fully static, no runtime dependencies.

## Build

```
node build.js            # generates everything into public/
node scripts/check-links.js   # verifies every internal link resolves
```

No npm dependencies — Node built-ins only.

## What gets generated (146 pages)

| Path | What |
|---|---|
| `/` | hub — category nav, full product grid (desktop / web-hosted), screenshots, bundle callout, blog teaser |
| `/<slug>/` | 58 product pages — price sticker, screenshot, features, comparison table, steps, FAQ, buy CTA |
| `/onetime-suite-bundle/` | the $997 OneTimeSuite Complete bundle (56-app catalog; $1,727 value, $730 saved) |
| `/comparison/` | blog hub listing all 84 posts |
| `/comparison/<slug>/` | 76 generated comparison posts |
| `/linktree-alternative/` etc. | 8 hand-written SEO posts at root-level slugs |
| `sitemap.xml`, `robots.txt`, `404.html` | plumbing |

Every page has canonical URLs, OG tags, and schema.org Product / FAQPage /
Article JSON-LD where apt.

## Source data

- `src/products.js` — 56 catalog products (copied from advancedmarketing-main; treat as data, edit upstream)
- `src/extra-products.js` — BloomRecorder + WisperTalk (shipped apps outside the catalog/bundle)
- `src/posts-1.js` … `posts-6.js` — 76 comparison posts
- `content/seo/*.md` — 8 hand-written SEO posts (split from the onetime-suite blog batch by `scripts/split-seo.js`)
- `assets/shots/*.png` — 40 real app screenshots
- `src/site.css` — the design system (tokens: `--paper`, `--ink`, `--accent`, `--price`, `--line`)

## Deploy

```
docker build -t onetimesuite .
docker run -p 80:80 onetimesuite
```

Multi-stage Dockerfile: node:22-alpine runs `build.js`, nginx:1.27-alpine
serves `public/` with clean-URL `try_files`.
