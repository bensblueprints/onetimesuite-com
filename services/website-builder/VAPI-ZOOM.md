# Vapi and Zoom appointment automation

This service receives authenticated Vapi tool calls at `https://onetimesuite.com/api/website-builder/vapi`. It does not initiate calls or launch campaigns.

## Account setup

Create a Zoom Server-to-Server OAuth app for the host account. Required granular scopes:

- `meeting:write:meeting:admin` — create the demo.
- `meeting:read:list_meetings:admin` — verify the host and reconcile uncertain creation responses without duplicates.
- `meeting:delete:meeting:admin` — clean up a meeting when booking fails or the prospect changes the time.

No recording, transcription, contact, billing or account-administration scopes are required. Activate the app only after the account owner approves these permissions. Save `account_id`, `client_id`, `client_secret`, and `host_email` using authenticated, same-origin `POST /api/website-builder/admin/zoom`. The server validates authentication and host meeting-list access before saving AES-256-GCM encrypted configuration in SQLite. Status-only `GET` on the same path never returns credentials. Back up the database together with the existing `SESSION_SECRET`; changing that secret without re-encryption makes stored provider credentials unreadable.

In Vapi, create a Bearer credential named **OneTimeSuite Website Automation**, using the existing dedicated webhook token. Keep the Authorization header and Bearer prefix enabled. Select this same credential on `start_website_build`, `create_website_demo_zoom`, and `cancel_website_demo_zoom`. Do not paste the Zoom client secret or a DeepInfra key into these tools. Vapi's optional JWE setting is not used by this endpoint.

`GET /api/website-builder/admin/zoom-tools` exports the two Zoom function definitions without secrets. Add the tools to the website outreach assistant only after credentials and a real internal meeting test succeed. Keep the existing calendar availability, calendar booking and end-call tools.

## Required assistant booking sequence

1. Complete discovery, confirm consent to a free concept, and confirm that $500 plus $50/month would be workable if the prospect chooses to proceed. The concept itself has no purchase obligation. Never guarantee revenue, ranking or delivery before the builder confirms readiness.
2. Confirm name, email by read-back, business website, IANA timezone, and a seated screen-viewing appointment. Host timezone is `Asia/Ho_Chi_Minh`. Offer a 30-minute slot 24–48 hours after the call starts; account for the prospect's local date and daylight saving time.
3. Call `check_website_demo_availability` for the exact interval. Do not book a busy slot. Obtain the prospect's agreement to the exact local date/time.
4. Call `create_website_demo_zoom` with `business_name`, `start_at` (ISO timestamp with offset), `duration_minutes: 30`, `prospect_timezone`, and `attendance_confirmed: true`. Wait for a successful `join_url`; never invent or substitute a personal meeting URL.
5. Call `schedule_website_demo` using the exact Zoom start/end timestamps, verified attendee email, and host timezone. Vapi's documented native Google Calendar tool supports `summary`, `startDateTime`, `endDateTime`, `attendees`, `timeZone`, and `calendarId`. Include the exact returned join URL in the **summary**, e.g. `Website presentation — Example Plumbing | Join Zoom: https://... | Please join seated at a computer`. Do not assume unsupported description/location fields are transmitted. If these become supported, the summary still retains the link until an actual invite test verifies the other fields.
6. Only after a successful calendar result, read back the prospect's local date/time, ask them to check inbox/spam/promotions for the invite, and reconfirm attendance and screen viewing. Record whether they actually received the invitation; do not invent email-delivery confirmation. If not received, resolve or flag operator follow-up.
7. Call `start_website_build` with the complete brief and the **actual** calendar event ID, Zoom join URL and exact timestamps. A queued job is not a completed website. If `builds_paused` is true, explain that delivery timing needs operator confirmation rather than promising tomorrow.

## Failure handling

- Zoom unavailable: do not create a calendar event with a fabricated link or claim a confirmed Zoom booking.
- Zoom creation timeout: retry only the identical request. For one minute the tool asks for a later retry. Afterwards it searches the host's scheduled meetings for its unique marker. It never creates a second meeting while the first outcome is uncertain. If lookup cannot establish exactly one match, an operator must review Zoom.
- Definitive calendar booking failure: `cancel_website_demo_zoom` cancels the Zoom meeting belonging to the current Vapi call. It cannot cancel an arbitrary meeting. A calendar timeout can mean the event was created; do not blindly retry, cancel Zoom, or create a second calendar event. Ask the operator to check the calendar.
- Changed time after a calendar event was created: the current native tool has no calendar deletion operation. Escalate the calendar change to the operator; do not claim both bookings were cancelled. The Zoom cancellation result explicitly reports `calendar_event_cancelled: false`.
- Each call has at most one active Zoom booking. Repeated creation returns the stored attendee-only result. Zoom host start links and access tokens are never stored in booking results or sent to Vapi.
- After Zoom is configured, the build webhook rejects briefs whose Zoom URL/start/end do not match a successful meeting for that call. Calendar event validity still depends on the successful native Vapi calendar result; this service has no independent Google credentials.

## Validation

`npm test` includes synthetic OAuth, meeting creation, replay/concurrency/restart protection, timeout reconciliation, cancellation ownership, time-window validation, credential encryption, HTTP authentication and CSRF checks. It makes no calls, sends no invitations, and creates no real meetings.

Before launch, create a clearly named internal-only future Zoom meeting, verify the returned link and time, and cancel it using the same call context. Verify an internal Google Calendar invitation contains the real Zoom link. Do not use customer contact details for the test. A live Zoom test is separate from full assistant/campaign validation and from the AI builder's provider capacity.

References: [Zoom OAuth](https://developers.zoom.us/docs/internal-apps/s2s-oauth/), [Zoom granular scopes](https://developers.zoom.us/docs/integrations/oauth-scopes-granular/), [Vapi Google Calendar fields](https://docs.vapi.ai/tools/google-calendar).
