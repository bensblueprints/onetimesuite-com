/* Comparison blog post content, part 4 (Statfox, Shipnotes, Hearback, Docwell, Boardly, Timevault, Streakly, Deepdesk, Quillpad, Chatlet) */
module.exports = [
  {
    slug: 'plausible-alternative', competitor: 'Plausible', product: 'statfox',
    metaDesc: 'Plausible costs $9–19/month, tiered by traffic, forever. Statfox is the same privacy-first analytics on your own server for a one-time $49. Honest comparison inside.',
    intro: [
      'Plausible deserves enormous credit. It proved that web analytics could be simple, cookie-free and privacy-respecting — one lightweight script, one clean dashboard, no consent banner — and built a sustainable open-source business doing it. If you left Google Analytics in the last few years, there is a good chance Plausible is where you went.',
      'But Plausible\'s hosted service is a subscription tiered by traffic: $9/month at 10k pageviews, climbing as your sites grow, forever. If you run several sites — or client sites — you are paying rent on a job your own $5 VPS could do. Statfox is a $49 pay-once analytics server built on the same privacy principles. Here is the honest comparison.',
    ],
    good: {
      lead: 'Plausible earns its reputation:',
      items: [
        'Genuinely privacy-first — no cookies, no personal data, EU-hosted, and they pioneered the model.',
        'Fully managed — uptime, scaling, backups and a polished dashboard are somebody else\'s job.',
        'Open source (AGPL) with a self-host option, which keeps the company honest.',
        'Mature extras — funnels, goals, ecommerce revenue and a stats API on current plans.',
      ],
      after: 'If you want zero-ops analytics and the traffic tiers fit your budget, Plausible is a genuinely good citizen of the web.',
    },
    hurts: [
      'The subscription math compounds with success. $9/month covers 10k pageviews; grow past a tier boundary and the bill steps up — $19, $39, onward — every month, forever. Three years at the Growth tier is roughly $684. And the price is per account, not per lifetime: stop paying and the dashboard, the history, the share links all go dark. Plausible\'s self-hosted Community Edition exists, but it is a heavier Elixir + ClickHouse stack that they understandably de-prioritize versus the paid cloud.',
      'There is also the multiplication problem. Agencies and indie hackers rarely run one site — they run ten. Traffic-tiered pricing means your analytics bill scales with exactly the thing you are trying to grow, while the actual server work involved (receiving tiny POST requests, counting rows) is trivial for even the cheapest VPS.',
    ],
    stay: [
      'Stay with Plausible if you want a zero-maintenance managed service, if you need funnels and ecommerce revenue attribution today, or if your organization requires a vendor with an SLA rather than software you run. Those are real things a subscription legitimately buys.',
      'Switch if you are comfortable running one Docker container, you track more than one site, and the numbers you actually check are visitors, sources, pages, countries and UTMs — which is what most people open their analytics for.',
    ],
    meetExtra: 'Statfox tracks unlimited sites from one dashboard with a <2KB cookie-free snippet — visitors, pageviews, bounce rate, duration, grouped referrers, countries, devices, UTMs, custom events and a realtime view, plus tokenized read-only share links for clients. Uniques come from a daily-rotating salted hash, so raw IPs are never stored.',
  },
  {
    slug: 'google-analytics-alternative', competitor: 'Google Analytics', product: 'statfox',
    metaDesc: 'Google Analytics is free — paid for with consent banners, complexity and your visitors\' data. Statfox is $49 once: simple, cookie-free, self-hosted analytics. Honest comparison.',
    intro: [
      'Google Analytics is the default analytics of the internet, and it is genuinely free in the cash sense — no invoice will ever arrive. GA4 can do almost anything: funnels, audiences, ad attribution, BigQuery exports, machine-learning insights across properties with millions of hits.',
      'It is also the tool people most often describe as "47 menus deep", it requires cookie consent banners in much of the world, and its business model is your visitors\' data. Most site owners use roughly none of its power: they want to know how many people came, from where, and what they read. Statfox answers exactly those questions, on your own server, without a consent banner — for $49, once. Here is the honest comparison.',
    ],
    good: {
      lead: 'GA4 is unbeatable at what it is actually for:',
      items: [
        'Free at any scale — no traffic tier will ever bill you.',
        'Deep advertising integration — if you buy Google Ads, GA\'s attribution loop is the native tool.',
        'Serious analysis power — funnels, cohorts, audiences, BigQuery export, custom reports.',
        'The ecosystem default — every tutorial, plugin and marketer already speaks it.',
      ],
      after: 'If you run paid acquisition at scale or genuinely do cohort analysis, GA4 is the correct tool and no $49 app replaces it.',
    },
    hurts: [
      'The costs are just non-monetary. GA4 requires cookie consent in the EU/UK, which means a banner, which measurably costs you real traffic data as visitors decline. Its script weighs ~50KB+ against Statfox\'s <2KB. Several EU data-protection authorities ruled GA transfers unlawful in recent years — an ongoing compliance headache if you serve European visitors. And GA4 itself samples data, defaults to 14-month retention, and buries "how many people visited yesterday" under an interface even professionals complain about.',
      'The deeper issue is alignment: Google gives you analytics free because your visitors\' behavior is valuable to Google. Self-hosting inverts that — the data exists on your server for your eyes, full stop. For a blog, a SaaS marketing site or client sites, that trade plus a one-page dashboard is simply a better daily experience.',
    ],
    stay: [
      'Stay with Google Analytics if you spend meaningfully on Google Ads (the attribution integration alone justifies it), if you need funnels, audiences and BigQuery-grade analysis, or if free-at-any-scale is non-negotiable and consent banners don\'t bother you.',
      'Switch if you check visitors, sources and top pages a few times a week and would happily trade the other 95% of GA4 for a dashboard you can read in ten seconds, a site that loads a 2KB script instead of 50, and no consent banner at all.',
    ],
    meetExtra: 'Statfox is the ten-second dashboard: visitors, pageviews, bounce rate and duration compared to the previous period, with breakdowns for pages, grouped referrers, countries, devices and UTMs, realtime visitors, SPA-aware tracking and custom events — across unlimited sites, from one $49 server you own.',
  },
  {
    slug: 'canny-alternative', competitor: 'Canny', product: 'shipnotes',
    metaDesc: 'Canny charges $79/month for changelog, roadmap and feature voting. Shipnotes does all three self-hosted for a one-time $49 — with no signup wall on votes. Honest comparison.',
    intro: [
      'Canny is the polished standard for user feedback: feature request boards, a public roadmap, a changelog, and prioritization tooling that product teams genuinely rely on. Companies like Ahrefs and ClickUp run their feedback loops on it, and it shows — the product is mature and well-integrated.',
      'It also starts at $79/month. That is $948 a year — every year — to host what is, mechanically, a list of posts, a three-column board and an upvote button. For a bootstrapped SaaS or an agency shipping client products, that price turns "listen to your users" into a luxury. Shipnotes is the same core loop, self-hosted, for $49 once. Here is the honest breakdown.',
    ],
    good: {
      lead: 'Canny is the category leader for good reasons:',
      items: [
        'The full prioritization suite — user segments, revenue-weighted scoring, internal notes and admin workflows.',
        'Deep integrations — Jira, Slack, Intercom, Salesforce, HubSpot; feedback flows in from where your team works.',
        'Identified voters — SSO means you know which customer (and which contract value) wants which feature.',
        'Managed and polished — nothing to host, and the UX is excellent.',
      ],
      after: 'If your product team weighs feature requests by customer revenue inside Salesforce, Canny is genuinely built for you.',
    },
    hurts: [
      'For everyone else, $79/month is a lot of rent. Over three years that is roughly $2,844 to display a changelog and count votes — work a $5 VPS does without noticing. The starter tiers gate exactly the features you eventually want, and the price scales with your team, not your value from it.',
      'Canny also puts voting behind account creation. That is a feature for enterprise (identified voters) and a bug for everyone else: most visitors will not create an account to upvote a feature request, so your vote counts systematically undercount actual demand. A signup wall between your users and "tell us what you want" filters out precisely the casual majority you most need to hear from.',
    ],
    stay: [
      'Stay with Canny if you need identified, segmented voters tied to CRM data, if the Jira/Slack/Intercom integrations are load-bearing for your team, or if nobody in your org can own a small server. Those are the things $948/year legitimately buys.',
      'Switch if what you actually need is a public changelog, a roadmap and honest vote counts. Shipnotes covers that loop entirely, your users vote without creating accounts, and the bill never comes again.',
    ],
    meetExtra: 'Shipnotes gives you a Markdown changelog with New/Improved/Fixed tags and RSS, a Planned / In Progress / Shipped roadmap sorted by votes, anonymous one-vote-per-visitor feature requests with comments, duplicate merging that carries votes over, BYO-SMTP subscriber emails and an embeddable "What\'s new" bell widget — all in one SQLite file on your box.',
  },
  {
    slug: 'headway-alternative', competitor: 'Headway', product: 'shipnotes',
    metaDesc: 'Headway charges monthly for a changelog widget. Shipnotes is a one-time $49 and adds a public roadmap, feature voting and email subscribers — self-hosted. Honest comparison.',
    intro: [
      'Headway does one thing well: a clean hosted changelog with an embeddable widget — the little "What\'s new" badge that tells users you\'re alive and shipping. It is simple to set up, pleasant to write in, and the free tier is enough for a side project.',
      'But the paid tier runs about $29/month for custom branding and privacy, and Headway is only the announcement half of the conversation. Users read what you shipped; they cannot tell you what to ship next. Shipnotes is $49 once and covers both directions — changelog plus roadmap plus feature voting — on your own server. Here is the honest comparison.',
    ],
    good: {
      lead: 'Headway keeps it simple, and simple has value:',
      items: [
        'Setup in minutes — hosted, with a clean editor and a lightweight widget.',
        'A generous free tier for public changelogs with Headway branding.',
        'Team-friendly — multiple authors, scheduled posts, Slack/Twitter integrations.',
        'It does one job and does not sprawl.',
      ],
      after: 'If all you want is a hosted changelog widget and the branding doesn\'t bother you, Headway\'s free tier is honestly fine.',
    },
    hurts: [
      'The moment you want your own branding or a private changelog, you are on the ~$29/month tier — $1,044 over three years for a widget and a feed. That is the recurring toll for something with no ongoing service component beyond static hosting your VPS already does.',
      'The bigger limitation is architectural: Headway is one-way. There is no roadmap board, no feature requests, no voting — no way for the users reading your changelog to close the loop. Teams end up bolting on a second subscription (Canny, upvote boards) to collect the feedback Headway can\'t. Two subscriptions to run one conversation with your users.',
    ],
    stay: [
      'Stay with Headway if you specifically want a zero-maintenance hosted changelog, you are happy inside the free tier, or your team needs multi-author scheduling workflows today.',
      'Switch if you want the whole loop — announce, collect, vote, prioritize — in one self-hosted app with no monthly fee, and you can spare ten minutes for a Docker deploy.',
    ],
    meetExtra: 'Shipnotes is the two-way version of a changelog: Markdown posts with tags, RSS and email subscribers on the announce side; a public roadmap and anonymous one-vote-per-visitor feature requests with comment threads and duplicate merging on the listen side; plus the same embeddable "What\'s new" bell widget — one script tag, unread badge included.',
  },
  {
    slug: 'hotjar-alternative', competitor: 'Hotjar', product: 'hearback',
    metaDesc: 'Hotjar charges $32/month for surveys with a 500-response cap. Hearback is a self-hosted feedback + NPS widget for $29 once, unlimited responses. Honest comparison.',
    intro: [
      'Hotjar built the category of "watch what your users actually do": heatmaps, session recordings, and later surveys and feedback widgets. It is a genuinely useful suite, and for UX teams the recordings alone can justify the invoice.',
      'But if what you actually use is the feedback button and the occasional NPS survey — which is where a large share of Hotjar accounts quietly end up — you are paying $32/month with a 500-response cap for a form and a dashboard. Hearback does the feedback half for $29, once, on your own server, with no response caps. Here is the honest breakdown.',
    ],
    good: {
      lead: 'Hotjar\'s suite is real and broad:',
      items: [
        'Session recordings and heatmaps — the visual "why is nobody clicking this" evidence nothing else provides.',
        'Funnels and frustration signals (rage clicks, u-turns) on higher tiers.',
        'Mature survey tooling with templates, targeting rules and integrations.',
        'Fully hosted, GDPR-conscious, and familiar to every UX researcher you\'ll ever hire.',
      ],
      after: 'If session replays and heatmaps drive your design decisions, Hotjar is the right tool and Hearback does not pretend to replace that half.',
    },
    hurts: [
      'The pricing works like a ratchet: surveys and feedback live on a plan that starts around $32/month and caps responses at 500/month — go over during a launch week and you either lose data or upgrade. Three years of that is roughly $1,152, for form submissions that are a few kilobytes each in a database.',
      'Hotjar is also a third-party script on your site — one more consent-banner entry, one more vendor holding your users\' verbatims, and one more tool that cannot run on intranets, staging environments behind VPNs, or products in privacy-sensitive industries. First-party feedback has none of those problems: same-origin script, your database, done.',
    ],
    stay: [
      'Stay with Hotjar if you need session recordings, heatmaps or frustration analytics — that is Hotjar\'s actual moat and Hearback deliberately does not attempt it. Stay too if you rely on its survey targeting rules (specific pages, user attributes, event triggers) beyond a frequency cap.',
      'Switch if your real usage is a feedback widget and NPS — collect, triage, trend, export. That is a $29-once job, and unlimited responses means launch weeks stop being billing events.',
    ],
    meetExtra: 'Hearback drops in with one script tag in a shadow DOM: an emoji-rated feedback form with Issue/Idea/Praise categories, classic 0–10 NPS with frequency capping enforced server-side, auto-captured page/browser context, an inbox with filters and a new → in progress → resolved workflow, an NPS trend dashboard, BYO-SMTP alerts and one-click CSV export.',
  },
  {
    slug: 'gitbook-alternative', competitor: 'GitBook', product: 'docwell',
    metaDesc: 'GitBook Premium runs $79/site/month for a hosted docs site. Docwell is a self-hosted help center — markdown, instant search, full SEO — for $29 once. Honest comparison.',
    intro: [
      'GitBook is what many teams reach for when "we need docs" becomes urgent: a polished hosted platform where markdown becomes a searchable, versioned documentation site, with git sync for engineering teams and an editor non-engineers can actually use.',
      'Then the pricing page: the free tier is for open source, and the tiers that businesses actually need climb to roughly $79 per site per month. That is $948 a year, per docs site, to host rendered markdown. Docwell is a self-hosted help center that does the customer-docs job for $29 once. Here is the honest comparison.',
    ],
    good: {
      lead: 'GitBook is genuinely strong:',
      items: [
        'Git sync — docs live in your repo, PRs update the site; engineers never leave their workflow.',
        'Real collaboration — branches, change requests, review flows and multi-author editing.',
        'Handsome output with versioning, spaces and multi-language support.',
        'Zero hosting responsibility, with search and performance handled for you.',
      ],
      after: 'If your docs are maintained like code by a team of engineers — branches, reviews, versions — GitBook is built precisely for that.',
    },
    hurts: [
      'The per-site subscription is brutal for small teams: $79/month × one product = $2,844 over three years, and a second product doubles it. Branding control and "remove GitBook badge" historically sit on paid tiers, so the cheap plans advertise their platform on your help center.',
      'For a customer-facing help center — as opposed to developer API docs — most of GitBook\'s power sits unused. You do not need branches and change requests to maintain 60 support articles; you need fast search, clean SEO, a way to see which articles fail, and an editor that stays out of the way. Renting a git-workflow platform for that is the wrong shape of tool.',
    ],
    stay: [
      'Stay with GitBook if your docs are engineering-owned and git-synced, if you need versioned docs per release, multi-language localization or change-request review flows. Docwell has none of those, on purpose.',
      'Switch if what you are really running is a product help center: articles, categories, search, "was this helpful?", SEO. That job needs a $29 tool and a $5 VPS, not a $948/year platform.',
    ],
    meetExtra: 'Docwell renders a branded, server-side help center with instant FTS5 search-as-you-type, auto TOCs, prev/next and related articles, one-vote-per-visitor helpful votes with a worst-articles-first feedback report, and complete SEO plumbing — sitemap.xml, OG tags, canonicals, smart 404s. Writing happens in a split-pane markdown editor with paste-to-upload images and a draft workflow.',
  },
  {
    slug: 'helpscout-docs-alternative', competitor: 'HelpScout Docs', product: 'docwell',
    metaDesc: 'HelpScout Docs comes bundled at $22+/user/month. If you just need a knowledge base, Docwell is $29 once, self-hosted, with search and vote analytics. Honest comparison.',
    intro: [
      'Help Scout is a genuinely pleasant help desk, and Docs is its knowledge-base module: clean article editor, collections, a tidy customer-facing site, and — its best trick — Beacon, which floats docs suggestions inside your product and deflects tickets before they reach your inbox.',
      'The catch is the bundle. Docs is not sold alone; it comes with Help Scout\'s per-seat pricing, which starts around $22/user/month and climbs on the plans most teams actually use. If you want the knowledge base but not (or no longer) the seats, you are paying help-desk prices for a docs site. Docwell is the docs half, self-hosted, for $29 once. The honest comparison follows.',
    ],
    good: {
      lead: 'Help Scout earns its fans:',
      items: [
        'Beacon — in-app docs suggestions that measurably deflect support tickets.',
        'Docs and inbox in one place: turn a good answer into an article without switching tools.',
        'Genuinely humane, well-designed software with strong support culture.',
        'Reporting ties article performance to actual support outcomes.',
      ],
      after: 'If your team lives in Help Scout\'s shared inbox anyway, Docs comes along naturally and the integration is real value.',
    },
    hurts: [
      'Per-seat bundling is the wrong pricing shape for a knowledge base. A 5-person support team pays $110+/month — $3,960+ over three years — and the docs site is inseparable from those seats. Leave Help Scout\'s inbox and your knowledge base leaves with it: content, URLs, search rankings, all tied to a subscription decided by different criteria.',
      'A knowledge base is also the most SEO-sensitive property a small product owns — those articles are long-tail search landing pages. Hosting them on a vendor subdomain-or-CNAME with limited control, behind a paywall for branding customization, undervalues an asset you will want to own for a decade.',
    ],
    stay: [
      'Stay with Help Scout if your team runs its shared inbox — the Docs integration and Beacon deflection genuinely multiply each other, and unbundling would cost you real workflow value.',
      'Switch if you are choosing a knowledge base on its own merits, or if you are keeping Help Scout for tickets but want docs you own: Docwell\'s articles live on your domain, in your SQLite file, findable by Google and immune to seat-count decisions.',
    ],
    meetExtra: 'Docwell is the standalone knowledge base done right: collections → categories → articles in markdown with live preview, instant FTS5 search, helpful votes with a worst-first feedback report (the closest thing to Beacon\'s "which articles fail" insight), and SEO-complete server-rendered pages — sitemap, OG tags, canonicals — on a domain you control forever.',
  },
  {
    slug: 'trello-alternative', competitor: 'Trello', product: 'boardly',
    metaDesc: 'Trello costs $5/user/month — $1,800 for a 10-person team over 3 years. Boardly is a self-hosted kanban for $19 once, unlimited boards. Honest comparison inside.',
    intro: [
      'Trello made kanban mainstream. Lists, cards, drag and drop — it is still one of the most intuitive pieces of software ever shipped, which is why hundreds of millions of accounts exist and why "just make a Trello board" is a sentence everyone understands.',
      'It is also an Atlassian subscription now: $5/user/month on Standard, more on Premium, with the free tier progressively tightened (10-board cap per workspace, attachment limits). A 10-person team pays $600 a year for lists with cards on them. Boardly is the same workflow, self-hosted, for $19 once. Here is the honest comparison.',
    ],
    good: {
      lead: 'Trello is still excellent at being Trello:',
      items: [
        'The smoothest kanban UX in the business, on every platform — web, iOS, Android, desktop.',
        'Butler automations — rules, scheduled commands and buttons that genuinely save clicks.',
        'Power-Ups and integrations with essentially everything.',
        'Real multi-user features: per-member assignment, notifications, permissions, workspaces.',
      ],
      after: 'If your team runs on assignments, automations and mobile apps, Trello\'s subscription buys real infrastructure.',
    },
    hurts: [
      'The per-user meter is the sting: kanban is one of the least server-intensive workloads imaginable — a few kilobytes of JSON per card — yet a 10-person team pays $1,800 over three years. Every new hire raises the bill; every plan review pressures the board count. Meanwhile the free tier that made Trello beloved keeps shrinking: 10 boards per workspace, plan-gated exports, file-size caps.',
      'And your boards live in Atlassian\'s cloud, in Atlassian\'s format, with JSON export gated by plan. Years of project history — decisions, checklists, attachments — sit behind a subscription and a terms-of-service you do not control. For internal tooling, that is a dependency you never needed to take.',
    ],
    stay: [
      'Stay with Trello if you need per-member assignment and notifications, Butler automations, or the mobile apps — Boardly has none of those, and for a distributed team juggling phones, they matter. Trello\'s free tier also remains fine for one small personal board.',
      'Switch if your boards are used by you, a small trusted team, or an agency organizing internal work — and what you actually do is drag cards, tick checklists and attach files. That job does not need a per-seat meter.',
    ],
    meetExtra: 'Boardly covers the workflow that made Trello famous: unlimited boards with themes and starred favorites, drag-and-drop lists and cards with exact order persistence, markdown cards with due dates and overdue highlighting, checklists with progress bars, labels, local file attachments, comments with an activity log, filters and search — plus a full-fidelity JSON export (attachments included) Trello would gate behind a plan.',
  },
  {
    slug: 'toggl-alternative', competitor: 'Toggl', product: 'timevault',
    metaDesc: 'Toggl Track costs $10/user/month, forever, to store your timers. Timevault is self-hosted time tracking with rates and billable reports for $29 once. Honest comparison.',
    intro: [
      'Toggl Track is the reference product for time tracking: a friction-free timer, apps on every platform, idle detection, calendar integration, and reporting polished by a decade of iteration. Freelancers love it because it disappears into the workflow; agencies love the team dashboards.',
      'Then the invoice: $10 per user per month on Starter, $18 on Premium, forever. A freelancer pays $360 over three years to remember when they worked. And billing-critical features like billable rates and time rounding sit on the paid tiers. Timevault is a $29 pay-once tracker built specifically for people who bill clients. Here is the honest comparison.',
    ],
    good: {
      lead: 'Toggl is the category benchmark for a reason:',
      items: [
        'Apps everywhere — browser extension, desktop, mobile — with one-click timers that sync seamlessly.',
        'Idle detection and Pomodoro reminders that rescue forgotten timers.',
        '100+ integrations: start a timer from Jira, Asana, GitHub, your calendar.',
        'Mature team features — approval workflows, team dashboards, project estimates.',
      ],
      after: 'If you track from three devices a day or manage a team\'s hours, Toggl\'s subscription buys real, ongoing infrastructure.',
    },
    hurts: [
      'For a solo freelancer, the math is upside down. $10/month — $120/year, $360 over three years — for storing timestamps and multiplying by an hourly rate. The features that turn tracked time into an invoice (billable rates, rounding) are exactly the ones gated to paid tiers, so the free tier is a demo for anyone who bills.',
      'Your hours also live in Toggl\'s cloud. Time data is commercially sensitive — it is literally a record of what you worked on for whom — and it is another account, another export format, another subscription to maintain for the decade your business runs. The actual computation involved is something SQLite does in microseconds.',
    ],
    stay: [
      'Stay with Toggl if you need mobile tracking, idle detection or calendar integrations — Timevault has no phone app, and if you track on the move that is decisive. Stay too if you manage a team with approvals and shared dashboards; Timevault is single-workspace by design.',
      'Switch if you work at a computer and bill clients: Timevault\'s timer survives browser restarts because it is server state, rates and rounding are included rather than tier-gated, and the report for a billing period reads out the exact invoiceable amount.',
    ],
    meetExtra: 'Timevault is built around the invoice: one-click timers with projects, clients, tags and hourly rates; manual entries in any format ("1:30", "90m"); an inline-editable weekly timesheet; reports grouped by project/client/tag/day with exact billable totals; law-firm-style 5/15-minute rounding applied only at report level; overlap detection so double-booked hours never reach a client; and CSV export plus a printable summary.',
  },
  {
    slug: 'clockify-alternative', competitor: 'Clockify', product: 'timevault',
    metaDesc: 'Clockify\'s free tier is generous — but rates, rounding and the reports billers need sit on $4.99–14.99/user/month tiers. Timevault is $29 once. Honest comparison.',
    intro: [
      'Clockify\'s pitch is disarming: free time tracking for unlimited users, unlimited projects, forever. And it is real — as freemium goes, Clockify is one of the most generous products in software, which is why millions of teams start there.',
      'The business model is the upsell path: the features that turn time tracking into billing — required fields, rounding, labor rates vs billable rates, invoicing, approval — spread across Basic ($4.99), Standard ($6.99), Pro ($9.99) and Enterprise ($14.99) per user per month. Freelancers who bill tend to end up paying after all. Timevault is $29 once, with the billing features in the box. Here is the honest breakdown.',
    ],
    good: {
      lead: 'Clockify\'s free tier deserves its reputation:',
      items: [
        'Genuinely free unlimited tracking — users, projects and reports without a card on file.',
        'Apps for web, desktop and mobile, plus a browser extension.',
        'Kiosk mode, timesheets and team features that small companies use daily.',
        'A fair upgrade path — each paid tier is cheaper than most competitors\' equivalents.',
      ],
      after: 'If free-forever basic tracking is all you need, Clockify is honestly hard to argue against — keep it.',
    },
    hurts: [
      'The friction appears the day you bill: time rounding lives on paid tiers, invoicing on Standard and up, and rate management deepens tier by tier. A freelancer on Standard pays ~$84/year — $252 over three years — and a small studio multiplies that by headcount. The free tier tracks time; the paid tiers are where it becomes money.',
      'Clockify is also cloud-only: your hours, clients and rates live on their servers, rate-limited by their API, exportable in their formats. Nothing sinister — but for data this simple and this private, "someone else\'s computer plus a monthly fee per person" is a lot of structure for arithmetic your own machine could do.',
    ],
    stay: [
      'Stay with Clockify if the free tier covers you — genuinely, it covers a lot — or if you need mobile apps, kiosk mode, or team management across many employees. Timevault is single-workspace and desktop/browser only.',
      'Switch if you are a freelancer or small studio that bills: Timevault includes the rates, rounding and billable reporting Clockify meters out across tiers, keeps your client data in a SQLite file you own, and costs less than five months of one Standard seat.',
    ],
    meetExtra: 'Timevault ships the billing tier as the only tier: hourly rates per project, billable flags, report-level 5/15-minute rounding that never mutates raw entries, overlap warnings, weekly timesheet editing, grouped reports with exact invoiceable totals, CSV export and printable client statements — with a timer that runs as server state and survives anything short of a power cut.',
  },
  {
    slug: 'habitify-alternative', competitor: 'Habitify', product: 'streakly',
    metaDesc: 'Habitify charges $5/month forever to store your checkmarks in their cloud. Streakly is a $15-once desktop habit tracker with a fairer streak engine. Honest comparison.',
    intro: [
      'Habitify is one of the better habit trackers on the market: clean design, apps on every platform, flexible schedules, and the pleasant data-nerd extras — time-of-day filters, mood notes, streak stats — that make daily check-ins feel rewarding.',
      'It is also a subscription for what is, underneath, a list of dates with checkmarks. Premium runs about $5/month or a larger one-time unlock, your data lives in their cloud behind an account, and the app phones home through the usual analytics SDKs. Streakly is a $15-once desktop tracker with no cloud at all. Here is the honest comparison.',
    ],
    good: {
      lead: 'Habitify gets the daily experience right:',
      items: [
        'True multi-platform — iOS, Android, web, macOS — with instant sync between them.',
        'Flexible scheduling: daily, weekly quotas, time-of-day sections and reminders.',
        'Motivating stats, streaks and mood tracking with a polished UI.',
        'A working free tier if you track only a few habits.',
      ],
      after: 'If checking habits off on your phone throughout the day is the whole point for you, Habitify is genuinely good at that.',
    },
    hurts: [
      'The subscription shape is the problem: $5/month is $180 over three years for storing checkmarks — and habits are precisely the long-horizon data you want to keep for a decade, which makes rent-forever the worst possible pricing model for it. Stop paying and features fall away; the streaks you built live in an account you are leasing.',
      'There is also a privacy dimension people rarely consider: a habit tracker knows when you sleep, whether you exercised, what you are trying to quit. That is intimate data to keep in anyone\'s cloud, attached to your identity, in an app carrying analytics SDKs. A tracker with zero network calls makes the entire question moot.',
    ],
    stay: [
      'Stay with Habitify if phone-first tracking with cross-device sync is essential — Streakly is a desktop app with no mobile client, and if your check-ins happen at the gym or on the bus, that decides it.',
      'Switch if you live at a computer, want your history in a file you own, and are tired of streak engines that break a weekday-only habit over a weekend. Streakly\'s engine is fair by design, and your entire history is one human-readable JSON file.',
    ],
    meetExtra: 'Streakly\'s streak engine survives real life: weekday-only habits skip weekends without breaking, N-per-week habits count weekly quotas across boundaries, vacation mode freezes streaks, and an unfinished today never kills a streak early. Around it: numeric goals with partial counts, GitHub-style year heatmaps, native reminders, per-day notes, drag-to-reorder, and one-click JSON + CSV export of everything.',
  },
  {
    slug: 'centered-alternative', competitor: 'Centered', product: 'deepdesk',
    metaDesc: 'Focus apps like Centered charge ~$10/month for timers, tasks and flow music. Deepdesk is a $15-once local deep-work dashboard. Honest comparison inside.',
    intro: [
      'Centered (and neighbors like Session) sell a compelling promise: structured deep work. A timer, your task list, flow music, gentle coaching nudges, and stats that gamify staying on task. For people fighting a noisy calendar, that structure genuinely helps.',
      'The structure arrives as a subscription — roughly $10/month for Centered, $5/month for Session — and as a cloud service with an account, for an activity that is fundamentally local: you, a timer, and the next 25 minutes. Deepdesk packages the whole loop as a $15-once desktop app with no account at all. Here is the honest comparison.',
    ],
    good: {
      lead: 'The subscription focus apps do bring real things:',
      items: [
        'Flow music — licensed, purpose-composed focus tracks streamed to you (Centered).',
        'Coach nudges and social accountability features like group flow sessions.',
        'Calendar integration that plans your focus blocks around meetings.',
        'Polished cross-device experiences with cloud-synced stats.',
      ],
      after: 'If licensed focus music and social accountability keep you honest, that ongoing service is what the monthly fee legitimately pays for.',
    },
    hurts: [
      'But strip the streaming and the coaching, and what remains — timer, intents, tasks, ambient sound, stats — has no ongoing cost to anyone. $10/month is $240 over two years for a Pomodoro clock and a progress chart. Focus-app startups also have a way of pivoting or shutting down (the category is littered with sunsets), and a cloud-tied focus history vanishes with the vendor.',
      'There is a quieter irony too: a deep-work tool that requires an account, syncs to a cloud and streams audio is itself a network dependency. Wi-Fi hiccup, service outage, login prompt — each one is exactly the interruption the app was supposed to prevent.',
    ],
    stay: [
      'Stay with Centered or Session if their streamed flow music genuinely carries your focus, if group sessions and coach nudges are what keep you accountable, or if calendar-aware planning of focus blocks matters to your day.',
      'Switch if what you actually use is the timer, the intent prompt and the stats. Deepdesk does that loop offline, forever, with ambient noise synthesized on your CPU instead of streamed — and it cannot be discontinued out from under you.',
    ],
    meetExtra: 'Deepdesk runs the full deep-work loop locally: a tick-driven Pomodoro engine where paused time can never leak into a session, "what are you working on?" intents logged per session, tasks with pomodoro tallies, a frameless always-on-top mini timer with a progress ring, white/pink/brown noise and procedural rain generated mathematically in real time, and a dashboard of focus minutes, streaks and a 30-day chart — all persisted as plain JSON on your disk.',
  },
  {
    slug: 'notion-alternative', competitor: 'Notion', product: 'quillpad',
    metaDesc: 'Notion costs $12/month per seat and keeps your notes in their cloud, their format. Quillpad is $29 once — local markdown files you own. Honest comparison inside.',
    intro: [
      'Notion is the everything-workspace: notes, wikis, databases, kanbans, calendars, now AI — assembled from blocks into whatever your team can imagine. It is genuinely brilliant software, and for collaborative team wikis and structured databases it has no equal at its price.',
      'But a huge share of Notion users are not running team databases. They are writing notes — meeting notes, ideas, journals, drafts — into a cloud app that costs $12/month per seat, requires an account and a connection, stores everything in a proprietary block format, and gets slower as pages accumulate. For those users, Quillpad makes a different bet: your notes as plain markdown files, in your folder, for $29 once. Here is the honest comparison.',
    ],
    good: {
      lead: 'Notion\'s strengths are real and substantial:',
      items: [
        'Databases — relational tables with views, filters, rollups and formulas that non-programmers can build.',
        'Team collaboration: shared workspaces, comments, permissions, real-time editing.',
        'Infinite flexibility — wikis, trackers, CRMs and dashboards from the same blocks.',
        'A capable free personal tier, plus Notion AI if that\'s your thing.',
      ],
      after: 'If your team runs on shared databases and collaborative pages, Notion is the correct tool and a files-based app will not replace it.',
    },
    hurts: [
      'The costs are lock-in shaped. Your notes live in Notion\'s cloud, in Notion\'s block format — the export is a lossy pile of markdown and CSVs that no other tool fully reconstructs. Offline support is partial and famously temperamental. And the meter runs per seat, per month: $432 over three years for one person, more when AI is toggled on. You are renting access to your own thinking.',
      'Speed is the quieter tax. Notion pages load from a server; a fast local editor opens in milliseconds. Multiplied across every "let me just note this down" moment for years, the difference between instant and almost-instant is the difference between a tool you trust reflexively and one you hesitate over.',
    ],
    stay: [
      'Stay with Notion for anything genuinely collaborative or database-shaped: team wikis, project trackers, shared roadmaps, structured data with views and formulas. Quillpad has no tables, no sharing, no permissions — it is deliberately not that.',
      'Switch for the personal layer: notes, journals, drafts, a knowledge base. Plain markdown files with wikilinks and backlinks give you the linked-thinking experience with zero lock-in — the "export" step simply does not exist, because your notes are already files.',
    ],
    meetExtra: 'Quillpad points at any folder and treats it as truth: real .md files edited in a CodeMirror 6 live-styled editor, [[wikilinks]] with fuzzy autocomplete, a backlinks panel with context lines, #tags, instant full-text search, Ctrl+P quick switching, Ctrl+D daily notes and a global Ctrl+Shift+N quick capture that appends to inbox.md from anywhere in Windows. The app watches the disk, so edits from any other tool appear live.',
  },
  {
    slug: 'obsidian-sync-alternative', competitor: 'Obsidian Sync', product: 'quillpad',
    metaDesc: 'Obsidian is free but Sync costs $4–8/month forever. Quillpad is $29 once — local markdown notes with wikilinks and backlinks, synced however you like. Honest comparison.',
    intro: [
      'Obsidian got the most important thing right: your notes are local markdown files, and the app is free. Its plugin ecosystem is extraordinary, its community devoted, and its graph view iconic. If you are deep into Obsidian with twenty plugins, this post will not move you — nor should it.',
      'But the business model lives in the add-ons: Obsidian Sync runs $4–8/month forever, commercial use requires a license, and the out-of-box experience buries beginners under a plugin ecosystem that is half the appeal and half the maintenance burden. Quillpad is a $29-once app covering the core linked-notes workflow with zero configuration — and, like Obsidian, your files are yours to sync any way you like. An honest comparison between neighbors.',
    ],
    good: {
      lead: 'Obsidian is the gold standard for local-first notes:',
      items: [
        'Free core app on every platform, including genuinely good mobile apps.',
        'The plugin ecosystem — a thousand community plugins covering every conceivable workflow.',
        'Graph view, canvas, and power features (Dataview, templater) with no equal.',
        'Obsidian Sync itself is well-built: end-to-end encrypted, version history, selective sync.',
      ],
      after: 'If you want a customizable second brain and enjoy tinkering, Obsidian plus its community is the deepest option there is.',
    },
    hurts: [
      'The recurring cost is Sync: $4–8/month, forever, to move markdown files between machines — $144–288 over three years for a transport job that Dropbox, Drive, iCloud, Syncthing or git will do free with the same files. It is excellent, convenient, encrypted — and still rent on a commodity.',
      'The other cost is configuration. Vanilla Obsidian is spartan by design; the magic arrives after you research, install and maintain plugins — which update, conflict and occasionally break your vault workflow. For people who want linked markdown notes without adopting a hobby, the setup itself is the price.',
    ],
    stay: [
      'Stay with Obsidian if you use its plugins, graph, canvas or mobile apps — and honestly, stay with Obsidian Sync if end-to-end encrypted mobile sync with version history matters and $4/month is fine. It is a fair product from a company with good values.',
      'Consider Quillpad if you want the core loop — live markdown editing, wikilinks, backlinks, tags, daily notes, quick capture — working perfectly in the first sixty seconds, with no plugin curation, and you would rather pay $29 once than configure your way there. The files are identical: you can even point both apps at the same vault.',
    ],
    meetExtra: 'Quillpad is the zero-config take on the same philosophy: your vault is any folder of real .md files, with a live-styled CodeMirror 6 editor, [[wikilink]] autocomplete with aliases, a backlinks panel with context, #tags, instant search, quick switcher, daily notes and a global Windows-wide quick-capture hotkey — everything working out of the box, nothing to install, and disk watching so external edits (including from Obsidian) appear live.',
  },
  {
    slug: 'crisp-alternative', competitor: 'Crisp', product: 'chatlet',
    metaDesc: 'Crisp\'s team plan is $95/month — $1,140/year for a chat bubble. Chatlet is self-hosted live chat with unlimited agents and sites for $49 once. Honest comparison.',
    intro: [
      'Crisp is one of the best-liked live chat products for small businesses: a slick widget, a genuinely pleasant agent inbox, and a platform that has grown into a shared inbox, a CRM, campaigns and a knowledge base. The free tier gets you two seats and the basics.',
      'The growth path is where it bites: the plans small teams actually settle on run $45–95/month — Crisp Plus at $95/month is $1,140 a year — for what is at its core a WebSocket, a widget and an inbox. Chatlet is that core, self-hosted, with unlimited agents and unlimited sites, for $49 once. Here is the honest comparison.',
    ],
    good: {
      lead: 'Crisp earns its popularity:',
      items: [
        'A polished all-in-one: shared inbox, CRM, email campaigns, knowledge base and chatbots on higher plans.',
        'Excellent native mobile apps — answer chats from anywhere.',
        'MagicBrowse co-browsing and video calls on the Unlimited tier.',
        'A genuinely usable free tier for two agents.',
      ],
      after: 'If you want chat plus CRM plus campaigns in one hosted suite with mobile apps, Crisp is very good at being that suite.',
    },
    hurts: [
      'The pricing is a ratchet by design: the free tier hooks you, the features you soon want (triggers, canned responses depth, integrations, more seats) live up the ladder, and by the time chat matters to your business you are at $95/month per workspace. Three years of Plus is roughly $3,420 — for infrastructure that idles at a few kilobytes per conversation.',
      'Every conversation also flows through Crisp\'s servers — your customers\' emails, their questions, your answers — governed by a vendor agreement rather than your own disk. And per-workspace pricing punishes exactly the people this suite targets: agencies and builders running chat on several sites pay the toll per property.',
    ],
    stay: [
      'Stay with Crisp if you need native mobile agent apps, chatbots, co-browsing, or the integrated CRM-and-campaigns suite — Chatlet does none of those. If your support team lives on their phones, Crisp\'s apps alone may settle it.',
      'Switch if what you actually need is the chat bubble, a solid agent dashboard and your data on your own box — especially if you run multiple sites. One Chatlet install powers all of them, with as many agents as you like, and the bill never repeats.',
    ],
    meetExtra: 'Chatlet covers the live-chat core properly: a ~9 KB shadow-DOM widget that one script tag installs, real-time WebSocket delivery with auto-reconnect and an HTTP-polling fallback for corporate firewalls, an agent dashboard with unread badges and typing indicators both ways, a visitor sidebar showing current page and full history, /shortcut canned responses, offline "leave a message" mode with BYO-SMTP email alerts, per-site embed snippets and downloadable transcripts.',
  },
  {
    slug: 'intercom-alternative', competitor: 'Intercom', product: 'chatlet',
    metaDesc: 'Intercom bills $39+ per seat per month plus usage-based AI fees. If you need live chat rather than a platform, Chatlet is $49 once, self-hosted. Honest comparison.',
    intro: [
      'Intercom invented modern in-app messaging and remains the most complete customer communication platform in the business: live chat, help desk, product tours, outbound campaigns, and now Fin — an AI agent that genuinely resolves a meaningful share of support tickets on its own.',
      'It is also famously, structurally expensive: $39+ per seat per month on the plans that matter, plus usage-based pricing for Fin resolutions, plus add-ons — small teams routinely report bills of several hundred dollars a month. If what your business actually needs is "a human answers chat on our website", you are buying a platform to use a bubble. Chatlet is the bubble, done properly, for $49 once. Here is the honest comparison.',
    ],
    good: {
      lead: 'Intercom is the deepest product in the category:',
      items: [
        'Fin AI agent — genuinely state-of-the-art automated resolution, not a gimmick.',
        'The full platform: help desk, knowledge base, product tours, outbound messages and campaign targeting.',
        'Rich customer profiles with event tracking, segmentation and workflow automation.',
        'Enterprise-grade integrations, reporting and mobile agent apps.',
      ],
      after: 'If support is a funded department and AI deflection at scale moves your unit economics, Intercom is priced against real savings.',
    },
    hurts: [
      'The pricing model compounds three ways: per seat (every agent added is $39–99/month), per usage (Fin bills ~$0.99 per resolution), and per module (tours, campaigns and surveys are add-ons). Teams describe the same arc — start small, watch the bill triple as seats and usage grow, then discover downgrading means losing workflows you built around. Three years for even a two-seat setup lands in the thousands.',
      'For a small SaaS, an agency, or an e-commerce shop, the honest question is: which of those platform features are you using? If the answer is "we answer chats when customers ask questions", then per-seat AI-platform pricing is the wrong shape entirely — you are renting a contact center to run a doorbell.',
    ],
    stay: [
      'Stay with Intercom if Fin\'s automated resolutions demonstrably pay for themselves, if you run genuine outbound campaigns and product tours, or if your support org needs enterprise workflows, SLAs and reporting. Chatlet competes with none of that.',
      'Switch if your support volume is human-scale and your need is human chat: Chatlet gives every agent a seat for free (there are no seats), every site a widget for free (there are no per-site fees), and your customer conversations a home on your own server.',
    ],
    meetExtra: 'Chatlet is deliberately the anti-platform: one small Node server, one SQLite file, a shadow-DOM widget with WebSocket delivery and polling fallback, an agent dashboard with typing indicators, visitor context and canned /shortcuts, offline messages with email notification via your own SMTP, unlimited agents, unlimited sites, transcripts on demand — and a price that never recurs.',
  },
];
