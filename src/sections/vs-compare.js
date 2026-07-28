/* src/sections/vs-compare.js — comparison-page factory.
 *
 * Emits, for every (product × competitor) pair in ctx.matrix.competitors:
 *   /vs/<app>-vs-<competitor>/        honest head-to-head (features + cost)
 *   /compare/<app>-vs-<competitor>/   pricing-focused sibling (all about money)
 *   /alternatives/<competitor>/       one page per competitor, card per app
 *   /vs/  /compare/  /alternatives/   hub pages grouped by competitor category
 *
 * All pricing facts come from product data (p.price, p.compPrice, p.compYr);
 * the SUITE price is derived from ctx.sales and appears only next to the
 * bundle mention. No ratings, no testimonials, deterministic output only.
 */
module.exports = function (ctx) {
  const { write, page, reg, esc, attr, SITE, crumbs, matrix, sales, schema, bySlug, fmt } = ctx;

  const avail = new Set((ctx.availableProducts || ctx.allProducts || []).map(p => p.slug));
  const catName = {};
  for (const c of matrix.categories || []) catName[c.slug] = c.name;
  const catLabel = slug => catName[slug] || 'Other tools';

  /* Suite price — only rendered next to the bundle mention. */
  const suitePrice = sales.hundredDaysComplete
    ? sales.postLaunchPrice
    : Math.min(sales.cap, sales.basePrice + sales.incrementPerSale * sales.salesCount);
  const DATE = sales.updatedAt || '2026-07-28';

  /* ---------- build the deduped pair list (deterministic) ---------- */
  const pairs = [];            // [{ p, comp, pairSlug }]
  const seenPair = new Set();
  const competitors = [...(matrix.competitors || [])].sort((a, b) => a.name.localeCompare(b.name));
  for (const comp of competitors) {
    for (const appSlug of [...comp.apps].sort()) {
      const p = bySlug[appSlug];
      if (!p) continue;
      const pairSlug = `${appSlug}-vs-${comp.slug}`;
      if (seenPair.has(pairSlug)) continue;   // skip deterministic dupe
      seenPair.add(pairSlug);
      pairs.push({ p, comp, pairSlug });
    }
  }

  /* ---------- shared helpers ---------- */

  /* FAQ entries that talk about money, falling back to the first entries. */
  function pricingFaq(p, n) {
    const faq = p.faq || [];
    const money = faq.filter(([q]) => /price|cost|subscription|pay|free|buy|renew|update/i.test(q));
    const picked = (money.length >= 3 ? money : faq).slice(0, n || 4);
    return picked.length ? picked : [[`Is ${p.brand} a subscription?`, `No. ${p.brand} is a one-time purchase — $${p.price} once, no renewal.`]];
  }

  const yrCost = (p, years) => (typeof p.compYr === 'number' ? fmt(p.compYr * years) : null);
  const compYrText = p => (typeof p.compYr === 'number' ? `${fmt(p.compYr)}/yr` : esc(p.compPrice || 'a subscription'));

  function costRows(p) {
    const rows = [`<li>After 1 year: ${esc(p.brand)} has cost you $${p.price} total — ${esc(p.competitor || 'the subscription')} has cost ${yrCost(p, 1) || compYrText(p)}.</li>`];
    if (yrCost(p, 3)) rows.push(`<li>After 3 years: ${esc(p.brand)} is still $${p.price} — the subscription is at ${yrCost(p, 3)}.</li>`);
    if (yrCost(p, 5)) rows.push(`<li>After 5 years: ${esc(p.brand)} is still $${p.price} — the subscription is at ${yrCost(p, 5)}.</li>`);
    return rows.join('\n            ');
  }

  function buyBtn(p, label) {
    /* Link the on-site checkout only when one actually exists for this slug
       (off-site-checkout apps like wispertalk have no /checkout/<slug>/ page). */
    const canCheckout = avail.has(p.slug) && (!ctx.checkoutSlugs || ctx.checkoutSlugs.has(p.slug));
    if (canCheckout) return `<a class="btn btn-solid" href="/checkout/${p.slug}/">${esc(label || `Buy ${p.brand} — $${p.price} once`)}</a>`;
    return `<a class="btn btn-solid" href="/${p.slug}/">${esc(`See ${p.brand} — $${p.price} once`)}</a>`;
  }

  function bundleNote(p) {
    return `<p style="font-size:0.9rem;">Or get ${esc(p.brand)} plus every other app in the suite: <a href="/onetime-suite-bundle/">the OneTimeSuite bundle</a> is currently ${fmt(suitePrice)}, one time.</p>`;
  }

  function faqHtml(faqPairs) {
    return faqPairs.map(([q, a]) => `<div class="faq-item">
            <h3>${esc(q)}</h3>
            <p>${esc(a)}</p>
          </div>`).join('\n          ');
  }

  /* ============================================================
   * 1. /vs/<app>-vs-<competitor>/ — the honest head-to-head
   * ============================================================ */
  for (const { p, comp, pairSlug } of pairs) {
    const url = `${SITE}/vs/${pairSlug}/`;
    const h1 = `${p.brand} vs ${comp.name} (2026): One-Time ${catLabel(comp.category)} Alternative`;
    const title = `${p.brand} vs ${comp.name}: pay-once alternative (2026)`;
    const desc = `Is ${p.brand} a good one-time-purchase alternative to ${comp.name}? Price, features, privacy and 5-year cost compared — plus who should switch and who should stay.`;
    const faqPairs = pricingFaq(p, 4);
    const compRows = (p.compRows || []).map(([label, ours, theirs]) =>
      `<tr><td>${esc(label)}</td><td class="us">${esc(ours)}</td><td>${esc(theirs)}</td></tr>`).join('\n              ');
    const fiveYr = yrCost(p, 5)
      ? `<tr class="total"><td>5-year cost</td><td class="us"><span class="price-fig">$${p.price}</span></td><td>${yrCost(p, 5)}</td></tr>`
      : '';
    const feats = (p.features || []).slice(0, 3).map(f =>
      `<li><strong>${esc(f[1])}.</strong> ${esc(f[2])}</li>`).join('\n            ');
    const whoFor = p.oneliner || p.tagline || `${p.brand} does the same core job for a flat one-time price.`;

    const body = `
    <section class="hero" aria-label="Comparison" style="padding-bottom:2.5rem;">
      <div class="wrap-narrow">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">OneTimeSuite</a> / <a href="/vs/">Comparisons</a> / ${esc(p.brand)} vs ${esc(comp.name)}</nav>
        <span class="stamp">Honest comparison · 2026</span>
        <h1 style="font-size:clamp(1.9rem,4.4vw,3rem);">${esc(h1)}</h1>
      </div>
    </section>

    <section aria-label="Comparison body" style="padding-top:2.5rem;">
      <div class="wrap-narrow">
        <article class="post-body">
          <h2>Quick answer</h2>
          <p>Yes — ${esc(p.brand)} is a one-time-purchase alternative to ${esc(comp.name)}. It costs $${p.price} once, while ${esc(comp.name)} runs ${esc(p.compPrice || 'a subscription')}${typeof p.compYr === 'number' ? ` — about ${fmt(p.compYr)} per year, every year` : ''}. ${esc(whoFor)} It is for people who want the job done on their own hardware without a renewal date — not for teams that live inside ${esc(comp.name)}'s ecosystem.</p>

          <p class="stamp blue">The verdict</p>
          <p><strong>Switch to ${esc(p.brand)} if</strong> you are an individual or small team paying ${esc(comp.name)} ${esc(p.compPrice || 'monthly')} for work your own machine can do. ${esc(p.payback || `At $${p.price} once, the math does not take long to work.`)}</p>
          <p><strong>Stay with ${esc(comp.name)} if</strong> your workflow depends on its integrations, you need enterprise features (SSO, admin controls, SLAs), or your team is large enough that per-seat collaboration tooling is worth the bill. ${esc(p.brand)} does not try to replicate those.</p>

          <h2>Head to head</h2>
          <div class="tbl-wrap">
            <table class="receipt">
              <thead><tr><th></th><th class="us">${esc(p.brand)}</th><th>${esc(comp.name)}</th></tr></thead>
              <tbody>
              ${compRows}
              ${fiveYr}
              </tbody>
            </table>
          </div>

          <h2>Where ${esc(comp.name)} still wins</h2>
          <ul>
            <li><strong>Ecosystem and integrations.</strong> Established tools accumulate years of third-party integrations, templates and add-ons. If your workflow is wired into ${esc(comp.name)}'s ecosystem, switching means rebuilding that plumbing — a real cost.</li>
            <li><strong>Team and enterprise features.</strong> Shared workspaces, granular permissions, SSO, audit logs and a vendor to call when something breaks — that is what the higher subscription tiers actually buy, and a pay-once app does not come with it.</li>
            <li><strong>Familiarity and hiring.</strong> ${esc(comp.name)} is the name people already know. Onboarding a team onto a tool nobody has used before takes time the subscription never charges for.</li>
          </ul>

          <h2>Where ${esc(p.brand)} wins</h2>
          <ul>
            <li><strong>Price, permanently.</strong> $${p.price} once versus ${compYrText(p)} for as long as you use it. There is no renewal, no seat count and no tier gate.</li>
            ${feats}
          </ul>

          <h2>The math</h2>
          <p>${esc(p.payback || `${p.brand} costs $${p.price} once — compare that to what ${comp.name} charges every year.`)}</p>
          <ul>
            ${costRows(p)}
          </ul>

          <h2>Common questions</h2>
          ${faqHtml(faqPairs)}

          <div class="cta-card">
            <h3>Try ${esc(p.brand)} — $${p.price}, one time</h3>
            <div class="btn-row">
              ${buyBtn(p)}
              <a class="btn btn-ghost" href="/${p.slug}/">${esc(p.brand)} product page</a>
              <a class="btn btn-ghost" href="/compare/${pairSlug}/">Pricing breakdown</a>
              <a class="btn btn-ghost" href="/alternatives/${comp.slug}/">More ${esc(comp.name)} alternatives</a>
            </div>
            ${bundleNote(p)}
          </div>
        </article>
      </div>
    </section>`;

    write(`vs/${pairSlug}`, page({
      title,
      desc,
      canonical: url,
      ogType: 'article',
      jsonld: [
        schema.articleLd({ title: h1, desc, url, datePublished: DATE }),
        schema.faqPageLd(faqPairs),
        schema.softwareApp(p, url),
        crumbs([['OneTimeSuite', `${SITE}/`], ['Comparisons', `${SITE}/vs/`], [`${p.brand} vs ${comp.name}`, url]]),
      ],
      body,
    }));
    reg(`/vs/${pairSlug}/`, 'vs');
  }

  /* ============================================================
   * 2. /compare/<app>-vs-<competitor>/ — pricing-focused sibling
   * ============================================================ */
  for (const { p, comp, pairSlug } of pairs) {
    const url = `${SITE}/compare/${pairSlug}/`;
    const h1 = `${p.brand} vs ${comp.name} pricing (2026)`;
    const desc = `${p.brand} vs ${comp.name} pricing in 2026: $${p.price} once vs ${p.compPrice || 'a subscription'}. Break-even math, 1/3/5/10-year totals and what the one-time price actually includes.`;
    const faqPairs = pricingFaq(p, 4);
    const yr = yrCost(p, 1);
    const feats = (p.features || []).slice(0, 5).map(f =>
      `<li><strong>${esc(f[1])}.</strong> ${esc(f[2])}</li>`).join('\n            ');

    const priceRows = [
      `<tr><td>Monthly</td><td class="us">$0 — no subscription</td><td>${esc(p.compPrice || 'Subscription')}</td></tr>`,
      `<tr><td>Annual</td><td class="us">$0 after purchase</td><td>${yr || esc(p.compPrice || '—')}</td></tr>`,
      `<tr><td>5-year total</td><td class="us"><span class="price-fig">$${p.price}</span></td><td>${yrCost(p, 5) || esc(p.compPrice || '—')}</td></tr>`,
      `<tr class="total"><td>10-year total</td><td class="us"><span class="price-fig">$${p.price}</span></td><td>${yrCost(p, 10) || esc(p.compPrice || '—')}</td></tr>`,
    ].join('\n              ');

    const body = `
    <section class="hero" aria-label="Pricing comparison" style="padding-bottom:2.5rem;">
      <div class="wrap-narrow">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">OneTimeSuite</a> / <a href="/compare/">Pricing comparisons</a> / ${esc(p.brand)} vs ${esc(comp.name)}</nav>
        <span class="stamp">Pricing deep-dive · 2026</span>
        <h1 style="font-size:clamp(1.9rem,4.4vw,3rem);">${esc(h1)}</h1>
        <p class="lead">${esc(p.brand)} costs $${p.price} once. ${esc(comp.name)} charges ${esc(p.compPrice || 'on subscription')}. Here is exactly what that difference compounds into.</p>
      </div>
    </section>

    <section aria-label="Pricing body" style="padding-top:2.5rem;">
      <div class="wrap-narrow">
        <article class="post-body">
          <h2>The price anchor</h2>
          <div class="tbl-wrap">
            <table class="receipt">
              <thead><tr><th></th><th class="us">${esc(p.brand)}</th><th>${esc(comp.name)}</th></tr></thead>
              <tbody>
              ${priceRows}
              </tbody>
            </table>
          </div>
          <p class="mono-note">Subscription figures from the vendor's published pricing (${esc(p.compPrice || 'see vendor site')}${typeof p.compYr === 'number' ? `, ~${fmt(p.compYr)}/yr` : ''}); the ${esc(p.brand)} column is the full price, paid once.</p>

          <h2>Break-even analysis</h2>
          <p>${esc(p.payback || `At $${p.price} once, ${p.brand} pays for itself quickly against a recurring plan.`)}</p>
          <ul>
            ${costRows(p)}
          </ul>

          <h2>What you get for $${p.price} once</h2>
          <ul>
            ${feats}
            <li><strong>No renewal, ever.</strong> The license does not expire and there is no per-seat meter — $${p.price} is the whole price.</li>
          </ul>

          <h2>Pricing questions</h2>
          ${faqHtml(faqPairs)}

          <div class="cta-card">
            <h3>${esc(p.brand)} — $${p.price}, one time</h3>
            <div class="btn-row">
              ${buyBtn(p)}
              <a class="btn btn-ghost" href="/${p.slug}/">${esc(p.brand)} product page</a>
              <a class="btn btn-ghost" href="/vs/${pairSlug}/">Full head-to-head</a>
              <a class="btn btn-ghost" href="/alternatives/${comp.slug}/">More ${esc(comp.name)} alternatives</a>
            </div>
            ${bundleNote(p)}
          </div>
        </article>
      </div>
    </section>`;

    write(`compare/${pairSlug}`, page({
      title: h1,
      desc,
      canonical: url,
      jsonld: [
        schema.productLd({ name: p.brand, desc: p.tagline || p.oneliner || h1, url, price: p.price }),
        schema.faqPageLd(faqPairs),
        crumbs([['OneTimeSuite', `${SITE}/`], ['Pricing comparisons', `${SITE}/compare/`], [`${p.brand} vs ${comp.name}`, url]]),
      ],
      body,
    }));
    reg(`/compare/${pairSlug}/`, 'vs');
  }

  /* ============================================================
   * 3. /alternatives/<competitor>/ — one page per competitor
   * ============================================================ */
  for (const comp of competitors) {
    const apps = comp.apps.map(s => bySlug[s]).filter(Boolean)
      .sort((a, b) => a.brand.localeCompare(b.brand));
    if (!apps.length) continue;
    const url = `${SITE}/alternatives/${comp.slug}/`;
    const h1 = `Best ${comp.name} alternatives you can buy once (2026)`;
    const title = `${comp.name} alternatives you buy once (2026)`;
    const desc = `The best pay-once ${comp.name} alternatives in 2026 — ${apps.length} app${apps.length === 1 ? '' : 's'} you buy once and own forever, with prices, features and head-to-head comparisons.`;
    const first = apps[0];
    const leaveYr = comp.priceYr || (typeof first.compYr === 'number' ? first.compYr : null);
    const leaveMo = comp.priceMo != null ? `$${comp.priceMo}/mo` : (first.compPrice || null);

    const cards = apps.map(p => `<div class="p-card">
            <h3>${p.icon ? `${p.icon} ` : ''}${esc(p.brand)}</h3>
            <p>${esc(p.oneliner || p.tagline || '')}</p>
            <p class="price-fig">$${p.price} once</p>
            <p><a class="link" href="/${p.slug}/">Product page</a> · <a class="link" href="/vs/${p.slug}-vs-${comp.slug}/">${esc(p.brand)} vs ${esc(comp.name)}</a></p>
          </div>`).join('\n          ');

    const altFaq = [
      [`Is there a one-time-purchase alternative to ${comp.name}?`,
        `Yes — ${apps.map(p => `${p.brand} ($${p.price} once)`).join(', ')}. Each replaces the core job ${comp.name} charges a subscription for, and none of them has a renewal.`],
      [`How much does ${comp.name} actually cost over time?`,
        `${leaveMo ? `${comp.name} is listed at ${leaveMo}` : `${comp.name} is sold as a subscription`}${leaveYr ? ` — roughly ${fmt(leaveYr)} per year, or ${fmt(leaveYr * 5)} over five years` : ''}. The alternatives on this page are single payments, so their cost never grows.`],
      [`What happens to my data if I leave ${comp.name}?`,
        'The pay-once tools on this page run on your own machine or your own server, so your files and records live with you instead of inside a rented account. Check each product page for import and export details before you switch.'],
    ];

    const body = `
    <section class="hero center" aria-label="${attr(comp.name)} alternatives" style="padding-bottom:2.5rem;">
      <div class="wrap">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">OneTimeSuite</a> / <a href="/alternatives/">Alternatives</a> / ${esc(comp.name)}</nav>
        <span class="stamp">${apps.length} pay-once alternative${apps.length === 1 ? '' : 's'} · 2026</span>
        <h1>${esc(h1)}</h1>
        <p class="lead">Every tool below replaces the core of what ${esc(comp.name)} does — for a single flat payment instead of ${esc(leaveMo || 'a subscription')}.</p>
      </div>
    </section>

    <section aria-label="Alternative apps">
      <div class="wrap">
        <div class="card-grid">
          ${cards}
        </div>

        <div class="wrap-narrow" style="margin-top:3rem;">
          <article class="post-body">
            <h2>Why people leave ${esc(comp.name)}</h2>
            <p>${esc(comp.name)} is sold as a subscription${leaveMo ? ` — ${leaveMo}` : ''}${leaveYr ? `, which works out to roughly ${fmt(leaveYr)} per year and ${fmt(leaveYr * 5)} over five years` : ''}. The product keeps working the same whether you pay or not, but access stops the moment you cancel: the fee is for permission, not for ongoing work done on your behalf. The tools above do the job on your own hardware or your own server, so the cost is fixed at the sticker price.</p>

            <h2>Common questions</h2>
            ${faqHtml(altFaq)}

            <p style="font-size:0.9rem;">Looking at one specific app? Read the head-to-head: ${apps.map(p => `<a href="/vs/${p.slug}-vs-${comp.slug}/">${esc(p.brand)} vs ${esc(comp.name)}</a>`).join(' · ')}.</p>
          </article>
        </div>
      </div>
    </section>`;

    write(`alternatives/${comp.slug}`, page({
      title,
      desc,
      canonical: url,
      jsonld: [
        schema.itemListLd({ name: h1, url, items: apps.map(p => [p.brand, `${SITE}/${p.slug}/`]) }),
        schema.faqPageLd(altFaq),
        crumbs([['OneTimeSuite', `${SITE}/`], ['Alternatives', `${SITE}/alternatives/`], [comp.name, url]]),
      ],
      body,
    }));
    reg(`/alternatives/${comp.slug}/`, 'vs');
  }

  /* ============================================================
   * 4. hub pages: /vs/ /compare/ /alternatives/
   * ============================================================ */
  function groupPairsByCategory() {
    const map = new Map(); // categorySlug -> pairs[]
    for (const pair of pairs) {
      const c = pair.comp.category || 'other';
      if (!map.has(c)) map.set(c, []);
      map.get(c).push(pair);
    }
    return [...map.entries()].sort((a, b) => catLabel(a[0]).localeCompare(catLabel(b[0])));
  }
  function groupCompsByCategory() {
    const map = new Map(); // categorySlug -> competitors[]
    for (const comp of competitors) {
      const c = comp.category || 'other';
      if (!map.has(c)) map.set(c, []);
      map.get(c).push(comp);
    }
    return [...map.entries()].sort((a, b) => catLabel(a[0]).localeCompare(catLabel(b[0])));
  }

  /* /vs/ hub */
  {
    const groups = groupPairsByCategory();
    const body = `
    <section class="hero center">
      <div class="wrap">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">OneTimeSuite</a> / Comparisons</nav>
        <span class="stamp">vs</span>
        <h1>Pay-once software, compared head to head</h1>
        <p class="lead">${pairs.length} honest comparisons between subscription incumbents and the one-time-purchase apps that replace them — real prices, real feature tables, no affiliate fluff.</p>
      </div>
    </section>
    <section aria-label="All comparisons">
      <div class="wrap">
        ${groups.map(([cat, items]) => `
        <div class="cat-head"><h2>${esc(catLabel(cat))}</h2><span class="count">${items.length} comparison${items.length === 1 ? '' : 's'}</span></div>
        <div class="card-grid">
          ${items.map(({ p, comp, pairSlug }) => `<a class="p-card" href="/vs/${pairSlug}/">
            <h3>${esc(p.brand)} vs ${esc(comp.name)}</h3>
            <p>${esc(p.oneliner || p.tagline || '')}</p>
            <p class="price-fig">$${p.price} once</p>
          </a>`).join('\n          ')}
        </div>`).join('\n        ')}
      </div>
    </section>`;
    write('vs', page({
      title: 'Pay-once software vs subscriptions — comparisons',
      desc: `Honest head-to-head comparisons of subscription tools vs one-time-purchase alternatives — ${pairs.length} matchups with real prices, feature tables and 5-year cost math.`,
      canonical: `${SITE}/vs/`,
      jsonld: [
        schema.itemListLd({ name: 'Pay-once software comparisons', url: `${SITE}/vs/`, items: pairs.map(({ p, comp, pairSlug }) => [`${p.brand} vs ${comp.name}`, `${SITE}/vs/${pairSlug}/`]) }),
        crumbs([['OneTimeSuite', `${SITE}/`], ['Comparisons', `${SITE}/vs/`]]),
      ],
      body,
    }));
    reg('/vs/', 'vs');
  }

  /* /compare/ hub */
  {
    const groups = groupPairsByCategory();
    const body = `
    <section class="hero center">
      <div class="wrap">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">OneTimeSuite</a> / Pricing comparisons</nav>
        <span class="stamp">pricing</span>
        <h1>Subscription pricing vs one-time pricing</h1>
        <p class="lead">${pairs.length} pricing breakdowns: what the subscription costs over 1, 3, 5 and 10 years versus a single payment — and where the break-even point lands.</p>
      </div>
    </section>
    <section aria-label="All pricing comparisons">
      <div class="wrap">
        ${groups.map(([cat, items]) => `
        <div class="cat-head"><h2>${esc(catLabel(cat))}</h2><span class="count">${items.length} breakdown${items.length === 1 ? '' : 's'}</span></div>
        <div class="card-grid">
          ${items.map(({ p, comp, pairSlug }) => `<a class="p-card" href="/compare/${pairSlug}/">
            <h3>${esc(p.brand)} vs ${esc(comp.name)} pricing</h3>
            <p>$${p.price} once vs ${esc(p.compPrice || 'subscription')}${typeof p.compYr === 'number' ? ` (${fmt(p.compYr)}/yr)` : ''}.</p>
          </a>`).join('\n          ')}
        </div>`).join('\n        ')}
      </div>
    </section>`;
    write('compare', page({
      title: 'Subscription vs one-time pricing — cost breakdowns',
      desc: `What subscription software really costs over 1, 3, 5 and 10 years vs a one-time purchase — ${pairs.length} pricing breakdowns with break-even math.`,
      canonical: `${SITE}/compare/`,
      jsonld: [
        schema.itemListLd({ name: 'Pricing comparisons', url: `${SITE}/compare/`, items: pairs.map(({ p, comp, pairSlug }) => [`${p.brand} vs ${comp.name} pricing`, `${SITE}/compare/${pairSlug}/`]) }),
        crumbs([['OneTimeSuite', `${SITE}/`], ['Pricing comparisons', `${SITE}/compare/`]]),
      ],
      body,
    }));
    reg('/compare/', 'vs');
  }

  /* /alternatives/ hub */
  {
    const groups = groupCompsByCategory();
    const body = `
    <section class="hero center">
      <div class="wrap">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">OneTimeSuite</a> / Alternatives</nav>
        <span class="stamp">alternatives</span>
        <h1>Pay-once alternatives to subscription software</h1>
        <p class="lead">${competitors.length} subscription tools, each with pay-once alternatives you buy once and own forever. Pick the tool you are renting and see what owning looks like.</p>
      </div>
    </section>
    <section aria-label="All alternatives">
      <div class="wrap">
        ${groups.map(([cat, comps]) => `
        <div class="cat-head"><h2>${esc(catLabel(cat))}</h2><span class="count">${comps.length} tool${comps.length === 1 ? '' : 's'}</span></div>
        <div class="card-grid">
          ${comps.map(comp => `<a class="p-card" href="/alternatives/${comp.slug}/">
            <h3>${esc(comp.name)} alternatives</h3>
            <p>${comp.apps.length} pay-once alternative${comp.apps.length === 1 ? '' : 's'}${comp.priceMo != null ? ` — ${esc(comp.name)} runs $${comp.priceMo}/mo` : ''}.</p>
          </a>`).join('\n          ')}
        </div>`).join('\n        ')}
      </div>
    </section>`;
    write('alternatives', page({
      title: 'Pay-once alternatives to subscription software',
      desc: `Browse pay-once alternatives to ${competitors.length} subscription tools — apps you buy once and own forever, grouped by category with real prices.`,
      canonical: `${SITE}/alternatives/`,
      jsonld: [
        schema.itemListLd({ name: 'Subscription software alternatives', url: `${SITE}/alternatives/`, items: competitors.map(comp => [`${comp.name} alternatives`, `${SITE}/alternatives/${comp.slug}/`]) }),
        crumbs([['OneTimeSuite', `${SITE}/`], ['Alternatives', `${SITE}/alternatives/`]]),
      ],
      body,
    }));
    reg('/alternatives/', 'vs');
  }
};
