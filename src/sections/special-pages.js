/* src/sections/special-pages.js — four flagship special pages:
 *   /calculator/     interactive 5-year subscription cost calculator (+ lead capture)
 *   /price-tracker/  transparency page for the rising-price suite model
 *   /manifesto/      long-form "end of software subscriptions" article
 *   /graveyard/      tools that moved from owned/free to subscription
 * Sitemap set 'pages' for all four. See docs/seo-factory/CONTRACT.md.
 */
module.exports = function (ctx) {
  const { write, page, reg, esc, attr, fmt, SITE, crumbs, matrix, sales, schema, bySlug } = ctx;

  /* Suite price — THE source of truth is src/sales-data.js (ctx.sales). */
  const suitePrice = sales.hundredDaysComplete
    ? sales.postLaunchPrice
    : Math.min(sales.cap, sales.basePrice + sales.incrementPerSale * sales.salesCount);
  const SUITE_TOTAL_APPS = 102; // the 100-days promise: 102 apps in the full suite
  const appsLive = ctx.availableProducts.length;
  const HOME = ['OneTimeSuite', `${SITE}/`];

  /* ============================================================
   * 1. /calculator/ — "What are your subscriptions really costing you?"
   * ============================================================ */
  {
    /* ~18 popular subscription tools with numeric monthly prices, sourced from
     * ctx.matrix.competitors. Curated slug list keeps the output deterministic
     * and biased toward tools people actually recognize. */
    const PICKED = [
      'loom', 'calendly', 'linktree', 'typeform', 'buffer', 'notion',
      'canva-pro', 'docusign', 'trello', 'freshbooks', 'hotjar', 'otter-ai',
      'remove-bg', 'transistor', 'feedly', 'toggl', 'uptimerobot', 'submagic',
    ];
    const tools = PICKED
      .map(slug => matrix.competitors.find(c => c.slug === slug))
      .filter(c => c && typeof c.priceMo === 'number' && c.priceMo > 0)
      .map(c => {
        const app = c.apps.map(s => bySlug[s]).find(Boolean);
        return { name: c.name, mo: c.priceMo, app: app ? { brand: app.brand, price: app.price, slug: app.slug } : null };
      });

    const rows = tools.map((t, i) => `
          <label style="display:flex;align-items:center;gap:0.8rem;flex-wrap:wrap;border:1.5px solid var(--ink);border-radius:10px;background:#fff;padding:0.7rem 1rem;cursor:pointer;">
            <input type="checkbox" data-mo="${t.mo}" id="calc-t${i}" style="width:1.1rem;height:1.1rem;accent-color:#e8420c;">
            <span style="font-weight:600;flex:1;min-width:8rem;">${esc(t.name)}</span>
            <span style="font-family:var(--mono);font-size:0.88rem;">$${t.mo}/mo</span>
            ${t.app ? `<span class="mono-note">replaced by <a href="/${attr(t.app.slug)}/">${esc(t.app.brand)}</a> (${fmt(t.app.price)} once)</span>` : ''}
          </label>`).join('');

    const faq = [
      ['Is the suite really one payment?',
        `Yes. You pay ${fmt(suitePrice)} today (the price rises $${sales.incrementPerSale} per sale, capped at ${fmt(sales.cap)} during the 100-day build) and you own every app in the suite forever. No renewal, no seat fees, no account with us required to keep using the apps.`],
      ['What happens after the 100 days?',
        `When all apps have shipped, the suite price becomes ${fmt(sales.postLaunchPrice)} and the rising-price counter ends. If you bought before that — at any earlier price — you keep lifetime access to everything, including every app added after you paid.`],
      ['Can I buy just one app?',
        'Yes. Every app is also sold individually at its own one-time price. If you only need two or three tools, buying those individually can cost less than the suite — the catalog at /apps/ lists every app with its price.'],
    ];

    /* Baked constants for the client-side script (build output stays static). */
    const CALC_DATA = JSON.stringify({ suite: suitePrice, cap: sales.cap }).replace(/</g, '\\u003c');

    const body = `
    <section class="hero center">
      <div class="wrap">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">OneTimeSuite</a> / Calculator</nav>
        <span class="stamp">the subscription calculator</span>
        <h1>What are your subscriptions really costing you?</h1>
        <p class="lead">Tick the tools you pay for monthly. We'll total the real 5-year bill — and put it next to the suite you buy once and own forever.</p>
        <p class="mono-note">Prefer the quick version? Try the <a href="/savings/">savings snapshot</a>.</p>
      </div>
    </section>

    <section aria-label="Pick your subscriptions">
      <div class="wrap-narrow">
        <div id="calc-tools" style="display:grid;gap:0.7rem;">${rows}
          <div style="display:flex;align-items:center;gap:0.8rem;flex-wrap:wrap;border:1.5px dashed var(--ink);border-radius:10px;padding:0.7rem 1rem;">
            <span style="font-weight:600;flex:1;min-width:8rem;">Other — anything we didn't list</span>
            <span style="font-family:var(--mono);font-size:0.88rem;">$<input id="calc-other" type="number" min="0" max="10000" step="1" placeholder="0" inputmode="numeric" style="width:5.5rem;padding:0.35rem 0.5rem;border:1.5px solid var(--ink);border-radius:8px;font:inherit;font-family:var(--mono);">/mo</span>
          </div>
        </div>
      </div>
    </section>

    <section aria-label="Your totals">
      <div class="wrap-narrow">
        <div style="border:1.5px solid var(--ink);border-radius:12px;background:#fff;padding:1.4rem 1.6rem;margin-top:1.6rem;box-shadow:5px 5px 0 var(--ink);">
          <p style="margin:0 0 0.3rem;">Your stack: <strong id="calc-mo" style="font-family:var(--mono);">$0</strong>/month &middot; <strong id="calc-yr" style="font-family:var(--mono);">$0</strong>/year</p>
          <p style="margin:0 0 0.9rem;">Over 5 years that's <strong id="calc-5yr" style="font-family:var(--mono);">$0</strong> — the suite is <strong style="font-family:var(--mono);">${fmt(suitePrice)}</strong>, once.</p>
          <p class="price-fig" id="calc-save" style="margin:0 0 0.9rem;">YOU SAVE $0 over 5 years</p>
          <div class="btn-row">
            <a class="btn btn-solid" href="/onetime-suite-bundle/">Get the whole suite — ${fmt(suitePrice)} once &rarr;</a>
            <a class="btn btn-ghost" href="/apps/">or buy apps individually</a>
          </div>
        </div>
      </div>
    </section>

    <section aria-label="Get the savings report">
      <div class="wrap-narrow">
        <div style="border:1.5px solid var(--ink);border-radius:12px;background:#fff;padding:1.6rem;margin-top:1.6rem;">
          <h2 style="margin-top:0;">Get the savings report + new app drops</h2>
          <p style="color:var(--ink-soft);">One email with your numbers and the apps that replace them — plus a heads-up when new pay-once apps ship. No spam.</p>
          <form id="calc-lead" novalidate>
            <input type="hidden" name="source" value="calculator">
            <label for="calc-name" class="mono-note" style="display:block;margin-bottom:0.3rem;">Name</label>
            <input id="calc-name" name="name" type="text" autocomplete="name" maxlength="120" required
              style="width:100%;padding:0.6rem 0.85rem;border:1.5px solid var(--ink);border-radius:10px;font:inherit;margin-bottom:0.9rem;background:var(--paper);">
            <label for="calc-email" class="mono-note" style="display:block;margin-bottom:0.3rem;">Email</label>
            <input id="calc-email" name="email" type="email" autocomplete="email" required
              style="width:100%;padding:0.6rem 0.85rem;border:1.5px solid var(--ink);border-radius:10px;font:inherit;margin-bottom:0.9rem;background:var(--paper);">
            <button id="calc-send" type="submit" class="btn btn-solid" style="cursor:pointer;border:1.5px solid var(--ink);">Send me the report</button>
            <p class="mono-note" id="calc-err" style="margin-top:0.7rem;"></p>
          </form>
          <p id="calc-done" class="mono-note" style="display:none;margin-top:0.7rem;">&#10003; Done — check your inbox for the savings report.</p>
        </div>
      </div>
    </section>

    <section aria-label="FAQ">
      <div class="wrap-narrow">
        <h2>Fair questions</h2>
        ${faq.map(([q, a]) => `<div class="faq-item"><h3>${esc(q)}</h3><p>${esc(a)}</p></div>`).join('\n        ')}
      </div>
    </section>

    <script>
    (function () {
      var CFG = ${CALC_DATA};
      function money(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
      var boxes = document.querySelectorAll('#calc-tools input[type="checkbox"]');
      var other = document.getElementById('calc-other');
      var moEl = document.getElementById('calc-mo');
      var yrEl = document.getElementById('calc-yr');
      var fiveEl = document.getElementById('calc-5yr');
      var saveEl = document.getElementById('calc-save');
      function render() {
        var mo = 0;
        for (var i = 0; i < boxes.length; i++) {
          if (boxes[i].checked) mo += parseFloat(boxes[i].getAttribute('data-mo')) || 0;
          var row = boxes[i].parentNode;
          row.style.outline = boxes[i].checked ? '2px solid var(--accent)' : 'none';
        }
        var extra = parseFloat(other.value);
        if (extra > 0) mo += Math.min(10000, extra);
        var five = mo * 60;
        moEl.textContent = money(mo);
        yrEl.textContent = money(mo * 12);
        fiveEl.textContent = money(five);
        var diff = five - CFG.suite;
        saveEl.textContent = diff >= 0
          ? 'YOU SAVE ' + money(diff) + ' over 5 years'
          : 'The suite costs ' + money(-diff) + ' more than your 5-year bill — but you own it past year five';
      }
      for (var i = 0; i < boxes.length; i++) boxes[i].addEventListener('change', render);
      other.addEventListener('input', render);
      render();

      /* lead capture — same contract as src/lead-page.js: POST /api/lead
       * with { name, email, source }. */
      var form = document.getElementById('calc-lead');
      var btn = document.getElementById('calc-send');
      var err = document.getElementById('calc-err');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        err.textContent = '';
        var name = document.getElementById('calc-name').value.trim();
        var email = document.getElementById('calc-email').value.trim();
        if (!name || !email) { err.textContent = 'Please fill in both fields.'; return; }
        btn.disabled = true;
        btn.textContent = 'Sending…';
        fetch('/api/lead', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name: name, email: email, source: 'calculator' })
        }).then(function (r) {
          return r.json().then(function (data) { return { ok: r.ok, data: data }; });
        }).then(function (res) {
          if (res.ok && res.data.ok) {
            form.style.display = 'none';
            document.getElementById('calc-done').style.display = 'block';
          } else {
            err.textContent = (res.data && res.data.error) ? res.data.error : 'Something went wrong — please try again.';
          }
        }).catch(function () {
          err.textContent = 'Network error — please try again.';
        }).finally(function () {
          btn.disabled = false;
          btn.textContent = 'Send me the report';
        });
      });
    })();
    </script>`;

    write('calculator', page({
      title: 'Subscription Calculator | OneTimeSuite',
      desc: 'Add up the subscriptions you pay every month, see your real 5-year cost, and compare it with one suite of apps you buy once and own forever.',
      canonical: `${SITE}/calculator/`,
      jsonld: [
        crumbs([HOME, ['Subscription Calculator', `${SITE}/calculator/`]]),
        schema.articleLd({
          title: 'What are your subscriptions really costing you?',
          desc: 'An interactive calculator that totals the 5-year cost of popular subscription tools and compares it with the one-time price of the OneTime Suite.',
          url: `${SITE}/calculator/`,
          datePublished: sales.updatedAt,
        }),
        schema.faqPageLd(faq),
      ],
      body,
    }));
    reg('/calculator/', 'pages');
  }

  /* ============================================================
   * 2. /price-tracker/ — the transparency page for the rising-price model
   * ============================================================ */
  {
    const capped = !sales.hundredDaysComplete && suitePrice >= sales.cap;
    const nextLine = sales.hundredDaysComplete
      ? `The 100 days are over — the suite is now ${fmt(sales.postLaunchPrice)}, fixed. No more counter.`
      : capped
        ? `The price has hit its ${fmt(sales.cap)} cap — it stays here for the rest of the 100-day build.`
        : `Next buyer pays ${fmt(suitePrice + sales.incrementPerSale)} — the price rises ${fmt(sales.incrementPerSale)} with every sale.`;

    /* Price history — real entries only. Empty ledger = the launch row alone. */
    const hist = (sales.priceHistory || []).slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const histRows = hist.length
      ? hist.map(h => `<tr><td>${esc(h.date)}</td><td class="us price-fig">${fmt(h.price)}</td><td>${esc(h.note || '')}</td></tr>`).join('\n            ')
      : `<tr><td>Launch</td><td class="us price-fig">${fmt(sales.basePrice)}</td><td>where it started</td></tr>`;

    /* Inline SVG line chart from the same points. 0/1 point = a single dot +
     * label — no invented intermediate data. */
    const pts = hist.length ? hist : [{ date: 'Launch', price: sales.basePrice, note: 'where it started' }];
    const W = 600, H = 160, PAD = 24;
    const prices = pts.map(p => p.price);
    const lo = Math.min.apply(null, prices), hi = Math.max.apply(null, prices);
    const span = hi - lo || 1;
    const xy = pts.map((p, i) => {
      const x = pts.length === 1 ? W / 2 : PAD + (i * (W - 2 * PAD)) / (pts.length - 1);
      const y = H - PAD - ((p.price - lo) * (H - 2 * PAD)) / span;
      return [Math.round(x * 10) / 10, Math.round(y * 10) / 10, p];
    });
    const dots = xy.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#e8420c" stroke="#17191d" stroke-width="1.5"/>`).join('');
    const line = xy.length > 1
      ? `<polyline points="${xy.map(([x, y]) => `${x},${y}`).join(' ')}" fill="none" stroke="#17191d" stroke-width="2"/>`
      : '';
    const first = xy[0], last = xy[xy.length - 1];
    const chart = `
        <svg viewBox="0 0 ${W} ${H + 34}" width="100%" role="img" aria-label="Suite price history chart" style="background:#fff;border:1.5px solid var(--ink);border-radius:12px;">
          <line x1="${PAD}" y1="${H - PAD}" x2="${W - PAD}" y2="${H - PAD}" stroke="#17191d" stroke-width="1" opacity="0.25"/>
          ${line}${dots}
          <text x="${first[0]}" y="${first[1] - 12}" text-anchor="middle" font-family="monospace" font-size="12" fill="#17191d">${fmt(first[2].price)}</text>
          <text x="${first[0]}" y="${H + 12}" text-anchor="middle" font-family="monospace" font-size="11" fill="#85888f">${esc(String(first[2].date))}</text>
          ${xy.length > 1 ? `<text x="${last[0]}" y="${last[1] - 12}" text-anchor="middle" font-family="monospace" font-size="12" fill="#17191d">${fmt(last[2].price)}</text>
          <text x="${last[0]}" y="${H + 12}" text-anchor="middle" font-family="monospace" font-size="11" fill="#85888f">${esc(String(last[2].date))}</text>` : ''}
        </svg>`;

    const body = `
    <section class="hero center">
      <div class="wrap">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">OneTimeSuite</a> / Price tracker</nav>
        <span class="stamp">full transparency</span>
        <h1>OneTime Suite price: ${fmt(suitePrice)} today</h1>
        <p class="lead">This page is the whole pricing model in the open: what the suite costs right now, what the next buyer pays, and every price it has ever been.</p>
      </div>
    </section>

    <section aria-label="Current price">
      <div class="wrap-narrow">
        <div style="border:1.5px solid var(--ink);border-radius:12px;background:#fff;padding:1.8rem;text-align:center;box-shadow:5px 5px 0 var(--ink);">
          <p class="price-fig" style="font-size:clamp(2.4rem,7vw,4rem);margin:0;">${fmt(suitePrice)}</p>
          <p style="margin:0.4rem 0 0;color:var(--ink-soft);">${esc(nextLine)}</p>
          <p class="mono-note" style="margin-top:0.9rem;">${appsLive} apps live &middot; of ${SUITE_TOTAL_APPS} in the full suite &middot; ${esc(sales.salesCount)} sales so far</p>
        </div>
      </div>
    </section>

    <section aria-label="How the pricing works">
      <div class="wrap-narrow">
        <h2>How the pricing works</h2>
        <div class="post-body">
          <p>The suite launched at <strong>${fmt(sales.basePrice)}</strong>. Every sale raises the price by <strong>${fmt(sales.incrementPerSale)}</strong>, up to a hard cap of <strong>${fmt(sales.cap)}</strong> during the 100-day build. Early buyers fund the build and get the best price; later buyers pay more for a more complete suite.</p>
          <p>After all apps ship, the suite becomes <strong>${fmt(sales.postLaunchPrice)}</strong> and the counter model ends. Individual apps are always available separately at <a href="/apps/">/apps/</a> at their own one-time prices.</p>
          <p>Already bought? <strong>You keep everything, forever.</strong> Every app that ships after your purchase joins your license at no extra cost — that's the point of buying early.</p>
        </div>
      </div>
    </section>

    <section aria-label="Price history">
      <div class="wrap-narrow">
        <h2>Price history</h2>
        <div class="tbl-wrap">
          <table class="receipt">
            <thead><tr><th>Date</th><th class="us">Price</th><th>Note</th></tr></thead>
            <tbody>
            ${histRows}
            </tbody>
          </table>
        </div>
        <div style="margin-top:1.2rem;">${chart}
        </div>
        <p class="mono-note" style="margin-top:0.8rem;">Last updated ${esc(sales.updatedAt)} — this page is regenerated when the sales ledger changes.</p>
      </div>
    </section>

    <section aria-label="Get the suite">
      <div class="wrap-narrow">
        <div class="btn-row">
          <a class="btn btn-solid" href="/onetime-suite-bundle/">Lock in ${fmt(suitePrice)} &rarr;</a>
          <a class="btn btn-ghost" href="/webinar/">Watch the webinar first</a>
        </div>
      </div>
    </section>`;

    write('price-tracker', page({
      title: 'Suite Price Tracker | OneTimeSuite',
      desc: `The OneTime Suite price rises $${sales.incrementPerSale} with every sale, from ${fmt(sales.basePrice)} up to a ${fmt(sales.cap)} cap during the 100-day build. Today's price, the history, and the model.`,
      canonical: `${SITE}/price-tracker/`,
      jsonld: [
        crumbs([HOME, ['Suite price tracker', `${SITE}/price-tracker/`]]),
        schema.productLd({
          name: 'OneTime Suite',
          desc: `Every app in the OneTime Suite catalog for one payment. ${appsLive} of ${SUITE_TOTAL_APPS} apps live.`,
          url: `${SITE}/price-tracker/`,
          price: suitePrice,
          priceNote: `Price rises $${sales.incrementPerSale} per sale up to ${fmt(sales.cap)} during the 100-day build; ${fmt(sales.postLaunchPrice)} after all apps ship.`,
        }),
      ],
      body,
    }));
    reg('/price-tracker/', 'pages');
  }

  /* ============================================================
   * 3. /manifesto/ — "The End of Software Subscriptions"
   * ============================================================ */
  {
    /* Real stats computed from the catalog at build time. */
    const appCount = ctx.allProducts.length;
    const yrSample = ctx.allProducts.filter(p => typeof p.compYr === 'number' && p.compYr > 0);
    const yrSum = yrSample.reduce((s, p) => s + p.compYr, 0);

    const body = `
    <section class="hero center">
      <div class="wrap">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">OneTimeSuite</a> / Manifesto</nav>
        <span class="stamp">the manifesto</span>
        <h1>The End of Software Subscriptions</h1>
        <p class="lead">Software used to be something you bought. Then it became something you rent. This is the case for owning your tools again.</p>
      </div>
    </section>

    <section aria-label="The manifesto">
      <div class="wrap-narrow">
        <article class="post-body">
          <h2>From bought to rented</h2>
          <p>There was a time when software came in a box and the transaction ended at the register. You paid once, you owned the disc, and the tool worked until you chose to replace it. Then the industry discovered the subscription — and slowly, one tool at a time, ownership became a monthly bill that never ends.</p>
          <p>The result is a stack that costs more every year while giving you nothing more to keep. Stop paying, and the tools you built your work on simply stop working.</p>
          <blockquote>You don't own your tools anymore. You rent permission to do your own work.</blockquote>

          <h2>What the rental actually costs</h2>
          <p>This catalog has <strong>${appCount} apps</strong>. For <strong>${yrSample.length} of them</strong> we track the yearly cost of the subscription tool each one replaces — real, published prices. Add that sample up and the rental bill is <strong>${fmt(yrSum)}+ per year</strong>. That's not a hypothetical average from a survey; it's the arithmetic of the actual tools these apps stand in for.</p>
          <p>The suite that replaces them costs <strong>${fmt(suitePrice)}</strong> — once. Even at its final price of ${fmt(sales.postLaunchPrice)} after the 100-day build, the entire catalog costs less than a few months of the stack it replaces.</p>
          <blockquote>${fmt(yrSum)} a year to rent. ${fmt(suitePrice)} once to own. That is the whole argument.</blockquote>

          <h2>What "own it" means here</h2>
          <p>Ownership is not a marketing word — it's a list of concrete properties:</p>
          <ul>
            <li><strong>Desktop apps run 100% local.</strong> Your files never leave your machine unless you send them somewhere.</li>
            <li><strong>Web apps are self-hosted.</strong> Your server, your data, your domain, your rules.</li>
            <li><strong>No accounts with us.</strong> Nothing to log into to keep using what you bought.</li>
            <li><strong>No telemetry.</strong> The apps don't phone home, because there's no home to phone.</li>
            <li><strong>No renewal dates.</strong> There is no date on which your tools stop working.</li>
          </ul>

          <h2>Free cores, paid packaging</h2>
          <p>Every app in the suite has a public, MIT-licensed core on GitHub. If you have the time and the skills, you can build and run the free version forever — that's deliberate. What the one-time price buys is the packaged product: signed installers, 1-click setup, and updates across the whole catalog. Free if you want free; paid once if you want done.</p>
          <blockquote>The free version stays free forever. The paid version is paid once, forever. Nobody gets a bill in year three.</blockquote>

          <h2>The 100 days</h2>
          <p>The suite is being built in public over 100 days: ${SUITE_TOTAL_APPS} apps, shipped one after another. During the build the price starts at ${fmt(sales.basePrice)} and rises ${fmt(sales.incrementPerSale)} with every sale, capped at ${fmt(sales.cap)} — early supporters pay least and get everything that ships after them, free. ${appsLive} apps are live today. The ledger is public on the <a href="/price-tracker/">price tracker</a>.</p>

          <h2>The invitation</h2>
          <p>If the rental model has ever annoyed you — a price hike email, a "your plan is changing" notice, a feature moved behind a higher tier — this is the exit. Run your own numbers on the <a href="/calculator/">subscription calculator</a>, visit the <a href="/graveyard/">graveyard</a> of tools that used to be yours, or watch the <a href="/webinar/">webinar</a> and see the apps work.</p>
          <div class="btn-row">
            <a class="btn btn-solid" href="/onetime-suite-bundle/">Get the suite — ${fmt(suitePrice)} once &rarr;</a>
            <a class="btn btn-ghost" href="/calculator/">Run your numbers</a>
            <a class="btn btn-ghost" href="/graveyard/">Visit the graveyard</a>
          </div>
        </article>
      </div>
    </section>`;

    write('manifesto', page({
      title: 'The End of Software Subscriptions | OneTimeSuite',
      desc: `Software went from bought to rented. The ${appCount} apps in this catalog replace tools renting for ${fmt(yrSum)}+ a year. The case for owning your software again.`,
      canonical: `${SITE}/manifesto/`,
      ogType: 'article',
      jsonld: [
        crumbs([HOME, ['Manifesto', `${SITE}/manifesto/`]]),
        schema.articleLd({
          title: 'The End of Software Subscriptions',
          desc: 'Software went from bought to rented. A data-backed case for owning your tools again: real subscription totals, real ownership terms, and the 100-day build.',
          url: `${SITE}/manifesto/`,
          datePublished: sales.updatedAt,
        }),
      ],
      body,
    }));
    reg('/manifesto/', 'pages');
  }

  /* ============================================================
   * 4. /graveyard/ — "The Subscription Graveyard"
   * ============================================================ */
  {
    const cards = matrix.graveyard.map(g => {
      const answers = g.alternativeSlugs
        .map(s => bySlug[s])
        .filter(Boolean)
        .map(p => `<a href="/${attr(p.slug)}/">${esc(p.brand)}</a> (${fmt(p.price)} once)`)
        .join(' &middot; ');
      return `
          <div class="p-card" id="${attr(g.slug)}" style="display:flex;flex-direction:column;">
            <h3>${esc(g.name)} <span class="mono-note">&middot; ${esc(g.year)}</span></h3>
            <p class="mono-note" style="margin:0.2rem 0 0.5rem;">Was: ${esc(g.was)}<br>Now: ${esc(g.now)}</p>
            <p class="one">${esc(g.story)}</p>
            <div class="foot"><span class="replaces">Our answer:<br>${answers || 'in the works'}</span></div>
          </div>`;
    }).join('');

    const body = `
    <section class="hero center">
      <div class="wrap">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">OneTimeSuite</a> / Graveyard</nav>
        <span class="stamp">pay respects</span>
        <h1>The Subscription Graveyard — tools that used to be yours</h1>
        <p class="lead">Eight tools you could once buy, or use freely, that moved to subscriptions. The dates and prices below are the public record — the answers on each card are ours.</p>
      </div>
    </section>

    <section aria-label="The graveyard">
      <div class="wrap">
        <div class="section-head">
          <span class="stamp">The graves</span>
          <h2>${matrix.graveyard.length} tools, and when the meter started</h2>
        </div>
        <div class="card-grid">${cards}
        </div>
        <p class="mono-note" style="margin-top:1rem;">Pricing-model history as publicly reported; linked products are ours.</p>
        <div class="btn-row" style="margin-top:1.4rem;">
          <a class="btn btn-solid" href="/manifesto/">Read the manifesto &rarr;</a>
          <a class="btn btn-ghost" href="/calculator/">Run your numbers</a>
        </div>
      </div>
    </section>`;

    write('graveyard', page({
      title: 'The Subscription Graveyard | OneTimeSuite',
      desc: 'Eight popular tools that moved from one-time licenses or generous free tiers to subscriptions — the dates, the prices, and the pay-once apps that answer them.',
      canonical: `${SITE}/graveyard/`,
      jsonld: [
        crumbs([HOME, ['The Subscription Graveyard', `${SITE}/graveyard/`]]),
        schema.itemListLd({
          name: 'The Subscription Graveyard',
          url: `${SITE}/graveyard/`,
          items: matrix.graveyard.map(g => [g.name, `${SITE}/graveyard/#${g.slug}`]),
        }),
      ],
      body,
    }));
    reg('/graveyard/', 'pages');
  }
};
