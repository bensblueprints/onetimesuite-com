/* events-data.js — talks, meetups and conferences for /events/.
 *
 * REAL ENTRIES ONLY. Every entry here renders a public /events/<slug>/ page
 * with Event structured data — never add placeholder, tentative or
 * "hopefully happening" events. Remove or flip to 'past' once done.
 *
 * Template (copy, fill with real data, then uncomment):
 *
 * {
 *   slug: 'example-conference-2026',            // URL: /events/example-conference-2026/
 *   name: 'Example Conference (replace me)',    // obviously a template — do not ship
 *   city: 'Example City',
 *   venue: 'Example Venue, Hall 1',
 *   startDate: '2026-01-01',                    // ISO date; required for Event schema
 *   endDate: '2026-01-02',                      // ISO date; same as startDate for 1-day events
 *   url: 'https://example.com/replace-me',      // official event page
 *   description: 'One or two honest sentences about what the talk or demo covers.',
 *   status: 'upcoming',                         // 'upcoming' | 'past'
 * },
 */
module.exports = {
  events: [],
};
