/*
 * Coming-soon catalog — products 51–100 from the onetime-suite-plans ROADMAP
 * (Batches 11–20) that are planned but not yet built, plus Dealstack (#45,
 * shipped on GitHub, landing page pending). No product pages are generated
 * for these; they render as caution-taped cards on the hub.
 *
 * kind: 'desktop' (Electron, offline) | 'web' (self-hosted VPS)
 */
module.exports = [
  /* ---- Batch 11 — Support & Ops ---- */
  { brand: 'Deskly', icon: '🎫', kind: 'web', price: 49, vs: 'Zendesk', vsPrice: '$55/mo', one: 'Help-desk tickets on your own server — inbox, assignments, canned replies, SLAs.' },
  { brand: 'Upkeep Status', icon: '🟢', kind: 'web', price: 29, vs: 'Statuspage.io', vsPrice: '$29/mo', one: 'A status page you host yourself — incidents, uptime history, subscriber alerts.' },
  { brand: 'Linkguard', icon: '🔗', kind: 'web', price: 24, vs: 'Dr. Link Check', vsPrice: '$12+/mo', one: 'Crawls your site on a schedule and reports every broken link before Google finds it.' },
  { brand: 'Maptrail', icon: '🗺️', kind: 'desktop', price: 19, vs: 'Screaming Frog', vsPrice: '£199/yr', one: 'Desktop sitemap generator and crawler — XML sitemaps for any site, offline.' },
  { brand: 'Docsmith API', icon: '📘', kind: 'desktop', price: 29, vs: 'ReadMe.io', vsPrice: '$99/mo', one: 'Beautiful API documentation generated from your OpenAPI spec — static, yours.' },

  /* ---- Batch 12 — Security / Dev ---- */
  { brand: 'Vaultly', icon: '🔐', kind: 'web', price: 39, vs: '1Password Teams', vsPrice: '$7.99/user/mo', one: 'Self-hosted password manager for teams — your vault on your server, no per-seat rent.' },
  { brand: 'Keyloop', icon: '🔑', kind: 'desktop', price: 19, vs: 'Authy', vsPrice: 'account lock-in', one: '2FA authenticator with real, exportable encrypted backups you control.' },
  { brand: 'Secretbox', icon: '🗝️', kind: 'web', price: 39, vs: 'Doppler', vsPrice: '$12/user/mo', one: 'Environment secrets manager — projects, environments, access tokens, audit log.' },
  { brand: 'Certwatch', icon: '📜', kind: 'web', price: 24, vs: 'paid SSL monitors', vsPrice: '$10–20/mo', one: 'Watches every certificate you own and alerts you long before it expires.' },
  { brand: 'Logbin', icon: '🪵', kind: 'web', price: 34, vs: 'Papertrail', vsPrice: '$7+/mo', one: 'Log aggregation and live tail across your servers — search, filters, retention you set.' },

  /* ---- Batch 13 — Content creation ---- */
  { brand: 'Resumecraft', icon: '📄', kind: 'desktop', price: 19, vs: 'Zety', vsPrice: '$23.70/mo', one: 'Resume builder with recruiter-grade templates — export PDF forever, no subscription.' },
  { brand: 'Pitchcraft', icon: '📑', kind: 'web', price: 29, vs: 'Proposify', vsPrice: '$19+/user/mo', one: 'Proposal generator — branded templates, e-accept, and a pipeline of who viewed what.' },
  { brand: 'Contractly', icon: '✍️', kind: 'desktop', price: 29, vs: 'PandaDoc', vsPrice: '$19+/user/mo', one: 'Contract template library with variables, merge fields and clean PDF export.' },
  { brand: 'Captionly', icon: '💬', kind: 'desktop', price: 34, vs: 'Submagic', vsPrice: '$18–39/mo', one: 'Auto-captions for short-form video with styled, animated subtitles — rendered locally.' },

  /* ---- Batch 14 — Marketing extras ---- */
  { brand: 'UTMcraft', icon: '🧷', kind: 'web', price: 19, vs: 'UTM.io', vsPrice: '$29/mo', one: 'UTM campaign builder your whole team shares — conventions enforced, links logged.' },
  { brand: 'Reflink', icon: '🤝', kind: 'web', price: 39, vs: 'Tapfiliate', vsPrice: '$89/mo', one: 'Affiliate tracking on your own domain — links, cookies, conversions, payout reports.' },
  { brand: 'Star Stack', icon: '⭐', kind: 'web', price: 29, vs: 'Trustpilot Business', vsPrice: '$199+/mo', one: 'Collect and display reviews in an embeddable widget — your reviews, your database.' },
  { brand: 'Clickmap', icon: '🖱️', kind: 'web', price: 49, vs: 'Hotjar', vsPrice: '$39+/mo', one: 'Heatmaps and session recordings, self-hosted — see what visitors do without leaking their data.' },
  { brand: 'Splitpoint', icon: '🔀', kind: 'web', price: 49, vs: 'VWO', vsPrice: '$199/mo', one: 'A/B testing with a tiny script and honest stats — experiments run on your infrastructure.' },

  /* ---- Batch 15 — Team / HR ---- */
  { brand: 'Hirestack', icon: '🧑‍💼', kind: 'web', price: 49, vs: 'Greenhouse', vsPrice: '$$$/yr contracts', one: 'Applicant tracking — pipeline stages, scorecards, and a careers page you own.' },
  { brand: 'Shiftly', icon: '🗓️', kind: 'web', price: 29, vs: 'When I Work', vsPrice: '$2.50/user/mo', one: 'Shift scheduling for hourly teams — drag-drop rota, swaps, and printable weeks.' },
  { brand: 'Rampcheck', icon: '✅', kind: 'web', price: 29, vs: 'Trainual', vsPrice: '$99/mo', one: 'Onboarding checklists and SOPs — every new hire walks the same proven path.' },
  { brand: 'Punchcard', icon: '⏱️', kind: 'web', price: 29, vs: 'QuickBooks Time', vsPrice: '$10+/user/mo', one: 'Timesheets with approval flow — clock in, submit, approve, export to payroll.' },

  /* ---- Batch 16 — Finance / personal ---- */
  { brand: 'Ledgerlite Home', icon: '🏠', kind: 'desktop', price: 15, vs: 'YNAB', vsPrice: '$14.99/mo', one: 'Personal budgeting with envelopes and rollover — your money data stays on your disk.' },
  { brand: 'Billoop', icon: '🔁', kind: 'web', price: 49, vs: 'Chargebee', vsPrice: '% of revenue', one: 'Lightweight recurring billing — plans, invoices, dunning, on your own Stripe account.' },
  { brand: 'Quotewell', icon: '🧮', kind: 'desktop', price: 29, vs: 'Proposify', vsPrice: '$19+/user/mo', one: 'Quotes and estimates with line items, margins and clean branded PDFs.' },
  { brand: 'Snapreceipt', icon: '📸', kind: 'desktop', price: 19, vs: 'Expensify', vsPrice: '$5–9/user/mo', one: 'Scan receipts to searchable expenses with local OCR — nothing uploaded anywhere.' },

  /* ---- Batch 17 — Local business ---- */
  { brand: 'Listcraft', icon: '🏘️', kind: 'web', price: 39, vs: 'Zillow Premier Agent', vsPrice: '$$$/mo', one: 'Property listing site for agents — listings, galleries, inquiries, on your domain.' },
  { brand: 'Menuly', icon: '🍽️', kind: 'web', price: 24, vs: 'Toast QR', vsPrice: '$29+/mo', one: 'QR menus for restaurants — update prices in seconds, no reprints, no monthly fee.' },
  { brand: 'Remindly', icon: '📲', kind: 'web', price: 34, vs: 'SimpleTexting', vsPrice: '$29+/mo', one: 'Appointment reminder SMS on your own Twilio account — pay carrier rates, not markup.' },
  { brand: 'Askback', icon: '🙋', kind: 'web', price: 34, vs: 'Podium', vsPrice: '$289/mo', one: 'Automated review requests by SMS/email after every job — BYO Twilio and SMTP.' },
  { brand: 'Citewatch', icon: '📍', kind: 'web', price: 34, vs: 'BrightLocal', vsPrice: '$39+/mo', one: 'Local SEO citation tracker — where your business is listed, where it isn\'t, what changed.' },

  /* ---- Batch 18 — Education / community ---- */
  { brand: 'Lessonforge', icon: '🎓', kind: 'web', price: 49, vs: 'Teachable', vsPrice: '$39+/mo + fees', one: 'Course builder and LMS — lessons, drip, quizzes, students, zero platform fees.' },
  { brand: 'Quizcraft', icon: '❓', kind: 'web', price: 29, vs: 'Outgrow', vsPrice: '$22+/mo', one: 'Quiz and assessment builder with scoring, branching and lead capture.' },
  { brand: 'Forumly', icon: '🗣️', kind: 'web', price: 39, vs: 'Circle', vsPrice: '$89/mo', one: 'A community forum you own — threads, reactions, moderation, members.' },
  { brand: 'Roster', icon: '📇', kind: 'web', price: 19, vs: 'Glue Up', vsPrice: '$$$/yr', one: 'Member directory for clubs and associations — profiles, dues status, exports.' },
  { brand: 'Eventcraft', icon: '🎟️', kind: 'web', price: 39, vs: 'Eventbrite', vsPrice: '2.7% + $0.79/ticket', one: 'Event registration and ticketing with zero per-ticket fees — your Stripe, your list.' },

  /* ---- Batch 19 — Creative / design ---- */
  { brand: 'Mockcraft', icon: '🖼️', kind: 'desktop', price: 19, vs: 'Placeit', vsPrice: '$14.95/mo', one: 'Product mockup generator — drop your design onto devices, apparel and print scenes.' },
  { brand: 'Postcraft Templates', icon: '🎨', kind: 'desktop', price: 19, vs: 'Canva Pro', vsPrice: '$12.99/mo', one: 'Social graphics templates you edit offline and export at full resolution.' },
  { brand: 'Slidecraft', icon: '📊', kind: 'desktop', price: 29, vs: 'Beautiful.ai', vsPrice: '$12–40/mo', one: 'Presentation builder with smart layouts — export to PDF/PPTX, work offline.' },

  /* ---- Batch 20 — Misc SaaS killers ---- */
  { brand: 'Redirectly', icon: '↪️', kind: 'web', price: 24, vs: 'Rebrandly', vsPrice: '$29+/mo', one: 'Redirect manager — 301s, vanity paths and click counts on your own domain.' },
  { brand: 'Clientdesk', icon: '🧑‍💻', kind: 'web', price: 39, vs: 'Baremetrics', vsPrice: '$50+/mo', one: 'Customer portal for invoices, subscriptions and billing history — self-hosted.' },
  { brand: 'Pulsecheck', icon: '📈', kind: 'web', price: 29, vs: 'Delighted', vsPrice: '$224/mo', one: 'NPS surveys by email and embed — scores, trends and verbatims in your database.' },
  { brand: 'Syncvault', icon: '☁️', kind: 'desktop', price: 29, vs: 'Backblaze', vsPrice: '$9/mo/computer', one: 'Scheduled backup and sync to any S3-compatible bucket — encrypted, incremental.' },
  { brand: 'Voicebox', icon: '🗳️', kind: 'web', price: 34, vs: 'Canny', vsPrice: '$50+/mo', one: 'Feature voting and public roadmap — let users tell you what to build next.' },

  /* ---- Shipped on GitHub, landing page in progress ---- */
  { brand: 'Dealstack', icon: '🧲', kind: 'web', price: 39, vs: 'Pipedrive', vsPrice: '$24+/user/mo', one: 'Lightweight CRM — contacts, deals and a pipeline board on your own server.', repoLive: true },
];
