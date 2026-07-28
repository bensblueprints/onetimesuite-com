/* src/sections/apps-directory.js — the /apps directory + programmatic app
 * profile subpages:
 *   /apps/                            full directory, one section per category
 *   /apps/<slug>/                     app profile (canonical -> /<slug>/)
 *   /apps/<slug>/for/<persona>/       persona-fit pages (2-4 per app)
 *   /apps/<slug>/on/<platform>/       platform/setup pages (gated by kind)
 *   /apps/<slug>/updates/             per-app changelog (data: src/changelogs.js)
 * All routes reg'd into the 'apps' sitemap set. */
const CHANGELOGS = require('../changelogs.js');

module.exports = function (ctx) {
  const { write, page, reg, esc, attr, SITE, crumbs, matrix, sales, schema, fmt, pricePair } = ctx;
  const GH = ctx.GH || 'https://github.com/bensblueprints';
  const allProducts = ctx.allProducts;
  const bySlug = ctx.bySlug || Object.fromEntries(allProducts.map(p => [p.slug, p]));
  const availSet = new Set((ctx.availableProducts || allProducts).map(p => p.slug));

  /* Current suite price — from ctx.sales ONLY (the 100-days counter model). */
  const suitePrice = sales.hundredDaysComplete
    ? sales.postLaunchPrice
    : Math.min(sales.cap, sales.basePrice + sales.incrementPerSale * sales.salesCount);
  const bundleSlug = (ctx.BUNDLE && ctx.BUNDLE.slug) || 'onetime-suite-bundle';

  /* slug -> category (first category that claims the app, mirroring seo-matrix) */
  const categoryByApp = {};
  for (const c of matrix.categories) for (const s of c.appSlugs) if (!(s in categoryByApp)) categoryByApp[s] = c.slug;
  const categoryBySlug = Object.fromEntries(matrix.categories.map(c => [c.slug, c]));

  /* Desktop-ness for setup copy: explicit kind wins; the original 50 products
   * have no kind, so fall back to build.js's DESKTOP_SLUGS when present. */
  const isDesktop = p => (p.kind ? p.kind === 'desktop'
    : (ctx.DESKTOP_SLUGS ? ctx.DESKTOP_SLUGS.has(p.slug) : true));

  /* Personas for a product: only personas whose fit list includes the product's
   * category. Uncategorized products get the 2 personas with the broadest fit. */
  const broadest = [...matrix.personas]
    .sort((a, b) => ((matrix.personaCategoryFit[b.slug] || []).length - (matrix.personaCategoryFit[a.slug] || []).length)
      || a.slug.localeCompare(b.slug))
    .slice(0, 2);
  const personasFor = p => {
    const cat = categoryByApp[p.slug];
    if (!cat) return broadest;
    /* catalog order is editorial priority; cap at 4 so no app gets all 8 */
    return matrix.personas.filter(per => (matrix.personaCategoryFit[per.slug] || []).includes(cat)).slice(0, 4);
  };

  /* Platforms for a product: gated by kind; no kind -> all platforms. */
  const platformsFor = p => (p.kind ? matrix.platforms.filter(pl => (pl.kinds || []).includes(p.kind)) : matrix.platforms);

  /* Editorial angle per known persona — used to map real features onto each
   * persona's workflow. Fallback derives nothing fake, just generic phrasing. */
  const PERSONA_ANGLE = {
    'creators': 'when there\'s a publishing schedule to hit',
    'youtubers': 'between filming and the upload deadline',
    'coaches': 'between client sessions',
    'agencies': 'across every client account, with no per-seat math',
    'freelancers': 'between gigs, against irregular income',
    'developers': 'while you\'re shipping, not managing vendor accounts',
    'podcasters': 'for every episode, including the back catalog',
    'small-business-owners': 'without adding another line to the monthly overhead',
  };
  const angleFor = per => PERSONA_ANGLE[per.slug] || 'day to day';

  /* lowercase the first letter only when it's an ordinary capitalized word
   * (don't mangle acronyms like "SLA timers"). */
  const decap = s => (/^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);

  /* Meta descriptions must land in 120–160 chars. Start from `base`, append
   * each extra clause only while it fits, pad if short, truncate as a last
   * resort. Deterministic — same inputs, same description. */
  const DESC_PADS = [' Pay once, own it forever.', ' No subscription, no renewal.', ' One-time purchase.'];
  const mkDesc = (base, extras) => {
    let d = base;
    for (const e of extras) if ((d + e).length <= 160) d += e;
    if (d.length < 120) for (const e of DESC_PADS) { if (d.length >= 120) break; if ((d + e).length <= 160) d += e; }
    if (d.length > 160) d = d.slice(0, 157).replace(/\s+\S*$/, '') + '…';
    return d;
  };

  /* one-line benefit derived from the product's real tagline (first clause) */
  const benefitFrom = tagline => {
    let b = String(tagline || '').split(/\s+[—–]\s+|\.\s/)[0].replace(/[.\s]+$/g, '');
    if (b.length > 64) b = b.slice(0, 64).replace(/\s+\S*$/, '');
    return b;
  };

  const yrCost = p => (typeof p.compYr === 'number' ? ` — roughly ${fmt(p.compYr)} a year, every year` : '');
  const repoLink = p => (p.closedSource ? '' : `<a class="link" href="${GH}/${attr(p.repo)}" rel="noopener">Source on GitHub &rarr;</a>`);

  const appsCrumb = (p, leaf) => {
    const items = [['OneTimeSuite', `${SITE}/`], ['Apps', `${SITE}/` + 'apps/'], [p.brand, `${SITE}/apps/${p.slug}/`]];
    if (leaf) items.push(leaf);
    return crumbs(items);
  };
  const appsCrumbNav = (p, leafText) =>
    `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">OneTimeSuite</a> / <a href="/apps/">Apps</a> / <a href="/apps/${p.slug}/">${esc(p.brand)}</a>${leafText ? ` / ${esc(leafText)}` : ''}</nav>`;

  /* ============================================================
   * 1. /apps/ — the directory
   * ============================================================ */
  const cardFor = p => `
          <div class="p-card">
            <span class="ico" aria-hidden="true">${p.icon}</span>
            <h3><a href="/${p.slug}/">${esc(p.brand)}</a></h3>
            <p class="one">${esc(p.oneliner)}</p>
            <div class="foot">
              <span class="sticker sm"><span class="amt">$${p.price}</span><span class="once">once</span></span>
              <a class="link" href="/apps/${p.slug}/">app profile &rarr;</a>
            </div>
          </div>`;

  const catSections = matrix.categories.map(c => {
    const apps = c.appSlugs.map(s => bySlug[s]).filter(Boolean);
    if (!apps.length) return '';
    return `
    <section aria-label="${attr(c.name)}">
      <div class="wrap">
        <div class="cat-head" id="${attr(c.slug)}" style="scroll-margin-top:80px;">
          <h2>${esc(c.name)}</h2>
          <span class="count">${apps.length} apps · pay once, own forever</span>
        </div>
        <p style="color:var(--ink-soft);max-width:72ch;margin-bottom:1.6rem;">${esc(c.desc)}</p>
        <div class="card-grid">${apps.map(cardFor).join('')}
        </div>
      </div>
    </section>`;
  }).join('');

  const uncategorized = allProducts.filter(p => !categoryByApp[p.slug]).sort((a, b) => a.slug.localeCompare(b.slug));
  const extraSection = uncategorized.length ? `
    <section aria-label="More pay-once apps">
      <div class="wrap">
        <div class="cat-head" id="more" style="scroll-margin-top:80px;">
          <h2>More pay-once apps</h2>
          <span class="count">${uncategorized.length} apps · pay once, own forever</span>
        </div>
        <p style="color:var(--ink-soft);max-width:72ch;margin-bottom:1.6rem;">The rest of the catalog — utilities and niche tools that don't fit neatly into one category, same one-time price model.</p>
        <div class="card-grid">${uncategorized.map(cardFor).join('')}
        </div>
      </div>
    </section>` : '';

  const bundlePitch = sales.hundredDaysComplete
    ? `Every app above — the full ${allProducts.length}-app catalog — is also available as one bundle for <span class="price-fig" style="font-family:var(--mono);">${fmt(suitePrice)}</span> flat. One receipt, everything included.`
    : `Every app above — the full ${allProducts.length}-app catalog — is also available as one bundle, currently <span class="price-fig" style="font-family:var(--mono);">${fmt(suitePrice)}</span>. The price rises $${sales.incrementPerSale} with every sale during the 100-days launch (capped at ${fmt(sales.cap)}), so earlier is cheaper.`;

  write('apps', page({
    title: `App Directory: ${allProducts.length} Pay-Once Apps | OneTimeSuite`,
    desc: `Browse all ${allProducts.length} OneTimeSuite apps by category — video, business ops, marketing, dev tools, finance and more. Every app is a one-time purchase. No subscriptions.`,
    canonical: `${SITE}/apps/`,
    jsonld: [
      crumbs([['OneTimeSuite', `${SITE}/`], ['Apps', `${SITE}/apps/`]]),
      schema.itemListLd({
        name: 'OneTimeSuite app directory',
        url: `${SITE}/apps/`,
        items: allProducts.map(p => [p.brand, `${SITE}/${p.slug}/`]),
      }),
    ],
    body: `
    <section class="hero center" aria-label="App directory">
      <div class="wrap">
        <span class="stamp">App directory</span>
        <h1>${allProducts.length} apps. Pay once. Own forever.</h1>
        <p class="lead">The full OneTimeSuite catalog, grouped by job — each app replaces a subscription tool with a one-time purchase. Nearly all ship with MIT source on GitHub; none of them phone home with a meter.</p>
      </div>
    </section>
    ${catSections}
    ${extraSection}
    <section aria-label="The bundle">
      <div class="wrap">
        <div class="bundle-box">
          <div>
            <span class="stamp">All ${allProducts.length} apps · one receipt</span>
            <h2 style="margin:0.4rem 0 0.7rem;">Everything, bundled</h2>
            <p style="color:var(--ink-soft);">${bundlePitch}</p>
            <div class="btn-row" style="margin-top:1.3rem;">
              <a class="btn btn-solid" href="/${attr(bundleSlug)}/">See the bundle &rarr;</a>
              <a class="btn btn-ghost" href="/savings/">What am I overpaying? &rarr;</a>
            </div>
          </div>
          <span class="price-pair">
            <span class="was">subscriptions, forever</span>
            <span class="sticker big"><span class="amt">${fmt(suitePrice)}</span><span class="once">once · everything</span></span>
          </span>
        </div>
      </div>
    </section>`,
  }));
  reg('/apps/', 'apps');

  /* ============================================================
   * 2-5. per-app pages
   * ============================================================ */
  for (const p of allProducts) {
    const desktop = isDesktop(p);
    const cat = categoryBySlug[categoryByApp[p.slug]];
    const personas = personasFor(p);
    const platforms = platformsFor(p);
    /* Only true when an on-site /checkout/<slug>/ page actually exists
       (off-site-checkout apps like wispertalk have none — never link it). */
    const available = availSet.has(p.slug) && (!ctx.checkoutSlugs || ctx.checkoutSlugs.has(p.slug));
    const kindLabel = p.kind === 'web' ? 'Self-hosted web app' : desktop ? 'Desktop app — runs offline' : 'Web app — self-hosted';
    const platformLabel = p.kind === 'web' ? 'Your own server (VPS / Docker), any browser' : 'Windows, macOS, Linux';

    /* ---------- 2. /apps/<slug>/ — profile (canonical -> /<slug>/) ---------- */
    const profileFaq = p.faq.slice(0, 3);
    const subLinks = [
      ...personas.map(per => `<a href="/apps/${p.slug}/for/${per.slug}/">${esc(p.brand)} for ${esc(per.name)}</a>`),
      ...platforms.map(pl => `<a href="/apps/${p.slug}/on/${pl.slug}/">${esc(p.brand)} on ${esc(pl.name)}</a>`),
      `<a href="/apps/${p.slug}/updates/">Updates &amp; changelog</a>`,
    ];

    write(`apps/${p.slug}`, page({
      title: `${p.brand} App Profile | OneTimeSuite`,
      desc: mkDesc(`${p.oneliner}`, [` ${p.brand} is $${p.price} once, replacing ${p.competitor} (${p.compPrice}).`, ' Features, platforms and FAQ.']),
      canonical: `${SITE}/${p.slug}/`,
      jsonld: [
        schema.softwareApp(p, `${SITE}/${p.slug}/`),
        schema.faqPageLd(profileFaq),
        appsCrumb(p),
      ],
      body: `
    <section class="hero" aria-label="${attr(p.brand)} profile">
      <div class="wrap">
        ${appsCrumbNav(p)}
        <span class="stamp">${cat ? esc(cat.name) : 'OneTimeSuite app'}</span>
        <h1>${p.icon} ${esc(p.brand)}</h1>
        <p class="lead">${esc(p.tagline)}</p>
        <div class="btn-row">
          <a class="btn btn-solid" href="/${p.slug}/">Full product page &rarr;</a>
          ${available ? `<a class="btn btn-ghost" href="/checkout/${p.slug}/">Checkout — $${p.price}</a>` : ''}
          ${repoLink(p)}
        </div>
      </div>
    </section>

    <section aria-label="Quick facts">
      <div class="wrap">
        <div class="section-head">
          <span class="stamp blue">Quick facts</span>
          <h2>${esc(p.brand)} at a glance</h2>
        </div>
        <div class="tbl-wrap">
          <table class="receipt">
            <tbody>
              <tr><td>Price</td><td class="us">$${p.price}, once — no renewal</td></tr>
              <tr><td>Replaces</td><td class="us">${esc(p.competitor)} at ${esc(p.compPrice)}${yrCost(p)}</td></tr>
              <tr><td>Type</td><td class="us">${kindLabel}</td></tr>
              <tr><td>Platforms</td><td class="us">${platformLabel}</td></tr>
              <tr><td>Category</td><td class="us">${cat ? esc(cat.name) : 'Utilities'}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section aria-label="Features">
      <div class="wrap">
        <div class="section-head">
          <span class="stamp blue">What's in the box</span>
          <h2>${esc(p.brand)} features</h2>
        </div>
        <div class="steps">
          ${p.features.slice(0, 8).map((f, i) => `<div class="step"><span class="n">${String(i + 1).padStart(2, '0')}</span><h3>${f[0]} ${esc(f[1])}</h3><p>${esc(f[2])}</p></div>`).join('\n          ')}
        </div>
      </div>
    </section>

    <section aria-label="Pricing">
      <div class="wrap">
        <div class="section-head">
          <span class="stamp">Pricing</span>
          <h2>$${p.price} once — that's the whole pricing page</h2>
          <p>${esc(p.competitor)} charges ${esc(p.compPrice)}${yrCost(p)}. ${esc(p.brand)} is a single payment, and it keeps working whether or not we ever sell another copy.</p>
        </div>
        ${pricePair(p)}
        <p style="color:var(--ink-soft);margin-top:1.2rem;">Or get ${esc(p.brand)} inside the full suite — every app in the catalog, currently ${fmt(suitePrice)} for the bundle. <a class="link" href="/${attr(bundleSlug)}/">See the bundle &rarr;</a></p>
      </div>
    </section>

    <section aria-label="Guides and deep dives">
      <div class="wrap">
        <div class="section-head">
          <span class="stamp blue">Dig deeper</span>
          <h2>${esc(p.brand)} guides &amp; pages</h2>
        </div>
        <div class="related-strip">
          ${subLinks.join('\n          ')}
        </div>
        <p class="mono-note" style="margin-top:1.4rem;"><a class="link" href="/${p.slug}/">Full ${esc(p.brand)} product page &rarr;</a>${available ? ` &nbsp;·&nbsp; <a class="link" href="/checkout/${p.slug}/">Checkout &rarr;</a>` : ''}</p>
      </div>
    </section>

    <section aria-label="Frequently asked questions">
      <div class="wrap-narrow">
        <div class="section-head">
          <span class="stamp">FAQ</span>
          <h2>Honest answers</h2>
        </div>
        ${profileFaq.map(q => `<div class="faq-item"><h3>${esc(q[0])}</h3><p>${esc(q[1])}</p></div>`).join('\n        ')}
      </div>
    </section>`,
    }));
    reg(`/apps/${p.slug}/`, 'apps');

    /* ---------- 3. /apps/<slug>/for/<persona>/ ---------- */
    for (const per of personas) {
      const benefit = benefitFrom(p.tagline);
      const fitFeatures = p.features.slice(0, 3);
      const steps = p.steps.slice(0, 4);
      const personaFaq = [
        [`Is ${p.brand} worth it for ${per.name.toLowerCase()}?`,
         `${p.payback} ${p.brand} costs $${p.price} once; ${p.competitor} charges ${p.compPrice}${typeof p.compYr === 'number' ? ` — about $${p.compYr} a year` : ''}. For ${per.name.toLowerCase()}, that fixed cost is the whole point: the tool is a one-time line item, not a monthly one.`],
        ...p.faq.slice(0, 2),
      ];

      write(`apps/${p.slug}/for/${per.slug}`, page({
        title: `${p.brand} for ${per.name} | OneTimeSuite`,
        desc: mkDesc(`${p.oneliner}`, [` Why ${per.name.toLowerCase()} pick ${p.brand}: $${p.price} once instead of ${p.competitor} at ${p.compPrice}.`, ' Workflow, cost math and FAQ.']),
        canonical: `${SITE}/apps/${p.slug}/for/${per.slug}/`,
        jsonld: [
          schema.articleLd({
            title: `${p.brand} for ${per.name}`,
            desc: `${p.oneliner}`,
            url: `${SITE}/apps/${p.slug}/for/${per.slug}/`,
          }),
          schema.faqPageLd(personaFaq),
          appsCrumb(p, [`For ${per.name}`, `${SITE}/apps/${p.slug}/for/${per.slug}/`]),
        ],
        body: `
    <section class="hero" aria-label="${attr(p.brand)} for ${attr(per.name)}">
      <div class="wrap">
        ${appsCrumbNav(p, `for ${per.name}`)}
        <span class="stamp">${esc(per.name)}</span>
        <h1>${esc(p.brand)} for ${esc(per.name)}: ${esc(benefit)}</h1>
        <p class="lead">${esc(p.tagline)}</p>
      </div>
    </section>

    <section aria-label="The problem">
      <div class="wrap-narrow">
        <div class="post-body">
          <p>${esc(per.blurb)}</p>
          <p>The tool this job usually means renting is ${esc(p.competitor)}, at ${esc(p.compPrice)}${yrCost(p)}. ${esc(p.brand)} does the job for a one-time $${p.price} — ${desktop ? 'running locally on your own machine' : 'running on infrastructure you control'}.</p>
        </div>
      </div>
    </section>

    <section aria-label="Why it fits">
      <div class="wrap">
        <div class="section-head">
          <span class="stamp blue">Fit check</span>
          <h2>Why it fits how ${esc(per.name.toLowerCase())} work</h2>
        </div>
        ${fitFeatures.map(f => `
        <div class="faq-item">
          <h3>${f[0]} ${esc(f[1])}</h3>
          <p>${esc(f[2])}</p>
          <p>For ${esc(per.name.toLowerCase())}, ${esc(decap(f[1]))} pays off ${esc(angleFor(per))} — and it's covered by the same one-time $${p.price}, not metered per month.</p>
        </div>`).join('')}
      </div>
    </section>

    <section aria-label="A typical workflow">
      <div class="wrap">
        <div class="section-head">
          <span class="stamp">Workflow</span>
          <h2>A typical workflow</h2>
        </div>
        <div class="steps">
          ${steps.map((s, i) => `<div class="step"><span class="n">STEP 0${i + 1}</span><h3>${esc(s[0])}</h3><p>${esc(s[1])}</p></div>`).join('\n          ')}
        </div>
      </div>
    </section>

    <section aria-label="The cost math">
      <div class="wrap-narrow">
        <div class="post-body">
          <h2>What it costs, honestly</h2>
          <p>${esc(p.brand)} is <span class="price-fig" style="font-family:var(--mono);">$${p.price}</span>, once. ${esc(p.competitor)} at ${esc(p.compPrice)}${yrCost(p)}. ${esc(p.payback)}</p>
        </div>
      </div>
    </section>

    <section aria-label="Frequently asked questions">
      <div class="wrap-narrow">
        <div class="section-head">
          <span class="stamp">FAQ</span>
          <h2>${esc(per.name)} ask</h2>
        </div>
        ${personaFaq.map(q => `<div class="faq-item"><h3>${esc(q[0])}</h3><p>${esc(q[1])}</p></div>`).join('\n        ')}
      </div>
    </section>

    <section aria-label="Get ${attr(p.brand)}" class="center">
      <div class="wrap">
        <h2>Own ${esc(p.brand)} forever — $${p.price}</h2>
        <div class="btn-row" style="justify-content:center;">
          <a class="btn btn-solid" href="/${p.slug}/">Full ${esc(p.brand)} product page &rarr;</a>
          ${available ? `<a class="btn btn-ghost" href="/checkout/${p.slug}/">Checkout — $${p.price}</a>` : ''}
        </div>
      </div>
    </section>`,
      }));
      reg(`/apps/${p.slug}/for/${per.slug}/`, 'apps');
    }

    /* ---------- 4. /apps/<slug>/on/<platform>/ ---------- */
    const setupSteps = p.kind === 'web'
      ? [
        ['Get the code', `Clone or download ${p.brand} from the repository (${GH}/${p.repo}) — the README documents the setup.`],
        ['Deploy on your own server', 'Self-host on your own VPS or server — Docker or the one-command setup from the repo README. Point your domain at it when you\'re ready.'],
        ['Keep your data yours', 'Your data stays on hardware you control — no third-party cloud, no per-seat pricing, no telemetry back to us.'],
      ]
      : [
        ['Download the installer', p.closedSource
          ? `Download the ${p.brand} installer from the delivery link you receive at checkout — a signed installer, no build step.`
          : `Download the latest ${p.brand} installer from the GitHub Releases page (${GH}/${p.repo}/releases) — or build it yourself from the MIT source.`],
        ['Install', 'Run the installer — one click, no terminal, no account to create.'],
        ['Run it locally', `${p.brand} runs 100% on your machine — no account, no telemetry, and it keeps working with the Wi-Fi off.`],
      ];
    const platformFaqPool = p.faq.filter(([q, a]) => /offline|platform|install|windows|mac|linux|server|deploy|host|data|upload/i.test(`${q} ${a}`));
    const platformFaq = (platformFaqPool.length >= 2 ? platformFaqPool : p.faq).slice(0, 2);

    for (const pl of platforms) {
      write(`apps/${p.slug}/on/${pl.slug}`, page({
        title: `${p.brand} on ${pl.name} | OneTimeSuite`,
        desc: mkDesc(`${p.brand} on ${pl.name}: ${pl.blurb}`, [` Setup notes and FAQ. $${p.price} once.`]),
        canonical: `${SITE}/apps/${p.slug}/on/${pl.slug}/`,
        jsonld: [
          schema.howToLd({ name: `Set up ${p.brand} on ${pl.name}`, steps: setupSteps, url: `${SITE}/apps/${p.slug}/on/${pl.slug}/` }),
          schema.faqPageLd(platformFaq),
          appsCrumb(p, [`On ${pl.name}`, `${SITE}/apps/${p.slug}/on/${pl.slug}/`]),
        ],
        body: `
    <section class="hero" aria-label="${attr(p.brand)} on ${attr(pl.name)}">
      <div class="wrap">
        ${appsCrumbNav(p, `on ${pl.name}`)}
        <span class="stamp">${esc(pl.name)}</span>
        <h1>${esc(p.brand)} on ${esc(pl.name)}</h1>
        <p class="lead">${esc(pl.blurb)}</p>
      </div>
    </section>

    <section aria-label="Setup">
      <div class="wrap">
        <div class="section-head">
          <span class="stamp blue">Setup</span>
          <h2>Setup on ${esc(pl.name)}</h2>
        </div>
        <div class="steps">
          ${setupSteps.map((s, i) => `<div class="step"><span class="n">STEP 0${i + 1}</span><h3>${esc(s[0])}</h3><p>${esc(s[1])}</p></div>`).join('\n          ')}
        </div>
        ${p.kind !== 'web' ? `<p class="mono-note" style="margin-top:1.4rem;">What works offline: everything. ${esc(p.brand)} is a desktop app — once it's installed, no feature needs a connection to us.</p>` : `<p class="mono-note" style="margin-top:1.4rem;">Because ${esc(p.brand)} is self-hosted, "offline" is your call — run it on a LAN or behind a VPN and it never touches the public internet.</p>`}
      </div>
    </section>

    <section aria-label="Frequently asked questions">
      <div class="wrap-narrow">
        <div class="section-head">
          <span class="stamp">FAQ</span>
          <h2>${esc(p.brand)} on ${esc(pl.name)} — honest answers</h2>
        </div>
        ${platformFaq.map(q => `<div class="faq-item"><h3>${esc(q[0])}</h3><p>${esc(q[1])}</p></div>`).join('\n        ')}
        <p class="mono-note" style="margin-top:1.4rem;"><a class="link" href="/apps/${p.slug}/">Back to the ${esc(p.brand)} profile &rarr;</a> &nbsp;·&nbsp; <a class="link" href="/${p.slug}/">Full product page &rarr;</a></p>
      </div>
    </section>`,
      }));
      reg(`/apps/${p.slug}/on/${pl.slug}/`, 'apps');
    }

    /* ---------- 5. /apps/<slug>/updates/ — changelog ---------- */
    const entries = Array.isArray(CHANGELOGS[p.slug]) ? CHANGELOGS[p.slug] : [];
    const firstDated = entries.find(e => e && e.date);
    const entriesHtml = entries.length
      ? entries.map(e => `
        <div class="faq-item">
          <h3>v${esc(e.version)}${e.date ? ` <span class="post-meta">— ${esc(e.date)}</span>` : ''}</h3>
          <ul>${(e.notes || []).map(n => `<li>${esc(n)}</li>`).join('')}</ul>
        </div>`).join('')
      : `
        <div class="faq-item">
          <h3>v1.0.0 — first public release</h3>
          <p>${esc(p.brand)} shipped. Detailed release notes land here as new versions are published.</p>
        </div>
        <p class="mono-note" style="margin-top:1.4rem;">Follow ${p.closedSource ? `the <a class="link" href="/${p.slug}/">${esc(p.brand)} product page</a>` : `the <a class="link" href="${GH}/${attr(p.repo)}" rel="noopener">${esc(p.brand)} repo</a>`} for release notes.</p>`;

    write(`apps/${p.slug}/updates`, page({
      title: `${p.brand} Updates & Changelog | OneTimeSuite`,
      desc: mkDesc(`Every ${p.brand} release in one place — version notes as they ship.`, [` ${p.brand} is $${p.price} once, and updates never come with a renewal attached.`]),
      canonical: `${SITE}/apps/${p.slug}/updates/`,
      jsonld: [
        schema.articleLd({
          title: `${p.brand} updates & changelog`,
          desc: `Release notes for ${p.brand}, the pay-once ${p.competitor} alternative.`,
          url: `${SITE}/apps/${p.slug}/updates/`,
          datePublished: firstDated ? firstDated.date : undefined,
        }),
        appsCrumb(p, ['Updates', `${SITE}/apps/${p.slug}/updates/`]),
      ],
      body: `
    <section class="hero" aria-label="${attr(p.brand)} updates">
      <div class="wrap">
        ${appsCrumbNav(p, 'updates')}
        <span class="stamp">Changelog</span>
        <h1>${p.icon} ${esc(p.brand)} updates</h1>
        <p class="lead">${esc(p.oneliner)}</p>
      </div>
    </section>

    <section aria-label="Release notes">
      <div class="wrap-narrow">
        ${entriesHtml}
        <p class="mono-note" style="margin-top:1.6rem;"><a class="link" href="/apps/${p.slug}/">Back to the ${esc(p.brand)} profile &rarr;</a> &nbsp;·&nbsp; <a class="link" href="/${p.slug}/">Full product page &rarr;</a></p>
      </div>
    </section>`,
    }));
    reg(`/apps/${p.slug}/updates/`, 'apps');
  }
};
