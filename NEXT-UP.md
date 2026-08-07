# NEXT UP — OneTimeSuite launch tracker

_Last updated 2026-07-27 after the 57-app launch (commit `08a0cde`). 65 apps are live in Available now on onetimesuite.com._

Work items, in priority order. Check boxes as you go.

---

## 1. Videos — 27 launched apps have DEAD videos

All 57 newly launched apps had unlisted YouTube videos recorded in `src/youtube-videos.json`, but 27 of those video IDs now return 401 (deleted or flipped to private). The embedded players on those landing pages are broken right now.

**First:** check YouTube Studio — if a batch action flipped them to private, just set them back to unlisted/public and skip re-recording.

**Re-make / re-upload videos for (dead IDs confirmed 2026-07-27):**

- [ ] Paletteforge (`paletteforge`)
- [ ] PDFsmith (`pdfsmith`)
- [ ] Quillpad (`quillpad`)
- [ ] Quotewell (`quotewell`)
- [ ] Reelsnag (`reelsnag`)
- [ ] Renewcheck (`renewcheck`)
- [ ] Shrinkray (`shrinkray`)
- [ ] Streakly (`streakly`)
- [ ] Textract (`textract`)
- [ ] Voicebarn (`voicebarn`)
- [ ] WhisperDesk (`whisperdesk`)
- [ ] Wrangle (`wrangle`)
- [ ] Pingcron (`pingcron`)
- [ ] Postbird (`postbird`)
- [ ] Queuecraft (`queuecraft`)
- [ ] Serpdeck (`serpdeck`)
- [ ] Shipnotes (`shipnotes`)
- [ ] Signboard (`signboard`)
- [ ] Snapfleet (`snapfleet`)
- [ ] Snipvault (`snipvault`)
- [ ] Statfox (`statfox`)
- [ ] Timevault (`timevault`)
- [ ] Upwatch (`upwatch`)
- [ ] Vaultkeeper (`vaultkeeper`)
- [ ] Trimly (`trimly`)
- [ ] Postdock (`postdock`)
- [ ] Scantrail (`scantrail`)

**Also fix stale titles** (title quotes the old price): Chatterbox ("$24 once" → $69), Inkseal ("$59 once" → $149), Serpdeck ("$39 once" → $99). Fix in YouTube Studio and in `src/youtube-videos.json`.

**After each re-upload:**
1. Update `videoId` + `title` in `src/youtube-videos.json`.
2. Regenerate that v2 page: `cd site-v2 && node generate.js <slug>` then copy `dist/<slug>/` → `v2-pages/<slug>/` (videoId is baked into the page).
3. `node build.js`, commit, push, trigger Coolify deploy.

**Decide privacy:** all videos are currently `unlisted`. Fine while embedded, but flip to `public` when you want YouTube search traffic.

---

## 2. Landing pages — get them spot on

Per-page checklist for all 65 live apps (do a pass page by page):

- [ ] Price shown == live Whop price (done for the 57; **spot-check the 8 pre-existing launches**: sigcraft $15, bloomrecorder $29, wispertalk $49, linkleaf $19, captionly $34, clip-pipeline $49, viral-invoice $99, wholeteam $19)
- [ ] Video embed plays (see §1 — 27 broken)
- [ ] Buy button → `/checkout/<slug>/?plan=...` → Whop embed loads the right plan/price
- [ ] FAQ / feature copy quotes the current price
- [ ] Page renders on mobile width
- [ ] `/thanks/<slug>/` page loads (post-purchase redirect target)

**Structural gaps to fix once (code, not per-page):**

- [ ] **Download buttons:** `site-v2/generate.js` `RELEASE_URLS` only has captionly + bloomrecorder. Add GitHub Releases URLs for every launched desktop app (all 21 have public v1.0.0 releases) so pages get the installer download button. Web apps should link their repo/self-host docs.
- [ ] **Demo buttons:** 12 in-browser demos exist (`build.js` DEMOS set) but v2 pages only link demos for captionly + cutaway (`generate.js` DEMO_SLUGS). Wire the other 10 (iconforge, sigcraft, pdfsmith, wrangle, textract, memeforge, paletteforge, shrinkray, bloomrecorder, quillpad).
- [ ] **End-to-end purchase test:** buy one cheap app yourself (e.g. deepdesk $15), confirm: checkout completes → redirect to `/thanks/<slug>/` → you can actually get the installer (Whop delivery). Refund after.
- [ ] **OG/social cards:** share a few product URLs on social/Twitter card validator, confirm title/price/image look right.

---

## 3. Test all the software

Standard checklist per app (desktop): installs clean → launches → core flow works → works offline (desktop apps) → version is the shipped one → exports/output correct → uninstalls clean.

Download source: GitHub Releases on each app's repo (see `repo` in `src/products*.js`), mirrored in Google Drive `Software Desktop Downloads/`. **Note: no Mac here — dmg testing needs a Mac or a volunteer.**

### Desktop apps (Windows installer available)

- [ ] SigCraft — generate signature from each template, copy into Gmail
- [ ] BloomRecorder — record screen, export MP4 + GIF
- [ ] WisperTalk — full dictation flow
- [ ] Captionly — caption a short clip, export
- [ ] Cutaway — batch background removal
- [ ] Contractly — fill a template, export PDF
- [ ] Deepdesk — Pomodoro + dashboard flow
- [ ] Docsmith API — import OpenAPI spec, export docs site
- [ ] Iconforge — icon set generation + export
- [ ] Keyloop — add TOTP account, export encrypted vault
- [ ] Maptrail — crawl a site, export XML sitemap
- [ ] Memeforge — make + export a meme
- [ ] Mockcraft — mockup with perspective warp, batch export
- [ ] Paletteforge — palette generation + export
- [ ] PDFsmith — merge/split/watermark a PDF
- [ ] Quillpad — editor flow
- [ ] Quotewell — build catalog, export branded quote PDF
- [ ] Reelsnag — core reel download flow
- [ ] Renewcheck — add domain, expiry check
- [ ] Shrinkray — batch compress + convert images
- [ ] Streakly — habit tracking flow
- [ ] Textract — OCR a document image
- [ ] Voicebarn — voice flow
- [ ] WhisperDesk — transcribe a video drop (TXT + SRT export)
- [ ] Wrangle — core flow
- [ ] Linkleaf — link-in-bio build + publish
- [ ] WholeTeam (wholeteam) — host + Member install, connect
- [ ] Clip Pipeline — pipeline run end-to-end

### Web/self-hosted apps (36 launched) — verify installer/launcher runs and the app comes up

- [ ] boardly, bookslot, bravowall, castport, chatlet, chatterbox, docwell, doortracker, droplink, famping, formforge, hawkwatch, hearback, hookscope, inkpress, inkseal, keymaster, ledgerly, overlayr, pingcron, postbird, queuecraft, serpdeck, shipnotes, signboard, snapfleet, snipvault, statfox, timevault, upwatch, vaultkeeper, billcraft, trimly, cardsmith, postdock, scantrail — one smoke pass each: run it, hit the main screen, do the one thing the app exists for.

**Important:** these 36 are sold as desktop downloads but catalogued as web/self-hosted — confirm what the buyer actually receives matches what the page promises.

---

## 4. Finish launching everything

**Blocked on Whop product creation** (Composio's Whop toolkit can upload files but can't create products — needs the direct Whop API write key from your original publish run):

- [ ] AutoClipperPro — repo + v1.0.0 release + Win installer ready; needs Whop product + catalog entry + page
- [ ] LeadManager — same (note: Drive holds raw `LeadManager.exe`, no Setup installer)
- [ ] AtomicScraper Suite — repo + release exist; no Drive folder, needs catalog + Whop
- [x] Screen Recorder — skip: rebranded to BloomRecorder (already live)

**Still in Coming soon (39 apps):** askback, billoop, certwatch, citewatch, clickmap, clientdesk, deskly, eventcraft, feedloft, forumly, hirestack, ledgerlitehome, lessonforge, linkguard, listcraft, logbin, menuly, pitchcraft, postcraft, pulsecheck, punchcard, quizcraft, rampcheck, redirectly, reflink, remindly, resumecraft, roster, secretbox, shiftly, slidecraft, snapreceipt, splitpoint, starstack, syncvault, upkeepstatus, utmcraft, vaultly, voicebox.

These aren't in the Drive archive — before any launch each needs: build verified → installer uploaded to Drive + GitHub release → Whop price verified → flip `AVAILABLE_SLUGS`. Same pipeline as this launch.

---

## 5. Housekeeping

- [ ] Rotate/move `COOLIFY_TOKEN` out of the plain env var (it printed to a terminal log this session)
- [ ] `scripts/check-links.js` reports 12 pre-existing false positives in demo pages (template literals) — safe to ignore or teach the checker to skip them
- [ ] Bundle page (`/onetime-suite-bundle/`) math changed with the 36 price updates — sanity-check the bundle price still makes sense vs. sum of apps
