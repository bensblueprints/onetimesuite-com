/* extra-competitors.js — curated competitor coverage beyond the catalog's own
 * `competitor` fields. Consumed by src/sections/vs-compare.js.
 *
 * Each entry: { slug, name, category, priceMo, priceYr, note, apps[] }.
 *   category  — a slug from seo-matrix.js categories.
 *   priceMo / priceYr — conservative PUBLIC list prices ("from $X"); null when
 *                       pricing is too variable to state honestly.
 *   note      — 1-2 factual sentences: what it is, what it costs.
 *   apps[]    — { slug (REAL catalog product), whyUs, theirsWins } — honest,
 *               pairing-specific copy. Only GENUINE functional overlaps.
 *
 * Prices are well-known published list prices as of mid-2026, phrased "from";
 * vendors change pricing often — keep these conservative, never precise guesses.
 */
module.exports = [
  {
    slug: 'canva', name: 'Canva', category: 'design-graphics',
    priceMo: 12.99, priceYr: 119.99,
    note: 'Canva is a browser-based design tool for social graphics, presentations and marketing assets. Canva Pro lists from $12.99/mo (about $119.99/yr), with a feature-limited free tier.',
    apps: [
      {
        slug: 'postcraft',
        whyUs: 'If your Canva habit is really "turn this week\'s headlines into on-brand social cards", Postcraft does that job in one pass: a CSV of headlines in, branded graphics at every platform size out, with a locked brand kit so nothing drifts off-style. It runs fully offline on your desktop for $19 once. No template browsing, no per-month meter.',
        theirsWins: 'Canva is a general-purpose editor with millions of templates, stock assets and real-time collaboration. Postcraft only does batch card generation — for one-off, freeform design work, Canva is the right tool.',
      },
      {
        slug: 'paletteforge',
        whyUs: 'One of Canva\'s underrated uses is quick color work for a brand or a post series. Paletteforge is a dedicated offline palette tool: generate and shuffle palettes, lock the colors you like, check WCAG contrast, and export straight to CSS, Tailwind, ASE or PNG. It is $15 once and never opens a browser tab.',
        theirsWins: 'Canva bundles color picking into a full design suite with templates and an asset library. Paletteforge is deliberately just palettes — if you need the canvas around the colors, that is Canva.',
      },
      {
        slug: 'cardsmith',
        whyUs: 'Teams often pay for Canva mainly to mass-produce OG images and social cards from a template. Cardsmith turns that into infrastructure: design the template once in a visual editor, then render unlimited PNGs through a self-hosted API or a bulk CSV run. At $99 once it replaces both the subscription and the manual export-clicking.',
        theirsWins: 'Canva needs no hosting and no API wiring, and its template marketplace is enormous. Cardsmith is a self-hosted render pipeline — great for automation, overkill if you make three images a month by hand.',
      },
      {
        slug: 'memeforge',
        whyUs: 'If your Canva usage is really meme and caption-image churn, Memeforge is built for exactly that: a built-in template library, drag-and-resize text boxes, custom fonts and stroke, and instant PNG export — 100% offline. It costs $15 once instead of a Pro subscription you only use for text-on-image.',
        theirsWins: 'Canva\'s meme templates sit inside a much bigger design ecosystem with stock photos, brand kits and team sharing. Memeforge is a single-purpose offline tool — faster for memes, not a design suite.',
      },
    ],
  },
  {
    slug: 'hootsuite', name: 'Hootsuite', category: 'marketing-seo',
    priceMo: 99, priceYr: 1188,
    note: 'Hootsuite is a social media management platform for scheduling, monitoring and analytics across networks. Plans list from $99/mo (about $1,188/yr) for a single user.',
    apps: [
      {
        slug: 'postdock',
        whyUs: 'PostDock covers the core of what most people actually use Hootsuite for: a composer with live previews, timezone-aware scheduling, a queue calendar, content recycling and webhooks — self-hosted, with your own API keys and your own data. It is $129 once, which is less than two months of Hootsuite\'s entry plan.',
        theirsWins: 'Hootsuite\'s price buys social listening, a unified engagement inbox, team approval workflows and analytics across many networks. PostDock schedules and publishes; it does not try to be a monitoring suite.',
      },
    ],
  },
  {
    slug: 'sprout-social', name: 'Sprout Social', category: 'marketing-seo',
    priceMo: 199, priceYr: 2388,
    note: 'Sprout Social is a social media management and analytics platform aimed at teams. Standard plans list from $199/seat/mo billed annually (about $2,388/seat/yr).',
    apps: [
      {
        slug: 'postdock',
        whyUs: 'For solo marketers and small teams whose Sprout bill is really a scheduling bill, PostDock does the publishing layer — composer, queue calendar, recycling, timezone-aware scheduling — on your own server for $129 once. Your API keys never sit in a third-party dashboard.',
        theirsWins: 'Sprout Social earns its per-seat price with a smart inbox, deep analytics, listening, and CRM-style contact history. PostDock is scheduling only; agencies that live in Sprout\'s reporting should stay.',
      },
    ],
  },
  {
    slug: 'later', name: 'Later', category: 'marketing-seo',
    priceMo: 25, priceYr: 200,
    note: 'Later is a visual-first social scheduler known for Instagram grid planning. Starter plans list from $25/mo (about $200/yr billed annually).',
    apps: [
      {
        slug: 'postdock',
        whyUs: 'PostDock gives you the scheduling backbone — a composer with live previews, a queue calendar, content recycling and timezone-aware publishing — self-hosted for $129 once instead of a monthly plan that rises with social sets. Webhooks let you wire it into the rest of your stack.',
        theirsWins: 'Later\'s visual Instagram grid planner, link-in-bio tool and media library are polished and purpose-built for visual-first brands. PostDock is channel-agnostic scheduling without the visual planner.',
      },
    ],
  },
  {
    slug: 'convertkit', name: 'Kit (ConvertKit)', category: 'marketing-seo',
    priceMo: 25, priceYr: 290,
    note: 'Kit (formerly ConvertKit) is an email platform for creators with automations and paid-newsletter support. Paid Creator plans list from $25/mo for 1,000 subscribers (about $290/yr), scaling with list size.',
    apps: [
      {
        slug: 'postbird',
        whyUs: 'Postbird covers the sending layer: lists, double opt-in, segments, a drag-block builder, throttled sending through any SMTP, and open/click tracking — with no per-contact pricing, so a growing list never grows the bill. It is $149 once on infrastructure you control.',
        theirsWins: 'Kit\'s visual automation builder, creator network, and native paid-subscription commerce are real products Postbird does not replicate. Postbird sends campaigns and sequences; it is not a creator monetization platform.',
      },
    ],
  },
  {
    slug: 'klaviyo', name: 'Klaviyo', category: 'marketing-seo',
    priceMo: 45, priceYr: null,
    note: 'Klaviyo is an email and SMS marketing platform priced by contact count, listing from around $45/mo for roughly 1,500 email contacts and rising steeply with list size.',
    apps: [
      {
        slug: 'postbird',
        whyUs: 'If your Klaviyo invoice is mostly "send campaigns and automations to a list we already own", Postbird does that without per-contact pricing: lists, segments, a drag-block builder, throttled sending through your own SMTP, and open/click tracking. $149 once, and the tenth thousand subscribers costs the same as the first.',
        theirsWins: 'Klaviyo\'s predictive analytics, deep e-commerce integrations and SMS channel are why stores pay per contact. Postbird has none of the data-science layer — it is an honest sending tool, not a CDP.',
      },
    ],
  },
  {
    slug: 'beehiiv', name: 'beehiiv', category: 'marketing-seo',
    priceMo: 49, priceYr: null,
    note: 'beehiiv is a newsletter platform with a built-in ad network and referral tools. Paid plans list from $49/mo (Scale), with a limited free tier.',
    apps: [
      {
        slug: 'postbird',
        whyUs: 'Postbird replaces beehiiv\'s core sending loop: build issues in a drag-block editor, segment your list, and send through your own SMTP with throttling and open/click tracking — no monthly tier that climbs with your subscriber count. It is $149 once and your list lives on your own server.',
        theirsWins: 'beehiiv bundles an ad network, referral program, recommendations and a hosted reading page — growth machinery Postbird does not attempt. If those network effects drive your list growth, the subscription is the product.',
      },
      {
        slug: 'inkpress',
        whyUs: 'The other half of a newsletter is the public archive. Inkpress publishes your writing as fast, zero-JS public pages with themes, RSS and SEO from one SQLite file — $79 once. Paired with any sender, it replaces the "hosted publication" part of beehiiv with something you fully own.',
        theirsWins: 'beehiiv integrates writing, sending, growth tools and monetization in one dashboard. Inkpress is just the publishing layer — you bring your own email pipe and your own growth plan.',
      },
    ],
  },
  {
    slug: 'substack', name: 'Substack', category: 'marketing-seo',
    priceMo: null, priceYr: null,
    note: 'Substack is a hosted newsletter and publishing platform. Publishing is free; Substack takes 10% of paid-subscription revenue plus payment processing fees.',
    apps: [
      {
        slug: 'postbird',
        whyUs: 'Substack\'s 10% cut means a newsletter earning $2,000/mo pays $200/mo forever. Postbird runs your list, segments and sending through your own SMTP for $149 once — 0% revenue share, with open/click tracking included. Your subscribers are rows in your database, not tenants on a platform.',
        theirsWins: 'Substack brings a reading app, a recommendation network and one-tap paid subscriptions with no setup. Postbird is plumbing: you host it, you wire payments yourself, and no network effects come with it.',
      },
      {
        slug: 'inkpress',
        whyUs: 'Inkpress is the self-hosted answer to Substack\'s publication: split-pane markdown writing, three clean themes, server-side highlighting, RSS and SEO on zero-JS pages — one SQLite file you can back up anywhere. $79 once, no platform between you and your readers.',
        theirsWins: 'Substack bundles email delivery, payments, discovery and a social graph behind every post. Inkpress only publishes the site; list delivery and monetization are yours to assemble.',
      },
    ],
  },
  {
    slug: 'asana', name: 'Asana', category: 'business-ops',
    priceMo: 10.99, priceYr: 131.88,
    note: 'Asana is a work-management platform with projects, timelines and portfolios. Starter plans list from $10.99/user/mo billed annually (about $131.88/user/yr).',
    apps: [
      {
        slug: 'boardly',
        whyUs: 'If your team\'s Asana usage is really boards with cards, checklists and labels, Boardly does exactly that — self-hosted kanban with drag & drop, attachments and full JSON export — for $49 once, total, instead of per user per month. A ten-person team stops paying $1,300/yr for a board.',
        theirsWins: 'Asana\'s timelines, workload views, portfolios and 200+ integrations are built for coordinating large organizations. Boardly is deliberately just boards; portfolio reporting is not in it.',
      },
    ],
  },
  {
    slug: 'mondaycom', name: 'Monday.com', category: 'business-ops',
    priceMo: 9, priceYr: 108,
    note: 'Monday.com is a work OS with boards, dashboards and automations. Plans list from $9/seat/mo billed annually (about $108/seat/yr), with a 3-seat minimum.',
    apps: [
      {
        slug: 'boardly',
        whyUs: 'Boardly replaces the kanban core of Monday.com: multiple boards, rich cards with checklists, labels and attachments, and complete JSON export whenever you want out. Self-hosted, $49 once for the whole team — no seat count, no 3-seat minimum.',
        theirsWins: 'Monday.com\'s dashboards, automations, docs and marketplace integrations make it a genuine work platform. Boardly is boards and nothing else — teams using Monday\'s automation recipes should keep it.',
      },
    ],
  },
  {
    slug: 'clickup', name: 'ClickUp', category: 'business-ops',
    priceMo: 7, priceYr: 84,
    note: 'ClickUp is an all-in-one project tool spanning tasks, docs, goals and time tracking. Unlimited plans list from $7/user/mo billed annually (about $84/user/yr).',
    apps: [
      {
        slug: 'boardly',
        whyUs: 'ClickUp\'s breadth is also its bloat; if you live in board view, Boardly gives you fast self-hosted kanban — drag & drop, checklists, labels, attachments, JSON export — for $49 once. No per-seat fee, no feature maze.',
        theirsWins: 'ClickUp bundles docs, whiteboards, goals, sprints and native time tracking under one login. Boardly covers boards only; if your workflow uses ClickUp\'s other modules, it is the more complete tool.',
      },
      {
        slug: 'timevault',
        whyUs: 'If you pay for ClickUp largely for its time tracking, Timevault is the dedicated tool: one-click timers, projects and clients with hourly rates, weekly timesheets and billable reports that turn straight into invoices — self-hosted for $79 once, any number of people.',
        theirsWins: 'ClickUp\'s time tracking lives inside a full project-management suite with tasks, docs and goals attached. Timevault is tracking and billing only — it will not manage your projects.',
      },
    ],
  },
  {
    slug: 'basecamp', name: 'Basecamp', category: 'business-ops',
    priceMo: 15, priceYr: 180,
    note: 'Basecamp is a project communication tool with message boards, to-dos and group chat. It lists at $15/user/mo, or $299/mo flat for unlimited users (Pro Unlimited).',
    apps: [
      {
        slug: 'boardly',
        whyUs: 'Basecamp\'s to-dos are where a lot of teams actually spend their day. Boardly is that layer as a focused self-hosted kanban — boards, rich cards, checklists, labels and attachments — for $49 once with full JSON export. No per-user fee as the team grows.',
        theirsWins: 'Basecamp\'s message boards, Campfire chat, automatic check-ins and email bridge make it a communication hub, not just tasks. Boardly has no chat or announcements — it is the task board, self-hosted.',
      },
    ],
  },
  {
    slug: 'zapier', name: 'Zapier', category: 'developer-tools',
    priceMo: 19.99, priceYr: 239.88,
    note: 'Zapier connects apps with trigger-action automations ("Zaps") across thousands of integrations. Professional plans list from $19.99/mo billed annually (about $239.88/yr), scaling by task volume.',
    apps: [
      {
        slug: 'hookscope',
        whyUs: 'A large share of real-world Zaps are "catch this webhook, inspect it, send it somewhere else". Hookscope is that exact loop self-hosted: bins that accept anything, a live inspector, replay, and auto-forwarding with URLs that never expire — $69 once with no task quota. Webhook plumbing stops being a metered service.',
        theirsWins: 'Zapier\'s value is its catalog of thousands of pre-built app integrations and multi-step logic with zero hosting. Hookscope speaks webhooks only; if your automation touches apps without webhooks, Zapier is the bridge.',
      },
    ],
  },
  {
    slug: 'make', name: 'Make', category: 'developer-tools',
    priceMo: 9, priceYr: 108,
    note: 'Make (formerly Integromat) is a visual automation platform for multi-step scenarios across SaaS APIs. Core plans list from $9/mo billed annually (about $108/yr), metered by operations.',
    apps: [
      {
        slug: 'hookscope',
        whyUs: 'If your Make scenarios mostly start and end with webhooks — receive, inspect, retry, forward — Hookscope replaces them with a self-hosted webhook workbench: permanent capture bins, a live request inspector, one-click replay and auto-forwarding. $69 once, no operations counter running.',
        theirsWins: 'Make\'s visual scenario builder, error handling and thousand-app module catalog go far beyond webhooks. Hookscope is deliberately narrow: it is the webhook layer, not a general automation canvas.',
      },
    ],
  },
  {
    slug: 'doodle', name: 'Doodle', category: 'business-ops',
    priceMo: 6.95, priceYr: 83.4,
    note: 'Doodle is a scheduling tool known for group availability polls and booking pages. Pro plans list from $6.95/user/mo billed annually (about $83.40/yr).',
    apps: [
      {
        slug: 'bookslot',
        whyUs: 'Bookslot replaces Doodle\'s booking-page half: event types, a weekly availability editor, timezone-correct slot math, double-booking protection and email + ICS invites — self-hosted for $99 once. Your booking page lives on your domain, not behind a subscription.',
        theirsWins: 'Doodle\'s group polls — finding one time across twenty people — are still its signature feature and Bookslot does not do polling. For one-on-one booking pages, Bookslot wins; for committee scheduling, Doodle does.',
      },
    ],
  },
  {
    slug: 'acuity-scheduling', name: 'Acuity Scheduling', category: 'business-ops',
    priceMo: 16, priceYr: 192,
    note: 'Acuity Scheduling (Squarespace Scheduling) is a client-booking platform with intake forms and packages. Plans list from $16/mo billed annually (about $192/yr).',
    apps: [
      {
        slug: 'bookslot',
        whyUs: 'Bookslot covers the everyday Acuity workflow: bookable event types, weekly availability, timezone-correct slots, double-booking protection and automatic email + ICS invites. It is $99 once on your own infrastructure — about six months of Acuity\'s entry plan, then nothing.',
        theirsWins: 'Acuity\'s intake forms, packages, memberships, gift certificates and payment processing are built for client-service businesses. Bookslot is scheduling and invites only — no payment collection or client packages.',
      },
    ],
  },
  {
    slug: 'square-appointments', name: 'Square Appointments', category: 'business-ops',
    priceMo: 29, priceYr: 348,
    note: 'Square Appointments is booking software tied to Square\'s payments ecosystem. It is free for individual use; Plus plans for teams list from $29/mo (about $348/yr).',
    apps: [
      {
        slug: 'bookslot',
        whyUs: 'If you are paying Square Appointments Plus mainly for bookable slots and reminders, Bookslot does the scheduling core — event types, availability, timezone-correct booking, email + ICS invites — self-hosted for $99 once, with no payment-platform tie-in.',
        theirsWins: 'Square Appointments is fused with Square payments, no-show protection, and a POS ecosystem for salons and clinics. Bookslot takes no payments and manages no staff — it is the booking page, owned.',
      },
    ],
  },
  {
    slug: 'kajabi', name: 'Kajabi', category: 'marketing-seo',
    priceMo: 149, priceYr: 1788,
    note: 'Kajabi is an all-in-one platform for courses, communities and marketing funnels. Basic plans list from $149/mo (about $1,788/yr).',
    apps: [
      {
        slug: 'lessonforge',
        whyUs: 'Lessonforge replaces Kajabi\'s course layer: self-hosted courses with modules and lessons, quizzes per module, progress tracking and PDF certificates, with enrollment through your own Stripe. $49 once versus $149 every month — the LMS stops being your biggest fixed cost.',
        theirsWins: 'Kajabi bundles email marketing, funnels, landing pages, a website builder and payments in one hosted platform. Lessonforge is courses only; the marketing machine around them is yours to build.',
      },
      {
        slug: 'forumly',
        whyUs: 'Kajabi\'s community feature is a common reason creators tolerate its price. Forumly is a real self-hosted community: categories, threads, reactions, badges, @mentions, search and moderator tools — $39 once on your own server, with your member data in your own database.',
        theirsWins: 'In Kajabi, the community sits next to your courses and payments with one login for members. Forumly is standalone community software — you integrate access and accounts yourself.',
      },
      {
        slug: 'postbird',
        whyUs: 'Kajabi\'s built-in email is priced into its $149/mo floor. Postbird handles the email layer — lists, segments, a drag-block builder, throttled sending via your SMTP, open/click tracking — for $149 once, with no contact-count tiers. Many course sellers can pair it with a self-hosted LMS and drop Kajabi entirely.',
        theirsWins: 'Kajabi\'s email is wired into its funnels, offers and automations, so a purchase can trigger a sequence with no integration work. Postbird is a standalone sender — automation logic lives in your stack, not in the tool.',
      },
    ],
  },
  {
    slug: 'podia', name: 'Podia', category: 'marketing-seo',
    priceMo: 33, priceYr: 396,
    note: 'Podia is a creator platform for courses, digital downloads and memberships. Mover plans list from $33/mo billed annually (about $396/yr).',
    apps: [
      {
        slug: 'lessonforge',
        whyUs: 'Lessonforge covers Podia\'s course hosting: modules and lessons, quizzes, progress tracking, PDF certificates and an instructor dashboard, with payments through your own Stripe. It is $49 once — Podia\'s annual bill would buy it eight times over.',
        theirsWins: 'Podia also sells downloads and memberships, hosts your storefront, and bundles email on higher tiers with zero setup. Lessonforge is a self-hosted LMS — you bring hosting, storefront and email.',
      },
    ],
  },
  {
    slug: 'ilovepdf', name: 'iLovePDF', category: 'productivity',
    priceMo: 7, priceYr: 48,
    note: 'iLovePDF is a web-based PDF toolkit (merge, split, compress, convert) that uploads files to its servers. Premium lists from about $7/mo (around $48/yr), with a capped free tier.',
    apps: [
      {
        slug: 'pdfsmith',
        whyUs: 'PDFsmith runs the same everyday jobs — merge, split, rotate, watermark, images-to-PDF, metadata — entirely on your machine, so contracts and invoices are never uploaded to anyone\'s servers. $29 once with no page limits, no account, and it works with the Wi-Fi off.',
        theirsWins: 'iLovePDF needs no install, runs on any device with a browser, and its toolkit is wider (OCR, e-sign, PDF/A conversion, repair). PDFsmith covers the core offline jobs; the long tail of formats is iLovePDF\'s.',
      },
    ],
  },
  {
    slug: 'sejda', name: 'Sejda', category: 'productivity',
    priceMo: null, priceYr: 63,
    note: 'Sejda is a PDF editor with web and desktop versions. It sells $5 weekly passes and an annual plan around $63/yr; the free tier caps documents by size and daily tasks.',
    apps: [
      {
        slug: 'pdfsmith',
        whyUs: 'PDFsmith does Sejda\'s daily-driver jobs — merge, split, rotate, watermark, images-to-PDF, metadata editing — locally with no daily task caps and no file-size ceilings, for $29 once. Nothing is uploaded and there is no counter resetting tomorrow.',
        theirsWins: 'Sejda can edit existing text inside a PDF, fill forms, and redact — things PDFsmith explicitly does not attempt. If you need to rewrite a PDF\'s contents rather than reassemble it, Sejda is the better tool.',
      },
    ],
  },
  {
    slug: 'pdf-expert', name: 'PDF Expert', category: 'productivity',
    priceMo: null, priceYr: 79.99,
    note: 'PDF Expert is Readdle\'s polished PDF editor for Mac, iPhone and iPad. It lists at about $79.99/yr, with a one-time Mac license around $139.99 also offered.',
    apps: [
      {
        slug: 'pdfsmith',
        whyUs: 'If you use PDF Expert for assembling documents — merging scans, splitting packets, rotating pages, watermarking drafts — PDFsmith does those jobs for $29 once, cross-platform via its MIT source, with everything processed locally. That is roughly a third of one year of PDF Expert\'s subscription.',
        theirsWins: 'PDF Expert is a full editor: annotate, highlight, edit embedded text and images, fill and sign forms, with best-in-class Apple integration. PDFsmith reassembles PDFs; it does not edit their contents.',
      },
      {
        slug: 'textract',
        whyUs: 'The feature many people subscribe to PDF Expert for is OCR — making scans searchable and selectable. Textract is a dedicated local OCR tool: drag-drop images and PDFs, per-page results, searchable-PDF export, batch folders and a screenshot-to-text hotkey, all offline for $19 once.',
        theirsWins: 'PDF Expert wraps OCR inside a complete reading, annotation and editing app. Textract only extracts text — if you need to mark up the document afterwards, you need the editor around it.',
      },
    ],
  },
  {
    slug: 'jotform', name: 'Jotform', category: 'business-ops',
    priceMo: 34, priceYr: 408,
    note: 'Jotform is an online form builder with payments, approvals and PDF generation. Bronze plans list from $34/mo billed annually (about $408/yr), capped by submissions and storage.',
    apps: [
      {
        slug: 'formforge',
        whyUs: 'Formforge replaces Jotform\'s form core: a drag-orderable field editor, conversational or classic display modes, file uploads, a submissions inbox and CSV export — self-hosted with unlimited responses for $99 once. No submission cap throttling your best month.',
        theirsWins: 'Jotform\'s payment fields, approval workflows, PDF editor and 10,000+ templates are a genuine platform. Formforge is forms and responses — payments and workflow automation are not included.',
      },
    ],
  },
  {
    slug: 'surveymonkey', name: 'SurveyMonkey', category: 'business-ops',
    priceMo: 25, priceYr: 300,
    note: 'SurveyMonkey is a survey platform with templates, logic and analysis. Team plans list from $25/user/mo billed annually (about $300/user/yr); individual plans are priced higher per month.',
    apps: [
      {
        slug: 'pulsecheck',
        whyUs: 'For the most common SurveyMonkey job — NPS and quick pulse surveys — Pulsecheck is purpose-built: one-question surveys delivered by link, email or widget, with instant detractor alerts and a clean dashboard. Self-hosted, $29 once, unlimited responses.',
        theirsWins: 'SurveyMonkey offers long multi-page surveys, question banks, skip logic and statistical analysis. Pulsecheck is deliberately one question at a time — research-grade instruments are SurveyMonkey\'s territory.',
      },
      {
        slug: 'hearback',
        whyUs: 'If your surveys live on your website, Hearback embeds feedback and NPS widgets with one line of code, captures page context automatically, and collects everything in a self-hosted inbox with CSV export. $79 once, no response limits, no per-user seats.',
        theirsWins: 'SurveyMonkey distributes surveys anywhere — email, links, social, panels — with logic branching and benchmarking data. Hearback is an on-site widget; it does not do panel distribution or complex survey logic.',
      },
      {
        slug: 'quizcraft',
        whyUs: 'When the "survey" is really a scored assessment or lead-gen quiz, Quizcraft fits better than a general survey tool: one-question-per-screen flow, conditional branching, server-side scoring, result buckets and an email gate. Self-hosted for $29 once with CSV export.',
        theirsWins: 'SurveyMonkey is the safer choice for formal research: validated question banks, randomization, crosstabs and compliance features. Quizcraft is marketing quizzes and scored assessments, not academic survey methodology.',
      },
    ],
  },
  {
    slug: 'intercom', name: 'Intercom', category: 'business-ops',
    priceMo: 29, priceYr: 348,
    note: 'Intercom is a customer messaging platform combining live chat, bots and a helpdesk. Essential plans list from $29/seat/mo billed annually (about $348/seat/yr), with usage-based add-ons.',
    apps: [
      {
        slug: 'chatlet',
        whyUs: 'Chatlet replaces Intercom\'s live-chat layer: a one-line embed, real-time messaging over WebSockets, an agent dashboard with visitor context, canned responses and offline messages — self-hosted for $129 once, no per-seat fee as your support team grows.',
        theirsWins: 'Intercom\'s AI bot, product tours, proactive campaigns and help center make it a full customer-engagement platform. Chatlet is human-powered chat only — no bots, no tours, no outbound messaging.',
      },
      {
        slug: 'deskly',
        whyUs: 'The inbox side of Intercom — conversations becoming tickets with SLAs — is Deskly\'s whole job: shared inbox, threaded email replies, SLA timers, canned responses and CSAT, self-hosted for $49 once. A five-agent team stops paying ~$1,700/yr in seats.',
        theirsWins: 'Intercom unifies chat, email, bots and a help center in one product with strong AI deflection. Deskly is an email-first helpdesk; live chat and automation would come from elsewhere.',
      },
    ],
  },
  {
    slug: 'freshdesk', name: 'Freshdesk', category: 'business-ops',
    priceMo: 15, priceYr: 180,
    note: 'Freshdesk is Freshworks\' ticketing helpdesk with automations and a knowledge base. Growth plans list from $15/agent/mo billed annually (about $180/agent/yr), with a limited free tier.',
    apps: [
      {
        slug: 'deskly',
        whyUs: 'Deskly covers Freshdesk\'s everyday workflow: email-to-ticket, threaded SMTP replies, a full ticket workflow, canned responses, internal notes and CSAT — self-hosted for $49 once with no per-agent pricing. Your support history stays in your own database.',
        theirsWins: 'Freshdesk adds a customer portal, knowledge base, SLA management with business hours, marketplace apps and phone/social channels. Deskly is the email ticketing core; omnichannel support is Freshdesk\'s strength.',
      },
    ],
  },
  {
    slug: 'semrush', name: 'Semrush', category: 'marketing-seo',
    priceMo: 139.95, priceYr: 1679.4,
    note: 'Semrush is an all-in-one SEO suite for keyword research, rank tracking, audits and competitive analysis. Pro plans list from $139.95/mo (about $1,679/yr).',
    apps: [
      {
        slug: 'serpdeck',
        whyUs: 'The rank-tracking tab is where many Semrush subscriptions actually live. Serpdeck does daily position tracking with history charts, competitor overlays and big-move alerts — bring your own SerpAPI or DataForSEO key and pay pennies per check. $99 once instead of $1,679/yr.',
        theirsWins: 'Semrush\'s keyword database, backlink index, content tools and PPC data are decades of aggregated crawl data. Serpdeck tracks rankings you already care about; it cannot do keyword discovery.',
      },
      {
        slug: 'maptrail',
        whyUs: 'Semrush\'s site audit is a crawler at heart. Maptrail runs that crawl locally on your desktop: breadth-first with depth and pattern controls, a standards-compliant sitemap.xml with automatic 50k chunking, and a full CSV SEO report — $19 once, unlimited re-crawls.',
        theirsWins: 'Semrush correlates crawl findings with its keyword and backlink databases and monitors issues on a schedule in the cloud. Maptrail crawls on demand from your machine — no cloud scheduling, no competitive data.',
      },
      {
        slug: 'linkguard',
        whyUs: 'If broken links and redirect chains are what you open Semrush\'s audit for, Linkguard isolates that job: it crawls your whole site for dead links and redirect chains, then re-checks on a schedule and emails you only when something new breaks. Self-hosted, $24 once.',
        theirsWins: 'Linkguard checks links, full stop. Semrush\'s audit covers 140+ technical checks — Core Web Vitals, hreflang, structured data, crawlability — plus the rest of the SEO suite around it.',
      },
      {
        slug: 'citewatch',
        whyUs: 'For local SEO, the Semrush feature that matters is listing management. Citewatch tracks your citations against one canonical NAP profile, diffs every listing, and turns mismatches into fix-tasks with recheck reminders — self-hosted for $34 once instead of a per-location subscription add-on.',
        theirsWins: 'Semrush pushes corrections to aggregator networks automatically and covers the full SEO workflow beyond local. Citewatch audits and tracks your listings; you make the edits at each directory yourself.',
      },
    ],
  },
  {
    slug: 'descript', name: 'Descript', category: 'video-audio',
    priceMo: 16, priceYr: 192,
    note: 'Descript is an AI audio/video editor where you edit media by editing its transcript. Hobbyist plans list from $16/mo billed annually (about $192/yr), metered by transcription hours.',
    apps: [
      {
        slug: 'captionly',
        whyUs: 'If your Descript usage ends at "transcribe this and burn in captions", Captionly does that locally: Whisper transcription on your machine, karaoke word-highlight styles, inline editing with re-sync and ffmpeg burn-in export. $34 once, unlimited videos, nothing uploaded.',
        theirsWins: 'Descript is a full editor — multitrack timeline, filler-word removal, Studio Sound, screen recording, overdub. Captionly only captions; it does not edit the video itself.',
      },
      {
        slug: 'whisperdesk',
        whyUs: 'Descript meters transcription hours; WhisperDesk does not. It transcribes audio and video files locally with Whisper — unlimited minutes, TXT/SRT/VTT export, language auto-detect — for $39 once on your own CPU. An hour of audio costs you electricity, not a quota.',
        theirsWins: 'Descript turns the transcript into an editing surface for the media itself, with collaboration and publishing built in. WhisperDesk hands you the text; what you do with it happens elsewhere.',
      },
    ],
  },
  {
    slug: 'capcut', name: 'CapCut', category: 'video-audio',
    priceMo: 7.99, priceYr: 74.99,
    note: 'CapCut is ByteDance\'s video editor, popular for short-form social content. CapCut Pro lists around $7.99/mo or $74.99/yr, gating effects and cloud features.',
    apps: [
      {
        slug: 'captionly',
        whyUs: 'Auto-captions are the Pro feature many creators actually pay CapCut for. Captionly generates them locally with Whisper, styles them with karaoke word-highlight presets, lets you fix words inline with re-sync, and burns them in via ffmpeg — $34 once, no account, no upload.',
        theirsWins: 'CapCut is a complete mobile and desktop editor with effects, templates, keyframes and a music library. Captionly only captions footage you have already cut — it complements an editor, never replaces one.',
      },
    ],
  },
  {
    slug: 'riverside', name: 'Riverside', category: 'video-audio',
    priceMo: 15, priceYr: 180,
    note: 'Riverside records remote interviews in studio quality by capturing each participant locally. Standard plans list from $15/mo billed annually (about $180/yr), capped by recording hours.',
    apps: [
      {
        slug: 'bloommeeting',
        whyUs: 'Bloom Meeting is Riverside\'s core trick as a desktop app you buy once: guests join from a browser link with nothing to install, everyone records locally in studio quality, and the tracks collect into a synced take folder with per-person offsets when the meeting ends. Local Whisper captions, auto-cut Dynamic Edit and RTMP streaming are all included, with no recording-hour meter. $49 once.',
        theirsWins: 'Riverside is a hosted platform: its cloud handles guest uploads, storage and team workflows with nothing to run yourself, supports larger guest counts, and its browser studio works when the host is on a machine without the app. If you want zero infrastructure and managed storage, Riverside is the smoother rental.',
      },
      {
        slug: 'bloomrecorder',
        whyUs: 'For solo recording — screen, camera or both — BloomRecorder captures locally in unlimited length with MP4 and GIF export, no cloud and no account, for $29 once. Recordings land in your folder the second you stop, not in a processing queue.',
        theirsWins: 'Riverside\'s reason to exist is remote guests: separate local tracks per participant, progressive upload, and a browser-based studio. BloomRecorder records the machine it runs on — it cannot capture a remote guest.',
      },
    ],
  },
  {
    slug: 'screenpal', name: 'ScreenPal', category: 'video-audio',
    priceMo: 3, priceYr: 36,
    note: 'ScreenPal (formerly Screencast-O-Matic) is a screen recorder and lightweight video editor with hosting. Solo plans list from $3/mo billed annually (about $36/yr).',
    apps: [
      {
        slug: 'bloomrecorder',
        whyUs: 'BloomRecorder matches ScreenPal\'s recording core — screen, camera or both, with device selection and a floating recording pill — but keeps everything 100% local with unlimited length and MP4/GIF export. $29 once and there is no cloud library tied to a subscription.',
        theirsWins: 'ScreenPal includes a built-in video editor, stock library, quizzes and cloud hosting with share pages. BloomRecorder only records; editing and hosting happen in other tools.',
      },
    ],
  },
  {
    slug: 'fireflies', name: 'Fireflies.ai', category: 'productivity',
    priceMo: 10, priceYr: 120,
    note: 'Fireflies.ai joins meetings as a bot, transcribes them and generates summaries. Pro plans list from $10/seat/mo billed annually (about $120/seat/yr), metered by transcription credits.',
    apps: [
      {
        slug: 'whisperdesk',
        whyUs: 'If you record the meeting anyway, WhisperDesk transcribes the file locally with unlimited minutes — TXT, SRT or VTT out, no credits, no bot in your call and no audio leaving your machine. $39 once covers every meeting you will ever transcribe.',
        theirsWins: 'Fireflies joins the call itself, identifies speakers, summarizes with AI and pushes notes into your CRM. WhisperDesk transcribes files you feed it — no live assistant, no speaker diarization, no summaries.',
      },
    ],
  },
  {
    slug: 'rev', name: 'Rev', category: 'video-audio',
    priceMo: null, priceYr: null,
    note: 'Rev sells transcription and captioning per minute: automated transcription from about $0.25/min and human transcription from $1.50/min, with subscription options for heavy users.',
    apps: [
      {
        slug: 'whisperdesk',
        whyUs: 'At Rev\'s automated rate, transcribing ten hours of audio costs about $150 — every time. WhisperDesk runs OpenAI\'s Whisper models on your own CPU with unlimited minutes and TXT/SRT/VTT export for $39 once, and confidential recordings never leave your machine.',
        theirsWins: 'Rev\'s human transcriptionists hit accuracy levels no local model matches, with rush delivery and legal-grade formatting. WhisperDesk is machine transcription — for court-ready or mission-critical text, humans still win.',
      },
    ],
  },
  {
    slug: 'photoroom', name: 'Photoroom', category: 'design-graphics',
    priceMo: 7.5, priceYr: 90,
    note: 'Photoroom is an AI product-photo tool that removes backgrounds and generates studio scenes. Pro plans list from about $7.50/mo billed annually (around $90/yr).',
    apps: [
      {
        slug: 'cutaway',
        whyUs: 'Cutaway does Photoroom\'s core job — AI background removal — locally on your machine: unlimited images, full original resolution, batch export, with models bundled in the installer so nothing is ever uploaded. $24 once versus a subscription that meters your product catalog.',
        theirsWins: 'Photoroom generates entire scenes — AI backgrounds, shadows, templates and a mobile app your whole team can use. Cutaway cuts the subject out; it does not art-direct the photo around it.',
      },
    ],
  },
  {
    slug: 'dashlane', name: 'Dashlane', category: 'security-backup',
    priceMo: 4.99, priceYr: 59.88,
    note: 'Dashlane is a hosted password manager with sharing and monitoring features. Premium plans list from $4.99/mo billed annually (about $59.88/yr).',
    apps: [
      {
        slug: 'vaultly',
        whyUs: 'Vaultly is the self-hosted answer: Bitwarden-style zero-knowledge vaults with client-side encryption, shared team vaults, logins/notes/cards and inline TOTP — on your own server for $39 once, with no per-seat fee. Your encrypted vault never sits in someone else\'s cloud.',
        theirsWins: 'Dashlane handles sync, recovery, dark-web monitoring and polished native apps on every platform with zero maintenance. Vaultly is software you host — uptime, backups and updates are your responsibility.',
      },
      {
        slug: 'keyloop',
        whyUs: 'If what you actually pay Dashlane for is two-factor codes, Keyloop is a dedicated desktop TOTP authenticator: live 6-digit codes, an encrypted local vault, and encrypted/QR/URI exports for backup — $19 once, fully offline.',
        theirsWins: 'Dashlane stores passwords, passkeys, payment cards and IDs and autofills them everywhere. Keyloop does TOTP codes only — it is a companion to your password solution, not a vault for everything.',
      },
    ],
  },
  {
    slug: 'lastpass', name: 'LastPass', category: 'security-backup',
    priceMo: 3, priceYr: 36,
    note: 'LastPass is a hosted password manager. Premium plans list from $3/mo billed annually (about $36/yr), with a device-limited free tier.',
    apps: [
      {
        slug: 'vaultly',
        whyUs: 'Vaultly gives you the password manager without the hosted target: zero-knowledge client-side encryption, shared team vaults, cards and notes, inline TOTP and an opt-in breach check — self-hosted for $39 once, no per-seat pricing ever.',
        theirsWins: 'LastPass requires no server to run, syncs across every device out of the box, and has mature browser extensions and emergency-access features. Vaultly trades that convenience for custody of your own data.',
      },
    ],
  },
  {
    slug: 'dropbox', name: 'Dropbox', category: 'security-backup',
    priceMo: 11.99, priceYr: 119.88,
    note: 'Dropbox is cloud file storage and sharing. Plus plans list from $11.99/mo billed annually (about $119.88/yr) for 2 TB of storage.',
    apps: [
      {
        slug: 'droplink',
        whyUs: 'A common Dropbox habit is really just "get this big file to a client". Droplink is a self-hosted transfer tool: chunked resumable uploads, password-protected links, download limits and automatic cleanup — $79 once on your own server, with no storage tier to outgrow.',
        theirsWins: 'Dropbox syncs folders across every device, versions files, and underpins shared team workspaces. Droplink moves files from A to B; it is not a synced drive or a collaboration space.',
      },
      {
        slug: 'syncvault',
        whyUs: 'If Dropbox is your backup strategy, Syncvault is the real thing: client-side AES-256-GCM encryption, content-addressed dedupe and point-in-time versioning, pushing to your own S3-compatible bucket or NAS. $29 once — your storage bill becomes a few dollars of object storage you control.',
        theirsWins: 'Dropbox is effortless: install it and every file is everywhere, with sharing and rewind built in. Syncvault is a backup agent, not a sync drive — restored files come from your bucket, not a magic folder.',
      },
    ],
  },
  {
    slug: 'harvest', name: 'Harvest', category: 'productivity',
    priceMo: 11, priceYr: 132,
    note: 'Harvest is time tracking and invoicing software for teams. Pro plans list from $11/seat/mo billed annually (about $132/seat/yr).',
    apps: [
      {
        slug: 'timevault',
        whyUs: 'Timevault covers Harvest\'s core loop: one-click timers, projects and clients with hourly rates, weekly timesheets and billable reports that turn straight into invoices — self-hosted for $79 once, whether one person or twenty track time.',
        theirsWins: 'Harvest adds expense tracking, budget alerts, team capacity views and deep integrations with project tools and accounting software. Timevault is time and billing only; expense capture and scheduling are out of scope.',
      },
    ],
  },
  {
    slug: 'evernote', name: 'Evernote', category: 'productivity',
    priceMo: 10.83, priceYr: 129.99,
    note: 'Evernote is a hosted note-taking app with web clipping and document search. Personal plans list at about $10.83/mo billed annually (around $129.99/yr).',
    apps: [
      {
        slug: 'quillpad',
        whyUs: 'Quillpad keeps your notes as plain markdown files in a folder you own — wikilinks, backlinks, tags, daily notes and a global quick-capture hotkey — with full-text search that never touches a server. $29 once and your notes outlive any company.',
        theirsWins: 'Evernote\'s web clipper, document and handwriting OCR, and sync across every device are genuinely best-in-class. Quillpad is local markdown notes — clipping and mobile sync are things you wire up yourself.',
      },
    ],
  },
  {
    slug: 'roam-research', name: 'Roam Research', category: 'productivity',
    priceMo: 15, priceYr: 165,
    note: 'Roam Research is a networked note-taking tool built around bidirectional links and daily notes. It lists at $15/mo, or $165 billed yearly.',
    apps: [
      {
        slug: 'quillpad',
        whyUs: 'Roam\'s core ideas — [[wikilinks]], backlinks and daily notes — are Quillpad\'s core too, but your graph lives in a folder of plain markdown files on your disk. $29 once instead of $165 every year, with full-text search and a quick switcher, no account required.',
        theirsWins: 'Roam\'s block-level references, queries and graph database go deeper than file-based linking, and it syncs collaboratively in the cloud. Quillpad is a personal, page-based knowledge base — no multiplayer, no block embeds.',
      },
    ],
  },
  {
    slug: 'buzzsprout', name: 'Buzzsprout', category: 'video-audio',
    priceMo: 12, priceYr: 144,
    note: 'Buzzsprout is a podcast hosting platform. Plans list from $12/mo (about $144/yr), tiered by monthly upload hours.',
    apps: [
      {
        slug: 'castport',
        whyUs: 'Castport hosts the podcast without the meter: unlimited shows and episodes, an Apple/Spotify-valid RSS feed, public pages, an embeddable player, chapters and download stats — self-hosted for $99 once. A weekly show stops paying $144/yr just to keep its feed alive.',
        theirsWins: 'Buzzsprout is zero-maintenance: global CDN delivery, transcription add-ons, dynamic ad insertion and distribution guides out of the box. Castport runs on your server — bandwidth and uptime are yours to manage.',
      },
    ],
  },
  {
    slug: 'podbean', name: 'Podbean', category: 'video-audio',
    priceMo: 9, priceYr: 108,
    note: 'Podbean is a podcast hosting and monetization platform. Unlimited audio plans list from $9/mo billed annually (about $108/yr).',
    apps: [
      {
        slug: 'castport',
        whyUs: 'Castport replaces Podbean\'s hosting core: upload episodes, get a valid RSS feed, public pages, an embeddable player, Podcasting 2.0 chapters, scheduling and download stats — $99 once on infrastructure you own, with no monthly bandwidth math.',
        theirsWins: 'Podbean bundles monetization — patron programs, dynamic ads, Apple Podcasts subscriptions — plus live audio and a mobile app. Castport is hosting and stats; monetization is yours to bolt on.',
      },
    ],
  },
  {
    slug: 'quickbooks', name: 'QuickBooks', category: 'finance-admin',
    priceMo: 35, priceYr: 420,
    note: 'QuickBooks Online is Intuit\'s small-business accounting platform. Simple Start lists from $35/mo (about $420/yr), with higher tiers for more users and features.',
    apps: [
      {
        slug: 'billcraft',
        whyUs: 'Honest scope: Billcraft overlaps QuickBooks on invoicing only — clients, professional PDF invoices, share links and recurring billing, self-hosted for $99 once. If invoices are the main reason you pay $35/mo, that is a year of QuickBooks every year you keep it.',
        theirsWins: 'QuickBooks is full double-entry accounting: bank feeds, reconciliation, payroll, tax reports and your accountant\'s default login. Billcraft does not do books — it sends invoices, and the accounting stays with your accountant.',
      },
      {
        slug: 'ledgerly',
        whyUs: 'The overlap here is expense tracking: Ledgerly does fast expense entry, local receipt OCR, categories, budgets, multi-currency and reports — on your own hardware for $79 once. For freelancers who use QuickBooks mostly as a receipt shoebox, that shoebox can cost $79 total.',
        theirsWins: 'QuickBooks reconciles bank feeds, tracks sales tax, runs payroll and produces accountant-ready ledgers. Ledgerly tracks expenses and budgets — it is not a general ledger and will not file anything for you.',
      },
    ],
  },
  {
    slug: 'hellosign', name: 'Dropbox Sign (HelloSign)', category: 'finance-admin',
    priceMo: 15, priceYr: 180,
    note: 'Dropbox Sign (formerly HelloSign) is an e-signature service. Essentials plans list from $15/mo billed annually (about $180/yr) for a single user.',
    apps: [
      {
        slug: 'inkseal',
        whyUs: 'Inkseal runs the signature flow on your own box: upload a PDF, place fields with drag and drop, route signers sequentially or in parallel, and get a flattened final document with a hash-chained audit trail. $149 once with no envelope quotas — the first document is free to try.',
        theirsWins: 'Dropbox Sign needs no hosting, offers templates, team management, SMS delivery and long-standing legal-compliance documentation. Inkseal is self-hosted — you own the infrastructure and the compliance conversation.',
      },
    ],
  },
  {
    slug: 'ticket-tailor', name: 'Ticket Tailor', category: 'business-ops',
    priceMo: null, priceYr: null,
    note: 'Ticket Tailor is an event ticketing platform priced per ticket sold — from about $0.26/ticket with prepay credits or around $0.75 pay-as-you-go; free events are free.',
    apps: [
      {
        slug: 'eventcraft',
        whyUs: 'Eventcraft flips ticketing to a flat cost: event pages, ticket tiers, QR-code tickets, webcam door check-in and auto-promoting waitlists, with money running through your own Stripe link. $39 once — at $0.75/ticket, a single 100-seat event would nearly cover it.',
        theirsWins: 'Ticket Tailor needs zero hosting, handles payment processing end-to-end, and scales to any box-office volume with per-ticket pricing that tracks your revenue. Eventcraft is self-hosted — you run the infrastructure and your own Stripe account.',
      },
    ],
  },
  {
    slug: 'fullstory', name: 'FullStory', category: 'marketing-seo',
    priceMo: null, priceYr: null,
    note: 'FullStory is a digital analytics platform with session replay, heatmaps and funnel analysis. Pricing is quote-based; entry plans are commonly reported in the hundreds of dollars per month.',
    apps: [
      {
        slug: 'clickmap',
        whyUs: 'Clickmap covers the behavioral core — click heatmaps, scroll-depth charts, session recordings and rage-click detection — from a one-tag install, all stored in your own SQLite file. $49 once instead of a five-figure analytics contract, and visitor data never leaves your server.',
        theirsWins: 'FullStory adds autocaptured funnels, retention analysis, segmentation, data warehouse sync and enterprise privacy controls. Clickmap shows you where people click and struggle; it is not a product-analytics suite.',
      },
    ],
  },
];
