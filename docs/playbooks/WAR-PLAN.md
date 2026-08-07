# WAR-PLAN — 30/60/90 Day Execution Sprint

**What this is:** the week-by-week marketing execution plan for OneTime Suite, written for the current reality: site live, 65 of 102 apps launched, SEO factory pages just shipped (`/vs`, `/compare`, `/alternatives`, `/apps`, `/solve`, `/categories`, `/calculator`, `/price-tracker`, `/manifesto`, `/graveyard`, `/webinar`, `/press`, `/events`, `/research`, `/stacks`).
**How to use it:** work the weeks in order, check boxes as you finish, and don't start Acceleration until the Foundation blockers (dead videos, broken purchase flow) are closed. Bracketed items need the founder's real numbers.

---

## Ground rules

- Every price, app name and feature in public content must match the README table (e.g. BloomRecorder $29, Bookslot $99, Linkleaf $19, WisperTalk $49).
- Never invent sales figures, user counts or testimonials. Use real numbers or say nothing.
- Bundle mechanics are fixed per `src/sales-data.js`: starts at **$97**, **+$1 per sale**, caps at **$997** during the 100-day build, then **$1,997** once all apps ship. Individual apps are always sold separately at `onetimesuite.com/apps/`.
- Where a tactic risks a platform ban (Reddit, HN, directories), follow the legitimacy rules in `outreach-templates.md` — genuine participation first, disclose you're the maker, one thread per community.

---

## Phase 1 — Foundation (Days 1–30)

Goal: nothing broken, everything measurable, first content shipped.

### Week 1 (Days 1–7): Measurement & breakage

- [ ] Verify Google Search Console for onetimesuite.com; submit the sitemap; request indexing on the 15 new factory sections.
- [ ] Check YouTube Studio for the 27 dead videos per `NEXT-UP.md` — if a batch action flipped them private, restore to unlisted/public and skip re-recording. List of the 27 slugs is in `NEXT-UP.md` §1.
- [ ] Fix the 3 stale YouTube titles flagged in `NEXT-UP.md` (title quotes old price) in YouTube Studio **and** `src/youtube-videos.json`.
- [ ] Run an end-to-end purchase test: buy one app on Whop with a real card, confirm delivery email, installer/download, and license/access work. Refund after. Document every snag.
- [ ] Spot-check that each live landing page's price matches the live Whop price (the 8 pre-existing launches called out in `NEXT-UP.md` §2: SigCraft $15, BloomRecorder $29, WisperTalk $49, Linkleaf $19, Captionly $34, Clip Pipeline $49, Viral Invoice $99, WholeTeam $19).
- [ ] Confirm the price tracker and calculator pages render the current `salesCount` and bundle price correctly.
- [ ] Set up one analytics baseline screenshot (GSC + site analytics) as the day-0 record.

### Week 2 (Days 8–14): Video repair + first Shorts

- [ ] Re-record/re-upload the dead videos that couldn't be restored (batch of ~9 per session, 3 sessions). After each: update `videoId`/`title` in `src/youtube-videos.json`, regenerate the v2 page (`cd site-v2 && node generate.js <slug>`, copy `dist/<slug>/` → `v2-pages/<slug>/`), rebuild.
- [ ] Record the first 10 YouTube Shorts using the 60-second template in `video-scripts.md` (one afternoon; scripts for bloomrecorder, bookslot, linkleaf, wispertalk, captionly, pdfsmith, cutaway, whisperdesk, shrinkray, upwatch are already written there).
- [ ] Publish 3 of the 10 Shorts; cross-post each to TikTok, Reels, LinkedIn and X per the distribution table in `video-scripts.md`.
- [ ] Write the pinned WhatsApp message from `whatsapp-pinned-message.md` and pin it in the group.

### Week 3 (Days 15–21): Directory & comparison presence

- [ ] Submit flagship apps to directories per the checklist in `outreach-templates.md` §d: AlternativeTo, SaaSHub, StackShare, Indie Hackers (Product Hunt and G2/Capterra are scheduled in Phase 2).
- [ ] Publish the first 5 daily X/LinkedIn posts using the formulas in `content-calendar.md` (app drop ×2, subscription roast ×1, behind-the-build ×1, user win ×1 — use `[founder inserts real user quote]` if none exists yet).
- [ ] Send the first 5 listicle-author pitches (`outreach-templates.md` §a), one per target "best X software" article.
- [ ] Publish remaining 7 Shorts across the week (1/day max per platform).

### Week 4 (Days 22–30): Webinar + WhatsApp engine

- [ ] Record the 12-minute webinar using `webinar-script.md`; upload; wire the `/webinar` page CTA to Whop.
- [ ] Run the WhatsApp weekly rhythm from `content-calendar.md` for one full week (Mon–Sun) and keep the 80/20 value-to-ask split.
- [ ] Run the first webinar promo cycle: WhatsApp Friday reminder + X/LinkedIn post + email/WhatsApp to event contacts.
- [ ] Review GSC: which factory pages got impressions; note the top 5 queries for Phase 2 content.
- [ ] Retrospective: what shipped, what slipped, real sales count `[N]` — update `src/sales-data.js` per its update protocol.

**Phase 1 exit criteria:** zero dead embedded videos, purchase flow proven end-to-end, 10 Shorts live on 5 platforms, webinar live, 4 weeks of WhatsApp rhythm done.

---

## Phase 2 — Acceleration (Days 31–60)

Goal: turn the factory on — volume video, launch moments, research as a traffic asset.

### Week 5 (Days 31–37): Video factory

- [ ] Establish the batch cadence: one afternoon per week, 10 Shorts per session, using the script template + thumbnail spec in `video-scripts.md`.
- [ ] Write 10 new scripts for the next tier of apps (pull names/prices from the README table — e.g. Trimly $79 vs Bitly, Statfox $129 vs Plausible, Boardly $49 vs Trello, Postbird $149 vs Mailchimp, Castport $99 vs Transistor).
- [ ] Batch-record session #2; schedule 1/day.

### Week 6 (Days 38–44): Product Hunt launches

- [ ] Launch flagship app #1 on Product Hunt (BloomRecorder $29 vs Loom is the strongest opener). Prep per the PH section of `outreach-templates.md` §d: assets, first comment (maker disclosure), gallery, launch-day WhatsApp/email push.
- [ ] Launch flagship app #2 later in the week only if #1 held quality — never two same-day launches.
- [ ] Post honest launch recaps (what worked, what flopped) on X/LinkedIn and Indie Hackers.

### Week 7 (Days 45–51): Research reports

- [ ] Finalize research report #1 on `/research` (e.g. subscription price-increase tracker using real, sourced competitor prices with "as of" dates — see honesty rules in `competitor-response-playbook.md`).
- [ ] Promote report #1: 3 posts, 1 email/WhatsApp drop, 10 personalized pitches to newsletter writers who cover SaaS pricing.
- [ ] Finalize research report #2 (e.g. "what a 10-tool subscription stack costs per year" using the real compYr figures: Loom $180, Typeform $348, Buffer ~$360, Otter.ai $204, FreshBooks $228 — always with source links and dates).

### Week 8 (Days 52–60): Event flywheel + UGC seed

- [ ] Run the full event playbook (`event-playbook.md`) for the next conference: `/events/<slug>/` page, QR cards with UTM links, "heading to X" posts, organizer guest-post pitch (`outreach-templates.md` §b) sent 2+ weeks ahead.
- [ ] Event week: 30-second in-person demos, photo-with-permission posts, everyone met added to WhatsApp within 24h.
- [ ] Post-event recap content ("[City] founders are ditching these 5 tools") within 48h.
- [ ] Recruit the first `[3–5]` WhatsApp members to share their own stacks for the Phase 3 UGC program — real people, real tools, no scripting.

**Phase 2 exit criteria:** 30+ total Shorts live, 2 Product Hunt launches done, 2 research reports promoted, 1 full event flywheel executed with UTM-tagged webinar traffic to prove it.

---

## Phase 3 — Domination (Days 61–90)

Goal: compound what works, refresh what's ranking, plan the finale.

### Week 9 (Days 61–67): Comparison-page refresh cycle

- [ ] Pull GSC data: rank all `/vs`, `/compare` and `/alternatives` pages by impressions.
- [ ] Refresh the top 20%: update competitor prices with "as of <date>" stamps, add the newest app screenshots, tighten intros. Never misquote a competitor — verify on their live pricing page first.
- [ ] Add internal links from refreshed pages to the relevant app pages and the bundle.

### Week 10 (Days 68–74): UGC stacks program live

- [ ] Launch the stacks program: members post their real "my one-time stack" (which suite apps replaced which subscriptions, with real prices) on X/LinkedIn and tag the suite. Feature the best on `/stacks`.
- [ ] Rules: no payment for posts, no scripted wording, disclose membership, real setups only.
- [ ] Publish the first stacks roundup post.

### Week 11 (Days 75–81): Podcast + press push

- [ ] Send 10 podcast pitches using `outreach-templates.md` §c (the 100-apps-in-100-days story). Personalize every one.
- [ ] Update `/press` with real milestones only: apps shipped `[65+N]`, days remaining, current bundle price from `sales-data.js`.
- [ ] Second event flywheel if a conference falls in this window.

### Week 12 (Days 82–90): Finale countdown planning

- [ ] Draft the finale plan for when the 100-day build completes and the bundle moves to $1,997: countdown content calendar, price-tracker-driven posts ("price is $[real current price] today — it becomes $1,997 when the build completes"), final webinar with live Q&A.
- [ ] Prepare the "cap watch" content: if the bundle approaches the $997 cap, that is a real, factual urgency story — tell it with exact numbers, never manufactured scarcity.
- [ ] 90-day retrospective against the day-0 baseline: GSC impressions, Shorts views, WhatsApp group size, bundle sales `[N]`, individual app sales `[N]`. Write it up honestly — including what failed.

**Phase 3 exit criteria:** refresh cycle is a standing weekly habit, UGC program producing real member posts weekly, finale countdown fully scripted and scheduled.

---

## Standing weekly cadence (all 90 days)

| Cadence | Item | Reference |
|---|---|---|
| Daily | 1 X/LinkedIn post + 1 Short cross-posted to 5 platforms | `content-calendar.md`, `video-scripts.md` |
| Weekly | 1 batch-recording afternoon (10 Shorts) | `video-scripts.md` |
| Weekly | WhatsApp Mon–Sun rhythm | `content-calendar.md` |
| Weekly | `node scripts/price-monitor.js` → competitor response if anything moved | `competitor-response-playbook.md` |
| Weekly | GSC review → refresh worst/best comparison pages | this file, Week 9 |
| Per event | Full before/during/after flywheel | `event-playbook.md` |
| Per sale | Bump `salesCount` in `src/sales-data.js`, rebuild | `src/sales-data.js` protocol |
