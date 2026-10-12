# One Time Suite Website Studio

A persistent, single-worker website-concept service with a public landing page, private admin studio, authenticated Vapi Function webhook, DeepInfra generation with separate writing and review models (OpenAI and Kimi Open Platform are optional alternatives).

## Routes

- `/website` — public service page and request form
- `/website-studio/` — private build queue; uses configured One Time Suite admin credentials
- `POST /api/website-builder/vapi` — Vapi `tool-calls` webhook; Bearer authentication required
- `/website-previews/<random-token>/` — concept; private until an operator approves it
- `/api/website-builder/health` — liveness only, no credentials or customer data

The main website and existing API are unchanged. The provided Docker Compose file adds higher-priority Traefik routes only for these paths on `onetimesuite.com`. Current deployment is on the existing Coolify host; a future Hetzner migration must move the volume and encrypted-secret key together. Do not move the entire website just to deploy this service.

## Run

Node 24 or newer. `npm ci`, copy `.env.example` to a private `.env`, set strong independent webhook/session secrets and admin credentials, then `node --env-file=.env src/server.js`. Run `npm test` for the isolated integration/security suite.

Production: `docker compose up -d --build`. The `studio-data` volume contains SQLite WAL data, briefs, private contact details, the event log and encrypted provider keys. Keep it private. The `SESSION_SECRET` is the encryption key material: retain it in backups. Never commit `.env`, expose the volume, or store secrets in Boardly notes.

## AI providers

DeepInfra is the selected provider. Connect its key in the private studio; it is stored with AES-256-GCM. Defaults: `moonshotai/Kimi-K3` discovers services and locations and writes pages, `zai-org/GLM-5.3` independently reviews them, and `deepseek-ai/DeepSeek-V4-Flash-0731` answers visitor questions. Models are configurable through `DEEPINFRA_BUILD_MODEL`, `DEEPINFRA_REVIEW_MODEL`, `DEEPINFRA_DISCOVERY_MODEL`, and `DEEPINFRA_CHAT_MODEL`. Requests use the official OpenAI-compatible endpoint with JSON-object output and strict runtime schema validation (including a bounded repair pass). The connection checks model availability and makes a tiny authenticated completion to verify credentials/billing.

OpenAI is supported through Responses with `store:false`, strict structured output, and `OPENAI_MODEL` (default `gpt-6.1-sol`). API billing is separate from ChatGPT. Provider changes are blocked while a job is building. No silent provider fallback occurs.

### Kimi Open Platform alternative

Connect an **Open Platform** key in the private studio. The server checks `/v1/models` for `kimi-k3` before saving it, encrypted with AES-256-GCM. The key is never returned through an API or embedded in the page. Kimi Code keys are not Open Platform keys. Default endpoint: `https://api.moonshot.ai/v1`; model: `kimi-k3`; `reasoning_effort: low`. The worker makes one generation and one independent content review, with at most one corrective generation/review pair per attempt. Network failures retry with backoff, up to three attempts; permanent auth/model errors stop. Daily build-attempt cap defaults to 20, concurrency is one, pending capacity is 100. This is a controlled concept-production queue, not a six-million-call campaign engine.

Without a key, requests are saved and builds wait. No substitute model or fake AI completion is used. Model review is not a guarantee of factual or visual correctness.

## Vapi configuration

Download the Function tool JSON from the private studio. Add a Vapi Custom Credential that sends `Authorization: Bearer <WEBHOOK_SECRET>`, and set the returned credential ID as `server.credentialId` in the tool. The actual webhook secret lives in the private server `.env`; never paste it into an assistant prompt or public tool description. Attach `start_website_build` to the existing `Advanced Marketing Website Outreach` assistant.

The endpoint implements the Vapi synchronous Function protocol, returning HTTP 200 with `results[]` and matching `toolCallId`. Tool validation failures use `error`; acceptance uses a stringified JSON `result`. It only accepts `tool-calls`; call-recording events do not start jobs.

Parameters: `business_name`, `website_url`, `contact_name`, `email`, `dislikes`, `requested_features[]`, `current_lead_sources`, `prospect_timezone` (IANA), `consent_to_build: true`, and `appointment` with `event_id`, `start_at`, `end_at`, `attendance_confirmed: true`, `invitation_received` and optional HTTPS `join_url`. Optional lead metadata: `lead_id`, `website_platform`, `phone`.

LeadRipper must supply known lead details to the Vapi call context. The assistant must not guess a lead ID or URL. This receiver does not scan or modify the catalog, place outbound calls, or independently verify a Google Calendar event: it expects the assistant to use the successful calendar-tool result.

Suggested assistant instruction:

> After explicit agreement to a free concept, collect what the prospect dislikes, desired features and current lead sources. Confirm their name, email, website and IANA timezone. Use the existing availability and scheduling tools to book a presentation 24–48 hours from now, expressed in the prospect’s timezone; the host is Asia/Ho_Chi_Minh. Ask whether the invitation arrived and whether they can attend while seated and viewing the screen. Only after the calendar tool succeeds and the prospect confirms attendance, call start_website_build using the actual event ID and timestamps. Use the actual joining URL if returned; do not invent Zoom details. A successful result means the brief was queued, not that a website is finished. On an error, correct the fields or explain that the brief needs follow-up. Do not keep retrying a failed tool without a correction. Explain that the concept is free; if they love it and choose to proceed, the website is $500 plus $50/month for hosting and the live AI chat assistant. Confirm that this investment would be workable before committing design resources.

Replay protection uses Vapi call ID plus the build action; duplicate deliveries return the existing job. A changed brief on the same call returns a conflict instead of creating a duplicate.

## What the builder produces

Home, services, about, contact, and a service-area index when locations are present. Each discovered service receives a page, each location receives a page, and every service/location pair receives a planned page. With S services and L locations, the full plan has S + L + S?L detail pages plus core pages. Nested navigation, breadcrumbs, canonical metadata, FAQs, a noindex preview sitemap, inquiry capture and page-aware AI chat are included. Three curated design themes.

The crawler imports up to 60 same-origin pages over three minutes, including sitemap discovery and nested navigation, with DNS-pinned public-address-only requests, redirect validation, time and size limits. It records import omissions and verifies quoted evidence for every service and location. Operators can confirm/correct the inventory with business-verified details in the studio; this archives the previous concept and revokes sharing before rebuilding.

The full page plan is saved before generation. The default budget is 200 pages (`MAX_PAGES_PER_BUILD`); larger plans stop visibly rather than silently dropping pages. Each page is written, independently reviewed, corrected once if necessary, and checkpointed. Interrupted jobs resume from completed pages. Deterministic checks reject missing pages, duplicate metadata and copy that merely substitutes service/location names. Uncertain coverage or missing local evidence blocks approval until resolved. Scripts and forms from source websites are not executed or copied. No external image or asset rights are assumed.

Requested custom functions such as ecommerce, appointment engines, payments, logins and CRM integrations are recorded as additional work, not silently represented as working. This release is a reviewed concept builder, not an autonomous clone-and-launch platform for arbitrary applications. JavaScript-only websites with insufficient readable content fail visibly for manual follow-up.

HTML checks cover headings, metadata, internal routes and executable-content isolation. Separate AI review checks content and feature claims; it does not claim to perform browser testing. Human review is required before a shareable concept is approved. Concept URLs are unguessable, noindex and served with a restrictive CSP. Do not present these as private authenticated client portals after approval: anyone with the approved link can view it.

## Zoom

The authenticated Vapi receiver now supports meeting creation and cancellation, encrypted Server-to-Server OAuth configuration, durable replay protection, timeout reconciliation, and call-scoped ownership checks. Connect and activate the Zoom app before attaching these tools to the assistant. The native calendar tool puts the real attendee join link in its supported `summary` field. See [VAPI-ZOOM.md](VAPI-ZOOM.md) for exact scopes, account setup, assistant sequencing, failure handling and internal validation.

## Verification and backup

`npm test` uses synthetic data in temporary directories and no paid model calls, emails or telephone calls. Before production, inspect the landing page and representative generated pages at desktop/mobile widths. Test a real provider-backed concept after connecting its key, then test the assistant using a consenting internal test number before any campaign launch. Back up SQLite with its online backup facility or stop this service briefly before copying the entire volume; copy `.env` separately to encrypted storage. Never copy only a live WAL database file.

`node test/live-smoke.mjs` is an explicitly invoked, paid DeepInfra integration check using a fictional business. It writes only to ignored `test-output/` and serves a local-only preview on port 3181 for visual QA; it does not enqueue production work.
