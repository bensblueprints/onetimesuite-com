# Measurement Dashboard — SEO Operation Playbook

How we know the programmatic SEO sections (`/vs/`, `/apps/`, `/solve/`,
`/categories/`, `/graveyard/`, comparison posts) are working. Review weekly
(30 min, Monday), deep-review monthly. Everything here uses free tooling —
do not buy rank trackers or SEO suites before month 3.

Rule zero: we report real numbers only. No estimated traffic, no inflated
counts — same standard as `src/sales-data.js`.

---

## 1. Weekly scorecard

Fill this in every week. Keep one row per metric; copy the table into your
notes with the date as the heading.

| Metric | Tool | Target | First-90-days baseline expectation | This week |
|---|---|---|---|---|
| Organic sessions (7-day trend) | GA4 (already installed, `G-QJ65NLXTY5`) — Reports → Acquisition → filter Session source = google / bing | Upward trend, not absolute number | Weeks 1–4: 0–20/wk total. Weeks 5–8: 10–80/wk. Weeks 9–13: 50–300/wk if indexing goes well. Flat zero for a month is NORMAL for a new domain section | |
| New keywords entering top 20 | Google Search Console → Performance → Queries (free — use this before ever paying for Ahrefs) | +2–5 new queries/week by week 8 | Weeks 1–4: mostly brand terms only. Weeks 5–12: long-tail "X alternative" / "X vs Y" queries start appearing, positions 15–40 | |
| Indexed pages vs emitted pages | GSC → Pages (coverage report). Emitted count = rows across `public/sitemap-*.xml` | Indexed ≥ 80% of emitted by day 90 | Indexing lag is normal: expect 20–50% indexed at day 30, 50–80% at day 60. "Crawled – currently not indexed" on programmatic pages is expected early; only worry if it persists past day 90 on your best pages | |
| CTR on top 10 queries | GSC → Performance → Queries, sort by impressions | ≥ 2% on position ≤10 queries; improving titles on the rest | Early CTR is noisy — expect 0.5–1.5% while pages sit at positions 8–30 | |
| Webinar signups from organic | GA4 → Events, filter landing page + `utm_campaign=vs-*` / `cta` content | First organic signup by day 45; 1–4/week by day 90 | Zero signups in the first month is the honest baseline — traffic comes before conversion | |
| Suite purchases attributed to organic | UTM → Whop checkout referrers / GA4 key events | First attributed sale by day 60–90 | Do not expect organic revenue before week 6. Programmatic SEO on a new section is a 3–6 month payback channel | |
| Core Web Vitals (mobile) | PageSpeed Insights on `/`, one `/vs/` page, one `/apps/` page | All "Good" (LCP ≤2.5s, INP ≤200ms, CLS ≤0.1) | Static build on nginx — should pass from day 1. If a page type fails, that's a build bug, fix immediately | |
| Referring domains / backlinks | Ahrefs Webmaster Tools (free tier — verified-property only data) | +1–3 new referring domains/month from outreach/press | 0–5 total in the first 90 days unless press lands. Do not chase this metric early | |

### Honest framing for the first 90 days

- A new programmatic section on a young domain typically sees **impressions
  before clicks, clicks before conversions**. The first 4–6 weeks are an
  indexing and trust-building period, not a traffic period.
- "Most pages won't rank for months" is the correct prior. The pages that DO
  break through early are almost always the low-competition long-tail ones
  (`/vs/<small-competitor>-vs-<app>/`, `/solve/<niche-problem>/`) — watch
  which ones and write more like them.
- A week of zero growth is data, not failure. Two months of zero indexing is
  a technical problem — escalate to coverage-report debugging.

---

## 2. UTM convention

All CTAs on SEO pages that lead to conversion surfaces carry UTMs so GA4 and
Whop can attribute signups/sales back to the page family.

Pattern:

```
utm_source   = seo                      # always "seo" for organic-driven CTAs
utm_medium   = organic
utm_campaign = <page-family>[-<slug>]   # e.g. vs-loom, apps-bloomrecorder, solve-transcribe-audio-to-text
utm_content  = <cta-slot>               # hero, mid, cta, footer, sticky
```

Examples:

```
/webinar/?utm_source=seo&utm_medium=organic&utm_campaign=vs-loom&utm_content=cta
/webinar/?utm_source=seo&utm_medium=organic&utm_campaign=apps-bookslot&utm_content=hero
/onetime-suite-bundle/?utm_source=seo&utm_medium=organic&utm_campaign=solve-monitor-website-uptime&utm_content=mid
/checkout/bloomrecorder/?utm_source=seo&utm_medium=organic&utm_campaign=vs-loom&utm_content=cta
```

Rules:

- `utm_campaign` names match the URL family: `vs-*`, `apps-*`, `solve-*`,
  `categories-*`, `blog-*`, `comparison-*`, `graveyard`.
- Lowercase only, hyphens not underscores, no dates in campaign names (dates
  belong in the GA4 time range, not the campaign label).
- Never put UTMs on internal navigation links — only on CTAs that leave the
  content page for a conversion surface (`/webinar/`, `/checkout/`,
  `/onetime-suite-bundle/`, Whop).

---

## 3. Setup checklist (do once, verify monthly)

- [ ] **GSC property verified** for `onetimesuite.com` (domain property preferred — covers http/https and subdomains).
- [ ] **Sitemap index submitted** in GSC → Sitemaps: `https://onetimesuite.com/sitemap.xml`. Status shows "Success"; re-check after each big build wave. (It's also linked in `robots.txt`, so Bing/Yandex discover it on their own.)
- [ ] **IndexNow key set up** — see `scripts/submit-index.js`; run it after each content wave (`node scripts/submit-index.js --since 7` submits all sitemap URLs to Bing/Yandex).
- [ ] **GA4 events to watch** (property `G-QJ65NLXTY5`): `page_view` by landing page; scroll/click events on `/webinar/`; outbound clicks to Whop checkout; mark webinar-signup and checkout-start as **key events** in GA4 → Admin → Events.
- [ ] **Microsoft Clarity** (free heatmaps + session recordings) installed on:
  - `/` (homepage)
  - `/webinar/`
  - top 10 `/vs/` pages by GSC impressions
  - top 5 app pages (`/apps/<slug>/`) by GSC impressions
  Watch recordings monthly for rage-clicks on CTAs and scroll drop-off before the first CTA.
- [ ] **Ahrefs Webmaster Tools** free tier verified on the property (backlink + technical audit data; no paid plan needed yet).
- [ ] **Price monitor baseline** recorded: `node scripts/price-monitor.js --update`, then weekly cron. Verify any CHANGED result manually before writing content about a competitor price change.

---

## 4. Monthly "rank & bank" review (fill-in template)

Copy this block, fill it in on the first Monday of each month.

```markdown
## Rank & Bank — <Month YYYY>

### Data pulled
- GSC date range: <last 28 days>   GA4 range: <same>   Reviewer: <name>

### A. Positions 4–10 (so close — push for snippets)
| Query | Page | Position | Impressions | Action (add FAQ schema block / tighten H2 to the question / add comparison table) |
|---|---|---|---|---|
| | | | | |

### B. Positions 11–20 (internal links + content refresh)
| Query | Page | Position | Impressions | Action (link from which higher-authority page / what section to expand with real data) |
|---|---|---|---|---|
| | | | | |

### C. High impressions, low CTR (<1.5% with >200 impressions — rewrite titles)
| Query | Page | Impressions | CTR | New title angle (number + competitor name + "one-time" hook) |
|---|---|---|---|---|
| | | | | |

### D. High traffic, low conversion (fix the CTA, not the content)
| Page | Organic sessions | Webinar clicks | Sales attributed | CTA fix (move above fold / change copy to price-anchor / add UTM) |
|---|---|---|---|---|
| | | | | |

### E. Winners to clone
- Page/query that outperformed: <…> — what pattern made it work? <…>
- 3 new pages to produce from that pattern next month: <…>

### F. Competitor price changes (from scripts/price-monitor.js, MANUALLY VERIFIED)
| Competitor | Old → New price | Verified on (date, URL) | Content action (update /vs/ page? new blog post?) |
|---|---|---|---|
| | | | |

### G. Decisions
- Keep doing: <…>
- Stop doing: <…>
- One experiment for next month: <…>
```

---

## 5. What NOT to track yet (and why)

- **AI-mention counting** (ChatGPT/Perplexity "did it recommend us") — manual,
  noisy, non-repeatable, and unactionable at our volume. Revisit when organic
  sessions exceed ~1k/month; before that it's vanity.
- **Paid rank trackers** (Ahrefs/SEMrush/Serpstat subscriptions) — GSC gives
  positions for free on queries that actually got impressions, which is all
  that matters before month 3. Buy tooling when you have >500 tracked
  keywords, not before.
- **Domain Rating / Domain Authority scores** — third-party proxies that lag
  reality by months and change nothing you do this quarter.
- **Daily position checking** — positions fluctuate ±5 daily on new pages;
  weekly GSC pulls are the right cadence. Daily checking produces anxiety,
  not insight.
- **Impression share vs competitors** — meaningless until we rank top 5 for
  anything commercially valuable.
- **Social traffic breakdowns** — the SEO operation's job is organic search;
  social UTMs are a separate dashboard.
