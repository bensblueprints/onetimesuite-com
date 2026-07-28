/* changelogs.js — per-app release notes, rendered on /apps/<slug>/updates/.
 *
 * Shape:
 *   { '<slug>': [{ version: '1.2.0', date: '2026-08-14', notes: ['...', ...] }, ...] }
 *
 * Documented example (NOT real data — replace with genuine releases when they
 * happen, then move the entry into module.exports):
 *
 *   'pdfsmith': [
 *     { version: '1.1.0', date: '2026-09-02', notes: [
 *         'Added batch watermarking across multiple files.',
 *         'Fixed rotation being ignored on odd page sizes.',
 *       ] },
 *     { version: '1.0.0', notes: ['First public release.'] },
 *   ],
 *
 * RULES:
 * - REAL releases only. Never invent versions, dates or notes to make a page
 *   look alive — fabricated changelogs are misrepresentation.
 * - `date` is optional (ISO YYYY-MM-DD). Omit it rather than guessing.
 * - Entries newest-first.
 * - Apps with no entry here render an honest "v1.0.0 — first public release"
 *   placeholder with NO date, plus a link to the repo's release notes.
 */
module.exports = {
};
