# Expanded fishing audience audit

The original category/name-only audience contained 5,811 records. The owner's recollection of roughly 30,000 fishing leads was supported by a broader search of the Hetzner catalog.

The key missing evidence was the legacy `industry` field. There were 26,815 canonical records labeled `Fishing Charters` (25,054 had a blank category), plus 7,607 labeled `Fishing guide`. Names alone also miss businesses such as Wild Times Guide Services and Olympic Peninsula Guide Service. Some German category labels were correctly canonicalized, but that did not recover blank-category legacy imports. Fleet backup/main source memberships overlap and must not be summed.

The deployed matcher now combines canonical fishing-charter membership, name and website matching for fishing/angling guides, charters and outfitters, and legacy industry labels including pipe-separated labels. Matching reasons are available from `ots_outreach.fishing_matches`. No source taxonomy or business identity was changed.

Verified after the expanded import:

| Measure | Count |
|---|---:|
| Fishing guide review cohort | 8,976 |
| Additional fishing charter/outfitter review cohort | 25,750 |
| Total fishing audience records | 34,726 |
| US records | 34,270 |
| Canadian records | 255 |
| UK records | 119 |
| Australian records | 72 |
| Irish records | 10 |
| Distinct normalized US phone numbers across both cohorts | 27,678 |
| Records with websites | 29,724 |
| Records with a source timezone value | 20,460 |
| Held records | 34,726 |
| Eligibility-verified records | 0 |
| Currently dialable records | 0 |

No canonical records with the exact legacy labels `Fishing guide`, `Fishing Charters` or `Fishing charter` were omitted from the expanded priority audience. The complete audience snapshot, including other industries and new arrivals, contains 4,253,191 records.

These are candidate records, not 34,726 verified fishing-guide businesses. Scrape-niche labels can include parks, marinas, shops and unrelated results. Canonical lead IDs can also share a phone, so the 27,678 distinct US numbers are the more useful upper bound for initial phone review; eligibility, actual business type and location still need verification. Stored source timezones are not automatically approved. All calling remains paused with weekday 09:00–17:00 local defaults and unset budgets. No calls were placed or scheduled.

Validation used read-only aggregate queries after the import transaction committed: cohort/country counts, phone deduplication, website/timezone presence, omitted-label count, held/eligibility status and the zero-row current candidate view. No live calls or messages were needed.
