# LeadRipper calling audience

`stage-leads.sql` imports references to every current canonical LeadRipper lead into an isolated `ots_outreach` schema on Hetzner. It preserves original data and excludes known duplicate aliases. Run it again to import new leads; reviewed states, evidence and suppression are preserved. No dialer, cron job or campaign is installed by this script.

Fishing-guide matches are first in the review queue, followed by fishing charters/outfitters, then the remaining audience. Matching checks both names and website URLs, the canonical fishing-charter category, and legacy industry labels (`Fishing guide` / `Fishing Charters`, including pipe-separated labels). `ots_outreach.fishing_matches` exposes every matching reason for review. Legacy industry labels often record the original scrape niche; some results are parks, stores or marinas. A match is a review candidate, not a verified industry or permission to call.

The initial 5,811-record fishing audience was undercounted: 25,054 canonical `Fishing Charters` records had blank categories, and 7,607 records carried the `Fishing guide` industry label. The first pass did not check those industry labels; some records were still found through their names/categories. Preserve the legacy industry evidence rather than silently converting all those businesses to a canonical fishing-charter category. Source memberships overlap across backups, so their counts must not be added together.

All records start held. Calling defaults are weekdays 09:00–17:00 in the business's verified IANA timezone. Source scrape cities can be wrong and must not be used blindly to infer location. Missing timezone/eligibility evidence, invalid US phone, suppression, missing budgets, or a paused setting excludes a record from the candidate view. Shared phone numbers are deduplicated for outreach without merging source businesses. International leads are retained but require country-specific normalization and eligibility rules before export.

The SQL is staging, not a campaign scheduler. The Website Studio now has a separate authenticated pre-dial receiver, phone-level opt-outs and per-contact attempt tracking. Do not merely unpause the SQL settings or upload the entire review queue as a live campaign. The SQL budgets are still required by its reviewed-candidate view. Vapi campaign contact CSVs are limited to 10,000 rows per file.

## First 500 calls: 250 per offer

The owner requested two distinct campaign groups, superseding the earlier single-call two-option pitch:

- A: $500 once plus $50/month. Assistant `73eb0c0d-ccbb-4bdd-94d9-8d5627d4668d`.
- B: $100/month with no setup fee. Assistant `b8615bbd-891b-4cf8-918c-525c4f06d81f`.

Both assistants are published v2 with seven tools, a 600-second call limit, and the same free concept/payment-only-on-acceptance terms. Optional Facebook/Google Ads follow the website and are separately scoped. The two dedicated prompt files are under `services/website-builder/`.

Purchased Twilio number `+14109703064` is imported and active in Vapi as `59d34435-26c2-444a-9898-36610e7a291e`. Import changed Twilio VoiceUrl and StatusCallback; both were immediately restored to their previous values. Existing ElevenLabs inbound voice and SMS routing is preserved. Do not assign an inbound Vapi assistant or re-import the number casually: those actions may replace the routing. Vapi outbound calls must specify the campaign assistant explicitly.

`src/outreach.js` in Website Studio stores the approved first batch in SQLite independently of the Hetzner source catalog. It defaults to paused and accepts at most 250 unique US numbers per offer, with one phone across both offers. Import requires documented eligibility and a verified IANA timezone with evidence; it does not derive either from scraped labels. Unknown campaigns, unknown phones, other-offer contacts, suppressed numbers, repeated attempts with a different contact ID, weekends and hours outside 09:00–17:00 are rejected immediately before dialing. DST is evaluated using the named timezone. Paused website production also stops pre-dial eligibility. Terminal outcomes cannot be overwritten by late dispatched events.

Admin API, under `/api/website-builder/admin/`, requires the existing authenticated studio session and same-origin header for writes:

- `GET outreach`: counts, pause state and registered campaign IDs.
- `POST outreach/contacts`: array of `{phone,country:"US",lead_id,variant,timezone,timezone_evidence,eligibility_verified:true,eligibility_evidence}`. Verify country separately: a +1 number alone does not establish a US business. Import small chunks below the 64 KB request limit. Oversized groups roll back atomically.
- `POST outreach/campaigns`: `{id: actualVapiCampaignUuid, variant: "a" | "b"}`.
- `POST outreach/pause`: `{paused: boolean}`. Default is paused.
- `GET outreach/suppressions`: authoritative opt-outs for these campaigns; mirror them into `ots_outreach.suppression` before future exports. Never clear a suppression on re-import.

Vapi campaigns must use `https://onetimesuite.com/api/website-builder/vapi` with the existing OneTimeSuite Website Automation credential, `predialPlan: {enabled: true}`, and contact outcome server events. The API accepts both nested function arguments and Vapi's flat name/parameters tool-call format. `record_website_do_not_call` uses the authenticated call's customer number, not an LLM-provided phone, and is attached to both assistants.

Creating a Vapi campaign starts or schedules it; there is no draft state. Only after funding, documented eligibility, verified locations, the complete builder test and an internal calendar invitation test: select exactly 500 unique eligible phones, assign 250 to each offer, import to the receiver, and construct scheduled campaigns with a future start time. Register returned campaign IDs before the start, include the blocking pre-dial hook and then enable the receiver. Group scheduling by timezone and keep the immediate per-contact timezone check. The account currently has four concurrent lines. Vapi retries capacity-constrained contacts for up to one hour, so use small scheduled batches within each offer group and reconcile outcomes before proceeding; do not assume a 250-contact upload means 250 completed calls. Do not automatically recreate a campaign or reset a reserved attempt after an uncertain API outcome. Reconcile actual call records first. Failed/skipped prospects do not count as completed calls.

As of 2026-10-13, the owner reports adding $25 to Vapi. The campaign assistant returned a successful internal chat response using the same API key that had returned HTTP 402 the previous day, confirming that key can now access the funded service. The live wallet amount is not exposed by that response. Twilio held $18.75 at last check. No campaign has been created and no prospect calls were made. Source leads still lack documented calling eligibility (0 of 34,726 staged fishing records). The internal native Google Calendar invitation test remains outstanding. Do not launch a scraped cold-marketing batch: Vapi requires prior express written consent for AI marketing calls to consumers, and Twilio prohibits unsolicited marketing calls. Obtain and preserve evidence for a qualified audience before importing contacts.

Use the existing private SSH alias `hetzner` and PostgreSQL container `gmaps-scraper-suite-postgres-1`, database `leadscraper`, role `scraper`. No credentials or lead exports belong in Git or Boardly.


Readiness update: the complete DeepInfra eight-page synthetic build passed after fixing internal workflow metadata in page-review context and false flags for intentionally omitted optional details. Grounded visitor chat and generated-site navigation also passed. Website production is now enabled; outreach remains paused with zero imported eligible contacts and zero registered campaigns. The native Google Calendar invitation test has not been run. Latest fixes are in commit 2268ad3.


2026-10-13 ? Vapi funding verified through successful campaign-assistant chat response after owner added $25. Wallet balance amount remains unconfirmed. The existing key is on the same organization as both published campaign assistants. No campaign/call created. Consent evidence remains zero; Twilio and Vapi provider rules prevent using this account for unsolicited AI marketing calls. Do not reset the goal or count setup as completed calls.
