# Competitor Response Playbook — Price-Increase Rapid Response

**What this is:** the weekly monitoring habit plus the 4-hour response sequence for when a competitor raises prices — the single best marketing moment a pay-once suite gets.
**How to use it:** run the monitor weekly; when a real change is confirmed, execute the sequence top to bottom. Every public claim follows the honesty rules at the bottom — one misquoted price costs more credibility than ten price hikes earn.

---

## Monitoring (weekly, ~15 minutes)

- [ ] Run the price monitor: `node scripts/price-monitor.js` (fetches the 12 competitor pricing pages in `scripts/price-watch.json`, diffs against the last snapshot in `scripts/price-snapshots.json`, and reports added/removed dollar amounts. First run records the baseline; use `--update` after reviewing, `--json` for machine-readable output.)
- [ ] Watch the competitors that matter most (mapped in the README table): Loom, Calendly, Typeform, Buffer, Otter.ai, FreshBooks, Linktree, SmallPDF, remove.bg, Submagic, Wispr Flow, UptimeRobot, TinyPNG Pro, Bitly, Trello, Plausible, Mailchimp, Transistor, Notion, Zendesk.
- [ ] Also watch for: plan removals ("we're discontinuing the free tier"), feature paywalls, per-seat changes, and acquisitions — all are response-worthy, not just price hikes.
- [ ] Log every check (date, competitor, old price, new price, source URL) — the log feeds `/price-tracker`-adjacent content and the "as of" stamps.

---

## The 4-hour response sequence

Triggered only by a **verified** change. Speed matters, but accuracy outranks speed at every step.

### Hour 0–1: Verify on the real page FIRST

- [ ] Open the competitor's actual pricing page yourself. Screenshot it with a visible date.
- [ ] Confirm it's a real change, not an A/B test, regional pricing, or a cached page (check in an incognito window + one secondary source: their changelog, a user report, an archived snapshot).
- [ ] Record: exact old price, exact new price, plan names, effective date, source URL.
- [ ] If anything is ambiguous — **do not post**. A wrong "they raised prices!" claim is a gift to the competitor.

### Hour 1–2: Update the site's comparison pages

- [ ] Update the competitor's `compPrice`/`compYr` in the product data (`src/products.js` / `src/products-51-100.js` / `src/extra-products.js`).
- [ ] Rebuild so the change propagates to the relevant `/vs`, `/compare`, `/alternatives`, `/calculator` and `/price-tracker` pages.
- [ ] Add an "as of [date]" stamp wherever the new price appears.
- [ ] `node build.js && node scripts/check-links.js`, verify the changed pages render correctly.

### Hour 2–3: Post the factual comparison

Post on X and LinkedIn — factual, not gleeful. Template:

> "[Tool] just raised its price from $[old]/mo to $[new]/mo — verified on their pricing page today ([date]): [link to their pricing page].
>
> That's now ~$[yearly]/yr for [what it does]. [Our app] does [the core job] for $[price], once — you own it, [it runs locally / you self-host it], and there's a free MIT version on GitHub.
>
> Their tool is genuinely good at [one true thing]. If the new price is worth it to you, stay. If it isn't: onetimesuite.com/[slug]/"

Rules for the post: link their pricing page, include the date, concede one genuine strength of their product, no mocking their users, no "greedy" framing — the math does the talking.

### Hour 3–4: Blog post + community note

- [ ] **Blog post** — template title: **"[Tool] raised prices: your options"**. Structure:
  1. What changed (old → new, effective date, link to their pricing page, "as of [date]").
  2. What it now costs per year at the affected tiers.
  3. The honest options: (a) stay — who it still makes sense for; (b) the free MIT MVP — who it's enough for; (c) the paid full app — who it's for, $[price] once.
  4. A migration note if one exists (export/import steps), otherwise omit.
- [ ] **Newsletter / WhatsApp note** — 3 lines max:
  > "Heads up: [Tool] raised prices to $[new]/mo ([date], their pricing page: [link]). That's ~$[yearly]/yr now. [App] is $[price] once, and the free version is on GitHub: [repo link]. Full breakdown: [blog post link]"

---

## Honesty rules (non-negotiable)

1. **Never misquote their pricing.** Verify on the live page, screenshot it, link it.
2. **"As of <date>" on every price claim** — theirs and ours. Prices change; the stamp keeps old posts honest.
3. **Always link their pricing page.** Confidence in your own math means sending people to check theirs.
4. **Acknowledge their strengths.** One true sentence about what the competitor does well makes the comparison credible — and keeps you honest about where your app actually wins.
5. **No pile-ons in their community.** Don't post the comparison in the competitor's subreddit/forum/Discord unless their rules explicitly allow competitor commentary — and even then, disclose you're the maker of the alternative.
6. **Update or expire old claims.** When a competitor's price changes again, refresh the old blog post and comparison pages rather than leaving stale numbers live.
7. **Bundle claims stay fixed:** the only urgency you may cite is the real, public pricing model ($97 start, +$1/sale, $997 cap during the build, $1,997 after). Never invent a "response sale."
