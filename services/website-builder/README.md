# One Time Suite Website Studio

A persistent, single-worker website-concept service with a public landing page, private admin studio, authenticated Vapi Function webhook, Kimi K3 generation and a separate Kimi review pass.

## Routes

- `/website` — public service page and request form
- `/website-studio/` — private build queue; uses configured One Time Suite admin credentials
- `POST /api/website-builder/vapi` — Vapi `tool-calls` webhook; Bearer authentication required
- `/website-previews/<random-token>/` — concept; private until an operator approves it
- `/api/website-builder/health` — liveness only, no credentials or customer data

The main website and existing API are unchanged. The provided Docker Compose file adds higher-priority Traefik routes only for these paths on `onetimesuite.com`. Current deployment is on the existing Coolify host; a future Hetzner migration must move the volume and encrypted-secret key together. Do not move the entire website just to deploy this service.

## Run

Node 24 or newer. `npm ci`, copy `.env.example` to a private `.env`, set strong independent webhook/session secrets and admin credentials, then `node --env-file=.env src/server.js`. Run `npm test` for the isolated integration/security suite.

Production: `docker compose up -d --build`. The `studio-data` volume contains SQLite WAL data, briefs, private contact details, the event log and an encrypted Kimi key. Keep it private. The `SESSION_SECRET` is the encryption key material: retain it in backups. Never commit `.env`, expose the volume, or store secrets in Boardly notes.

## Kimi K3

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

Four responsive pages (home, services, about, contact), source-grounded business copy, FAQs, real inquiry capture in the studio, AI text chat and optional browser speech playback. Three curated design themes. It imports the homepage and up to three same-origin about/service/contact pages, with DNS-pinned public-address-only requests, redirect validation, time and size limits. Scripts and forms from source websites are not executed or copied. No external image or asset rights are assumed.

Requested custom functions such as ecommerce, appointment engines, payments, logins and CRM integrations are recorded as additional work, not silently represented as working. This release is a reviewed concept builder, not an autonomous clone-and-launch platform for arbitrary applications. JavaScript-only websites with insufficient readable content fail visibly for manual follow-up.

HTML checks cover headings, metadata, internal routes and executable-content isolation. Separate AI review checks content and feature claims; it does not claim to perform browser testing. Human review is required before a shareable concept is approved. Concept URLs are unguessable, noindex and served with a restrictive CSP. Do not present these as private authenticated client portals after approval: anyone with the approved link can view it.

## Zoom

Create the Zoom account at https://zoom.us/signup. Signup, email verification and acceptance of Zoom terms belong to the account owner. Zoom is not connected by this service. Once connected, create a real meeting before scheduling the calendar event and include its `join_url` in the event and build brief. For automated meeting creation, use a Zoom Server-to-Server OAuth app with only the required meeting scopes. Do not send a host `start_url` to prospects. Use the real `join_url`, and keep the existing calendar availability checks.

## Verification and backup

`npm test` uses synthetic data in temporary directories and no paid model calls, emails or telephone calls. Before production, inspect the landing page and representative generated pages at desktop/mobile widths. Test a real Kimi concept after connecting its key, then test the assistant using a consenting internal test number before any campaign launch. Back up SQLite with its online backup facility or stop this service briefly before copying the entire volume; copy `.env` separately to encrypted storage. Never copy only a live WAL database file.
