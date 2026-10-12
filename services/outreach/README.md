# LeadRipper calling audience

`stage-leads.sql` imports references to every current canonical LeadRipper lead into an isolated `ots_outreach` schema on Hetzner. It preserves original data and excludes known duplicate aliases. Run it again to import new leads; reviewed states, evidence and suppression are preserved. No dialer, cron job or campaign is installed by this script.

Fishing-guide name matches are first in the review queue, then the canonical fishing-charter category, then the remaining audience. A name match is a review candidate, not a verified industry or permission to call.

All records start held. Calling defaults are weekdays 09:00–17:00 in the business's verified IANA timezone. Source scrape cities can be wrong and must not be used blindly to infer location. Missing timezone/eligibility evidence, invalid US phone, suppression, missing budgets, or a paused setting excludes a record from the candidate view. Shared phone numbers are deduplicated for outreach without merging source businesses. International leads are retained but require country-specific normalization and eligibility rules before export.

This is staging, not a working campaign scheduler. Before enabling calls, connect an outbound-capable Vapi number, complete the internal calendar/Zoom test and full AI build, record eligibility evidence and budget, and implement a dispatcher with atomic spending reservations, phone-level call history/opt-outs and an immediate pre-dial business-hours check. Do not merely unpause the settings or upload the entire review queue as a live campaign. Vapi campaign contact CSVs are limited to 10,000 rows per file.

Use the existing private SSH alias `hetzner` and PostgreSQL container `gmaps-scraper-suite-postgres-1`, database `leadscraper`, role `scraper`. No credentials or lead exports belong in Git or Boardly.
