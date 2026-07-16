# OneTimeSuite — Web Demo Launch Runbook

How to ship an in-browser demo for an app to `onetimesuite.com/<slug>/demo/`.
This is the exact, repeatable process ("build the demo" = do this).

## Architecture

- Demos are **single self-contained HTML files**: `src/<slug>-demo.html`.
- `build.js` copies each `src/<slug>-demo.html` → `public/<slug>/demo/index.html`
  for every slug in the `DEMOS` set (near top of `build.js`).
- Demos run **100% client-side** (no backend needed). Heavy models (e.g. Whisper
  via `@huggingface/transformers` from CDN) stream in the browser.
- Every demo embeds the central ad server and a Whop buy link, and gates free
  usage with `localStorage` (see below).

## Conventions (copy from an existing demo, e.g. `src/captionly-demo.html`)

1. `<script src="/ads/ad.js" async></script>` in `<head>` + an ad slot:
   `<div class="ad" data-ots-ad="728x90">Advertisement</div>`.
2. Buy button → `https://whop.com/benjisaiempire/<slug>` (from `src/whop-links.json`).
3. Free-usage gate in `localStorage`:
   - `captionly` model: **1 free export/day** (`{date,count}` under a `*_demo` key).
   - Simpler apps: **1 free use ever** (`<slug>_demo_used` flag) → paywall modal.
4. Optional **email capture** before first free action: modal → validate → store
   in `localStorage` → `POST` to `window.__CAPTIONLY_LEAD` (`/api/lead`). NOTE:
   the `/api/lead` collector is not built yet — emails are captured locally until
   a backend endpoint exists.
5. Keep it self-contained: inline CSS/JS, embed data (e.g. preset catalog) and the
   logo as a `data:` URI so the single file has no local asset deps.

## Steps to launch a demo

1. **Build the app's demo source.** For apps with a rich UI (like Captionly), keep
   the demo app in the product repo under `website/app/` and assemble it into one
   file. Captionly uses an assembler that inlines `styles.css` + `app.js` +
   `presets.json` + logo and sets `window.__CAPTIONLY_*` globals, writing
   `onetimesuite-com/src/captionly-demo.html`. Re-run the assembler after edits.
2. **Register the slug:** add `'<slug>'` to the `DEMOS` set in `build.js`.
3. **(If launching)** add `'<slug>'` to `AVAILABLE_SLUGS` in `build.js` so the hub
   moves it from "Coming soon" to "Available now".
4. **Build + verify locally:**
   ```
   node build.js
   # serve public/ and open http://localhost:PORT/<slug>/demo/
   ```
5. **Deploy:**
   ```
   git add build.js src/<slug>-demo.html
   git commit -m "Add <Brand> web demo at /<slug>/demo/"
   git push origin HEAD                       # public site repo, safe
   # trigger Coolify rebuild (app uuid byc1vxrtnbq8vrvaj1vxnc3z):
   curl -s -X GET "http://212.28.184.24:8000/api/v1/deploy?uuid=byc1vxrtnbq8vrvaj1vxnc3z" \
     -H "Authorization: Bearer $COOLIFY_TOKEN"
   ```
   The Coolify app runs `node build.js` server-side and serves `public/` via nginx.
6. **Confirm live:** poll `https://onetimesuite.com/<slug>/demo/` until HTTP 200
   (the VPS is busy; a rebuild can take a few minutes).

## Facts

- Site repo: `bensblueprints/onetimesuite-com` (public). Coolify app
  `byc1vxrtnbq8vrvaj1vxnc3z`, project "OneTime Suite".
- Coolify API base: `http://212.28.184.24:8000` (Contabo). Token in the operator's
  private notes — never print it; read into an env var and use in the header only.
- Existing demos: iconforge, sigcraft, pdfsmith, wrangle, textract, memeforge,
  paletteforge, shrinkray, bloomrecorder, quillpad, **captionly**.
