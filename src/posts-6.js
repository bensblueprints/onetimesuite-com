/* Comparison blog post content, part 6 (Castport, Inkpress, Feedloft, Droplink, Inkseal, Overlayr, Signboard, Serpdeck, Chatterbox, Ledgerly) */
module.exports = [
  {
    slug: 'buzzsprout-alternative', competitor: 'Buzzsprout', product: 'castport',
    metaDesc: 'Buzzsprout meters your podcast by upload hours — $12–24/month forever. Castport self-hosts your show with an Apple/Spotify-valid feed for $39 once. Honest comparison.',
    intro: [
      'Buzzsprout is arguably the friendliest podcast host on the market. The onboarding is famously gentle, the dashboard explains everything in plain English, and features like Magic Mastering and automatic episode optimization have earned it a devoted following among first-time podcasters. There is a reason so many "how to start a podcast" guides point straight at it.',
      'But Buzzsprout meters your show by upload hours: $12/month buys 3 hours of new audio a month, $18 buys 6, $24 buys 12 — and the free tier deletes your episodes after 90 days. Under the hood, podcast hosting is file storage plus an RSS feed, and that is a job your own $5 VPS can do. Castport is a $39 pay-once, self-hosted podcast host — here is the honest comparison.',
    ],
    good: {
      lead: 'Buzzsprout has earned its reputation, and we will not pretend otherwise:',
      items: [
        'The easiest onboarding in podcasting — genuinely beginner-proof, with guides for every directory submission.',
        'Magic Mastering — automatic loudness normalization and audio polish, an add-on nothing self-hosted matches out of the box.',
        'Solid, IAB-certified analytics that advertisers recognize.',
        'Dynamic ad insertion and affiliate marketplace options when you want to monetize.',
        'Their servers carry your bandwidth — a viral episode is their scaling problem, not yours.',
      ],
      after: 'If you are launching your first show and want a company holding your hand through Apple and Spotify submission, Buzzsprout is a genuinely good choice.',
    },
    hurts: [
      'The meter never stops. $12–24/month is $144–288 every year, forever, and the pricing is tied to upload hours — publish more, pay more. Over three years a modest weekly show on the $18 tier costs $648. And the free tier is a trap for archival purposes: episodes are deleted after 90 days, which tells you who really owns the shelf your show sits on. Your audio lives on their infrastructure, your feed is served from their domain, and your analytics live in their dashboard.',
      'That last part is the deeper cost. Migrating podcast hosts mid-show is a nervous operation — 301 redirects on the feed, hoping every subscribed app follows. The subscription model works precisely because leaving is scary. With a self-hosted feed on your own domain, that lock-in simply never forms: the feed URL is yours on day one and stays yours forever.',
    ],
    stay: [
      'Stay with Buzzsprout if you want zero server responsibility — self-hosting means your box carries the download bandwidth, and a genuinely huge show may outgrow a $5 VPS. Stay if Magic Mastering, IAB-certified stats or dynamic ad insertion are part of how you produce or monetize. Those are real services, not just storage.',
      'Switch if your show is the common case: a modest, steady audience, episodes you want online forever, and a monthly bill you resent. Castport gives you unlimited shows, unlimited episodes and unlimited archive depth for $39 once — no upload-hours math ever again.',
    ],
    meetExtra: 'Castport generates an Apple/Spotify-valid RSS feed the hard-won way — byte-exact enclosure lengths, permanent GUIDs, probed durations, real HTTP Range support — plus clean public show pages, an embeddable player, Podcasting 2.0 chapters, and privacy-safe download stats (IPs hashed with a rotating daily salt). One SQLite file and two folders; back up your entire podcast by copying three things.',
  },
  {
    slug: 'ghost-alternative', competitor: 'Ghost', product: 'inkpress',
    metaDesc: 'Ghost(Pro) starts at $9/month — $324 over three years — to publish markdown. Inkpress is a $29-once, self-hosted blog engine with zero-JS pages. Honest comparison.',
    intro: [
      'Ghost is one of the best publishing platforms ever built. It is genuinely open source, the editor is a joy, and it has grown into a full creator business stack: memberships, paid newsletters, tiered subscriptions, native email. Plenty of six-figure newsletter businesses run on Ghost, and they are right to.',
      'But if what you want is a blog — write markdown, publish fast pages, own your words — Ghost(Pro) starts at $9/month ($108/year, $324 over three years) and climbs with staff users and features. Self-hosting Ghost is free but means running a Node app against MySQL with their recommended stack, which is its own part-time job. Inkpress is the smaller, simpler answer: a $29 pay-once markdown blog engine in one SQLite file.',
    ],
    good: {
      lead: 'Ghost deserves enormous credit:',
      items: [
        'A genuinely excellent editor — one of the best writing experiences on the web.',
        'The full creator stack: memberships, paid subscriptions, native newsletters, Stripe integration.',
        'Actually open source (MIT) — self-hosting is a real, unrestricted option.',
        'A mature theme ecosystem and a professional hosted platform with real support.',
      ],
      after: 'If you are building a paid newsletter or membership business, Ghost is the correct tool and this post will not talk you out of it.',
    },
    hurts: [
      'The subscription math is the usual story: $9/month on Starter is $324 over three years — and Starter caps you at one staff user and limited integrations, so growing blogs drift toward $25+/month tiers quickly. That is real money for what is, for a plain blog, markdown rendering plus a theme. The self-host escape hatch exists but is honest work: MySQL 8, a specific Node version, config management and upgrade churn on a platform that evolves fast.',
      'There is also a weight question. Ghost ships a member-management system, an email engine and an admin API whether you need them or not, and its public pages carry more JavaScript than a blog strictly requires. If your blog is a reading surface, not a business platform, most of what you are paying for — in money or in ops effort — is machinery you never switch on.',
    ],
    stay: [
      'Stay with Ghost if memberships, paid newsletters or a multi-author team are the point — Inkpress has none of that, deliberately. It is a single-admin blog engine with no email, no members and no payment rails. Stay on Ghost(Pro) if you want a company on the hook for uptime and backups.',
      'Switch if you write and publish, full stop. Inkpress gives you a split-pane markdown editor, three themes, scheduled posts, RSS, sitemaps and per-post SEO overrides — with public pages that ship zero JavaScript and load instantly — for $29 once, on a $5 VPS or as a desktop app.',
    ],
    meetExtra: 'Inkpress renders everything server-side: Shiki syntax highlighting at save time, pure HTML/CSS public pages with perfect Lighthouse scores, a 301 redirect table so renamed slugs never break links, and the whole site in one SQLite file. Backup is a file copy. MIT source included.',
  },
  {
    slug: 'feedly-alternative', competitor: 'Feedly', product: 'feedloft',
    metaDesc: 'Feedly Pro is $8/month forever to poll RSS feeds and store articles. Feedloft is a $24-once, self-hosted reader with full-text search. Honest comparison.',
    intro: [
      'Feedly inherited the throne when Google Reader died, and it has held it well. Polished apps on every platform, instant sync, a clean reading experience, and an AI layer (Leo) that can filter noise and surface topics across thousands of sources. For teams doing market intelligence, its enterprise tiers are a real product.',
      'But for an individual who just reads feeds, Feedly Pro is $8/month — $96/year, $288 over three years — for software that is, architecturally, a poller and a database. Your subscriptions, read states and saved articles all live in their cloud, tiered behind their plans. Feedloft moves that whole machine onto hardware you control for $24, once.',
    ],
    good: {
      lead: 'Feedly is the category leader for good reasons:',
      items: [
        'Excellent native mobile apps with seamless sync across devices.',
        'Leo, the AI assistant — mute topics, prioritize keywords, deduplicate near-identical stories.',
        'Deep integrations: save to Notion, Slack, Zapier, read-later services.',
        'A generous free tier (up to 100 sources) that many casual readers never outgrow.',
      ],
      after: 'If you read on your phone all day and want AI triage across hundreds of sources, Feedly Pro earns its fee.',
    },
    hurts: [
      'The subscription compounds quietly: $96/year for Pro, $144/year for Pro+, forever, to poll URLs your browser could poll. Three years of Pro is $288 — twelve times Feedloft\'s one-time price. The free tier caps sources and holds back search; the features that make heavy reading pleasant (full-text search, hiding sponsored content, power filters) are exactly the ones metered behind paid tiers.',
      'And your reading graph lives on their servers. Every subscription, every read article, every saved story is data about what you pay attention to — held by a vendor whose business model includes understanding attention. Feedly is a reputable company, but "reputable custodian of my intellectual diet" is still a weaker position than "my SQLite file, my disk, no telemetry at all."',
    ],
    stay: [
      'Stay with Feedly if mobile-first reading with cloud sync is non-negotiable — Feedloft is a self-hosted web app plus desktop app, and phone reading means reaching your own server (a VPS or Tailscale makes that workable, but it is your setup to own). Stay if Leo\'s AI triage genuinely saves you time across huge source lists.',
      'Switch if you read at a desk, care where your data lives, and are tired of renting a poller. Feedloft gives you folders, OPML import/export, full-text extraction for summary-only feeds, and instant FTS5 search — for less than four months of Feedly Pro.',
    ],
    meetExtra: 'Feedloft is keyboard-first (full vim-style j/k/o/m/s set), dark-mode-first, and dense in the way serious readers want. The poller respects ETag/Last-Modified and backs off failing feeds; Readability pulls full articles when feeds only publish summaries. One Node process, one SQLite file, MIT source.',
  },
  {
    slug: 'inoreader-alternative', competitor: 'Inoreader', product: 'feedloft',
    metaDesc: 'Inoreader Pro is ~$90/year for power-user RSS in their cloud. Feedloft is $24 once, self-hosted, with FTS5 search and full-text extraction. Honest comparison.',
    intro: [
      'Inoreader is the power user\'s RSS reader — the one people graduate to when Feedly feels too consumer. Rules and filters that act on incoming articles automatically, monitoring feeds for keyword mentions, podcast and newsletter ingestion, offline reading, and a free tier that is genuinely more generous than most competitors\' paid entry plans.',
      'It is still a subscription for your own reading habit: Pro runs about $7.50–9.99/month depending on billing — call it $90/year, every year — and the automation features that define the product are exactly what is gated behind it. Feedloft takes a different bet: the reader is software you buy once, $24, and run on your own box forever.',
    ],
    good: {
      lead: 'Inoreader is genuinely the most capable hosted reader:',
      items: [
        'Rules engine — auto-tag, auto-mark, push notifications on keyword matches, real automation.',
        'Ingests more than RSS: newsletters via email address, podcasts, social feeds, page-change monitoring.',
        'A generous free tier (150 feeds) with the core reading experience intact.',
        'Offline reading in solid mobile apps, plus OPML everything.',
      ],
      after: 'If your feeds are a monitoring system — brand mentions, competitor tracking, research alerts — Inoreader\'s automation is worth real money.',
    },
    hurts: [
      'The math is the standard subscription curve: ~$90/year for Pro is ~$270 over three years, forever, with the power features (search across all feeds, rules, monitoring) locked to the paying tier. Inoreader has also moved features between tiers over the years — as with any hosted service, the deal you signed up for is not guaranteed to be the deal in year three.',
      'And the reading data lives with them. Inoreader is better than most on privacy, but your subscription list and reading behavior still sit in someone else\'s database, governed by someone else\'s retention policy. A self-hosted reader makes the whole question moot: the only server that knows what you read is the one you own, and the only network calls are to the feeds you subscribed to.',
    ],
    stay: [
      'Stay with Inoreader if the rules engine is your workflow — Feedloft has folders, search and full-text extraction, but no auto-tagging rules, no keyword alerts, no newsletter-to-feed ingestion. Those are real Inoreader strengths we have not replicated. Stay too if polished mobile apps with offline sync are how you actually read.',
      'Switch if what you need is a fast, private, keyboard-driven reading machine for the feeds you chose: $24 once, unlimited feeds, instant FTS5 full-text search, and OPML import that preserves your folder structure on the way in — and produces valid OPML 2.0 on the way out if you ever leave.',
    ],
    meetExtra: 'Feedloft\'s poller does conditional GET (honors 304s), per-feed interval overrides, and automatic backoff on failing feeds — polite to publishers and light on your VPS. Full-text extraction via Mozilla Readability runs per-article or always-on per-feed. MIT-licensed, zero telemetry, one SQLite file.',
  },
  {
    slug: 'wetransfer-alternative', competitor: 'WeTransfer', product: 'droplink',
    metaDesc: 'WeTransfer Pro is $12/month — $432 over three years — to send files through their cloud. Droplink sends from your own server, resumable, for $29 once. Honest comparison.',
    intro: [
      'WeTransfer made sending big files civilized. No account for recipients, a link that just works, and a product so pleasant that "I\'ll WeTransfer it" became the default sentence in every creative industry. For agencies and freelancers moving client work around, it is the path of least resistance.',
      'The Pro plan is $12/month — $144/year, $432 over three years — for what is, mechanically, an upload, a stored file and a download link. Your client\'s footage, your unreleased designs, your contracts all sit on WeTransfer\'s storage under WeTransfer\'s terms in between. Droplink is the same workflow running on your own $5 VPS: $29 once, no meter, and files that never touch a third party.',
    ],
    good: {
      lead: 'WeTransfer earns its ubiquity:',
      items: [
        'The smoothest sender-to-recipient flow in the business — no signup, no app, no friction.',
        'Pro transfers up to 200GB with 1TB of storage, password protection and expiry control.',
        'Branded portals and wallpapers — agencies genuinely use the presentation layer.',
        'It is the name clients already know, which has real coordination value.',
      ],
      after: 'If your clients expect a WeTransfer link and the branding page is part of your pitch, that polish is worth something.',
    },
    hurts: [
      'The free tier caps transfers at a couple of gigabytes and Pro is $144/year forever — over three years you have paid $432 to rent a progress bar. There is also a reliability gap that stings at exactly the wrong moment: uploads are not resumable. A connection blip at 94% of a 40GB upload means starting over. For people who send big files for a living, that is not an edge case, it is a Tuesday.',
      'And every transfer is a custody handoff. Your files sit on WeTransfer\'s servers, subject to their terms of service, retention windows and jurisdiction, until expiry. WeTransfer also drew industry attention in 2025 for terms-of-service language around content and machine learning — it clarified the terms after the backlash, but the episode made the underlying point: files on someone else\'s storage are governed by someone else\'s lawyers. Files on your own server are not.',
    ],
    stay: [
      'Stay with WeTransfer if the recipient experience and brand recognition matter more than the bill — a Droplink page is clean but it is your domain, not a name clients already trust. Stay if you genuinely cannot host anything: Droplink\'s share links need a public server (a $5 VPS), and that is one thing to set up.',
      'Switch if you send large files regularly and want them under your control: no size limit beyond your disk, chunked resumable uploads that survive a dropped connection, password gates, download limits, expiring links and a download-event log — all for less than three months of Pro.',
    ],
    meetExtra: 'Droplink slices uploads into 5MB chunks with per-chunk retry, streams them straight to disk (a 50GB file never touches RAM), and resumes exactly where a refresh or outage left off — verified byte-for-byte with sha256 in the test suite. Recipients get a clean page with previews, a ZIP-all button and a live expiry countdown. One SQLite file plus a files folder, MIT source.',
  },
  {
    slug: 'docusign-alternative', competitor: 'DocuSign', product: 'inkseal',
    metaDesc: 'DocuSign Personal is $10/month for 5 envelopes; Standard is $25/month. Inkseal is $49 once — unlimited envelopes, self-hosted, verifiable audit trail. Honest comparison.',
    intro: [
      'DocuSign is the verb of e-signatures. It is the platform legal departments have already approved, the name counterparties do not question, and an enterprise stack — identity verification, notarization, CLM, integrations with every CRM on earth — that goes far deeper than "sign this PDF."',
      'It is also priced like the enterprise platform it is. Personal costs $10/month and caps you at five envelopes a month; Standard is $25/month per user. A landlord sending a dozen leases a year, or a freelancer sending a contract a month, is paying $120–300 a year forever and still watching an envelope cap. Inkseal is that everyday workflow — upload PDF, place fields, route signers, get a flattened audit-trailed document back — self-hosted, for $49 once.',
    ],
    good: {
      lead: 'DocuSign\'s dominance is earned:',
      items: [
        'Universal acceptance — nobody\'s lawyer asks "what is DocuSign?"',
        'Enterprise-grade compliance options, including certificate-based and Qualified Electronic Signatures via their EU trust services.',
        'Identity verification, SMS delivery, notarization and payment collection on higher tiers.',
        'Integrations with effectively every CRM, HR and document system in existence.',
      ],
      after: 'If you operate in a regulated industry, need QES in the EU, or your counterparties require a household name, DocuSign is the safe answer.',
    },
    hurts: [
      'The pricing punishes light users hardest. Personal is $120/year for five envelopes a month — that is potentially $2 per signature for a typical small landlord. Standard at $25/month is $900 over three years, per user. The product is excellent; the model is a meter on something that, for everyday agreements, is a solved technical problem: field placement, click-to-sign consent, an audit log and a flattened PDF.',
      'Your executed contracts also live in DocuSign\'s cloud, and the audit trail is their proprietary attestation — you trust it because you trust them. One honest note in the other direction, because it matters: Inkseal\'s signatures are valid under ESIGN/UETA and as basic eIDAS electronic signatures — intent, consent capture, tamper-evident audit trail, copies for all parties — but Inkseal is NOT a Qualified Electronic Signature (QES). It uses no certificate-based digital signatures and no Qualified Trust Service Provider, and claims no compliance certification. For leases, NDAs, contractor agreements and internal approvals that is exactly what the law requires; for QES-mandated or heavily regulated workflows, it is not, and you should stay with a provider like DocuSign.',
    ],
    stay: [
      'Stay with DocuSign if you need QES, identity verification, notarization, or the brand reassurance of the market leader in front of nervous counterparties. Stay if your envelopes flow out of Salesforce or an HR system where the integrations do real work.',
      'Switch if your reality is everyday agreements at small volume being billed at enterprise rates. Inkseal does sequential or parallel signer routing, templates, decline/void/remind flows and unlimited envelopes — five months of DocuSign Personal pays for it outright, and there is no cap to think about ever again.',
    ],
    meetExtra: 'Inkseal\'s audit trail is not a PDF footer you take on faith: every event is hash-chained — sha256(prev_hash + event) — rooted in the SHA-256 of the original uploaded document, and a one-click Verify recomputes the entire chain and reports exactly where it breaks if anything was ever tampered with. Signatures are embedded into the PDF itself via pdf-lib, not overlaid. Runs as a desktop app or on a $5 VPS; MIT source you can read before trusting it with contracts.',
  },
  {
    slug: 'pandadoc-alternative', competitor: 'PandaDoc', product: 'inkseal',
    metaDesc: 'PandaDoc starts at $19/user/month — $684+ over three years — for proposals plus e-signing. If signing is what you need, Inkseal is $49 once. Honest comparison.',
    intro: [
      'PandaDoc is really a sales-document platform that happens to include e-signatures. The document builder assembles proposals from content blocks and pricing tables, quotes calculate themselves, approval workflows keep managers in the loop, and analytics tell your rep the prospect spent four minutes on the pricing page. For sales teams, that is a genuine edge.',
      'But it is priced per user, per month, forever: Essentials at $19/user/month, Business at $49/user/month — $684 to $1,764 over three years for a single seat. If what you actually do is send finished PDFs to be signed — leases, contracts, NDAs — you are paying for a proposal studio to use its signature pad. Inkseal is the signature pad alone, self-hosted, $49 once.',
    ],
    good: {
      lead: 'PandaDoc is a strong product in its actual category:',
      items: [
        'The document builder — templates, content library, drag-in pricing tables that calculate totals.',
        'Document analytics: see when a prospect opened, what they read, how long they lingered.',
        'Approval workflows and CRM integrations (HubSpot, Salesforce, Pipedrive) that sales ops actually use.',
        'Payment collection on signed documents — sign and pay in one flow.',
      ],
      after: 'If you send proposals and quotes for a living, PandaDoc is a legitimate revenue tool, not just a signing tool.',
    },
    hurts: [
      'Per-seat pricing scales the wrong way for small teams: three people on Essentials is $684/year — every year — and key features like CRM integration and approval chains push you toward the $49/user Business tier. PandaDoc\'s free e-sign tier exists but is deliberately minimal. As with every SaaS in this category, your executed agreements live in their cloud, and your access to your own signed history is tied to an active subscription.',
      'The overkill problem is the quiet one. Most small businesses evaluating PandaDoc need perhaps ten documents signed a month, from templates that change twice a year. The proposal analytics, content library and quote builder go unused while the invoice arrives monthly. Honest caveat in the other direction: Inkseal is ESIGN/UETA-valid and covers basic eIDAS electronic signatures, but it is not a Qualified Electronic Signature (QES) and claims no compliance certification — everyday agreements yes, regulated-industry signature mandates no.',
    ],
    stay: [
      'Stay with PandaDoc if proposals are your pipeline — the builder, analytics and CRM hooks are the product, and Inkseal has none of them. Stay if you collect payment at signature time or need document workflows deeper than sign-in-order.',
      'Switch if your documents arrive as finished PDFs and just need signatures. Inkseal gives you drag-and-drop field placement, sequential or parallel routing, reusable templates, email invitations over your own SMTP, and unlimited envelopes — for roughly two and a half months of one Essentials seat.',
    ],
    meetExtra: 'Inkseal flattens signatures directly into the PDF at the exact recorded coordinates (the rotation-safe math has its own unit-test suite), appends an audit certificate page, and backs every envelope with a hash-chained, one-click-verifiable audit trail rooted in the original document\'s own hash. Desktop app for offline use, Docker for a $5 VPS, MIT source.',
  },
  {
    slug: 'streamelements-alternative', competitor: 'StreamElements', product: 'overlayr',
    metaDesc: 'StreamElements is free — but your overlays live on their cloud and lag when it hiccups. Overlayr self-hosts your overlays for $24 once. Honest comparison.',
    intro: [
      'StreamElements is the default overlay stack for a huge share of Twitch and YouTube streamers, and the price is hard to argue with: free. Overlay editor, alerts, a chatbot, tipping via SE.Pay, loyalty points, a merch store — an entire streamer toolkit funded by payment processing fees and premium upsells rather than a subscription.',
      'Free has a shape, though. Your overlays render from StreamElements\' cloud, which means their infrastructure is live in your broadcast — when it lags or hiccups mid-stream, that is your production glitching on someone else\'s server. Overlayr takes the opposite bet: five overlay types served from your own machine or VPS, updated over WebSocket, for $24 once. Nothing between OBS and your overlays but your own network.',
    ],
    good: {
      lead: 'StreamElements offers a lot, for nothing:',
      items: [
        'Genuinely free core — overlays, alerts, chatbot and tipping with no monthly fee.',
        'A huge theme gallery and a capable in-browser overlay editor.',
        'Deep Twitch/YouTube integration: follows, subs, raids and cheers all wired up out of the box.',
        'SE.Pay tipping, loyalty programs and sponsorship tools — a real monetization layer.',
      ],
      after: 'If you want alerts tied to Twitch events with zero setup and zero cost, StreamElements is a fair default and this post will be honest about that.',
    },
    hurts: [
      'The cost is architectural rather than monetary. Every overlay is a browser source pointed at StreamElements\' servers: a cloud outage, a degraded region or plain latency shows up live on your stream, and streamers trade stories about widgets freezing mid-broadcast. You also live inside their ecosystem — themes, premium galleries and SE.Pay (where processing fees on your tips are the business model) are all nudges, and your overlay configs are not portable anywhere else.',
      'There is also a subtler reliability problem Overlayr was specifically built around: OBS reloads browser sources constantly — scene switches, source toggles, GPU hiccups — and a cloud countdown that re-initializes on reload can visibly desync. Overlayr\'s timers are server-authoritative: the server owns started_at/ends_at in SQLite, and every reconnect resyncs to the correct remaining time instead of resetting. On your own LAN, latency between OBS and the overlay server is effectively zero.',
    ],
    stay: [
      'Stay with StreamElements if you want platform-event alerts with no infrastructure at all — Overlayr\'s alerts fire from a dashboard button or a webhook, so hooking them to Twitch events means wiring up Streamer.bot or an EventSub relay yourself. Stay if the chatbot, loyalty points or SE.Pay tipping are part of how your channel runs.',
      'Switch if you care about production reliability and ownership: countdowns, goal bars, tickers, starting-soon scenes and alert boxes served from your own box, with no watermark, no upsell and no third-party cloud in your broadcast path — for $24, once.',
    ],
    meetExtra: 'Overlayr ships five overlay types as tokenized OBS Browser Source URLs with live WebSocket updates, a live editor that previews the actual overlay over a transparent checkerboard (exactly what OBS sees), five themes with per-overlay overrides, and a webhook endpoint that plugs into Streamer.bot or Zapier. One Node process, one SQLite file, MIT source.',
  },
  {
    slug: 'yodeck-alternative', competitor: 'Yodeck', product: 'signboard',
    metaDesc: 'Yodeck charges $8 per screen per month — $1,440 for five screens over three years. Signboard runs unlimited screens from your own server for $49 once.',
    intro: [
      'Yodeck is one of the best-liked names in small-business digital signage, and deservedly so. It is affordable by category standards, easy to set up, offers preloaded Raspberry Pi players, and its free single-screen tier is a genuinely generous way to run one lobby TV. For a category historically full of enterprise pricing, Yodeck made signage approachable.',
      'But the model is per screen, per month, forever: $8/screen/month means a modest five-screen setup — a café with menu boards, a gym, a dental office — costs $480 a year, $1,440 over three years, for what is at its core a scheduled slideshow with a health dashboard. Signboard is that product, self-hosted: $49 once, unlimited screens, any browser as a player.',
    ],
    good: {
      lead: 'Yodeck gets the fundamentals right:',
      items: [
        'A free tier for a single screen — genuinely useful, not just a demo.',
        'Preloaded Raspberry Pi players shipped to you — hardware and software as one solved problem.',
        'A big app ecosystem: weather, news tickers, dashboards, social walls.',
        'Solid scheduling, offline caching on players, and a management console built for non-technical staff.',
      ],
      after: 'If you run one screen, Yodeck\'s free tier is honestly hard to beat — use it and pay nobody.',
    },
    hurts: [
      'The per-screen meter is the whole story. Screen two starts the billing, and the bill scales with exactly the thing you want to grow: $8/screen/month is $96 per screen per year, indefinitely. Five screens over three years is $1,440; ten screens is $2,880 — rent, forever, on TVs you already own, showing content you already made. Franchise or multi-site operators feel this hardest, which is precisely who the pricing is designed around.',
      'Your content, playlists and schedules also live in Yodeck\'s cloud, dependent on their service continuing on terms you like. And each screen wants their player app or their Pi image. Signboard\'s answer is a 6-character pairing code in any browser — a smart TV\'s built-in browser, a $35 Pi in kiosk Chromium, an old Fire tablet — with no per-device account and no app store between you and your own screens.',
    ],
    stay: [
      'Stay with Yodeck if you have exactly one screen (free beats $49), if you want turnkey preloaded hardware shipped to your door, or if the app ecosystem — live news, weather, dashboards — is content you actually display. Signboard shows images, videos, web pages and templated announcement slides; it does not have an app store.',
      'Switch the moment screen count matters: Signboard is $49 once for unlimited screens, with drag-reorder playlists, server-side dayparting evaluated in each screen\'s own timezone (kiosk clocks drift and lie), a live health dashboard, offline media caching via service worker, and one-click emergency takeover to every screen you own.',
    ],
    meetExtra: 'Signboard runs as one Node process — admin, API, player and media — against one SQLite file. Playlist and schedule edits push to affected screens instantly over WebSocket with a 60-second poll as fallback, and announcement slides come from five built-in layout templates so a "Closed Friday" screen takes 20 seconds to make. Docker on a $5 VPS, or a Windows desktop app that doubles as a kiosk player. MIT source.',
  },
  {
    slug: 'accuranker-alternative', competitor: 'AccuRanker', product: 'serpdeck',
    metaDesc: 'AccuRanker starts at $129/month — $4,644 over three years — for 1,000 keywords. Serpdeck is $39 once plus your own SERP API key at pennies per check.',
    intro: [
      'AccuRanker is widely considered the best pure rank tracker money can rent. It is fast — on-demand refreshes across huge keyword sets, updates competitors take hours to match — with SERP-feature tracking, share-of-voice analytics and Data Studio integrations that agencies build client reporting on. If rank tracking is your product, AccuRanker is the premium tier of the market.',
      'It starts at $129/month for 1,000 keywords — $1,548 a year, $4,644 over three years — for something that is, mechanically, a scheduler, a database and a line chart wrapped around SERP lookups. The lookups are the only part that genuinely costs money, and providers like SerpAPI and DataForSEO already sell them for fractions of a cent. Serpdeck is the wrapper as a $39 one-time purchase: you bring the API key, it does the scheduling, history, competitor tracking and alerting.',
    ],
    good: {
      lead: 'AccuRanker\'s premium reputation is deserved:',
      items: [
        'Speed — on-demand refresh of your entire keyword portfolio, not a once-daily batch.',
        'SERP-feature tracking: featured snippets, local packs, PAA boxes, pixel-rank.',
        'Share-of-voice and landing-page analytics that turn positions into strategy.',
        'Agency-grade reporting, API access and Looker Studio connectors.',
      ],
      after: 'If you manage enterprise SEO or bill clients for rank reporting at scale, AccuRanker\'s speed and depth are genuinely worth paying for.',
    },
    hurts: [
      'The subscription is sized for agencies and billed to everyone. $129/month is the floor — 1,000 keywords, one price, whether you check them all daily or not — and $4,644 over three years buys the same infrastructure a $5 VPS runs comfortably. The real marginal cost of rank tracking is the SERP queries themselves: via DataForSEO, checking 100 keywords daily runs roughly $2–6 a month at pay-as-you-go rates. The rest of the fee is the convenience of renting the scheduler.',
      'There is also a data-custody angle SEO folks rarely price in: your full keyword strategy — every term you target, every competitor you watch, every project you run — lives in a vendor\'s cloud, tiered by their plans. Serpdeck keeps that map in a SQLite file on your own machine, with unlimited projects, keywords and competitors because there is no reason to meter your own database.',
    ],
    stay: [
      'Stay with AccuRanker if you need on-demand refreshes across thousands of keywords, SERP-feature and pixel-rank tracking, or polished client-facing reporting — Serpdeck checks on a daily schedule (plus manual re-checks), tracks organic positions, and exports CSV; it is not an agency reporting suite. Stay if you do not want to manage an API key or a server at all.',
      'Switch if you track your own sites or a modest client roster and the $129/month floor stings. Serpdeck pays for itself against AccuRanker in about nine days, and the ongoing cost is your own metered API usage — pennies, billed at cost, with no markup baked into a subscription.',
    ],
    meetExtra: 'Serpdeck is driver-based: SerpAPI, DataForSEO, or a generic JSON-mapping driver for any SERP endpoint you already run. Every check stores the full top-100 SERP snapshot, history charts overlay competitor lines with rank #1 at the top, and webhook/email alerts fire on big moves or top-10 entry/exit. A SQLite-backed crash-safe job queue means a killed process just resumes — nothing lost, nothing double-fired. MIT source; deliberately no direct Google scraping, ever.',
  },
  {
    slug: 'hyvor-talk-alternative', competitor: 'Hyvor Talk', product: 'chatterbox',
    metaDesc: 'Hyvor Talk is the privacy-friendly comment widget — at $8–24+/month forever. Chatterbox is the same idea self-hosted for $24 once. Honest comparison.',
    intro: [
      'Hyvor Talk is what people switch to when they get fed up with Disqus, and it earns the role. No ads, no tracking, EU hosting, GDPR-conscious by design, and a genuinely polished widget with reactions, real-time updates and clean moderation. As hosted comment platforms go, it is one of the good ones — this comparison starts from respect.',
      'But it is still a subscription on a comment box: plans start around $8/month billed annually and climb past $24/month as your pageviews grow — $288 to $864+ over three years, forever, for threaded replies and a moderation queue. Chatterbox is the same core product as a $24 one-time purchase: one script tag, your own $5 VPS, your readers\' comments in your own SQLite file.',
    ],
    good: {
      lead: 'Hyvor Talk gets the important things right:',
      items: [
        'Genuinely privacy-respecting — no ads, no data selling, EU-hosted, GDPR-minded.',
        'A polished widget: reactions, real-time comment updates, rich formatting.',
        'Solid moderation with spam filtering, plus SSO on higher tiers.',
        'A small, principled company — the kind of vendor you want to exist.',
      ],
      after: 'If you want privacy-respecting comments and refuse to run any server, Hyvor Talk is the right hosted pick.',
    },
    hurts: [
      'The pricing scales with success: tiers are pageview-based, so a post that finally goes viral moves you up a plan. $8/month is the entry, $24+/month is where growing blogs land — and over three years that is $288–864+ on a widget whose job has not changed. The subscription also has the usual custody catch: your community\'s entire comment history lives on their infrastructure, exportable in theory, hostage to an active plan in practice.',
      'And even the most privacy-respecting third party is still a third party. Your readers\' comments, emails and IP-derived data pass through someone else\'s servers under someone else\'s policy. Chatterbox\'s answer is structural rather than promissory: it runs on your box, salted-hashes IP addresses before they ever touch disk, and makes zero external calls — the privacy policy is the architecture.',
    ],
    stay: [
      'Stay with Hyvor Talk if you cannot or will not run a server — Chatterbox\'s embed needs a public VPS, and that is a real requirement, not a footnote. Stay if real-time updates, reactions and SSO are features your community actively uses; Chatterbox does threading, voting and email notifications, but not live-updating comments or single sign-on.',
      'Switch if you run a blog on a static site or your own server and want comments to be the same kind of thing: yours. $24 once, threaded replies with Wilson-score ranking, a real moderation dashboard, spam defenses that never show your readers a CAPTCHA, and reply notifications over your own SMTP.',
    ],
    meetExtra: 'Chatterbox is one script tag: a dependency-free ~15KB vanilla-JS widget in a shadow DOM, so your site\'s styles and the widget\'s never leak into each other. Comment bodies render as text nodes only — XSS-safe by construction — and the whole system is one Express process and one SQLite file you back up by copying it. MIT source.',
  },
  {
    slug: 'disqus-alternative', competitor: 'Disqus', product: 'chatterbox',
    metaDesc: 'Disqus is free because your readers are the product — ads and trackers next to your writing, or $12+/month to remove them. Chatterbox is $24 once, self-hosted, no ads ever.',
    intro: [
      'Disqus is the default comment system of the internet — installed on millions of sites, familiar to every reader, with network-wide accounts, social login and moderation tools that have handled comment sections at enormous scale for over a decade. For getting comments running in five minutes in 2012, it was the obvious choice, and inertia has carried it since.',
      'The catch is the business model. Disqus\'s free tier is advertising-supported: promoted content appears around your comment section, and the embed brings third-party tracking of your readers with it. Removing the ads costs $12/month (Plus), and the Pro tier is $95/month — $432 to $3,420 over three years. Chatterbox is the exit ramp: $24 once, self-hosted, with a Disqus importer that carries your whole comment history out with you.',
    ],
    good: {
      lead: 'Credit where due — Disqus solved real problems:',
      items: [
        'Effortless setup with universal familiarity — readers already have accounts.',
        'Network effects: social login, cross-site identity, notifications that pull commenters back.',
        'Moderation tooling and spam filtering proven at massive scale.',
        'A free tier that, ads aside, genuinely works for getting comments live in minutes.',
      ],
      after: 'If comment volume is huge and moderation staffing is your bottleneck, Disqus\'s mature tooling still counts for something.',
    },
    hurts: [
      'On the free tier, the product is your audience. Disqus injects sponsored content into your comment section — ads you did not choose, next to writing you sweated over — and the embed loads trackers that follow your readers across the Disqus network. Disqus has been documented sharing user data with dozens of third parties, and in 2021 was fined ~$3M by Norway\'s data protection authority over unlawful tracking. That is the price of "free," and your readers pay it. Making it stop costs $12/month, forever — $432 over three years just to remove ads from your own site.',
      'The embed is also heavy — Disqus can add megabytes of JavaScript and dozens of requests to an otherwise fast page — and your community\'s decade of comments lives on their servers under their terms. Export exists, but the gravitational pull of "it is all over there" is exactly how a free widget becomes a $95/month line item.',
    ],
    stay: [
      'Stay with Disqus if cross-site reader identity genuinely drives your engagement, or if you moderate at a scale where their tooling and spam infrastructure earn their keep. Stay too if you cannot host anything — Chatterbox needs a $5 VPS for the embed to be publicly reachable.',
      'Switch if the ads and tracking were never the deal you meant to make with your readers. Chatterbox imports your Disqus XML export — dry-run the counts first, commit when happy, idempotent so re-running never double-imports — and from then on your comments are threaded, voted, moderated and stored in one SQLite file you own.',
    ],
    meetExtra: 'Chatterbox is privacy-first by construction: no ads ever, no third-party requests, IPs salted-hashed before they touch disk, and spam defenses (honeypot, time-to-submit, per-IP rate limits, link thresholds) that stay invisible to humans. The ~15KB shadow-DOM widget will not fight your page speed the way a Disqus embed does. $24 once, MIT source, your readers stay yours.',
  },
  {
    slug: 'expensify-alternative', competitor: 'Expensify', product: 'ledgerly',
    metaDesc: 'Expensify charges per user per month and your receipts live in their cloud. Ledgerly does expense tracking with local OCR for $29 once. Honest comparison.',
    intro: [
      'Expensify made expense reports almost painless. SmartScan a receipt, watch the details fill themselves in, submit for one-click approval — and on the corporate side, company cards, mileage tracking, reimbursements and accounting sync make it a genuine finance platform. For companies processing employee expense reports at volume, it does real work.',
      'For a freelancer or small business owner, though, it is a per-user monthly meter — around $5/user/month on the paid plans, $180+ over three years for a solo user, more per seat forever — and every receipt you photograph uploads to their cloud. Receipts routinely show card digits, home addresses and personal spending patterns. Ledgerly is a $29 pay-once tracker whose OCR runs entirely on your own machine: no subscription, and no receipt ever leaves your disk.',
    ],
    good: {
      lead: 'Expensify remains genuinely good at its actual job:',
      items: [
        'SmartScan — mature, accurate receipt OCR with a decade of training behind it.',
        'The full corporate workflow: submit, approve, reimburse, sync to QuickBooks/Xero/NetSuite.',
        'The Expensify Card and per-diem, mileage and travel integrations.',
        'Multi-employee policy controls that finance teams actually need.',
      ],
      after: 'If you run expense reports across a real team with approval chains and reimbursements, Expensify is built for exactly that.',
    },
    hurts: [
      'The subscription is mistargeted at small users. A solo freelancer pays $60+/year forever for what is, at that scale, data entry with OCR — $180+ over three years against Ledgerly\'s $29 once, and per-seat pricing multiplies it for every person you add. Worse, the relationship is hostage-shaped: cancel, and your years of categorized expense history live behind a login you no longer pay for. Your accountant needs records for seven years; your subscription lasts exactly as long as you keep paying.',
      'And the receipts themselves are the quiet privacy issue. Every SmartScan uploads a photo — often showing partial card numbers, home addresses, medical purchases, personal habits — to a third party\'s cloud, where it is processed by their systems under their policy. Ledgerly\'s OCR is tesseract.js running client-side, in your browser or the desktop app, with the worker, wasm core and language data all served from the app itself: the image is parsed on your CPU and never transmitted anywhere.',
    ],
    stay: [
      'Stay with Expensify if you have employees submitting reports for approval and reimbursement — Ledgerly is a tracker, not an approval workflow, and it has no corporate cards, no mileage capture, no accounting-software sync. Those are real platform features Ledgerly deliberately does not attempt.',
      'Switch if you are the whole finance department: track by category, project and vendor; scan receipts locally; watch category budgets go amber at 80%; export clean CSV for your accountant and a monthly PDF report — $29 once, and your seven years of records sit in a SQLite file nobody can paywall.',
    ],
    meetExtra: 'Ledgerly stores money as integer cents everywhere (no float drift in totals), snapshots the exchange rate on every multi-currency entry so editing a rate never rewrites history, and materializes recurring expenses through a daily sweep with catch-up for missed days. Reports ship with a spend-by-category donut, daily bars and top-vendor tables. One SQLite file plus a receipts folder — back up by copying two things. MIT source.',
  },
];
