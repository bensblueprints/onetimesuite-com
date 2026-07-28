/* webinar-data.js — content for /webinar/ (the closer page for SEO traffic).
 *
 * youtubeId: paste the real video ID here; page renders a placeholder until set.
 * (The ID is the part after watch?v= — e.g. 'dQw4w9WgXcQ'.)
 * While it stays empty, /webinar/ shows a styled placeholder box and emits
 * NO VideoObject structured data — never ship video schema for a placeholder.
 */
module.exports = {
  youtubeId: '',
  title: 'The OneTime Suite walkthrough',
  durationNote: '~12 minutes',
  /* [timeRange, label] — rendered as the agenda steps on /webinar/. */
  agenda: [
    ['0:00–2:00', 'The subscription problem — what a typical monthly software stack really costs over a year'],
    ['2:00–8:00', 'Rapid-fire demo — 12 apps from the catalog, shown live with real workflows'],
    ['8:00–10:00', 'The deal mechanics — pay once, the +$1-per-sale price ladder, and the cap'],
    ['10:00–12:00', 'How to lock your price — exactly what happens when you buy, and what you get'],
  ],
};
