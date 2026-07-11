/* Comparison blog post content, part 2 (Upwatch, Trimly, Billcraft, Bookslot, Formforge) */
module.exports = [
  {
    slug: 'uptimerobot-alternative', competitor: 'UptimeRobot', product: 'upwatch',
    metaDesc: 'UptimeRobot costs $96+/year and caps your monitors. Upwatch is self-hosted uptime monitoring with a branded status page — $39 once, unlimited monitors.',
    intro: [
      'UptimeRobot is the default answer to "how do I know when my site goes down?" — and deservedly so. The free tier (50 monitors at 5-minute intervals) is one of the most generous in SaaS, setup takes ninety seconds, and it checks your sites from multiple locations around the world.',
      'The squeeze starts when you outgrow free: 1-minute intervals, more monitor types, proper status pages and longer log retention all live behind the paid tiers at roughly $8/month and up — $96+/year, forever, with monitor counts still capped. If you run client sites and own even one $5 VPS, there is a pay-once path: Upwatch, $39, unlimited monitors, your own branded status page.',
    ],
    good: {
      lead: 'UptimeRobot has earned its two million users:',
      items: [
        'A genuinely useful free tier — 50 monitors free is unmatched.',
        'Multi-location checking, so one flaky network route does not page you at 3 a.m.',
        'Broad monitor types: HTTP, ping, port, keyword, SSL expiry, cron/heartbeat.',
        'Mature integrations — Slack, PagerDuty, Telegram, SMS and voice calls on paid tiers.',
      ],
      after: 'If you monitor three personal projects and the free tier covers you, honestly: keep it. Free wins.',
    },
    hurts: [
      'The paid math is where agencies feel it. The Solo tier runs about $8/month — $96/year, $480 over five years — and still caps monitors at 50. Monitoring 80 client sites means a higher tier and a forever-growing bill that scales with your success. The polished status pages, longer retention and faster checks are all rungs on the same ladder, and every rung renews annually.',
      'Your monitoring data also lives in their cloud, attached to their account limits. Want a fully branded status page on your own domain with your own retention policy? That is exactly the feature set the pricing ladder is built to sell you, one tier at a time.',
    ],
    stay: [
      'Stay with UptimeRobot if the free tier covers you — do not pay $39 to replace $0. Stay if you need multi-region checking (Upwatch checks from the one box you run it on), ping/port/DNS monitor types, or SMS/voice alerting managed for you.',
      'Switch if you are an agency or indie host paying monthly to watch client sites. One $5 VPS runs Upwatch with unlimited HTTP monitors, 30-second intervals, keyword checks and a clean branded status page for every client — for a flat $39, once.',
    ],
    meetExtra: 'Upwatch was built for the agency case: unlimited HTTP(S) monitors with status-code and keyword assertions, per-monitor uptime stats and incident logs, Slack/Discord-compatible webhooks plus SMTP email on down and recovery, and a classic 90-day-bar public status page at /status.',
  },
  {
    slug: 'pingdom-alternative', competitor: 'Pingdom', product: 'upwatch',
    metaDesc: 'Pingdom starts at $10+/month and climbs with check volume. Upwatch gives you self-hosted uptime monitoring and a public status page for $39 one-time.',
    intro: [
      'Pingdom (now part of SolarWinds) is the enterprise-recognizable name in uptime monitoring. It pioneered the category: synthetic checks from a global probe network, real-user monitoring, transaction checks that log into your app and click through flows, and root-cause traces when things break.',
      'It is priced accordingly — synthetic monitoring starts around $10/month billed annually and scales with check volume, with RUM priced separately. For a SaaS company, that is a rounding error. For a freelancer or small agency watching a few dozen sites with "is it up, and is the checkout page rendering?" — it is a $120+/year subscription for a $39-once problem. That is Upwatch\'s territory.',
    ],
    good: {
      lead: 'Pingdom is a serious tool with serious capabilities:',
      items: [
        'A global probe network — checks from dozens of locations, which catches regional outages self-hosted tools cannot see.',
        'Transaction monitoring — scripted multi-step checks (log in, add to cart, pay).',
        'Real User Monitoring — actual visitor performance data, not just synthetic checks.',
        'Enterprise alerting, escalation policies and SolarWinds ecosystem integration.',
      ],
      after: 'If you have an SLA to prove or a revenue funnel to trace, Pingdom-class tooling is a legitimate line item.',
    },
    hurts: [
      'The pricing model scales against small operators: $10+/month gets a starter bundle of checks, and both check count and RUM pageviews meter upward from there. $120–300+/year, every year, is common for modest setups. Five years in, you have spent $600+ renting something whose core loop — an HTTP GET and a status comparison — your cheapest VPS performs happily.',
      'There is also complexity cost. Pingdom is built for teams with dashboards, escalations and integrations to manage. When your actual requirement is "email or Slack me when a client site dies, and show clients a clean status page," most of what you are paying for goes unused.',
    ],
    stay: [
      'Stay with Pingdom if you need multi-region probes, scripted transaction checks or real-user monitoring — Upwatch does none of those; it checks HTTP from the single location where you run it. For contractual SLAs, that difference matters.',
      'Switch if you are paying enterprise-monitoring money for up/down awareness on client sites. Upwatch gives you 30-second HTTP checks, keyword assertions, incident history, webhook + email alerts and a branded public status page — self-hosted, $39 once.',
    ],
    meetExtra: 'Upwatch runs as one Node process with SQLite — no cron, no Redis, no agents. Desktop mode for watching sites from your own machine, or Docker on a $5 VPS for a 24/7 public status page your clients can bookmark.',
  },
  {
    slug: 'statuscake-alternative', competitor: 'StatusCake', product: 'upwatch',
    metaDesc: 'StatusCake\'s useful features live in paid tiers from ~$20/month. Upwatch is a $39-once self-hosted uptime monitor with unlimited checks and a branded status page.',
    intro: [
      'StatusCake is the cheerful British contender in uptime monitoring: a solid free tier (10 monitors at 5-minute intervals), uptime and SSL checks, page-speed monitoring, domain-expiry warnings, and a personality most infrastructure tools lack.',
      'As with its competitors, though, the free tier is the top of a funnel. One-minute intervals, meaningful monitor counts, SMS alerts and clean status pages live in the Superior plan at roughly $20+/month billed annually — $240+/year, forever. If you would rather own your monitoring than rent it, Upwatch does the core job — HTTP checks, alerts, incidents, a public status page — for $39, once, on hardware you already have.',
    ],
    good: {
      lead: 'StatusCake covers a lot of ground:',
      items: [
        'Uptime, page speed, SSL and domain-expiry monitoring in one dashboard — the domain-expiry check has saved many a forgotten renewal.',
        'A workable free tier for small personal setups.',
        'Multi-location test servers on paid plans.',
        'Straightforward integrations: Slack, Discord, PagerDuty, webhooks.',
      ],
      after: 'For a solo dev with a handful of sites, StatusCake free is a perfectly sensible choice.',
    },
    hurts: [
      'The paid ladder adds up fast: the Superior tier lands around $250/year, and the plans above it climb steeply. Five years of Superior is over $1,200 — to check that web servers return 200. Monitor counts, check intervals and status-page polish are all rationed by tier, so growing your client roster grows your bill by design.',
      'And as with every hosted monitor, your uptime history, incident log and status pages live in their account system. Churn off the subscription and the history goes with it. A self-hosted monitor writes that history into a SQLite file you can back up, query and keep forever.',
    ],
    stay: [
      'Stay with StatusCake if the free tier covers your needs, or if domain-expiry and page-speed monitoring alongside uptime genuinely earn their keep — Upwatch focuses on HTTP(S) uptime and does not do speed or domain checks. Multi-location testing is also theirs, not ours.',
      'Switch if you are on (or being pushed toward) the paid tiers for more monitors, faster intervals or a branded status page. Upwatch has no caps on any of those, because it is your server doing the work.',
    ],
    meetExtra: 'Upwatch keeps 90 days of check history (configurable) in SQLite with automatic pruning, computes uptime over 24h/7d/30d windows, logs every down/recovery transition, and serves a clean public status page with the classic 90-day bars — branded with your name, on your domain.',
  },
  {
    slug: 'bitly-alternative', competitor: 'Bitly', product: 'trimly',
    metaDesc: 'Bitly charges $348/year to use your own domain on short links. Trimly is a self-hosted shortener with QR codes and full analytics for $29 one-time.',
    intro: [
      'Bitly is the brand name of link shortening — so much so that "bitly link" is generic vocabulary. The product has grown into a full "connections platform": short links, QR codes, link-in-bio pages, campaign analytics, and enterprise features used by two-thirds of the Fortune 500.',
      'The pricing has grown with it. The plan that unlocks a custom branded domain — the single feature most businesses actually want — runs about $29/month, $348/year, forever. Link and QR quotas are capped per tier, and every click you have ever earned lives in their database, not yours. Trimly is the pay-once version of the 90% use case: your domain, your clicks, your SQLite file, $29 total.',
    ],
    good: {
      lead: 'Bitly is genuinely strong infrastructure:',
      items: [
        'Rock-solid redirect uptime at global scale — nobody worries about a Bitly link dying under load.',
        'Deep analytics with city-level geo, QR codes and link-in-bio in one platform.',
        'Integrations everywhere: HubSpot, Salesforce, social schedulers, a first-class API.',
        'Enterprise compliance, SSO and account management for big organizations.',
      ],
      after: 'If marketing ops at a 200-person company runs on Bitly campaigns, that subscription is doing real work.',
    },
    hurts: [
      'For everyone smaller, the math is brutal: $348/year for a custom domain, against $29 once for Trimly plus a $5/month VPS you probably already have. Even counting the VPS, year one costs less than three months of Bitly — and years two through forever are nearly free. Bitly\'s free and cheap tiers, meanwhile, keep tightening: link caps, analytics limits, and bit.ly-branded domains that scream "generic marketing blast."',
      'The deeper issue is custody. Your click data — which campaigns work, who your audience is, where they come from — is the asset. On Bitly, it lives on their servers behind their API limits, and links redirect through their infrastructure, with their business model built around link data. Cancel, and your history is theirs to export on their terms.',
    ],
    stay: [
      'Stay with Bitly if you need guaranteed global-scale redirects for viral-volume traffic, city-level analytics, or its ecosystem of native integrations — Trimly is one Node server; if it goes down, your links do too (put Cloudflare in front and treat your VPS well).',
      'Switch if you want branded short links, QR codes and honest analytics for a business, agency or side project. Bulk CSV import means the migration off Bitly is one paste.',
    ],
    meetExtra: 'Trimly gives every link a QR code (PNG + SVG), a UTM builder, per-link 301/302 choice, and analytics covering totals, uniques, referrers, devices, browsers and countries (via Cloudflare\'s free CF-IPCountry header — no paid geo API). All of it in a SQLite file you own.',
  },
  {
    slug: 'rebrandly-alternative', competitor: 'Rebrandly', product: 'trimly',
    metaDesc: 'Rebrandly meters branded links by plan, from $13/month. Trimly is a self-hosted link shortener on your own domain — unlimited links, $29 once.',
    intro: [
      'Rebrandly built its whole identity around one insight: branded links get more clicks than generic ones. It made custom-domain short links its headline feature rather than an upsell, and wrapped them in solid link management — tags, teammates, UTM tooling and an API developers actually like.',
      'But the meter still runs. Paid plans start around $13/month and climb quickly as you add links, clicks tracked, and teammates; serious usage lands in the $32–99/month tiers. Which raises the obvious question: if the domain is yours anyway, why rent the redirect? Trimly puts the shortener itself on your infrastructure — $29 once, unlimited links, unlimited clicks.',
    ],
    good: {
      lead: 'Rebrandly does branded linking well:',
      items: [
        'Custom domains as a first-class feature, with easy DNS setup and SSL handled for you.',
        'Clean link management: tags, folders, teammate roles, link editing.',
        'A well-documented API and 100+ integrations via Zapier and friends.',
        'Sensible analytics with UTM support throughout.',
      ],
      after: 'If a marketing team needs shared link management with roles and zero server admin, Rebrandly is a comfortable home.',
    },
    hurts: [
      'The tiers meter exactly the things you cannot predict: how many links you will create and how many clicks they will get. A campaign that outperforms can push you into the next tier — success is a billing event. At $13–32/month, years one through five cost $156–1,900+, all to redirect HTTP requests from a domain you already own to destinations you already control.',
      'And the click data — the actual product of all this — accumulates in Rebrandly\'s cloud. API rate limits govern your access to your own analytics. If you ever leave, you get an export; what you do not get is the live, queryable history in your own hands.',
    ],
    stay: [
      'Stay with Rebrandly if you need team features — multiple seats, roles, shared folders — or guaranteed managed uptime with zero interest in running a server. Trimly is admin-password single-tenant; it has no teammate roles.',
      'Switch if you are a founder, marketer or agency comfortable with a $5 VPS and Docker. You get unlimited branded links on your own domain, QR codes for every link, and analytics in a SQLite file nobody can rate-limit you out of.',
    ],
    meetExtra: 'Trimly deploys with docker compose in minutes: point go.yourbrand.com at your VPS, put free Cloudflare in front, and you have branded short links with click charts, referrers, devices and countries — plus bulk CSV import to bring your whole Rebrandly library over in one paste.',
  },
  {
    slug: 'short-io-alternative', competitor: 'Short.io', product: 'trimly',
    metaDesc: 'Short.io\'s useful tiers run $19–99/month for branded short links. Trimly is a $29-once self-hosted shortener with QR codes and full click analytics.',
    intro: [
      'Short.io is the quietly capable link shortener — custom domains on every paid plan, link cloaking, geo- and device-targeted redirects, A/B splitting, and a solid API. It is a favorite of affiliate marketers and growth teams who need links that do more than redirect.',
      'Its pricing follows the SaaS ladder: a limited free tier, then roughly $19/month (Personal) to $99/month (Team) as your link counts, clicks and features grow. That is $228–1,188 per year, forever, largely for infrastructure that fits comfortably on the smallest VPS money rents. Trimly is that VPS version: $29 once, no meters.',
    ],
    good: {
      lead: 'Short.io packs in real capability:',
      items: [
        'Geo and device targeting — send iOS users to the App Store and Germans to the .de site from one link.',
        'A/B redirect splitting for landing-page tests.',
        'Custom domains on all paid plans with managed SSL.',
        'A developer-friendly API and browser extensions.',
      ],
      after: 'If conditional redirects are core to your funnel — affiliates, app marketing — Short.io\'s cleverness genuinely earns money.',
    },
    hurts: [
      'The ladder is steep for what most users actually do (create links, count clicks): $19/month tightens quickly on links and click analytics retention, and teams land at $59–99/month. Over three years the Personal tier alone is $684. The free tier, as ever, is a demo with the good parts — meaningful analytics, more links, more domains — held back.',
      'Click data lives in their cloud, retention is plan-dependent, and your redirect layer — the thing between every ad you buy and every landing page you own — is a third party\'s uptime and pricing decisions. That is a lot of strategic surface area to rent monthly.',
    ],
    stay: [
      'Stay with Short.io if you need geo/device targeting or A/B splits — Trimly redirects every visitor to one destination per link, full stop. Those conditional features are Short.io\'s real moat, and if you use them, pay for them happily.',
      'Switch if your links just need to redirect, look branded, carry UTMs and report honest analytics. That is the whole job for most businesses, and it should not cost $228 a year.',
    ],
    meetExtra: 'Trimly covers the everyday shortener completely: custom or auto slugs on your domain, 301/302 per link, editable destinations that keep printed QR codes alive, a built-in UTM builder, CSV import/export, and click analytics (uniques via privacy-friendly daily hashing) stored in your own SQLite file.',
  },
  {
    slug: 'freshbooks-alternative', competitor: 'FreshBooks', product: 'billcraft',
    metaDesc: 'FreshBooks costs $228+/year and caps billable clients on its Lite plan. Billcraft is self-hosted invoicing — unlimited clients, recurring billing, $39 once.',
    intro: [
      'FreshBooks is one of the most pleasant pieces of accounting software ever made for non-accountants. Freelancers love it for a reason: sending a professional invoice takes a minute, expenses snap in from your bank feed, time tracking flows into billing, and at tax time the reports are just there.',
      'It is also a full accounting platform priced like one — the Lite plan runs about $19/month ($228/year) and caps you at five billable clients, with Plus at ~$33/month for fifty. If you actually use the accounting, that can be fair. But a large share of subscribers use FreshBooks as an invoice generator with a dashboard — and that job is a $39-once problem. That is Billcraft.',
    ],
    good: {
      lead: 'FreshBooks earns its reputation:',
      items: [
        'Real double-entry accounting, expense tracking with bank feeds, and tax-time reports your accountant will accept.',
        'Built-in payments — clients pay invoices by card or bank transfer with a click.',
        'Time tracking and project billing that flow straight into invoices.',
        'Automatic payment reminders and late fees, handled for you.',
      ],
      after: 'If you need books, not just bills — expenses, reconciliation, tax reports — FreshBooks is doing real accounting work for that subscription.',
    },
    hurts: [
      'The Lite plan\'s five-billable-client cap is the tell: it exists to push growing freelancers to Plus at ~$396/year. Between them, a typical freelancer pays $228–400 every year, forever — $1,100–2,000 over five years — when their actual usage is "create invoice, email invoice, mark paid." The invoice itself, the thing clients see, does not know or care whether an accounting platform generated it.',
      'Your entire client list, billing history and revenue picture also live in FreshBooks\' cloud, accessible exactly as long as you keep paying. Stop subscribing and your billing system — including the records you are legally required to keep — becomes an export file and a memory.',
    ],
    stay: [
      'Stay with FreshBooks if you use the accounting: expense capture, bank reconciliation, tax reports, or built-in card payments — Billcraft does none of those. It is invoicing, not bookkeeping, and we would rather say that plainly than surprise you.',
      'Switch if invoicing is the job: unlimited clients, professional PDFs with your logo, share links clients open without logging in, recurring monthly invoices, and email via your own SMTP — with every record in a SQLite file on hardware you control.',
    ],
    meetExtra: 'Billcraft handles the full invoicing loop: business profile with logo and payment instructions, client CRUD, line items with tax and discounts, draft/sent/paid statuses with automatic overdue detection, a dashboard of outstanding and overdue totals, and recurring templates that auto-create (and optionally auto-email) monthly drafts.',
  },
  {
    slug: 'invoice-ninja-alternative', competitor: 'Invoice Ninja', product: 'billcraft',
    metaDesc: 'Invoice Ninja is powerful but complex — 4 clients free, ~$120/yr hosted Pro, or a heavy self-host. Billcraft is simple self-hosted invoicing for $39 once.',
    intro: [
      'Invoice Ninja is the open-source heavyweight of invoicing — and an honest post has to start there: like Billcraft, it can be self-hosted for free, and its feature list is enormous. Invoices, quotes, projects, tasks, expenses, vendors, 45+ payment gateways, client portals, white-labeling. It is a genuinely impressive project.',
      'The catch is heft. The hosted free tier caps you at four clients; hosted Pro runs about $10–12/month (~$120/year). Self-hosting is free but means running a full Laravel/PHP application with a database, queues, cron and regular upgrades. Billcraft\'s pitch is different: the 20% of Invoice Ninja that freelancers actually use, in one Node process with one SQLite file, for $39 with a packaged installer.',
    ],
    good: {
      lead: 'Invoice Ninja\'s strengths are substantial:',
      items: [
        'Breadth nothing else open-source matches: quotes, expenses, projects, inventory, vendors, purchase orders.',
        '45+ payment gateway integrations — clients pay invoices online natively.',
        'A real client portal, plus white-labeling on paid plans.',
        'Free self-hosting with an active community, and reasonable hosted pricing.',
      ],
      after: 'If you need quotes-to-invoices workflows, online payments and a client portal, Invoice Ninja is arguably the category\'s best value at any price.',
    },
    hurts: [
      'The cost here is complexity more than cash. The four-client hosted free tier is a taste, not a tool; hosted Pro is another ~$120/year subscription line. Self-hosting the Laravel stack is real sysadmin work — PHP versions, migrations, queue workers, breaking upgrades — which is why so many "free" Invoice Ninja installs quietly become paid hosted accounts.',
      'And for a freelancer with a dozen clients sending a handful of invoices a month, the feature surface is drag, not power: modules you will never open, settings screens you have to learn, and an upgrade treadmill you did not sign up for. Simple work deserves a simple tool.',
    ],
    stay: [
      'Stay with Invoice Ninja if you need online card payments, quotes, expenses or a client portal — Billcraft has none of those; clients pay via the bank/Stripe instructions you print on the invoice. If you are happy running Laravel, its free self-host is genuinely unbeatable on features-per-dollar.',
      'Switch if you want invoicing that installs in one click, runs as a desktop app or a single Docker container, and stores everything in one SQLite file you can back up by copying it.',
    ],
    meetExtra: 'Billcraft is deliberately small: Node + Express + SQLite, PDFs rendered server-side with pdfkit (no headless browser), a React dashboard, and a thin Electron wrapper so the same app runs on your desktop offline or on a $5 VPS when clients need share links.',
  },
  {
    slug: 'calendly-alternative', competitor: 'Calendly', product: 'bookslot',
    metaDesc: 'Calendly costs $120+/user/year, forever, to rent your booking link. Bookslot is a self-hosted scheduling page on your own domain for $39 once.',
    intro: [
      'Calendly won scheduling. "Send me your Calendly" is a sentence in every industry now, and the product deserves it: connect your calendars, set your rules, and double-bookings simply stop existing. Its two-way sync with Google, Outlook and iCloud calendars remains the best in the business.',
      'But the Standard plan is $10 per user per month — $120/year, $360 over three years — to rent a booking page on calendly.com. For consultants, coaches, barbers and freelancers whose real need is "let people book my open slots and get a calendar invite," that is a permanent tax on a solved problem. Bookslot is that booking page, self-hosted on your own domain, for $39 once.',
    ],
    good: {
      lead: 'Calendly is polished in ways that matter:',
      items: [
        'True two-way calendar sync — it reads busy times from all your calendars in real time, so slots are always accurate.',
        'Native Zoom/Meet/Teams links generated per booking.',
        'Routing forms, collective and round-robin scheduling for teams.',
        'Workflows: automatic reminder emails and SMS that measurably cut no-shows.',
      ],
      after: 'If you juggle three synced calendars and team round-robins, Calendly\'s automation genuinely earns its subscription.',
    },
    hurts: [
      'The free tier gives you one event type — the paywall starts the moment you want "30-min intro" and "60-min session" side by side. Standard is $120/user/year forever; a three-person practice pays over $1,000 every three years for booking pages. And your professional front door lives on their domain, their branding rules, their price changes — Calendly has raised and restructured pricing before and will again.',
      'Client booking data — names, emails, patterns — also lives in their cloud, another processor in your privacy policy. For therapists, lawyers and consultants, fewer third parties holding client PII is not paranoia; it is hygiene.',
    ],
    stay: [
      'Stay with Calendly if you need real-time busy-time sync across multiple calendars — Bookslot does not sync calendars; it sends .ics invites and you block times manually. Stay for team round-robin, SMS reminders and native video-call links. Those are honest gaps.',
      'Switch if you are a solo operator with a schedule you control: your event types, buffers, minimum notice and blocked dates, on your domain, with timezone-correct booking and cancel/reschedule links — and no meter running on your own availability.',
    ],
    meetExtra: 'Bookslot handles the hard part properly: bookings stored in UTC, availability computed DST-safely in your timezone, displayed in the visitor\'s — unit-tested including DST gap days — with double-booking protection enforced inside a SQLite transaction and confirmation emails carrying .ics calendar attachments.',
  },
  {
    slug: 'cal-com-alternative', competitor: 'Cal.com', product: 'bookslot',
    metaDesc: 'Cal.com is open-source scheduling — free hosted for individuals, but heavy to self-host. Bookslot is a lightweight $39-once booking page for your own VPS.',
    intro: [
      'Cal.com is the open-source answer to Calendly, and a good one: free for individuals on the hosted plan, teams at ~$15/user/month, fully open-source, self-hostable, with an API-first design and an app store of integrations. If this post talks you into Cal.com instead of Bookslot, fair enough — it is a strong project.',
      'The honest comparison is about weight. Cal.com is a large Next.js/Prisma platform: self-hosting it properly means PostgreSQL, environment sprawl, real memory, and keeping pace with a fast-moving monorepo. Bookslot is the opposite bet — one small Node process, one SQLite file, $39 once with a packaged installer — for people who want a booking page, not a scheduling platform.',
    ],
    good: {
      lead: 'Cal.com has a lot going for it:',
      items: [
        'Genuinely free hosted plan for individuals — hard to beat.',
        'Open source (AGPL/commercial), auditable, self-hostable.',
        'Calendar sync, video-call integrations, routing forms, workflows and an app ecosystem.',
        'An API-first design teams can build products on.',
      ],
      after: 'For teams, or anyone who wants Calendly features with open-source values on a hosted free tier, Cal.com is an excellent default.',
    },
    hurts: [
      'Where it pinches: self-hosting Cal.com is a real operations project — a heavyweight Next.js app with Postgres, migrations and frequent releases, comfortably beyond a $5 VPS if you want it snappy. The hosted free tier, meanwhile, is one person and Cal\'s domain and branding rules; teams pay ~$180/user/year, and the roadmap\'s center of gravity is understandably the hosted platform.',
      'For a barber, coach or consultant, the platform features are mostly surface area: app stores and routing forms in front of what they need — "show my open slots, take a booking, email an invite." Complexity has a maintenance cost even when the license is free.',
    ],
    stay: [
      'Stay with Cal.com if the hosted free tier covers you (solo, one calendar — genuinely free beats $39), or if you need calendar sync, video integrations and team scheduling with open-source values. If you already run Postgres happily, its self-host is viable too.',
      'Switch if you want self-hosting that fits on the smallest VPS or runs as a desktop app: one process, one SQLite file, timezone-correct math, ICS invites and cancel/reschedule links — installed in minutes, owned forever.',
    ],
    meetExtra: 'Bookslot keeps the footprint tiny on purpose: Node + Express + better-sqlite3, a dark-mode React booking page, Docker compose for VPS deploys, and an Electron desktop mode — the same code and schema everywhere, so moving from desktop to server is copying a data folder.',
  },
  {
    slug: 'typeform-alternative', competitor: 'Typeform', product: 'formforge',
    metaDesc: 'Typeform charges $348/year and caps responses at 100/month on Basic. Formforge is a self-hosted form builder with unlimited responses for $39 once.',
    intro: [
      'Typeform made forms feel human. One question at a time, smooth transitions, conversational tone — respondents actually finish Typeforms, and completion rate is the whole game in surveys and lead capture. It is a genuinely great interaction model, which is why everyone copied it.',
      'Then there is the bill: the Basic plan is $29/month — $348/year — and caps you at 100 responses per month. One hundred. A single successful campaign blows through that in a day, and the overage path is a bigger plan. Formforge gives you the same one-question-per-screen experience, self-hosted, with unlimited responses, for $39 once.',
    ],
    good: {
      lead: 'Typeform\'s polish is real:',
      items: [
        'The smoothest form-filling experience in the industry — animations, keyboard flow, mobile feel.',
        'Logic jumps, calculators, hidden fields and personalization for sophisticated flows.',
        'Native integrations: HubSpot, Salesforce, Slack, Sheets, and a mature API.',
        'Video questions (VideoAsk) and research-grade survey tooling around the core product.',
      ],
      after: 'If your forms branch heavily, score leads or pipe into a CRM natively, Typeform\'s upper tiers are doing real work.',
    },
    hurts: [
      'The response caps are the sharpest edge in SaaS pricing: Basic\'s 100 responses/month means each response on a maxed month costs 29 cents — and a form that goes viral is a billing emergency, not a win. Plus ($59/mo) and Business ($99/mo) raise the caps but never remove them. Three years on Basic is over $1,000 for form submissions — rows in a database.',
      'Every submission also lands in Typeform\'s cloud: lead lists, survey answers, uploaded files, all of it on their servers under their retention and their (GDPR-compliant but still third-party) processing. For internal tools, HR forms or client intake with sensitive answers, that is a real consideration, not a checkbox.',
    ],
    stay: [
      'Stay with Typeform if you need logic jumps, calculated fields or native CRM integrations — Formforge\'s fields are linear (no branching yet), and integrations are your job via CSV or its API surface. Those are honest gaps against Typeform\'s upper tiers.',
      'Switch if your forms are straightforward — contact, intake, feedback, registration, surveys — and you are tired of counting responses. Unlimited forms, unlimited submissions, file uploads included, on your own server.',
    ],
    meetExtra: 'Formforge ships the Typeform-style one-question-per-screen flow (with keyboard navigation) and a classic single-page mode, 10 field types including file upload and star rating, spam protection via honeypot and rate limiting, a submissions inbox with CSV export, and BYO-SMTP email notifications.',
  },
  {
    slug: 'jotform-alternative', competitor: 'Jotform', product: 'formforge',
    metaDesc: 'Jotform\'s free tier is generous but paid tiers run $348+/year with submission caps. Formforge is a $39-once self-hosted form builder with no caps at all.',
    intro: [
      'Jotform is the feature giant of the form world: 10,000+ templates, a drag-and-drop builder, approval workflows, e-signatures, PDF generation, payment collection through 40+ processors, even a no-code app builder. Its free tier — five forms, 100 submissions a month — is one of the most usable in the category.',
      'The paid ladder is where it tightens: Bronze at ~$34/month, Silver ~$39, Gold ~$99 (annual billing reduces these), each rationing forms, submissions, storage and views. Like every form SaaS, you are renting capacity forever. Formforge takes the other road: fewer features, zero caps, your own server, $39 once.',
    ],
    good: {
      lead: 'Jotform\'s breadth is genuinely useful:',
      items: [
        'Payment forms with Stripe, PayPal, Square and dozens more — collect money with no code.',
        'Approval flows, e-signatures and PDF document generation built in.',
        'HIPAA-compliance features on Gold for healthcare intake.',
        'A vast template library and conditional logic in the builder.',
      ],
      after: 'If your forms collect payments or route through approval chains, Jotform\'s machinery is worth paying for.',
    },
    hurts: [
      'The caps follow you up every tier: Bronze\'s ~1,000 submissions/month sounds roomy until a registration form or giveaway lands, and storage and monthly-view limits lurk behind the headline numbers. Silver-tier usage runs ~$468/year at monthly billing — $2,300+ over five years — for a form builder. The free tier\'s 100 submissions, meanwhile, quietly throttles any form that starts working.',
      'And it is all cloud: submissions, uploaded files, signatures — hosted by Jotform, branded with Jotform on lower tiers, retained per plan. Sensitive intake data (which is exactly what forms collect) deserves a deliberate answer to "whose disk is this on?"',
    ],
    stay: [
      'Stay with Jotform if you need payment collection, e-signatures, approval workflows or HIPAA features — Formforge has none of those; it collects answers and files, full stop. The free tier is also genuinely fine for five small forms.',
      'Switch if what you build is intake, registration, feedback and contact forms, and you want them unlimited, unbranded, on your own domain, with respondent files on your own disk. $39 once is less than six weeks of Bronze.',
    ],
    meetExtra: 'Formforge keeps the essentials sharp: a drag-orderable editor with 10 field types, per-form accent colors and success redirects, an open/closed toggle, iframe embedding, a clean submissions inbox with detail drawer and one-click CSV export — all in one Node process with SQLite.',
  },
  {
    slug: 'wisestamp-alternative', competitor: 'WiseStamp', product: 'sigcraft',
    metaDesc: 'WiseStamp costs $72/user/year forever — for a block of HTML. SigCraft builds email-safe signatures locally for $15 one-time, whole team included. Honest comparison.',
    intro: [
      'WiseStamp is the best-known name in email signature generators, and for good reason: dozens of templates, one-click social icons, banners, and — its real differentiator — centralized team signature management that IT departments can roll out across a whole company from a dashboard.',
      'Here is the uncomfortable truth about the category, though: an email signature is a block of HTML. It is generated once, pasted into your mail client, and then it just... exists. Paying $6 per user per month, forever, for a static artifact is one of the strangest recurring bills in software. SigCraft generates the same email-safe HTML on your desktop for $15, once, team included.',
    ],
    good: {
      lead: 'WiseStamp has real strengths worth naming:',
      items: [
        'Around 50 templates with frequent additions — more visual variety than any local tool.',
        'Centralized team management — update everyone\'s signature from one dashboard, with Google Workspace / Microsoft 365 integration that applies changes server-side.',
        'Dynamic content: rotating banners, live social feeds, scheduling links embedded in signatures.',
        'Zero-install, works from any browser on any machine.',
      ],
      after: 'If IT needs to push signature updates to 200 mailboxes centrally, WiseStamp\'s Teams product is doing genuinely ongoing work — that is a fair subscription.',
    },
    hurts: [
      'For individuals and small teams the math is absurd: $6/month is $72/year and $216 over three years — per user. A five-person team pays over $1,000 in three years for HTML blocks that change maybe twice a year. And the free tier plants WiseStamp\'s own advertisement at the bottom of your signature, so every email you send markets their product, not yours.',
      'There is also lock-in by design: your signature lives in their account system, rendered through their infrastructure. Stop paying and signatures degrade or revert to branded versions. A signature you generated locally as plain HTML, by contrast, is just yours — it keeps working in your mail client whether the tool that made it exists or not.',
    ],
    stay: [
      'Stay with WiseStamp if you need centralized, server-side team signature management with Workspace/365 integration — SigCraft generates files; it does not push them into mailboxes remotely. Stay too if dynamic content (rotating banners, live feeds) is part of your marketing.',
      'Switch if you are an individual, freelancer or small team whose signature changes a few times a year. Generate it locally, paste it once, own it forever — and put your logo in your signature instead of theirs.',
    ],
    meetExtra: 'SigCraft focuses on the part that actually matters: HTML that renders everywhere. Table layouts, inline styles and Outlook VML conditionals mean your signature survives Gmail, Outlook desktop and web, Apple Mail and Thunderbird — with 10 templates, 12 social badge styles, banner + CTA support, live preview, and a team CSV mode that batch-exports signatures for everyone at no extra cost.',
  },
];
