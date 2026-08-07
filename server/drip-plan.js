/* drip-plan.js — the 100-email sequence: what goes out on which step, and how
 * each one renders.
 *
 * Design: 100 steps minus 67 live apps leaves 33 editorial slots, so every live
 * app gets exactly one spotlight in catalog order and the remainder carries
 * webinar invites, the free-app offer, bundle pitches and manifesto/comparison
 * content. Nothing is padded and no app is doubled up.
 *
 * Emails are GENERATED from catalog data, not hand-written — five rotating
 * subject formulas over the product's own brand/competitor/price fields. Only
 * the manifestos and the finale carry bespoke prose. Hand-writing 100 emails is
 * not maintainable; when an app ships, it appends itself.
 *
 * Cadence is data, not calendar days: DRIP_CADENCE maps a subscriber's
 * day-offset to a step, so the same 100 emails can run daily or tapered
 * without touching the content.
 */

const fs = require('fs');
const path = require('path');

const SITE_URL = process.env.SITE_URL || 'https://onetimesuite.com';
const CADENCE = process.env.DRIP_CADENCE || 'taper';
const TOTAL = 100;

/* ---------------- data ------------------------------------------------------ */

const dataFile = name => {
  const candidates = [
    path.join('/app', name),
    path.join(__dirname, '..', 'public', '_data', name),
  ];
  for (const f of candidates) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { /* next */ } }
  return null;
};

const catalog = dataFile('email-catalog.json') || [];
const totals = dataFile('email-totals.json') || {
  liveCount: catalog.length, onceTotal: 0, competitorYearly: 0,
  bundlePrice: 997, bundleValue: 5254, bundleSavings: 4257,
};

/* ---------------- cadence --------------------------------------------------- */

/* offset 0 = signup day. Returns the step due on that offset, or null.
   'taper' front-loads while intent is hot then backs off — 100 emails over
   ~5.5 months instead of 100 consecutive days, which would breach Gmail's
   0.3% complaint ceiling and take the transactional mail down with it. */
function stepForOffset(offset) {
  if (offset < 0) return null;
  if (CADENCE === 'daily') return offset + 1 <= TOTAL ? offset + 1 : null;
  if (CADENCE === 'weekly') return offset % 7 === 0 && offset / 7 + 1 <= TOTAL ? offset / 7 + 1 : null;

  /* taper: 1-14 daily · 15-50 weekdays · 51-80 Mon/Tue/Thu/Fri · 81-100 Mon/Wed/Fri */
  if (offset < 14) return offset + 1;
  const dow = d => ((d % 7) + 7) % 7;          // 0 = same weekday as offset 0
  let step = 14;
  for (let d = 14; d <= offset; d++) {
    let due;
    if (step < 50) due = dow(d) !== 5 && dow(d) !== 6;
    else if (step < 80) due = [0, 1, 3, 4].includes(dow(d));
    else due = [0, 2, 4].includes(dow(d));
    if (due) { step++; if (d === offset) return step <= TOTAL ? step : null; }
  }
  return null;
}

/* ---------------- the map --------------------------------------------------- */

/* Editorial steps. Everything else is a spotlight, filled from the catalog in
   order. Webinar invites reframe the same video rather than repeating it;
   offers run in three real 14-day windows; bundle pitches land late, because
   the bundle argument is arithmetic and needs a shortlist to land against. */
const FIXED = {
  1: 'welcome', 3: 'webinar', 5: 'offer', 7: 'comparison', 9: 'manifesto',
  11: 'webinar', 13: 'offer', 15: 'comparison', 18: 'manifesto', 21: 'webinar',
  24: 'offer', 27: 'bundle', 31: 'social', 34: 'webinar', 37: 'offer',
  40: 'manifesto', 44: 'comparison', 47: 'bundle', 50: 'webinar', 53: 'offer',
  57: 'social', 60: 'manifesto', 63: 'webinar', 66: 'offer', 70: 'bundle',
  73: 'comparison', 76: 'webinar', 80: 'social', 84: 'comparison', 88: 'webinar',
  92: 'offer', 96: 'bundle', 100: 'finale',
};

/* Spotlight steps in ascending order -> catalog index. */
const spotlightSteps = [];
for (let n = 1; n <= TOTAL; n++) if (!FIXED[n]) spotlightSteps.push(n);

const appForStep = n => {
  const i = spotlightSteps.indexOf(n);
  return i < 0 ? null : catalog[i] || null;
};

const typeOf = n => FIXED[n] || 'spotlight';

/* ---------------- shell ----------------------------------------------------- */

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const money = n => '$' + Number(n).toLocaleString('en-US');

/* Matches the existing welcome email: paper/ink, mono, single column, no
   images and no web fonts — which is also what spam filters like. */
function shell(bodyHtml, unsubHtml) {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:24px;background:#f4f5f2;font-family:ui-monospace,Menlo,monospace;color:#17191d;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1.5px solid #17191d;border-radius:12px;padding:28px;">
    <p style="margin:0 0 18px;font-size:13px;color:#85888f;">onetimesuite.com</p>
${bodyHtml}
    <p style="margin:24px 0 0;font-size:13px;color:#85888f;">The software is always pay-once.${unsubHtml || ''}</p>
  </div>
</body></html>`;
}

const btn = (href, label) =>
  `    <p style="margin:22px 0 0;"><a href="${esc(href)}" style="display:inline-block;background:#e8420c;color:#fff;font-weight:700;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:15px;">${esc(label)}</a></p>`;

const para = t => `    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">${t}</p>`;
const h1 = t => `    <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">${esc(t)}</h1>`;

const productUrl = slug => `${SITE_URL}/software/${slug}/`;

/* ---------------- archetypes ------------------------------------------------ */

/* Five subject formulas, rotated by spotlight index so the inbox never shows a
   run of identically-shaped rows. */
function spotlightSubject(app, i) {
  const c = app.competitor || 'the subscription';
  switch (i % 5) {
    case 0: return app.compYr ? `${c} is ${money(app.compYr)}/yr. ${app.brand} is ${money(app.price)}. Once.` : `${app.brand} — ${money(app.price)}, once`;
    case 1: return `Stop renting ${c}`;
    case 2: return `${app.brand}: ${String(app.tagline || app.oneliner).split(' — ')[0].slice(0, 60)}`;
    case 3: return app.compYr ? `${money(app.price)} once, or ${money(app.compYr)} every year` : `${money(app.price)} once. That's the whole price.`;
    default: return `The ${c} replacement that can't raise its price`;
  }
}

function renderSpotlight(app, i) {
  const feats = (app.features || []).map(([name, desc]) =>
    `      <li style="margin:0 0 8px;"><strong>${esc(name)}</strong>${desc ? ' — ' + esc(desc) : ''}</li>`).join('\n');

  const compare = app.compYr ? `
    <table role="presentation" style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
      <tr><td style="padding:8px 0;border-bottom:1px solid #e6e7e3;">${esc(app.brand)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e6e7e3;text-align:right;font-weight:700;">${money(app.price)} once</td></tr>
      <tr><td style="padding:8px 0;">${esc(app.competitor)}</td>
          <td style="padding:8px 0;text-align:right;">${money(app.compYr)} every year</td></tr>
    </table>` : '';

  const body = [
    h1(`${app.icon} ${app.brand}`),
    app.competitor ? para(`Replaces <strong>${esc(app.competitor)}</strong>${app.compPrice ? ` — ${esc(app.compPrice)}` : ''}.`) : '',
    para(esc(app.oneliner)),
    feats ? `    <ul style="margin:0 0 16px;padding-left:20px;font-size:15px;line-height:1.6;">\n${feats}\n    </ul>` : '',
    compare,
    app.payback ? para(`<em>${esc(app.payback)}</em>`) : '',
    btn(productUrl(app.slug), `Get ${app.brand} — ${money(app.price)}, once`),
    app.demo ? para(`<a href="${esc(productUrl(app.slug))}demo/" style="color:#e8420c;">Or try it free in your browser</a> — no signup.`) : '',
    para(app.kind === 'desktop'
      ? 'Runs entirely on your machine. No account, no telemetry, no expiry.'
      : 'Self-hosts on a $5 VPS you control. Your data stays on your box.'),
  ].filter(Boolean).join('\n');

  return { subject: spotlightSubject(app, i), body, tag: `spotlight:${app.slug}` };
}

function renderWebinar(n) {
  const variants = [
    ['12 minutes. 12 apps. One payment each.', 'A recorded walkthrough of the catalog — the subscription problem, a rapid-fire demo, and exactly how paying once works.'],
    ["Didn't watch yet? Here's the short version.", 'Twelve minutes, recorded, no scheduled broadcast to miss. Skip to whichever section you care about.'],
    ["You've read about the apps. Come see them run.", 'Reading about software is not the same as watching it work. Same twelve minutes.'],
    ['Month one is done. The video is still 12 minutes.', 'If the emails have been useful, the walkthrough is the condensed version of all of them.'],
    ['Halfway. Still worth twelve minutes.', 'The walkthrough covers what these emails cannot: the apps actually running.'],
    ["The 12 apps I'd buy first (video)", 'Less a pitch than a buying guide — which apps pay for themselves fastest.'],
    ['Nine weeks in, and yes, still twelve minutes.', "I'll keep mentioning it because it is the single fastest way to understand the catalog."],
    ["Final invite — then I'll stop asking.", 'Last time I bring this up. The video stays online either way.'],
  ];
  const idx = Object.keys(FIXED).filter(k => FIXED[k] === 'webinar').map(Number).sort((a, b) => a - b).indexOf(n);
  const [subject, lead] = variants[Math.max(0, idx) % variants.length];

  const body = [
    h1(subject),
    para(esc(lead)),
    para('And if you watch it through, you can pick <strong>any single app in the catalog</strong> and I\'ll cover it — a one-off code, yours, good for one app.'),
    btn(`${SITE_URL}/webinar/`, 'Watch the walkthrough'),
  ].join('\n');
  return { subject, body, tag: 'webinar' };
}

function renderOffer(n) {
  const subjects = [
    'Watch the walkthrough, pick any app, I\'ll cover it',
    'Your free app is still sitting there',
    'Last call on the free app (14 days is 14 days)',
    'Reopening the free-app code',
    'Pick your free app — here are the popular picks',
    'Your free app, one more time',
    'The free-app code closes with this sequence',
  ];
  const idx = Object.keys(FIXED).filter(k => FIXED[k] === 'offer').map(Number).sort((a, b) => a - b).indexOf(n);
  const subject = subjects[Math.max(0, idx) % subjects.length];

  const picks = catalog.slice(0, 6)
    .map(a => `      <li style="margin:0 0 6px;">${esc(a.icon)} <strong>${esc(a.brand)}</strong> — ${esc(a.competitor || 'a subscription')}, ${money(a.price)}</li>`)
    .join('\n');

  const body = [
    h1(subject),
    para('Three steps, no catch:'),
    `    <ol style="margin:0 0 16px;padding-left:20px;font-size:15px;line-height:1.7;">
      <li>Watch the ~12-minute walkthrough.</li>
      <li>Pick any one app from the catalog.</li>
      <li>A one-off code lands on screen — it covers that app in full.</li>
    </ol>`,
    para('The code works once, on one app, and expires in 14 days. The only thing it does not cover is the $997 complete bundle.'),
    picks ? `    <ul style="margin:0 0 16px;padding-left:20px;font-size:15px;line-height:1.6;">\n${picks}\n    </ul>` : '',
    btn(`${SITE_URL}/webinar/`, 'Watch, then claim your app'),
  ].filter(Boolean).join('\n');
  return { subject, body, tag: 'offer' };
}

function renderBundle() {
  const body = [
    h1(`${totals.liveCount} apps for ${money(totals.bundlePrice)}. The math, in full.`),
    para(`Bought one at a time, the catalog comes to <strong>${money(totals.bundleValue)}</strong>. The bundle is <strong>${money(totals.bundlePrice)}</strong> — a saving of ${money(totals.bundleSavings)}.`),
    para(`Rented instead, the software these replace costs about <strong>${money(totals.competitorYearly)} every year</strong>, forever.`),
    para('Every app shipped from here on is included at no extra cost. That is the whole offer — there is no tier above it.'),
    btn(`${SITE_URL}/onetime-suite-bundle/`, 'Own all of it'),
    para(`<a href="${SITE_URL}/price-tracker/" style="color:#e8420c;">The current price and how it moves</a> — it only ever goes up.`),
  ].join('\n');
  return { subject: `${totals.liveCount} apps for ${money(totals.bundlePrice)}. The math, in full.`, body, tag: 'bundle' };
}

function renderComparison() {
  const rows = catalog.filter(a => a.compYr).sort((a, b) => b.compYr - a.compYr).slice(0, 12)
    .map(a => `      <tr><td style="padding:6px 0;border-bottom:1px solid #e6e7e3;">${esc(a.competitor)}</td>
          <td style="padding:6px 0;border-bottom:1px solid #e6e7e3;text-align:right;">${money(a.compYr)}/yr</td>
          <td style="padding:6px 0;border-bottom:1px solid #e6e7e3;text-align:right;"><strong>${esc(a.brand)} ${money(a.price)}</strong></td></tr>`)
    .join('\n');

  const body = [
    h1('Add up last month\'s bank statement'),
    para('The twelve most expensive subscriptions in the catalog, against what replaces them:'),
    `    <table role="presentation" style="width:100%;border-collapse:collapse;font-size:13px;margin:0 0 16px;">\n${rows}\n    </table>`,
    para(`Across all ${totals.liveCount} live apps: <strong>${money(totals.competitorYearly)} a year</strong> rented, or <strong>${money(totals.onceTotal)} once</strong> owned.`),
    btn(`${SITE_URL}/apps/`, 'See the whole catalog'),
  ].join('\n');
  return { subject: `${money(totals.competitorYearly)}/yr, or ${money(totals.onceTotal)} once`, body, tag: 'comparison' };
}

/* The hand-written ones. Position, not product. */
const MANIFESTOS = [
  ['The software is always pay-once. The cloud is the upgrade.',
    ['Every app here is bought, not rented. You get the whole thing — no crippled free tier, no feature held back to push you up a plan, no expiry.',
      'The only thing I ever charge again for is a server: sync across devices, sharing outside your licence, always-on alerts. Things that genuinely need a machine running while you sleep. If it can work on your own hardware, it does, and it stays free with the licence you already bought.',
      'You are not renting software. You are optionally paying me to run a box you would otherwise run yourself.']],
  ['Your files never leave this building',
    ['The desktop apps make no network calls. Not "we anonymise it" — none. Turn your Wi-Fi off and they keep working, because the processing happens on your CPU.',
      'That is not a privacy feature I bolted on. It is what happens when nobody needs to meter your usage.']],
  ['"Unlimited" is a pricing tier, not a feature',
    ['Response caps, credit systems, seat counts — three ways of turning your growth into someone else\'s revenue. You do better, so you pay more, for identical software.',
      'None of these apps have a meter, because there is no billing relationship left to protect once you have paid.']],
  ['Can you export your data? Try it right now.',
    ['Open whatever you pay monthly for and find the export button. Time how long it takes. That number is how much leverage they have over you.',
      'Every app here fails that test on purpose — the files are already yours, in formats you can open without me.']],
  ['Nobody has ever crippled a piece of software you own',
    ['You have had the "we are sunsetting your plan" email. Everyone has. A feature you built a workflow on, withdrawn, because the economics changed at a company you do not work for.',
      'Bought software cannot be sunset. The copy on your disk keeps working whatever happens to me.']],
];

function renderManifesto(n) {
  const idx = Object.keys(FIXED).filter(k => FIXED[k] === 'manifesto').map(Number).sort((a, b) => a - b).indexOf(n);
  const [subject, paras] = MANIFESTOS[Math.max(0, idx) % MANIFESTOS.length];
  const body = [h1(subject), ...paras.map(t => para(esc(t))), btn(`${SITE_URL}/apps/`, 'Browse the catalog')].join('\n');
  return { subject, body, tag: 'manifesto' };
}

function renderSocial() {
  const body = [
    h1('What people replaced first'),
    para('Rather than invent testimonials, here is the honest version: the apps people buy first are almost always the ones replacing the subscription that annoyed them most recently.'),
    para('Usually that is a tool costing under $15 a month that they had forgotten they were paying for at all.'),
    btn(`${SITE_URL}/apps/`, 'See what you are still renting'),
  ].join('\n');
  return { subject: 'What people replaced first', body, tag: 'social' };
}

function renderFinale() {
  const body = [
    h1(`100 emails. ${totals.liveCount} apps. ${money(totals.competitorYearly)} a year, gone.`),
    para('That is the end of the sequence. To close the loop I opened on day one: the software is always a one-time purchase, and the cloud is the only upgrade.'),
    para(`${totals.liveCount} apps live, ${money(totals.onceTotal)} to own outright, against ${money(totals.competitorYearly)} a year to keep renting the things they replace.`),
    btn(`${SITE_URL}/onetime-suite-bundle/`, `Own all of it — ${money(totals.bundlePrice)}`),
    para('Or stay on the list and I will only email when something new ships. Or leave — the link is below and it works in one click. The software does not care either way, and neither do I.'),
  ].join('\n');
  return { subject: `100 emails. ${totals.liveCount} apps. ${money(totals.competitorYearly)} a year, gone.`, body, tag: 'finale' };
}

/* ---------------- entry point ----------------------------------------------- */

/* Returns { subject, html, text, tag } or null to skip the step.
   `sub` gates content on subscriber state: someone who already watched the
   webinar or claimed their app should never be pitched either again. */
function render(n, sub, opts = {}) {
  const type = typeOf(n);
  if (type === 'welcome') return null;           // sent at signup by recordLead

  if (type === 'webinar' && sub && sub.watch_qualified) return null;
  if (type === 'offer' && opts.hasCoupon) return null;

  let out;
  if (type === 'spotlight') {
    const app = appForStep(n);
    if (!app) return null;                       // fewer live apps than slots
    out = renderSpotlight(app, spotlightSteps.indexOf(n));
  } else if (type === 'webinar') out = renderWebinar(n);
  else if (type === 'offer') out = renderOffer(n);
  else if (type === 'bundle') out = renderBundle();
  else if (type === 'comparison') out = renderComparison();
  else if (type === 'manifesto') out = renderManifesto(n);
  else if (type === 'social') out = renderSocial();
  else if (type === 'finale') out = renderFinale();
  else return null;

  const unsubHtml = opts.unsubUrl
    ? ` <a href="${esc(opts.unsubUrl)}" style="color:#85888f;">Unsubscribe</a> — one click.`
    : '';

  const text = out.body
    .replace(/<li[^>]*>/g, '  - ').replace(/<\/li>/g, '')
    .replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
    + (opts.unsubUrl ? `\n\nUnsubscribe: ${opts.unsubUrl}` : '');

  return { subject: out.subject, html: shell(out.body, unsubHtml), text, tag: out.tag, type, step: n };
}

module.exports = {
  TOTAL, CADENCE, FIXED, render, typeOf, appForStep, stepForOffset,
  spotlightSteps, catalogSize: () => catalog.length, totals,
};
