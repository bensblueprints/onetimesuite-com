/* src/sections/conversion-pages.js — conversion + trust pages:
 * /webinar/ (SEO-traffic closer), /press/ (press kit), /events/ hub +
 * /events/<slug>/, /research/ hub + two computed data reports, and
 * /stacks/ (User Stack showcase program).
 * Sitemap set: 'pages' for every route. See docs/seo-factory/CONTRACT.md §5.
 *
 * Honesty rules baked in here:
 *  - suite price ONLY from ctx.sales (rising-price model, real numbers);
 *  - VideoObject/Event structured data only for real videos/events;
 *  - /stacks/ renders a clearly-labeled illustrative mock, never a fake
 *    testimonial.
 */
module.exports = function (ctx) {
  const { write, page, reg, esc, attr, SITE, crumbs, matrix, sales, schema, bySlug, fmt } = ctx;
  const webinar = require('../webinar-data.js');
  const { events } = require('../events-data.js');
  const { stacks } = require('../stacks-data.js');

  const GH = ctx.GH || 'https://github.com/bensblueprints';
  const allProducts = ctx.allProducts;
  const availableProducts = ctx.availableProducts;
  const CONTACT = 'ben [at] advancedmarketing [dot] co';
  const HOME = ['OneTimeSuite', `${SITE}/`];

  /* Suite price — the ONLY source of truth (sales-data.js). */
  const suitePrice = sales.hundredDaysComplete
    ? sales.postLaunchPrice
    : Math.min(sales.cap, sales.basePrice + sales.incrementPerSale * sales.salesCount);

  /* Deal-mechanics sentence, factual from sales-data either way. */
  const dealMechanics = sales.hundredDaysComplete
    ? `The 100 days are complete — the suite is ${fmt(sales.postLaunchPrice)}, one payment, every app.`
    : `The suite started at ${fmt(sales.basePrice)} and rises ${fmt(sales.incrementPerSale)} with every sale, capped at ${fmt(sales.cap)} during the 100 days. Right now it is ${fmt(suitePrice)}. After all apps ship, the suite becomes ${fmt(sales.postLaunchPrice)}.`;

  /* ---- shared lead-capture form (exact /api/lead contract from src/lead-page.js) ---- */
  const INPUT_STYLE = 'width:100%;font-size:1rem;color:var(--ink);background:var(--paper);border:1.5px solid var(--ink);border-radius:12px;padding:0.7rem 0.9rem;margin-bottom:1rem;outline:none;box-sizing:border-box;';
  const LABEL_STYLE = 'display:block;font-family:var(--mono);font-size:0.78rem;font-weight:600;margin-bottom:0.3rem;';

  function leadForm({ source, button, note }) {
    return `
        <form class="lead-capture" data-source="${attr(source)}" novalidate style="max-width:440px;margin:1.4rem auto 0;text-align:left;">
          <input type="hidden" name="source" value="${attr(source)}">
          <label for="lf-name-${attr(source)}" style="${LABEL_STYLE}">Name</label>
          <input id="lf-name-${attr(source)}" name="name" type="text" autocomplete="name" maxlength="120" required style="${INPUT_STYLE}">
          <label for="lf-email-${attr(source)}" style="${LABEL_STYLE}">Email</label>
          <input id="lf-email-${attr(source)}" name="email" type="email" autocomplete="email" required style="${INPUT_STYLE}">
          <button class="btn btn-solid" type="submit" style="width:100%;border:1.5px solid var(--ink);cursor:pointer;">${esc(button)}</button>
          <p class="lead-err mono-note" style="display:none;color:var(--accent);margin-top:0.7rem;"></p>
          <p class="mono-note" style="margin-top:0.9rem;text-align:center;">${esc(note)}</p>
        </form>`;
  }

  /* One handler per page, bound to every form.lead-capture — same fetch
   * pattern as src/lead-page.js (POST /api/lead, { name, email, source }). */
  const LEAD_SCRIPT = `
    <script>
    (function () {
      document.querySelectorAll('form.lead-capture').forEach(function (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var err = form.querySelector('.lead-err');
          var btn = form.querySelector('button[type="submit"]');
          err.style.display = 'none'; err.textContent = '';
          var name = form.querySelector('input[name="name"]').value.trim();
          var email = form.querySelector('input[name="email"]').value.trim();
          if (!name || !email) { err.textContent = 'Please fill in both fields.'; err.style.display = 'block'; return; }
          btn.disabled = true; var label = btn.textContent; btn.textContent = 'Sending…';
          fetch('/api/lead', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ name: name, email: email, source: form.getAttribute('data-source') })
          }).then(function (r) {
            return r.json().then(function (data) { return { ok: r.ok, data: data }; });
          }).then(function (res) {
            if (res.ok && res.data.ok) {
              form.innerHTML = '<p class="mono-note" style="color:var(--ink);font-weight:600;padding:1rem 0;">Done — check your inbox.</p>';
            } else {
              err.textContent = (res.data && res.data.error) ? res.data.error : 'Something went wrong — please try again.';
              err.style.display = 'block';
            }
          }).catch(function () {
            err.textContent = 'Network error — please try again.';
            err.style.display = 'block';
          }).finally(function () {
            btn.disabled = false; btn.textContent = label;
          });
        });
      });
    })();
    </script>`;

  /* ============================================================
   * 1. /webinar/
   * ============================================================ */
  (function webinarPage() {
    const videoBlock = webinar.youtubeId
      ? `
        <div style="position:relative;padding-top:56.25%;border:1.5px solid var(--ink);border-radius:12px;overflow:hidden;background:#000;">
          <iframe src="https://www.youtube-nocookie.com/embed/${attr(webinar.youtubeId)}" title="${attr(webinar.title)}"
            style="position:absolute;inset:0;width:100%;height:100%;border:0;"
            loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
        </div>
        <p class="mono-note" style="margin-top:0.7rem;">${esc(webinar.title)} — ${esc(webinar.durationNote)}, recorded. Watch anytime.</p>`
      : `
        <div style="border:1.5px dashed var(--ink);border-radius:12px;padding:4.5rem 2rem;text-align:center;background:var(--paper-raised);">
          <span class="stamp">coming soon</span>
          <p style="font-family:var(--display);font-weight:800;font-size:1.3rem;margin-top:1rem;">Webinar video drops here — join the list below to get it first.</p>
          <p class="mono-note" style="margin-top:0.6rem;">${esc(webinar.durationNote)} · recorded · watch anytime once it's live</p>
        </div>`;

    const agendaSteps = webinar.agenda.map(([time, label]) => `
          <div class="step"><span class="n">${esc(time)}</span><h3 style="font-size:1.05rem;">${esc(label.split(' — ')[0])}</h3><p>${esc(label.split(' — ').slice(1).join(' — ') || label)}</p></div>`).join('');

    const faq = [
      ['Is the webinar live or recorded?', 'Recorded. Once the video is published on this page you can watch it anytime — there is no scheduled broadcast to miss and no replay window that expires.'],
      ['Do I have to buy anything after watching?', 'No. The webinar is a walkthrough, not a commitment. Every app is also sold individually, and the free MIT-licensed versions stay on GitHub regardless.'],
      ['What if I only want one app?', 'Then buy just that one. Individual apps are always sold separately at one-time prices — browse the full catalog at /apps/. The suite only makes sense if you want several.'],
    ];

    const jsonld = [
      schema.faqPageLd(faq),
      crumbs([HOME, ['Webinar', `${SITE}/webinar/`]]),
    ];
    /* VideoObject ONLY for a real video — never for the placeholder. */
    if (webinar.youtubeId) {
      jsonld.unshift(schema.videoLd({
        name: webinar.title,
        desc: 'A recorded walkthrough of the OneTimeSuite catalog: the subscription problem, a rapid-fire demo of 12 apps, how the pay-once deal works, and how to lock the current suite price.',
        thumbUrl: `https://i.ytimg.com/vi/${webinar.youtubeId}/hqdefault.jpg`,
        uploadDate: sales.updatedAt,
        durationIso: 'PT12M',
        url: `${SITE}/webinar/`,
      }));
    }

    write('webinar', page({
      title: 'Webinar: See the Apps, Understand the Deal | OneTimeSuite',
      desc: 'A ~12-minute recorded walkthrough: the subscription problem, 12 apps demoed rapid-fire, how the pay-once deal works, and how to lock today\'s suite price.',
      canonical: `${SITE}/webinar/`,
      jsonld,
      body: `
    <section class="hero center">
      <div class="wrap">
        <span class="stamp">Webinar</span>
        <h1>See all the apps. Understand the deal. Lock your price.</h1>
        <p class="lead">${esc(webinar.title)} — ${esc(webinar.durationNote)}, recorded, no sign-up wall. What the subscription stack costs, what replaces it, and exactly how the one-time price works.</p>
      </div>
    </section>

    <section aria-label="Webinar video">
      <div class="wrap" style="max-width:920px;">
        ${videoBlock}
      </div>
    </section>

    <section aria-label="Agenda">
      <div class="wrap">
        <div class="section-head">
          <span class="stamp blue">Agenda</span>
          <h2>What the ${esc(webinar.durationNote)} covers</h2>
        </div>
        <div class="steps">${agendaSteps}
        </div>
      </div>
    </section>

    <section aria-label="The deal">
      <div class="wrap-narrow">
        <div class="cta-card">
          <span class="stamp">The deal</span>
          <h3>The suite is <span class="price-fig">${fmt(suitePrice)}</span> right now — once, not per month.</h3>
          <p>${esc(dealMechanics)} One payment covers every app in the catalog, with installers, 1-click setup and updates. Prefer just one tool? Individual apps are always sold separately at one-time prices on <a class="link" href="/apps/">/apps/</a>.</p>
          <div class="btn-row">
            <a class="btn btn-solid" href="/onetime-suite-bundle/">See the full suite &rarr;</a>
            <a class="btn btn-ghost" href="/apps/">Browse individual apps</a>
          </div>
        </div>
      </div>
    </section>

    <section aria-label="Get the webinar link" class="center">
      <div class="wrap-narrow">
        <div class="section-head">
          <span class="stamp blue">Stay in the loop</span>
          <h2>Get the webinar link + price-rise alerts</h2>
          <p>The suite price rises ${esc(fmt(sales.incrementPerSale))} with every sale. Leave your email and you get the webinar link the moment the video lands — plus a heads-up before price rises.</p>
        </div>
        ${leadForm({ source: 'webinar', button: 'Send me the webinar link', note: 'One email when the video drops, alerts when the price moves. No spam, unsubscribe anytime.' })}
      </div>
    </section>

    <section aria-label="Frequently asked questions">
      <div class="wrap-narrow">
        <div class="section-head">
          <span class="stamp">FAQ</span>
          <h2>Honest answers</h2>
        </div>
        ${faq.map(([q, a]) => `<div class="faq-item"><h3>${esc(q)}</h3><p>${esc(a)}</p></div>`).join('\n        ')}
      </div>
    </section>
    ${LEAD_SCRIPT}`,
    }));
    reg('/webinar/', 'pages');
  })();

  /* ============================================================
   * 2. /press/
   * ============================================================ */
  (function pressPage() {
    const prices = allProducts.map(p => p.price).filter(n => typeof n === 'number').sort((a, b) => a - b);
    const minPrice = prices[0], maxPrice = prices[prices.length - 1];
    /* Only link screenshots that actually ship in assets/shots/ — ctx.hasShot
       is the build's own detector; fall back to an fs check in the harness. */
    const hasShot = ctx.hasShot || ((s) => { try { return require('fs').existsSync(require('path').join(__dirname, '..', '..', 'assets', 'shots', s + '.png')); } catch { return false; } });
    const flagshipShots = ['bloomrecorder', 'wispertalk', 'pdfsmith', 'bookslot', 'linkleaf', 'captionly', 'cutaway', 'whisperdesk', 'upwatch', 'formforge']
      .filter(hasShot).slice(0, 5);

    const boilerplate = `OneTimeSuite is a pay-once software suite: ${allProducts.length} desktop and web apps that replace the subscription SaaS stack — screen recorders, PDF tools, schedulers, form builders, e-signature, analytics and more — with software you buy once and own forever. Every app ships first as a free, MIT-licensed MVP on GitHub; the paid version adds packaged installers, 1-click setup and updates. The suite is built in public: the full catalog, every price and the 100-apps-in-100-days build log are published on the site. The complete suite is sold under a rising-price model — it started at ${fmt(sales.basePrice)} and increases ${fmt(sales.incrementPerSale)} with every sale, capped at ${fmt(sales.cap)} during the launch window. OneTimeSuite is operated by Advanced Marketing.`;

    const factRows = [
      ['Apps in catalog', String(allProducts.length)],
      ['Apps available now', String(availableProducts.length)],
      ['Individual app prices', `${fmt(minPrice)} – ${fmt(maxPrice)}, one-time`],
      ['Suite pricing model', sales.hundredDaysComplete
        ? `${fmt(sales.postLaunchPrice)} one-time (100 days complete)`
        : `Started ${fmt(sales.basePrice)}, +${fmt(sales.incrementPerSale)} per sale, capped ${fmt(sales.cap)} during the 100 days; ${fmt(sales.postLaunchPrice)} after all apps ship`],
      ['Source code', 'Free MIT-licensed MVPs on GitHub for the catalog'],
      ['Company', 'OneTimeSuite, operated by Advanced Marketing'],
      ['Contact', CONTACT],
    ].map(([k, v]) => `
            <tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('');

    const shotRows = flagshipShots.map((slug) => {
      const p = bySlug[slug];
      const label = p ? `${p.brand} — ${p.tagline || 'app screenshot'}` : slug;
      return `
            <tr><td>${p ? esc(p.icon || '') : ''} ${esc(p ? p.brand : slug)}</td><td>${esc(p ? (p.tagline || '') : '')}</td><td><a class="link" href="/assets/shots/${attr(slug)}.png">/assets/shots/${esc(slug)}.png</a></td></tr>`;
    }).join('');

    write('press', page({
      title: 'Press Kit — Facts, Boilerplate & Assets | OneTimeSuite',
      desc: 'Press kit for OneTimeSuite: a 100-word boilerplate, a facts sheet with real catalog numbers, screenshots and brand assets, and how to reach us for stories.',
      canonical: `${SITE}/press/`,
      jsonld: [
        schema.articleLd({
          title: 'OneTimeSuite Press Kit',
          desc: 'Boilerplate, facts sheet, screenshots and brand assets for the pay-once software suite.',
          url: `${SITE}/press/`,
          datePublished: sales.updatedAt,
        }),
        crumbs([HOME, ['Press', `${SITE}/press/`]]),
      ],
      body: `
    <section class="hero" aria-label="Press kit" style="padding-bottom:2.5rem;">
      <div class="wrap-narrow">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">OneTimeSuite</a> / Press</nav>
        <span class="stamp">Press kit</span>
        <h1 style="font-size:clamp(1.9rem,4.4vw,3rem);">Press &amp; media kit</h1>
        <p class="lead">Everything on this page is quotable as-is. Numbers are computed from the live catalog at build time, last updated ${esc(sales.updatedAt)}.</p>
      </div>
    </section>

    <section aria-label="Boilerplate" style="padding-top:2.5rem;">
      <div class="wrap-narrow">
        <article class="post-body">
          <h2>Boilerplate (~100 words)</h2>
          <p>${esc(boilerplate)}</p>
          <h2>The short version</h2>
          <p>${allProducts.length} pay-once apps replacing subscription SaaS. Free MIT MVPs on <a href="${attr(GH)}" rel="noopener">GitHub</a>, paid full versions with installers and updates. Built in public.</p>
        </article>
      </div>
    </section>

    <section aria-label="Facts sheet">
      <div class="wrap-narrow">
        <div class="section-head">
          <span class="stamp blue">Facts sheet</span>
          <h2>The numbers, verbatim</h2>
        </div>
        <div class="tbl-wrap">
          <table class="receipt">
            <thead><tr><th>Fact</th><th>Value</th></tr></thead>
            <tbody>${factRows}
            </tbody>
          </table>
        </div>
        <p class="mono-note" style="margin-top:0.8rem;">Figures computed from the product catalog and sales data at build time (${esc(sales.updatedAt)}).</p>
      </div>
    </section>

    <section aria-label="Assets">
      <div class="wrap-narrow">
        <div class="section-head">
          <span class="stamp">Assets</span>
          <h2>Screenshots &amp; logos</h2>
          <p>Real screenshots of the flagship apps, served from this site — hotlink or download.</p>
        </div>
        <div class="tbl-wrap">
          <table class="receipt">
            <thead><tr><th>App</th><th>What it is</th><th class="us">Screenshot</th></tr></thead>
            <tbody>${shotRows}
            </tbody>
          </table>
        </div>
        <article class="post-body" style="margin-top:1.4rem;">
          <p>Logo &amp; favicons live at the site root: <a class="link" href="/favicon.ico">/favicon.ico</a>, <a class="link" href="/favicon-32x32.png">/favicon-32x32.png</a>, <a class="link" href="/apple-touch-icon.png">/apple-touch-icon.png</a>, <a class="link" href="/android-chrome-512x512.png">/android-chrome-512x512.png</a>.</p>
        </article>
      </div>
    </section>

    <section aria-label="Contact" class="center">
      <div class="wrap-narrow">
        <h2>Press contact</h2>
        <p style="color:var(--ink-soft);margin:0.8rem auto 1.4rem;">Questions, interview requests or review copies: ${esc(CONTACT)}. OneTimeSuite is operated by <a href="https://advancedmarketing.co" rel="noopener">Advanced Marketing</a>.</p>
        <div class="btn-row" style="justify-content:center;">
          <a class="btn btn-ghost" href="/">Browse the site</a>
          <a class="btn btn-ghost" href="/research/">Data reports</a>
        </div>
      </div>
    </section>`,
    }));
    reg('/press/', 'pages');
  })();

  /* ============================================================
   * 3. /events/ hub + /events/<slug>/
   * ============================================================ */
  (function eventsPages() {
    const upcoming = events.filter(e => e.status === 'upcoming').sort((a, b) => a.startDate.localeCompare(b.startDate));
    const past = events.filter(e => e.status === 'past').sort((a, b) => b.startDate.localeCompare(a.startDate));

    const eventCard = (e) => `
          <div class="p-card" style="padding:1.4rem;">
            <span class="stamp ${e.status === 'past' ? '' : 'blue'}">${e.status === 'past' ? 'past' : 'upcoming'}</span>
            <h3 style="margin-top:0.9rem;"><a href="/events/${attr(e.slug)}/">${esc(e.name)}</a></h3>
            <p class="one">${esc(e.description)}</p>
            <div class="foot"><span class="replaces">${esc(e.startDate)}${e.endDate && e.endDate !== e.startDate ? ` → ${esc(e.endDate)}` : ''}<br>${esc(e.venue)}, ${esc(e.city)}</span><a class="link" href="/events/${attr(e.slug)}/">Details &rarr;</a></div>
          </div>`;

    const listSection = (title, stamp, list) => list.length ? `
    <section aria-label="${attr(title)}">
      <div class="wrap">
        <div class="section-head">
          <span class="stamp ${stamp}">${esc(title)}</span>
          <h2>${esc(title)}</h2>
        </div>
        <div class="card-grid">${list.map(eventCard).join('')}
        </div>
      </div>
    </section>` : '';

    const emptyState = `
    <section aria-label="Announcements" class="center">
      <div class="wrap-narrow">
        <div class="cta-card" style="text-align:center;">
          <span class="stamp">Announcements land here first</span>
          <h3>Where I'll be next</h3>
          <p>No events on the calendar yet — when a talk, meetup or demo table is confirmed it appears here with full details. Want a live demo of the suite at your event? Email ${esc(CONTACT)} or join the list and mention your event.</p>
          ${leadForm({ source: 'events', button: 'Notify me about events', note: 'Event announcements only. No spam, unsubscribe anytime.' })}
        </div>
      </div>
    </section>`;

    const hubJsonld = [crumbs([HOME, ['Events', `${SITE}/events/`]])];
    if (events.length) {
      hubJsonld.unshift(schema.itemListLd({
        name: 'OneTimeSuite events',
        url: `${SITE}/events/`,
        items: [...upcoming, ...past].map(e => [e.name, `${SITE}/events/${e.slug}/`]),
      }));
    }

    write('events', page({
      title: 'Events & Meetups | OneTimeSuite',
      desc: 'Where the OneTimeSuite demo table lands next — conferences, meetups and live walkthroughs. Announcements, past appearances, and booking a demo at your event.',
      canonical: `${SITE}/events/`,
      jsonld: hubJsonld,
      body: `
    <section class="hero center">
      <div class="wrap">
        <span class="stamp">Events</span>
        <h1>See the suite live</h1>
        <p class="lead">Talks, meetups and demo tables — real apps, real numbers, no slideware. Confirmed appearances are listed below.</p>
      </div>
    </section>
    ${listSection('Upcoming', 'blue', upcoming)}
    ${listSection('Past events', '', past)}
    ${events.length ? '' : emptyState}
    ${LEAD_SCRIPT}`,
    }));
    reg('/events/', 'pages');

    /* Per-event pages — real entries only. */
    for (const e of [...upcoming, ...past]) {
      const demoApps = availableProducts.slice(0, 5);
      write(`events/${e.slug}`, page({
        title: ctx.fitTitle(`${e.name} | OneTimeSuite Events`),
        desc: ctx.fitDesc(`OneTimeSuite at ${e.name} — ${e.venue}, ${e.city}, ${e.startDate}${e.endDate && e.endDate !== e.startDate ? ` to ${e.endDate}` : ''}. Live demos of the pay-once suite and how to find the table.`),
        canonical: `${SITE}/events/${e.slug}/`,
        jsonld: [
          schema.eventLd({
            name: e.name,
            startDate: e.startDate,
            endDate: e.endDate || e.startDate,
            eventStatus: 'https://schema.org/EventScheduled',
            location: { '@type': 'Place', name: e.venue, address: e.city },
            description: e.description,
            url: e.url,
            organizer: { '@type': 'Organization', name: 'OneTimeSuite', url: SITE },
          }),
          crumbs([HOME, ['Events', `${SITE}/events/`], [e.name, `${SITE}/events/${e.slug}/`]]),
        ],
        body: `
    <section class="hero" aria-label="${attr(e.name)}" style="padding-bottom:2.5rem;">
      <div class="wrap-narrow">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">OneTimeSuite</a> / <a href="/events/">Events</a> / ${esc(e.name)}</nav>
        <span class="stamp ${e.status === 'past' ? '' : 'blue'}">${e.status === 'past' ? 'past event' : 'upcoming'}</span>
        <h1 style="font-size:clamp(1.9rem,4.4vw,3rem);">${esc(e.name)}</h1>
        <p class="lead">${esc(e.description)}</p>
      </div>
    </section>

    <section aria-label="Event details" style="padding-top:2.5rem;">
      <div class="wrap-narrow">
        <div class="section-head">
          <span class="stamp blue">Details</span>
          <h2>When &amp; where</h2>
        </div>
        <div class="tbl-wrap">
          <table class="receipt">
            <tbody>
              <tr><td>When</td><td>${esc(e.startDate)}${e.endDate && e.endDate !== e.startDate ? ` → ${esc(e.endDate)}` : ''}</td></tr>
              <tr><td>Where</td><td>${esc(e.venue)}, ${esc(e.city)}</td></tr>
              <tr><td>Event page</td><td><a class="link" href="${attr(e.url)}" rel="noopener">${esc(e.url)}</a></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section aria-label="What I'll demo">
      <div class="wrap-narrow">
        <div class="section-head">
          <span class="stamp">At the table</span>
          <h2>What I'll demo</h2>
          <p>The first five apps out of the bag — ask to see any of the ${availableProducts.length} available apps live.</p>
        </div>
        <ul style="list-style:none;display:grid;gap:0.5rem;padding:0;">
          ${demoApps.map(p => `<li><a class="link" href="/${attr(p.slug)}/">${esc(p.icon || '')} ${esc(p.brand)}</a> <span style="color:var(--ink-soft);">— ${esc(p.tagline || p.oneliner || '')}</span></li>`).join('\n          ')}
        </ul>
        <div class="cta-card">
          <h3>Can't make it?</h3>
          <p>The whole pitch is on the site: the webinar walks through the apps and the deal, and every app page shows real screenshots.</p>
          <div class="btn-row">
            <a class="btn btn-solid" href="/webinar/">Watch the webinar &rarr;</a>
            <a class="btn btn-ghost" href="/apps/">Browse the apps</a>
          </div>
        </div>
      </div>
    </section>`,
      }));
      reg(`/events/${e.slug}/`, 'pages');
    }
  })();

  /* ============================================================
   * 4. /research/ hub + two computed reports
   * ============================================================ */
  (function researchPages() {
    /* ---- report 1: cost of SaaS subscriptions ---- */
    const priced = matrix.competitors
      .filter(c => typeof c.priceYr === 'number')
      .sort((a, b) => (b.priceYr - a.priceYr) || a.name.localeCompare(b.name));
    const total = priced.reduce((s, c) => s + c.priceYr, 0);
    const sortedYr = priced.map(c => c.priceYr).sort((a, b) => a - b);
    const median = sortedYr.length % 2
      ? sortedYr[(sortedYr.length - 1) / 2]
      : (sortedYr[sortedYr.length / 2 - 1] + sortedYr[sortedYr.length / 2]) / 2;
    const avg = Math.round(total / priced.length);
    const fiveYear = total * 5;

    const compRows = priced.map((c) => {
      const apps = c.apps.map(s => bySlug[s]).filter(Boolean)
        .map(p => `<a class="link" href="/${attr(p.slug)}/">${esc(p.brand)}</a>`).join(', ');
      return `
            <tr><td>${esc(c.name)}</td><td class="price-fig">${fmt(c.priceYr)}/yr</td><td>${apps || '—'}</td></tr>`;
    }).join('');

    /* Inline SVG bar chart — 10 most expensive, deterministic. */
    const top10 = priced.slice(0, 10);
    const BAR_MAX = top10.length ? top10[0].priceYr : 1;
    const ROW_H = 34, LABEL_W = 190, VAL_W = 90, CHART_W = 720;
    const barW = v => Math.max(2, Math.round((v / BAR_MAX) * (CHART_W - LABEL_W - VAL_W)));
    const svgChart = `
        <svg viewBox="0 0 ${CHART_W} ${top10.length * ROW_H + 8}" role="img" aria-label="Bar chart of the 10 most expensive subscriptions replaced by the suite" style="width:100%;height:auto;border:1.5px solid var(--ink);border-radius:12px;background:var(--paper-raised);">
          ${top10.map((c, i) => {
            const y = i * ROW_H + 6;
            return `
          <text x="${LABEL_W - 10}" y="${y + ROW_H / 2 + 4}" text-anchor="end" font-family="var(--mono, monospace)" font-size="12" fill="var(--ink, #17191d)">${esc(c.name)}</text>
          <rect x="${LABEL_W}" y="${y + 5}" width="${barW(c.priceYr)}" height="${ROW_H - 14}" rx="4" fill="var(--accent, #e8420c)"></rect>
          <text x="${LABEL_W + barW(c.priceYr) + 8}" y="${y + ROW_H / 2 + 4}" font-family="var(--mono, monospace)" font-size="12" fill="var(--ink-soft, #4b4e55)">${fmt(c.priceYr)}</text>`;
          }).join('')}
        </svg>`;

    const report1Desc = `We priced ${priced.length} subscription tools the suite replaces: average ${fmt(avg)}/yr, median ${fmt(median)}/yr, ${fmt(total)}/yr to keep them all. Full table and methodology inside.`;

    write('research/cost-of-saas-subscriptions-2026', page({
      title: 'The Cost of SaaS Subscriptions in 2026 | OneTimeSuite',
      desc: report1Desc,
      canonical: `${SITE}/research/cost-of-saas-subscriptions-2026/`,
      jsonld: [
        schema.articleLd({
          title: 'The Cost of SaaS Subscriptions in 2026',
          desc: report1Desc,
          url: `${SITE}/research/cost-of-saas-subscriptions-2026/`,
          datePublished: sales.updatedAt,
        }),
        crumbs([HOME, ['Research', `${SITE}/research/`], ['Cost of SaaS Subscriptions 2026', `${SITE}/research/cost-of-saas-subscriptions-2026/`]]),
      ],
      body: `
    <section class="hero" aria-label="The cost of SaaS subscriptions" style="padding-bottom:2.5rem;">
      <div class="wrap-narrow">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">OneTimeSuite</a> / <a href="/research/">Research</a> / Cost of SaaS</nav>
        <span class="stamp">Data report</span>
        <h1 style="font-size:clamp(1.9rem,4.4vw,3rem);">The cost of SaaS subscriptions in 2026</h1>
        <p class="lead">Every subscription tool in our comparison catalog with a numeric yearly price — ${priced.length} of them — and what it costs to keep them all running.</p>
      </div>
    </section>

    <section aria-label="Headline numbers" style="padding-top:2.5rem;">
      <div class="wrap">
        <div class="steps">
          <div class="step"><span class="n">PRICED TOOLS</span><h3 class="price-fig">${priced.length}</h3><p>competitors in the catalog with a numeric listed $/yr price.</p></div>
          <div class="step"><span class="n">AVERAGE</span><h3 class="price-fig">${fmt(avg)}/yr</h3><p>mean yearly subscription cost across those tools.</p></div>
          <div class="step"><span class="n">MEDIAN</span><h3 class="price-fig">${fmt(median)}/yr</h3><p>the middle of the distribution — half cost more, half less.</p></div>
          <div class="step"><span class="n">ALL OF THEM</span><h3 class="price-fig">${fmt(total)}/yr</h3><p>to subscribe to every tool at once — ${fmt(fiveYear)} over five years.</p></div>
        </div>
      </div>
    </section>

    <section aria-label="Ten most expensive">
      <div class="wrap" style="max-width:920px;">
        <div class="section-head">
          <span class="stamp blue">The top of the bill</span>
          <h2>The 10 most expensive subscriptions we replace</h2>
        </div>
        ${svgChart}
      </div>
    </section>

    <section aria-label="Full table">
      <div class="wrap">
        <div class="section-head">
          <span class="stamp">Full table</span>
          <h2>Every priced competitor, and what replaces it</h2>
        </div>
        <div class="tbl-wrap">
          <table class="receipt">
            <thead><tr><th>Subscription tool</th><th>Listed price</th><th class="us">Replaced by</th></tr></thead>
            <tbody>${compRows}
              <tr class="total"><td>Total to subscribe to all ${priced.length}</td><td class="price-fig">${fmt(total)}/yr</td><td>suite: ${fmt(suitePrice)} once</td></tr>
            </tbody>
          </table>
        </div>
        <p class="mono-note" style="margin-top:0.9rem;">Prices as listed by vendors, collected ${esc(sales.updatedAt)}; suite app prices from our catalog.</p>
        <div class="cta-card">
          <h3>The one-time alternative</h3>
          <p>${esc(dealMechanics)} Or buy just the apps you need individually at one-time prices.</p>
          <div class="btn-row">
            <a class="btn btn-solid" href="/onetime-suite-bundle/">See the suite &rarr;</a>
            <a class="btn btn-ghost" href="/apps/">Browse individual apps</a>
          </div>
        </div>
      </div>
    </section>`,
    }));
    reg('/research/cost-of-saas-subscriptions-2026/', 'pages');

    /* ---- report 2: 100 apps, 100 days — by the numbers ---- */
    const isDesktop = p => (ctx.DESKTOP_SLUGS ? ctx.DESKTOP_SLUGS.has(p.slug) : p.kind !== 'web');
    const desktopCount = allProducts.filter(isDesktop).length;
    const webCount = allProducts.length - desktopCount;
    const appPrices = allProducts.map(p => p.price).filter(n => typeof n === 'number').sort((a, b) => a - b);
    const appMedian = appPrices.length % 2
      ? appPrices[(appPrices.length - 1) / 2]
      : (appPrices[appPrices.length / 2 - 1] + appPrices[appPrices.length / 2]) / 2;
    const repoCount = allProducts.filter(p => p.repo).length;
    const catRows = matrix.categories.map(c => `
            <tr><td>${esc(c.name)}</td><td class="price-fig">${c.appSlugs.length}</td><td>${esc(c.desc)}</td></tr>`).join('');

    const report2Desc = `Exactly what exists today: apps shipped, desktop vs web split, price distribution, MIT repos and category breakdown — computed at build time.`;

    write('research/100-apps-100-days', page({
      title: '100 Apps in 100 Days — Build by the Numbers | OneTimeSuite',
      desc: report2Desc,
      canonical: `${SITE}/research/100-apps-100-days/`,
      jsonld: [
        schema.articleLd({
          title: '100 Apps in 100 Days — Build by the Numbers',
          desc: report2Desc,
          url: `${SITE}/research/100-apps-100-days/`,
          datePublished: sales.updatedAt,
        }),
        crumbs([HOME, ['Research', `${SITE}/research/`], ['100 Apps in 100 Days', `${SITE}/research/100-apps-100-days/`]]),
      ],
      body: `
    <section class="hero" aria-label="100 apps in 100 days" style="padding-bottom:2.5rem;">
      <div class="wrap-narrow">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">OneTimeSuite</a> / <a href="/research/">Research</a> / 100 Apps in 100 Days</nav>
        <span class="stamp">Data report</span>
        <h1 style="font-size:clamp(1.9rem,4.4vw,3rem);">100 apps in 100 days — by the numbers</h1>
        <p class="lead">Here's exactly what exists today, updated at build time (${esc(sales.updatedAt)}). No projections, no rounding up — just the catalog as it stands.</p>
      </div>
    </section>

    <section aria-label="The numbers" style="padding-top:2.5rem;">
      <div class="wrap">
        <div class="steps">
          <div class="step"><span class="n">IN THE CATALOG</span><h3 class="price-fig">${allProducts.length}</h3><p>apps listed in the suite catalog right now.</p></div>
          <div class="step"><span class="n">AVAILABLE NOW</span><h3 class="price-fig">${availableProducts.length}</h3><p>apps you can buy and download today; the rest are in build.</p></div>
          <div class="step"><span class="n">DESKTOP</span><h3 class="price-fig">${desktopCount}</h3><p>native desktop apps — install once, run offline, own outright.</p></div>
          <div class="step"><span class="n">WEB</span><h3 class="price-fig">${webCount}</h3><p>web apps you self-host — your server, your data, no per-seat fees.</p></div>
          <div class="step"><span class="n">FREE MIT REPOS</span><h3 class="price-fig">${repoCount}</h3><p>apps with a free, MIT-licensed MVP repository on GitHub.</p></div>
        </div>
      </div>
    </section>

    <section aria-label="Price distribution">
      <div class="wrap-narrow">
        <div class="section-head">
          <span class="stamp blue">Individual pricing</span>
          <h2>What a single app costs</h2>
          <p>Every app is also sold on its own, one-time. Across the ${appPrices.length} priced apps in the catalog: cheapest <span class="price-fig">${fmt(appPrices[0])}</span>, median <span class="price-fig">${fmt(appMedian)}</span>, most expensive <span class="price-fig">${fmt(appPrices[appPrices.length - 1])}</span> — all one-time payments, no renewal.</p>
        </div>
      </div>
    </section>

    <section aria-label="Category breakdown">
      <div class="wrap">
        <div class="section-head">
          <span class="stamp">Categories</span>
          <h2>Where the apps land</h2>
        </div>
        <div class="tbl-wrap">
          <table class="receipt">
            <thead><tr><th>Category</th><th>Apps</th><th class="us">What it covers</th></tr></thead>
            <tbody>${catRows}
            </tbody>
          </table>
        </div>
        <div class="cta-card">
          <h3>Follow the build</h3>
          <p>The suite is built in public — the catalog, the prices and this page update as apps ship. ${esc(dealMechanics)}</p>
          <div class="btn-row">
            <a class="btn btn-solid" href="/apps/">Browse the catalog &rarr;</a>
            <a class="btn btn-ghost" href="/onetime-suite-bundle/">See the suite deal</a>
          </div>
        </div>
      </div>
    </section>`,
    }));
    reg('/research/100-apps-100-days/', 'pages');

    /* ---- hub ---- */
    write('research', page({
      title: 'Research — Real Numbers From the Catalog | OneTimeSuite',
      desc: 'Data reports computed from the OneTimeSuite catalog: what SaaS subscriptions cost per year, and what the 100-apps-in-100-days build has shipped so far.',
      canonical: `${SITE}/research/`,
      jsonld: [
        schema.itemListLd({
          name: 'OneTimeSuite research',
          url: `${SITE}/research/`,
          items: [
            ['The Cost of SaaS Subscriptions in 2026', `${SITE}/research/cost-of-saas-subscriptions-2026/`],
            ['100 Apps in 100 Days — Build by the Numbers', `${SITE}/research/100-apps-100-days/`],
          ],
        }),
        crumbs([HOME, ['Research', `${SITE}/research/`]]),
      ],
      body: `
    <section class="hero center">
      <div class="wrap">
        <span class="stamp">Research</span>
        <h1>Real numbers, computed from the catalog</h1>
        <p class="lead">No surveys, no estimates — every figure in these reports is derived from the live product catalog and published vendor prices at build time (${esc(sales.updatedAt)}).</p>
      </div>
    </section>

    <section aria-label="Reports">
      <div class="wrap">
        <div class="card-grid">
          <div class="p-card" style="padding:1.4rem;">
            <span class="stamp blue">Data report</span>
            <h3 style="margin-top:0.9rem;"><a href="/research/cost-of-saas-subscriptions-2026/">The Cost of SaaS Subscriptions in 2026</a></h3>
            <p class="one">${priced.length} subscription tools with numeric yearly prices: average ${fmt(avg)}/yr, median ${fmt(median)}/yr, ${fmt(total)}/yr to subscribe to them all.</p>
            <div class="foot"><span class="replaces">table + chart</span><a class="link" href="/research/cost-of-saas-subscriptions-2026/">Read the report &rarr;</a></div>
          </div>
          <div class="p-card" style="padding:1.4rem;">
            <span class="stamp blue">Data report</span>
            <h3 style="margin-top:0.9rem;"><a href="/research/100-apps-100-days/">100 Apps in 100 Days — Build by the Numbers</a></h3>
            <p class="one">Exactly what exists today: ${allProducts.length} apps in the catalog, ${availableProducts.length} available now, desktop vs web split, price distribution and MIT repos.</p>
            <div class="foot"><span class="replaces">updated at build time</span><a class="link" href="/research/100-apps-100-days/">Read the report &rarr;</a></div>
          </div>
        </div>
      </div>
    </section>`,
    }));
    reg('/research/', 'pages');
  })();

  /* ============================================================
   * 5. /stacks/ — User Stack showcase program
   * ============================================================ */
  (function stacksPage() {
    const published = [...stacks].sort((a, b) => a.displayName.localeCompare(b.displayName));

    const stackCard = (s) => {
      const beforeTotal = s.before.reduce((t, x) => t + (Number(x.monthly) || 0), 0);
      const afterTotal = s.after.reduce((t, x) => t + (Number(x.monthly) || 0), 0);
      return `
          <div class="p-card" style="padding:1.4rem;">
            <span class="stamp blue">User stack</span>
            <h3 style="margin-top:0.9rem;">${esc(s.displayName)}</h3>
            <p class="one"><strong>Before:</strong> ${s.before.map(x => `${esc(x.tool)} ($${esc(String(x.monthly))}/mo)`).join(', ')} — ${fmt(beforeTotal)}/mo.<br>
            <strong>After:</strong> ${s.after.map(x => `${esc(x.tool)} ($${esc(String(x.monthly))}/mo)`).join(', ')} — ${fmt(afterTotal)}/mo.</p>
            <p class="one" style="font-style:italic;">&ldquo;${esc(s.quote)}&rdquo;</p>
          </div>`;
    };

    /* Clearly-labeled illustrative mock — format demo, NOT a testimonial. */
    const mock = `
          <div class="p-card" style="padding:1.4rem;border:1.5px dashed var(--ink);background:var(--paper);">
            <span class="stamp">Example — not a real customer</span>
            <h3 style="margin-top:0.9rem;">Your name could be here</h3>
            <p class="one"><strong>Before:</strong> Design Tool Co ($29/mo), Scheduler App ($12/mo), Form Builder Pro ($25/mo) — $66/mo.<br>
            <strong>After:</strong> OneTimeSuite apps ($0/mo) — $0/mo.</p>
            <p class="one" style="font-style:italic;">&ldquo;This is where your own words would go — what you replaced, and what you run now.&rdquo;</p>
            <p class="mono-note">Illustrative mock showing the published format only.</p>
          </div>`;

    const stacksSection = published.length
      ? `
    <section aria-label="Published stacks">
      <div class="wrap">
        <div class="section-head">
          <span class="stamp">Published stacks</span>
          <h2>Real before &amp; afters</h2>
        </div>
        <div class="card-grid">${published.map(stackCard).join('')}
        </div>
      </div>
    </section>`
      : '';

    write('stacks', page({
      title: 'User Stacks — Before & After the Suite | OneTimeSuite',
      desc: 'Buyers share the subscription stack they replaced and what they run now. See the format, read published stacks, or submit yours for the showcase.',
      canonical: `${SITE}/stacks/`,
      jsonld: [
        schema.articleLd({
          title: 'User Stacks — the OneTimeSuite showcase program',
          desc: 'Buyers share their before/after software stack: the subscriptions they replaced and what they run now.',
          url: `${SITE}/stacks/`,
          datePublished: sales.updatedAt,
        }),
        crumbs([HOME, ['User Stacks', `${SITE}/stacks/`]]),
      ],
      body: `
    <section class="hero center">
      <div class="wrap">
        <span class="stamp">User stacks</span>
        <h1>Your stack, before &amp; after</h1>
        <p class="lead">Bought the suite? Share the subscriptions you replaced and what you run now — we publish real stacks at /stacks/&lt;your-name&gt;/ with your permission.</p>
      </div>
    </section>

    <section aria-label="How it works">
      <div class="wrap">
        <div class="section-head">
          <span class="stamp blue">The program</span>
          <h2>How the showcase works</h2>
        </div>
        <div class="steps">
          <div class="step"><span class="n">STEP 01</span><h3>List your before</h3><p>The subscription tools you were paying for, with the monthly cost of each.</p></div>
          <div class="step"><span class="n">STEP 02</span><h3>List your after</h3><p>The suite apps (or anything else) you run instead — and what they cost you per month now.</p></div>
          <div class="step"><span class="n">STEP 03</span><h3>We publish it</h3><p>With your sign-off, your stack goes live at /stacks/&lt;your-name&gt;/ — your words, your numbers, no editing into marketing copy.</p></div>
        </div>
      </div>
    </section>

    ${stacksSection}

    <section aria-label="The format">
      <div class="wrap">
        <div class="section-head">
          <span class="stamp">The format</span>
          <h2>What a published stack looks like</h2>
          <p>${published.length ? 'Same format as the real stacks above.' : 'No stacks published yet — be the first. This mock shows the exact format your stack would take.'}</p>
        </div>
        <div class="card-grid" style="max-width:420px;">${mock}
        </div>
      </div>
    </section>

    <section aria-label="Submit your stack" class="center">
      <div class="wrap-narrow">
        <div class="cta-card" style="text-align:center;">
          <span class="stamp blue">Be the first</span>
          <h3>${published.length ? 'Add your stack' : 'No stacks published yet — be the first'}</h3>
          <p>Email ${esc(CONTACT)} with <strong>stack</strong> in the subject, or leave your details here and mention your stack. Include:</p>
          <ul style="list-style:none;display:grid;gap:0.4rem;padding:0;text-align:left;max-width:440px;margin:0 auto;">
            <li>— the tools you replaced, with their monthly costs</li>
            <li>— what you run now, and what it costs per month</li>
            <li>— one or two sentences in your own words (optional)</li>
          </ul>
          ${leadForm({ source: 'stack-submission', button: 'Submit my stack', note: 'We only publish with your explicit approval. No invented quotes, ever.' })}
        </div>
      </div>
    </section>
    ${LEAD_SCRIPT}`,
    }));
    reg('/stacks/', 'pages');
  })();
};
