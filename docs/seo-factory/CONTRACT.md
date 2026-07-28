# SEO Factory — Section Authoring Contract

This is the binding contract for agents authoring programmatic SEO sections in
`src/sections/`. Each section is a Node module that `build.js` auto-discovers
and runs at build time (SECTION 7c, right after the comparison-posts section).
Node built-ins only — **no npm packages, ever**.

Verify your section before handing off:

```bash
node scripts/test-section.js src/sections/your-section.js
node --check build.js && node build.js   # full-build check, if allowed in your lane
node scripts/check-links.js              # no NEW failures beyond the known 12 demo-page ones
```

---

## 1. Section module skeleton

```js
/* src/sections/example.js — one-line description of what this section emits */
module.exports = function (ctx) {
  const { write, page, reg, esc, attr, SITE, crumbs, matrix, sales, schema, bySlug } = ctx;

  // hub page
  write('example', page({
    title: 'Example Hub | OneTimeSuite',            // ≤60 chars after escaping
    desc: 'What this hub is about, in 120–160 chars. page() clamps, but aim correct.',
    canonical: `${SITE}/example/`,
    jsonld: [
      crumbs([['OneTimeSuite', `${SITE}/`], ['Example', `${SITE}/example/`]]),
      schema.itemListLd({ name: 'Example', url: `${SITE}/example/`, items: [['Thing', `${SITE}/example/thing/`]] }),
    ],
    body: `
    <section class="hero center">
      <div class="wrap">
        <span class="stamp">hub</span>
        <h1>Example</h1>
        <p class="lead">${esc('data-driven lead')}</p>
      </div>
    </section>`,
  }));
  reg('/example/', 'pages');   // sitemap set — see ROUTE REGISTRY for the right set
};
```

Rules of the harness:

- The module is called once, synchronously, with `sectionCtx`.
- Emit pages with `ctx.write(rel, html)` where `rel` is the directory under
  `public/` (`write('vs/loom-vs-bloomrecorder', html)` → `/vs/loom-vs-bloomrecorder/`).
  `write('', html)` is the homepage — never use it.
- Always emit through `ctx.page({...})` — it is the ONLY head/layout wrapper
  (NAV, FOOTER, fonts, GA/GTM/pixel, CSS, canonical, one ld+json script per
  jsonld object). Never hand-write `<html>`, `<head>` or `</script>`.
- After writing each page, call `ctx.reg(route, set)` with the trailing-slash
  route and the correct sitemap set.
- **Deterministic output**: no `Date.now()`, no `Math.random()`, no
  environment-dependent values in emitted HTML. Sort all iterated collections.

## 2. sectionCtx API

| key | type | notes |
|---|---|---|
| `write(rel, html)` | fn | emit `public/<rel>/index.html` (`rel ''` = homepage — don't use) |
| `page(opts)` | fn | full HTML doc; opts: `{ title, desc, canonical, ogType='website', jsonld=[], body, robots='index, follow' }`. Auto-clamps title ≤60 / desc 120–160 |
| `reg(relPath, set='pages')` | fn | register route in sitemap set: `'pages'`, `'apps'`, `'blog'`, `'vs'` |
| `esc(s)` / `attr(s)` | fn | HTML-escape (body) / attribute-escape. **Mandatory** on all data strings |
| `fitTitle(t)` / `fitDesc(d)` | fn | the same clamps page() applies |
| `fmt(n)` / `art(name)` | fn | `$1,234` / a-vs-an article |
| `SITE` / `WHOP` / `GH` | string | `https://onetimesuite.com`, Whop store, GitHub org |
| `crumbs(items)` | fn | BreadcrumbList from `[[name, absoluteUrl], …]` |
| `ORG_LD` | obj | shared Organization node (no `@context` — pair with one that has it) |
| `ldJson(o)` | fn | compact JSON, `<` escaped — page() already applies it to `jsonld` |
| `pricePair(p)` | fn | struck subscription price + one-time sticker HTML |
| `shotFrame(p)` | fn | screenshot in browser chrome (placeholder if no shot) |
| `allProducts` | array | full catalog (104 entries) — see shape below |
| `availableProducts` / `upcomingProducts` | array | split by `AVAILABLE_SLUGS` |
| `bySlug` | obj | slug → product |
| `products` / `products51` / `extras` / `comingSoon` | array | raw catalog slices |
| `desktopProducts` / `webProducts` / `DESKTOP_SLUGS` | array/Set | platform split |
| `AVAILABLE_SLUGS` / `DEMOS` | Set | purchasable slugs / slugs with a `/demo/` page |
| `BUNDLE` | obj | `{ slug:'onetime-suite-bundle', name, price:997, tagline, checkoutUrl }` |
| `bundleValue` / `bundleSavings` | number | à-la-carte total / savings vs bundle |
| `localCheckout(slug, url)` | fn | rewrite Whop checkout URLs to `/checkout/<slug>/?plan=…` |
| `hasShot/hasBox/hasClip(slug)` | fn | asset existence checks |
| `ytId(slug)` / `ytIdRaw(slug)` | fn | embeddable YouTube id / raw id |
| `youtubeVideos` | obj | slug → `{ videoId, at }` (src/youtube-videos.json) |
| `videoLd(p)` / `videoLdScript(p)` | fn | build.js's own VideoObject helpers |
| `posts` | array | 76 comparison-post entries (`/comparison/<slug>/`) |
| `seoPosts` | array | hand-written root-level md posts |
| `matrix` | obj | `require('../seo-matrix.js')` — see §3 |
| `sales` | obj | `require('../sales-data.js')` — see §3 |
| `schema` | obj | `require('../seo/schema.js')` — see §3 |

## 3. Data shapes (verbatim)

### Product (entries of `allProducts`)

```js
{ slug, brand, repo, price, icon, tagline, oneliner,
  competitor, compPrice, compYr, heroLead,
  features: [[icon, title, text]],
  compRows: [[label, ours, theirs]],
  payback, steps: [[title, text]], faq: [[q, a]],
  kind?: 'desktop' | 'web',          // absent on the original 50 products
  buyUrl?, closedSource?, seoRelated? }
```

### sales-data (`ctx.sales`) — REAL numbers only, rendered publicly

```js
{ basePrice: 97, incrementPerSale: 1, cap: 997, postLaunchPrice: 1997,
  hundredDaysComplete: false, salesCount: 0, priceHistory: [], updatedAt: '2026-07-28' }
```

Current price while the 100 days run:
`Math.min(sales.cap, sales.basePrice + sales.incrementPerSale * sales.salesCount)`;
after `hundredDaysComplete`, the price is `sales.postLaunchPrice`.

### seo-matrix (`ctx.matrix`)

```js
{
  competitors: [{ slug, name, category, priceMo /* null|number */, priceYr, apps: [productSlug, …] }, …],
  personas:    [{ slug, name, blurb }, …],              // 8
  platforms:   [{ slug, name, blurb, kinds: ['desktop'|'web', …] }, …], // 6
  problems:    [{ slug, title, h1, intro, appSlugs }, …],               // 24
  categories:  [{ slug, name, desc, appSlugs }, …],                     // 8
  graveyard:   [{ slug, name, was, now, year, story, alternativeSlugs }, …], // 8
  personaCategoryFit: { [personaSlug]: [categorySlug, …] },
}
```

Platform gating: only emit `/apps/<slug>/on/<platform>/` when the product's
`kind` is in the platform's `kinds`; products with **no `kind`** get all
platforms.

### schema helpers (`ctx.schema`) — all return plain objects for `page({jsonld})`

```js
schema.softwareApp(p, url)                        // SoftwareApplication + Offer(price USD)
schema.faqPageLd([[q, a], …])                     // FAQPage
schema.productLd({ name, desc, url, price, priceNote })  // Product + Offer
schema.eventLd(ev)                                // Event (ev passed through)
schema.videoLd({ name, desc, thumbUrl, uploadDate, durationIso, url })
schema.howToLd({ name, steps: [[title, text], …], url })
schema.articleLd({ title, desc, url, datePublished })
schema.itemListLd({ name, url, items: [[name, url], …] })
```

**HARD RULE: never emit `aggregateRating` or `review` fields.** There is no
real review data. No fake testimonials, reviews, star ratings, or "as seen
on" badges anywhere in any section.

## 4. CSS class catalog (src/site.css — use these, don't invent new ones)

`.wrap` `.wrap-narrow` `section.hero` `section.hero.center` `.section-head`
`.cat-head` + `.count` `.crumbs` `.stamp` `.stamp.blue` `.mono-note` `.lead`
`.price-fig` `.btn` `.btn-solid` `.btn-ghost` `.btn-row` `.link`
`.price-pair` + `.was` + `.sticker` (`.big`, `.sm`) + `.amt` + `.once`
`.tbl-wrap` > `table.receipt` (`.us` col, `.total` row) `.post-body`
`.post-meta` `.post-list` `.faq-item` `.cta-card` `.steps` + `.step` + `.n`
`.related-strip` `.bundle-box` `.p-card` (`.soon`, `.tape`) `.card-grid`
`.show-rows` / `.show-row` `.avail` (`.dot`, `.lg`)

## 5. ROUTE REGISTRY — who owns what

Top-level dirs matching a product slug or a `v2-pages/` entry get clobbered by
the v2 overlay at the end of the build — new routes MUST use these prefixes.

| file | routes | sitemap set |
|---|---|---|
| `src/sections/vs-compare.js` | `/vs/`, `/vs/<app>-vs-<competitor>/`, `/compare/`, `/compare/<app>-vs-<competitor>/`, `/alternatives/`, `/alternatives/<competitor>/` | `vs` |
| `src/sections/apps-directory.js` | `/apps/`, `/apps/<slug>/` (canonical → `SITE+'/<slug>/'`), `/apps/<slug>/for/<persona>/`, `/apps/<slug>/on/<platform>/`, `/apps/<slug>/updates/` | `apps` |
| `src/sections/solve-categories.js` | `/solve/`, `/solve/<problem>/`, `/categories/`, `/categories/<category>/` | `vs` |
| `src/sections/special-pages.js` | `/calculator/`, `/price-tracker/`, `/manifesto/`, `/graveyard/` | `pages` |
| `src/sections/conversion-pages.js` | `/webinar/`, `/press/`, `/events/`, `/events/<slug>/`, `/research/`, `/research/<topic>/`, `/stacks/` | `pages` |

Do not emit routes outside your file's row. Two files must never emit the same
route.

## 6. Content & safety rules

1. **Always `esc()` / `attr()` data strings** (brand names, competitor names,
   FAQ text, blurbs — everything from data files).
2. **Never hand-write `</script>`** or raw `<script type="application/ld+json">`;
   structured data goes through `page({ jsonld })` only.
3. Titles ≤60 chars, descriptions 120–160 chars — page() clamps, but aim correct.
4. Every page calls `reg()` with the set from the route registry table.
5. Every internal link must target a route in the registry or an existing
   route: `/<slug>/` product pages, `/comparison/` + `/comparison/<slug>/`,
   `/blog/` + `/blog/<slug>/`, `/savings/`, `/onetime-suite-bundle/`,
   `/terms/`, `/privacy/`, `/checkout/<slug>/`, `/` (and `/<slug>/demo/` only
   for slugs in `ctx.DEMOS`).
6. Breadcrumbs (`crumbs()`) must only link to routes that are actually emitted.
7. **No fake testimonials, reviews, ratings, or social-proof numbers.** Sales
   figures come from `ctx.sales` only — never invent counts.
8. `/apps/<slug>/` pages MUST set `canonical: SITE + '/<slug>/'` (they are
   duplicates of the real product pages).
9. **Genuinely differentiated content**: each page type needs ≥3 content
   blocks that vary by actual product data (features, compRows, faq,
   competitor, payback, steps, price) — no name-swapped boilerplate where
   only the noun changes.
10. Deterministic output: no `Date.now()`, `Math.random()`, or iteration over
    unsorted collections. Sort before mapping.
11. Graveyard/comparison copy states pricing-model **facts** only — neutral
    tone, no defamation.
