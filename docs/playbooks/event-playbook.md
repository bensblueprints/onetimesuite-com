# Event Playbook — the In-Person Flywheel

**What this is:** the before/during/after system for conferences and meetups, where the founder sells heavily in person and funnels people into the WhatsApp group, then the ~12-minute webinar.
**How to use it:** start the "before" steps 2–3 weeks out. Every link you hand out in person uses the UTM convention below so you can prove the flywheel works.

---

## UTM convention (use everywhere at events)

```
onetimesuite.com/webinar/?utm_source=event&utm_medium=qr&utm_campaign=<event-slug>
```

- `<event-slug>` = lowercase-hyphenated event + year, e.g. `microconf-2026`, `saastock-dublin-2026`.
- QR codes, printed cards, and follow-up DMs all use this exact pattern; only the slug changes.
- Non-QR links from the same event (recap posts, DMs): `utm_medium=social` or `utm_medium=dm`.

---

## BEFORE (2–3 weeks out)

- [ ] **Create the event page** at `onetimesuite.com/events/<slug>/` — event data lives in `src/events-data.js` (add the event there: name, city, dates, slug, talk/demo details; the /events section renders from it). Include: what you'll be demoing, where to find you, and the WhatsApp join link.
- [ ] **Post "heading to X"** on X and LinkedIn (template):
  > "I'll be at [Event] in [City] on [dates]. I'm the person demoing 102 pay-once apps — a $29 Loom replacement, a $39 Calendly you own, and 100 more. If you're going and you're tired of renting software, come find me. onetimesuite.com/events/<slug>/"
- [ ] **Email the organizer the guest-post offer** — use template (b) in `outreach-templates.md`. Offer the "20-minute subscription audit" attendee post with real, sourced prices. Send it early enough to make their newsletter cycle.
- [ ] **Print the WhatsApp QR invite cards** (spec below) and charge the demo laptop/phone.
- [ ] **Pre-load the 30-second demos** for the 5 strongest apps (BloomRecorder, Bookslot, Linkleaf, WisperTalk, Captionly) — offline copies in case venue wifi dies.

## DURING

### WhatsApp QR invite card spec

| Element | Spec |
|---|---|
| Size | Business-card (85×55mm), matte — survives a pocket |
| Front | WhatsApp QR code (join link), "102 apps. Pay once. Own them forever." + onetimesuite.com |
| Back | Three line hook: "Loom $180/yr → BloomRecorder $29 once · Calendly $120/yr → Bookslot $39 once · Typeform $348/yr → Formforge $39 once" + webinar QR (`/webinar/` with the event UTM) |
| Rule | The QR goes to the **WhatsApp group**, not a sales page — the group is the funnel |

### Photo-with-permission posts

- Always ask before photographing anyone; get explicit "yes, post it."
- Caption formula: real first name (with permission), their actual words, no embellishment:
  > "Met [Name] at [Event] — they're paying ~$[real number]/yr for [tools] and didn't know pay-once alternatives exist. Demoed BloomRecorder on the spot. [Event] is good people."
- 1–2 posts per day of the event, not a barrage.

### The 30-second in-person demo script

> "Quick question — what are you paying monthly for software you barely think about? [...] Right. So I build pay-once replacements. Watch this — 20 seconds."
>
> [Open BloomRecorder or Bookslot on the laptop; do ONE action — record 5 seconds and export, or book a slot.]
>
> "That's $29 once instead of Loom at $180 a year. There are 102 of these — recording, booking, forms, invoicing, transcription. Every one has a free version on GitHub, so you can check it's real before spending anything.
>
> Best move: scan this — it's our WhatsApp group. I drop every new app there first, and there's a 12-minute video that shows the whole thing. If it's not for you, mute it and leave, no hard feelings."

**Rules of the floor:** demo the real app, quote real prices, never promise features that don't exist, never trash-talk a competitor beyond their actual pricing, and if someone says no, hand them a card and move on.

## AFTER (within 24–48 hours)

- [ ] **Add everyone you met to WhatsApp within 24h** — personal invite message, not a group add without consent: "Great meeting you at [Event] — here's the group I mentioned: [link]. The 12-min walkthrough is at [webinar UTM link]."
- [ ] **Recap post** on X/LinkedIn (template):
  > "[City] founders are ditching these 5 tools. Spent [N] days at [Event] asking everyone what subscriptions annoy them most. The answers, over and over: 1) Loom (~$180/yr) 2) Calendly (~$120/yr) 3) Typeform (~$348/yr) 4) Otter.ai (~$204/yr) 5) Buffer (~$360/yr for 5 channels) — prices as of [date]. Every one has a pay-once alternative now. Full recap: onetimesuite.com/events/<slug>/"
- [ ] **Follow-up DM template** (send individually, personalize the first line):
  > "Hey [Name] — [specific thing from your conversation at the event]. Good talking with you at [Event]. As promised: the group is [WhatsApp link] and the 12-minute walkthrough is [webinar UTM link]. If you only need one tool, everything's also sold separately at onetimesuite.com/apps/ — no bundle required. Either way, good meeting you."
- [ ] **Log the event:** contacts made `[N]`, WhatsApp joins from the event QR `[N]` (check UTM traffic on /webinar/), sales attributed `[N]`. Real numbers only — this is what justifies (or kills) the next event's ticket.
- [ ] **Update the /events/<slug>/ page** with the recap and photos (permission-cleared only).
