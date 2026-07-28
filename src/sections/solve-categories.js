/* solve-categories.js — search-intent "job to be done" pages and category hubs.
 *
 * Emits:
 *   /solve/<problem>/        24 pages — one per matrix.problems entry
 *   /solve/                  hub of all 24 problems, loosely grouped
 *   /categories/<category>/  8 hubs — one per matrix.categories entry
 *   /categories/             hub of the 8 categories
 *
 * Sitemap set: 'vs' (per docs/seo-factory/CONTRACT.md §5).
 */
module.exports = function (ctx) {
  const { write, page, reg, esc, attr, SITE, crumbs, matrix, sales, schema, bySlug, fmt } = ctx;

  /* ctx.GH is provided by build.js but not by the test harness — fall back to
   * the same org URL so the section works under both. */
  const GH = ctx.GH || 'https://github.com/bensblueprints';

  /* ---------- derived lookups (deterministic: sources are fixed arrays) ---------- */
  const compByApp = {}; // appSlug -> first competitor slug (matrix.competitors is name-sorted)
  for (const c of matrix.competitors) for (const a of c.apps) if (!(a in compByApp)) compByApp[a] = c.slug;
  const catByApp = {}; // appSlug -> first category slug
  for (const c of matrix.categories) for (const s of c.appSlugs) if (!(s in catByApp)) catByApp[s] = c.slug;

  const resolve = slugs => slugs.map(s => bySlug[s]).filter(Boolean);

  /* Suite price — REAL numbers from ctx.sales only (contract §3). */
  const suitePrice = sales.hundredDaysComplete
    ? sales.postLaunchPrice
    : Math.min(sales.cap, sales.basePrice + sales.incrementPerSale * sales.salesCount);
  const suitePriceNote = sales.hundredDaysComplete
    ? 'the full launch is complete — this is the final suite price'
    : 'the price rises $1 with every sale during the 100-days launch';

  /* Clamp to the 120–160 desc window on a word boundary (page() clamps too,
   * but we aim correct). */
  const clampDesc = s => {
    s = String(s).replace(/\s+/g, ' ').trim();
    if (s.length > 160) {
      const cut = s.slice(0, 158);
      s = cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:—–-]+$/, '') + '…';
    }
    if (s.length < 120) s += ' Pay once, own it forever.';
    return s;
  };

  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  /* ---------- shared fragments ---------- */
  const pCard = p => `
          <a class="p-card" href="/${p.slug}/">
            <span class="avail"><span class="dot" aria-hidden="true"></span>Available now</span>
            <span class="ico" aria-hidden="true">${p.icon}</span>
            <h3>${esc(p.brand)}</h3>
            <p class="one">${esc(p.oneliner)}</p>
            <div class="foot">
              <span class="sticker sm"><span class="amt">$${p.price}</span><span class="once">once</span></span>
              <span class="replaces">replaces ${esc(p.competitor)}<br>${esc(p.compPrice)}</span>
            </div>
          </a>`;

  const bundleBox = label => `
    <section aria-label="Get the whole suite">
      <div class="wrap">
        <div class="bundle-box">
          <div>
            <span class="stamp">${esc(label)}</span>
            <h2 style="margin:0.4rem 0 0.7rem;">The whole suite, one payment</h2>
            <p style="color:var(--ink-soft);">Every app on this page — plus the rest of the 102-app catalog — is in the OneTimeSuite bundle. The suite is ${fmt(suitePrice)} right now (${esc(suitePriceNote)}), and every app shipped later joins it for free.</p>
            <div class="btn-row" style="margin-top:1.3rem;">
              <a class="btn btn-solid" href="/onetime-suite-bundle/">See what's inside &rarr;</a>
            </div>
          </div>
          <span class="price-pair">
            <span class="was">subscriptions, forever</span>
            <span class="sticker big"><span class="amt">${fmt(suitePrice)}</span><span class="once">once · everything</span></span>
          </span>
        </div>
      </div>
    </section>`;

  /* ============================================================
   * 1. /solve/<problem>/ — 24 job-to-be-done pages
   * ============================================================ */

  /* Short verb phrases per problem — used for the title tag, crumb label and
   * the "How to …" heading (the h1 stays the long-form one from the matrix). */
  const VERB = {
    'record-screen-for-clients': 'record your screen for clients',
    'caption-videos-automatically': 'caption videos automatically',
    'transcribe-audio-to-text': 'transcribe audio to text',
    'download-social-media-clips': 'download social media clips',
    'remove-image-backgrounds': 'remove image backgrounds',
    'compress-photos-without-quality-loss': 'compress photos without quality loss',
    'edit-pdfs-offline': 'edit PDFs offline',
    'schedule-meetings-without-back-and-forth': 'schedule meetings without the back-and-forth',
    'build-forms-and-surveys': 'build forms and surveys',
    'send-invoices-and-get-paid': 'send invoices and get paid',
    'manage-clients-and-leads': 'manage clients and leads',
    'schedule-social-media-posts': 'schedule social media posts',
    'monitor-website-uptime': 'monitor website uptime',
    'host-a-public-status-page': 'host a public status page',
    'create-short-links': 'create short links',
    'build-a-link-in-bio-page': 'build a link-in-bio page',
    'generate-qr-codes': 'generate QR codes',
    'design-email-signatures': 'design email signatures',
    'write-a-knowledge-base': 'write a knowledge base',
    'add-live-chat-to-your-site': 'add live chat to your site',
    'run-a-kanban-board': 'run a kanban board',
    'track-time-and-bill-hours': 'track time and bill hours',
    'build-habits-and-stay-focused': 'build habits and stay focused',
    'keep-a-private-notes-system': 'keep a private notes system',
  };

  for (const prob of matrix.problems) {
    const apps = resolve(prob.appSlugs);
    if (!apps.length) { console.warn('SKIPPED problem (no resolvable apps):', prob.slug); continue; }
    const top = apps[0];
    const verb = VERB[prob.slug] || prob.title.replace(/-/g, ' ');
    const url = `${SITE}/solve/${prob.slug}/`;

    /* How-to steps: the top app's real steps; fall back to its first 3
     * features if it has none. */
    const steps = (top.steps && top.steps.length)
      ? top.steps
      : top.features.slice(0, 3).map(f => [`Open ${f[1]}`, f[2]]);

    /* "Which one should I pick?" — guidance from the apps' kinds. Products
     * with no kind field are desktop apps (schema.js treats them the same). */
    const desktopApps = apps.filter(p => p.kind !== 'web');
    const webApps = apps.filter(p => p.kind === 'web');
    const pickParts = [];
    if (desktopApps.length) pickParts.push(`${desktopApps.map(p => p.brand).join(', ')} ${desktopApps.length > 1 ? 'are desktop apps' : 'is a desktop app'} — everything runs locally on your machine, so your files stay private and the app works offline`);
    if (webApps.length) pickParts.push(`${webApps.map(p => p.brand).join(', ')} ${webApps.length > 1 ? 'are self-hosted web apps' : 'is a self-hosted web app'} — you run them on your own server or VPS, so your team can log in from anywhere while the data stays yours`);
    const pickAnswer = `Pick by where you want the software to live. ${pickParts.join('; ')}. Either way, every option here is a one-time purchase with MIT-licensed source on GitHub.`;

    const freeAnswer = `Yes. ${top.brand} — like every app in the suite — has a free, MIT-licensed MVP on GitHub (${GH}/${top.repo}). Buying gets you the signed installer, one-click setup and updates; the source is free forever.`;
    const oneTimeAnswer = `Yes. Every app on this page is a single payment — ${apps.map(p => `${p.brand} is $${p.price}`).join(', ')}. No renewal, no seats, no usage meter. The apps keep working even if you never pay again.`;

    const faqLd = schema.faqPageLd([
      ['Is there a free option?', freeAnswer],
      ['Which one should I pick?', pickAnswer],
      ['Are these really one-time?', oneTimeAnswer],
    ]);

    /* Cross-links: each app's /vs/ page (competitor derived from the matrix)
     * and its category hub, when they exist. */
    const crossLinks = [];
    for (const p of apps) {
      if (compByApp[p.slug]) crossLinks.push(`<a class="link" href="/vs/${p.slug}-vs-${compByApp[p.slug]}/">${esc(p.brand)} vs the subscription it replaces</a>`);
      if (catByApp[p.slug]) {
        const cat = matrix.categories.find(c => c.slug === catByApp[p.slug]);
        crossLinks.push(`<a class="link" href="/categories/${cat.slug}/">More ${esc(cat.name)} tools</a>`);
      }
    }

    const costRows = apps.map(p => {
      const sub = typeof p.compYr === 'number'
        ? `${esc(p.competitor)} — ${esc(p.compPrice)} (~$${p.compYr}/yr)`
        : `${esc(p.competitor)} — ${esc(p.compPrice)}`;
      return `<tr><td><a href="/${p.slug}/">${esc(p.brand)}</a></td><td class="us">$${p.price} once</td><td>${sub}</td></tr>`;
    }).join('\n            ');

    const body = `
    <section class="hero" aria-label="${attr(verb)}">
      <div class="wrap">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">OneTimeSuite</a> / <a href="/solve/">Solve</a> / ${esc(cap(verb))}</nav>
        <span class="stamp">${apps.length} pay-once ${apps.length > 1 ? 'tools' : 'tool'}</span>
        <h1>${esc(prob.h1)}</h1>
        <p class="lead">${esc(prob.intro)}</p>
      </div>
    </section>

    <section aria-label="Tools that solve this">
      <div class="wrap">
        <div class="section-head">
          <span class="stamp blue">Pay once, own forever</span>
          <h2>Tools that solve this</h2>
        </div>
        <div class="card-grid">${apps.map(pCard).join('')}
        </div>
      </div>
    </section>

    <section aria-label="How to">
      <div class="wrap">
        <div class="section-head">
          <span class="stamp">Three steps, no subscription</span>
          <h2>How to ${esc(verb)} with ${esc(top.brand)}</h2>
        </div>
        <div class="steps">
          ${steps.map((s, i) => `<div class="step"><span class="n">STEP 0${i + 1}</span><h3>${esc(s[0])}</h3><p>${esc(s[1])}</p></div>`).join('\n          ')}
        </div>
      </div>
    </section>

    <section aria-label="What it costs">
      <div class="wrap-narrow">
        <div class="section-head">
          <span class="stamp blue">The receipt</span>
          <h2>What it costs</h2>
        </div>
        <div class="tbl-wrap">
          <table class="receipt">
            <thead><tr><th>App</th><th class="us">You pay</th><th>Subscription it replaces</th></tr></thead>
            <tbody>
            ${costRows}
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section aria-label="Frequently asked questions">
      <div class="wrap-narrow">
        <div class="section-head">
          <span class="stamp">FAQ</span>
          <h2>Honest answers</h2>
        </div>
        <div class="faq-item"><h3>Is there a free option?</h3><p>Yes. ${esc(top.brand)} — like every app in the suite — has a free, MIT-licensed MVP on GitHub (<a href="${attr(`${GH}/${top.repo}`)}" rel="noopener">${esc(`${GH}/${top.repo}`)}</a>). Buying gets you the signed installer, one-click setup and updates; the source is free forever.</p></div>
        <div class="faq-item"><h3>Which one should I pick?</h3><p>${esc(pickAnswer)}</p></div>
        <div class="faq-item"><h3>Are these really one-time?</h3><p>${esc(oneTimeAnswer)}</p></div>
      </div>
    </section>

    <section aria-label="Related pages">
      <div class="wrap-narrow">
        <p class="mono-note">Keep digging:</p>
        <div class="related-strip">
          ${crossLinks.join('\n          ')}
        </div>
      </div>
    </section>`;

    write(`solve/${prob.slug}`, page({
      title: `${cap(verb)} | OneTimeSuite`,
      desc: clampDesc(prob.intro),
      canonical: url,
      jsonld: [
        crumbs([['OneTimeSuite', `${SITE}/`], ['Solve', `${SITE}/solve/`], [cap(verb), url]]),
        schema.itemListLd({ name: `Tools to ${verb}`, url, items: apps.map(p => [p.brand, `${SITE}/${p.slug}/`]) }),
        faqLd,
        schema.howToLd({ name: `How to ${verb} with ${top.brand}`, steps, url }),
      ],
      body,
    }));
    reg(`/solve/${prob.slug}/`, 'vs');
  }

  /* ============================================================
   * 2. /solve/ — hub of all 24 problems, loosely grouped
   * ============================================================ */
  const SOLVE_GROUPS = [
    ['Media & creative', ['record-screen-for-clients', 'caption-videos-automatically', 'transcribe-audio-to-text', 'download-social-media-clips', 'remove-image-backgrounds', 'compress-photos-without-quality-loss']],
    ['Documents & notes', ['edit-pdfs-offline', 'keep-a-private-notes-system', 'build-habits-and-stay-focused']],
    ['Business & money', ['schedule-meetings-without-back-and-forth', 'build-forms-and-surveys', 'send-invoices-and-get-paid', 'manage-clients-and-leads', 'run-a-kanban-board', 'track-time-and-bill-hours', 'write-a-knowledge-base']],
    ['Web presence & marketing', ['schedule-social-media-posts', 'monitor-website-uptime', 'host-a-public-status-page', 'create-short-links', 'build-a-link-in-bio-page', 'generate-qr-codes', 'design-email-signatures', 'add-live-chat-to-your-site']],
  ];
  const probBySlug = Object.fromEntries(matrix.problems.map(p => [p.slug, p]));

  const solveGroupsHtml = SOLVE_GROUPS.map(([name, slugs]) => {
    const probs = slugs.map(s => probBySlug[s]).filter(Boolean);
    if (!probs.length) return '';
    return `
      <div style="margin-bottom:2.4rem;">
        <div class="cat-head"><h2>${esc(name)}</h2><span class="count">${probs.length} problems</span></div>
        <div class="post-list">
          ${probs.map(pr => `<a href="/solve/${pr.slug}/"><h3>${esc(pr.h1)}</h3><p>${esc(clampDesc(pr.intro))}</p></a>`).join('\n          ')}
        </div>
      </div>`;
  }).join('');

  write('solve', page({
    title: 'Solve It Once — 24 Problems, Pay-Once Tools | OneTimeSuite',
    desc: 'Pick the job you need done — screen recording, captions, invoices, forms, uptime, QR codes — and find the pay-once tools that do it. No subscriptions, ever.',
    canonical: `${SITE}/solve/`,
    jsonld: [
      crumbs([['OneTimeSuite', `${SITE}/`], ['Solve', `${SITE}/solve/`]]),
      schema.itemListLd({ name: 'Problems solved by pay-once tools', url: `${SITE}/solve/`, items: matrix.problems.map(pr => [pr.h1, `${SITE}/solve/${pr.slug}/`]) }),
    ],
    body: `
    <section class="hero" aria-label="Solve">
      <div class="wrap">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">OneTimeSuite</a> / Solve</nav>
        <span class="stamp">${matrix.problems.length} problems, zero subscriptions</span>
        <h1>What are you trying to do?</h1>
        <p class="lead">Every tool in the suite exists to kill a monthly bill — pick your problem. Each page below shows the pay-once apps that get the job done, what they cost next to the subscription they replace, and how to get started in three steps.</p>
      </div>
    </section>

    <section aria-label="All problems">
      <div class="wrap">${solveGroupsHtml}
      </div>
    </section>

    <section aria-label="Browse by category" class="center">
      <div class="wrap">
        <h2>Prefer to browse the whole toolbox?</h2>
        <p style="color:var(--ink-soft);margin:0.8rem auto 1.6rem;">The 102 apps are also grouped into 8 categories — video, business ops, marketing, developer tools and more.</p>
        <div class="btn-row" style="justify-content:center;">
          <a class="btn btn-solid" href="/categories/">Browse categories &rarr;</a>
        </div>
      </div>
    </section>`,
  }));
  reg('/solve/', 'vs');

  /* ============================================================
   * 3. /categories/<category>/ — 8 category hubs
   * ============================================================ */

  /* ~150-word intros per category — expanded from matrix desc, grounded in the
   * actual apps included (brands + what they do, from their oneliners). */
  const CAT_INTROS = {
    'video-audio': `Video and audio work used to mean a stack of monthly rentals: a recorder, a captioning tool, a transcription service, a podcast host. This category replaces all of them with software you buy once. BloomRecorder captures your screen, camera or both entirely on your machine, with unlimited recording length. Captionly and WhisperDesk turn speech into text locally — auto-captions with karaoke-style highlighting in one, unlimited transcription minutes with TXT, SRT and VTT export in the other. WisperTalk gives you lifetime AI dictation for Windows and macOS. Clip Pipeline and Reelsnag handle the repurposing grind: downloading, trimming and re-voicing social clips in bulk. Voicebarn generates unlimited neural text-to-speech locally, and Castport hosts your podcast — episodes in, a valid RSS feed, public pages and an embeddable player out — for a single payment. Every minute you produce is yours, with no cloud caps and no renewal date.`,
    'business-ops': `The back office is where per-seat pricing hurts most: every hire makes the helpdesk, the scheduler and the form builder more expensive. This category replaces that stack with pay-once tools you host yourself. Deskly is a shared inbox with SLA timers and canned replies and no per-agent fees. Bookslot gives you timezone-correct booking pages you actually own, while Formforge collects unlimited form responses with file uploads and CSV export. Docwell publishes a searchable knowledge base, Chatlet puts live chat on your site, and Boardly runs drag-and-drop kanban boards. Hirestack is a full applicant tracking system with a careers page and pipeline, Shiftly handles staff scheduling with swaps and live labor cost, and Roster keeps a searchable member directory. WholeTeam maps your org chart, Clientdesk tracks clients, and SigCraft batch-generates email signatures. One payment each — growth no longer raises your software bill.`,
    'marketing-seo': `Marketing tools are priced like utilities: every channel, site and contact adds a few more dollars a month, forever. This category swaps the whole pile for pay-once, mostly self-hosted alternatives. PostDock schedules social posts with queues and content recycling on your own server. Linkleaf hosts your link-in-bio page, Trimly runs branded short links on your own domain, and Scantrail generates dynamic QR codes with scan analytics that never expire behind a paywall. Statfox gives you cookie-free web analytics for unlimited sites, Serpdeck tracks daily search positions with competitor overlays, and Hawkwatch watches competitor prices and stock with screenshot alerts. Cardsmith renders unlimited OG images from templates, Postbird sends email campaigns with no per-contact pricing, UTMcraft enforces clean campaign naming, Reflink runs an affiliate program, Citewatch tracks citations, Star Stack aggregates reviews, and Bravowall collects testimonials. Your data, your infrastructure, one receipt.`,
    'developer-tools': `Developers rent an absurd amount of plumbing by the month: webhook inspectors, cron monitors, screenshot APIs, secret stores. This category is pay-once and self-hosted tooling for people who ship software. Wrangle bundles ten everyday data utilities — JSON conversion, JWT decoding, diffs, regex, hashing — into one offline app. Hookscope captures, inspects and replays webhooks with URLs that never expire, while Snapfleet turns any URL into a PNG, JPG or PDF on your own server at zero cost per render. Pingcron alerts you when a scheduled job fails to check in, Certwatch watches TLS certificates with real handshake checks, and Linkguard crawls your site for broken links. Vaultkeeper runs encrypted database backups to S3, FTP or disk, Secretbox versions your environment secrets with a CLI, and Logbin collects and tails logs. Docsmith API publishes static API references, Snipvault manages snippets, Keymaster signs offline-verifiable license keys, Maptrail crawls for SEO, and Queuecraft runs waitlists. Buy once, deploy anywhere.`,
    'productivity': `Personal software should be the calmest thing you own — instead it is where subscriptions quietly multiply. This category is desktop-first tools that keep working even if you never open your wallet again. Quillpad is fast local notes with wikilinks, backlinks and daily notes. Streakly tracks habits with a fair streak engine and heatmaps, Deepdesk runs Pomodoro focus sessions with generated ambient noise, and Feedloft is a self-hosted RSS reader in one SQLite file. Inkpress is a split-pane markdown editor with RSS and SEO built in. Renewcheck tracks your recurring subscriptions and renewal dates — your card numbers never touch a server. Snapreceipt scans receipts with on-device OCR, Ledgerlite Home does zero-based budgeting locally, and Timevault logs billable hours with one-click timers. Lessonforge is a self-hosted course platform with quizzes and certificates, and Quizcraft builds scored quizzes with lead capture. Your routines, notes and money data stay on your own machine.`,
    'design-graphics': `Creative tools pioneered the credit system: pay monthly, then pay again per image, per export, per seat. This category is pay-once design software with no credits and no cloud lock-in. Cutaway removes image backgrounds with local AI — unlimited images, full resolution, nothing uploaded. Shrinkray batch-compresses a thousand photos at a time into JPG, PNG, WebP or AVIF. Iconforge turns one image into a complete favicon and app-icon set, and Paletteforge generates color palettes with contrast checking and CSS, Tailwind or ASE export — all offline. Memeforge makes captioned graphics with a built-in template library, Mockcraft renders product mockups with true perspective warp, and Postcraft Templates turns a CSV of headlines into branded graphics at every platform size in one pass. Slidecraft builds content-aware decks that reflow themselves and export real PPTX files, Resumecraft produces ATS-safe resumes as real PDFs, and Pitchcraft builds self-hosted proposals with click-to-sign acceptance. Make as much as you want — the meter is gone.`,
    'finance-admin': `Invoices, quotes, contracts and signatures are the paperwork layer of a business — and the subscription industry charges rent on every piece of it. This category replaces that rent with tools you own outright. Billcraft handles clients, invoices, PDFs, share links and recurring billing on hardware you control. Quotewell builds branded quotes and estimates from a local catalog, and Contractly keeps a contract library with fill-in-the-blanks variables and clean PDF export. Inkseal routes PDFs for e-signature with a flattened, audit-trailed result on your own box. Ledgerly tracks expenses, budgets and multiple currencies with in-browser receipt OCR and no cloud. Textract does local OCR for images and PDFs, exporting searchable PDFs in batch. Billoop runs full subscription billing — plans, coupons, proration, dunning and an MRR dashboard — against your own Stripe account, and Viral Invoice creates escalating-price sales links where payments land in your Stripe too. Professional paperwork, owned outright.`,
    'security-backup': `Security and backup are the last things you should rent by the seat — yet passwords, certificates, uptime and backups are all sold per user, per month. This category is infrastructure you control instead. Vaultly is a zero-knowledge password vault with shared teams and TOTP, self-hosted with no per-seat fee. Keyloop is a desktop TOTP authenticator with an encrypted local vault and encrypted exports. Secretbox versions project secrets across environments with a CLI that pipes straight into your .env files. Certwatch performs real TLS handshake checks on a schedule with 30, 14, 7 and 1-day email and webhook alerts before anything expires. Syncvault encrypts backups client-side and pushes them to your own S3-compatible bucket or NAS. Upwatch monitors HTTP endpoints with an incident log and a branded 90-day status page, Upkeep Status publishes a full self-hosted status page with components and subscribers, and Logbin collects, tails and searches your logs. Own the safety net.`,
  };

  for (const cat of matrix.categories) {
    const apps = resolve(cat.appSlugs);
    if (!apps.length) { console.warn('SKIPPED category (no resolvable apps):', cat.slug); continue; }
    const url = `${SITE}/categories/${cat.slug}/`;
    const intro = CAT_INTROS[cat.slug] || cat.desc;

    /* Comparison strip: sum compYr over entries where it's a real number,
     * and say how many entries the figure is based on. */
    const known = apps.filter(p => typeof p.compYr === 'number');
    const compYrSum = known.reduce((n, p) => n + p.compYr, 0);

    const desktopCount = apps.filter(p => p.kind !== 'web').length;
    const webCount = apps.length - desktopCount;

    const faqPairs = [
      ['Are these really one-time purchases?', `Yes. Every app in ${cat.name} is a single payment — prices on this page run from $${Math.min(...apps.map(p => p.price))} to $${Math.max(...apps.map(p => p.price))}, once. No renewals, no per-seat fees, no usage meters.`],
      ['Do I get updates?', `Yes. Buying includes updates, and every app ships with MIT-licensed source on GitHub — so even the code is yours to keep, audit and build on. New apps added to the suite later never raise the price of what you already bought.`],
      ['Self-hosted or desktop — what is the difference?', `This category has ${desktopCount} desktop ${desktopCount === 1 ? 'app' : 'apps'} and ${webCount} self-hosted web ${webCount === 1 ? 'app' : 'apps'}. Desktop apps run locally on your machine — private, offline-capable, nothing uploaded. Self-hosted web apps run on your own server or VPS, so you and your team can reach them from anywhere while the data stays on hardware you control.`],
    ];

    const body = `
    <section class="hero" aria-label="${attr(cat.name)}">
      <div class="wrap">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">OneTimeSuite</a> / <a href="/categories/">Categories</a> / ${esc(cat.name)}</nav>
        <span class="stamp">${apps.length} pay-once apps</span>
        <h1>${esc(cat.name)} — pay-once tools</h1>
        <p class="lead">${esc(cat.desc)}</p>
        <p style="color:var(--ink-soft);max-width:68ch;">${esc(intro)}</p>
      </div>
    </section>

    <section aria-label="Apps in this category">
      <div class="wrap">
        <div class="section-head">
          <span class="stamp blue">Pay once, own forever</span>
          <h2>${apps.length} apps in ${esc(cat.name)}</h2>
        </div>
        <div class="card-grid">${apps.map(pCard).join('')}
        </div>
      </div>
    </section>

    <section aria-label="What the subscriptions would cost">
      <div class="wrap-narrow">
        <div class="related-strip" style="display:block;">
          <p style="margin:0;">Bought separately, these apps replace <span class="price-fig" style="font-family:var(--mono);">${fmt(compYrSum)}/yr</span> of subscriptions — that figure adds up the known annual competitor cost of ${known.length} of the ${apps.length} apps here.</p>
        </div>
      </div>
    </section>

    ${bundleBox(`${apps.length} apps in this category · ${fmt(compYrSum)}/yr replaced`)}

    <section aria-label="Frequently asked questions">
      <div class="wrap-narrow">
        <div class="section-head">
          <span class="stamp">FAQ</span>
          <h2>Honest answers</h2>
        </div>
        ${faqPairs.map(([q, a]) => `<div class="faq-item"><h3>${esc(q)}</h3><p>${esc(a)}</p></div>`).join('\n        ')}
      </div>
    </section>`;

    write(`categories/${cat.slug}`, page({
      title: `${cat.name} — Pay-Once Tools | OneTimeSuite`,
      desc: clampDesc(cat.desc),
      canonical: url,
      jsonld: [
        crumbs([['OneTimeSuite', `${SITE}/`], ['Categories', `${SITE}/categories/`], [cat.name, url]]),
        schema.itemListLd({ name: `${cat.name} — pay-once tools`, url, items: apps.map(p => [p.brand, `${SITE}/${p.slug}/`]) }),
        schema.faqPageLd(faqPairs),
      ],
      body,
    }));
    reg(`/categories/${cat.slug}/`, 'vs');
  }

  /* ============================================================
   * 4. /categories/ — hub of the 8 categories
   * ============================================================ */
  const catCards = matrix.categories.map(cat => {
    const apps = resolve(cat.appSlugs);
    return `<a href="/categories/${cat.slug}/"><h3>${esc(cat.name)} <span class="mono-note">— ${apps.length} apps</span></h3><p>${esc(clampDesc(cat.desc))}</p></a>`;
  }).join('\n          ');

  write('categories', page({
    title: 'Pay-Once Software by Category | OneTimeSuite',
    desc: 'Browse the pay-once suite by category — video, business ops, marketing, developer tools, productivity, design, finance and security. Pay once, own forever.',
    canonical: `${SITE}/categories/`,
    jsonld: [
      crumbs([['OneTimeSuite', `${SITE}/`], ['Categories', `${SITE}/categories/`]]),
      schema.itemListLd({ name: 'Pay-once software categories', url: `${SITE}/categories/`, items: matrix.categories.map(c => [c.name, `${SITE}/categories/${c.slug}/`]) }),
    ],
    body: `
    <section class="hero" aria-label="Categories">
      <div class="wrap">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">OneTimeSuite</a> / Categories</nav>
        <span class="stamp">${matrix.categories.length} categories · one-time prices</span>
        <h1>The suite, by category</h1>
        <p class="lead">Every app in the OneTimeSuite catalog is a single payment — no subscriptions, no per-seat fees, no renewal dates. Pick a category to see the tools, what they cost, and the subscriptions they replace.</p>
      </div>
    </section>

    <section aria-label="All categories">
      <div class="wrap">
        <div class="post-list">
          ${catCards}
        </div>
      </div>
    </section>

    <section aria-label="Solve a specific problem" class="center">
      <div class="wrap">
        <h2>Looking for a specific job?</h2>
        <p style="color:var(--ink-soft);margin:0.8rem auto 1.6rem;">The /solve/ pages group the same apps by the problem they fix — recording, invoicing, uptime, QR codes and more.</p>
        <div class="btn-row" style="justify-content:center;">
          <a class="btn btn-ghost" href="/solve/">Browse by problem &rarr;</a>
        </div>
      </div>
    </section>

    ${bundleBox('All 102 apps · one receipt')}`,
  }));
  reg('/categories/', 'vs');
};
