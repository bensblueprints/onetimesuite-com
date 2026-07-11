/*
 * extra-products.js — shipped apps that live outside advancedmarketing-main's
 * products.js. Same shape as products.js entries, plus:
 *   buyUrl       — checkout URL if not Whop
 *   closedSource — true = paid, closed-source; never render GitHub/MIT copy
 *   stamp        — hero stamp text override
 *   seoRelated   — [path, label] pairs to the hand-written SEO posts
 * Both are desktop apps. They are NOT part of the $997 bundle math (that
 * receipt is the 56-app catalog).
 */
module.exports = [
  {
    slug: 'bloomrecorder',
    brand: 'BloomRecorder',
    repo: 'bloomrecorder',
    price: 29,
    icon: '🎥',
    tagline: 'The Loom replacement you buy once.',
    oneliner: 'Record screen, camera or both — 100% local, unlimited length, MP4 & GIF export. No cloud, no account, no subscription.',
    competitor: 'Loom',
    compPrice: '$15/user/mo',
    compYr: 180,
    heroLead: 'Loom Business is $15 per user per month — about $180 a year, forever — and every clip you record lives on their servers. BloomRecorder does the same job entirely on your machine: zero telemetry, zero network calls, zero accounts, recordings saved straight to your own disk. $29, once.',
    features: [
      ['🖥️', 'Screen, camera, or both', 'Record either source alone or both together — as split files or picture-in-picture combined.'],
      ['🔎', 'Source picker with live thumbnails', 'See exactly what each screen and window looks like before you hit record.'],
      ['🎚️', 'Device selection', 'Pick your camera and microphone; system audio and mic are mixed into every output automatically.'],
      ['📁', 'Your disk, your folder', 'Choose the output folder — recordings never touch a cloud, an account, or anyone else\'s servers.'],
      ['⏺️', 'Floating recording pill', 'An always-on-top pill with a running timer and a stop button, out of the way of what you\'re capturing.'],
      ['🗂️', 'Local library', 'Every recording lands in a local library with auto-generated thumbnails, so past clips are easy to find.'],
      ['🎬', 'MP4 export', 'H.264 with faststart — plays everywhere, streams instantly, no re-encoding roulette.'],
      ['🌀', 'Optimized GIF export', 'Two-pass palettegen/paletteuse encoding — crisp GIFs, not the muddy single-pass kind.'],
      ['✂️', 'Trim before export', 'Cut the fumbling at the start and the reach-for-the-mouse at the end before you share.'],
      ['🔒', '100% local', 'Zero telemetry, zero network calls, zero accounts. Nothing leaves your machine, ever.'],
    ],
    compRows: [
      ['Price', '$29 once', '$15/user/mo (~$180/yr, forever); Business+AI $24/mo'],
      ['Recording length', 'Unlimited', 'Plan-limited'],
      ['Where recordings live', 'Your own disk', 'Loom\'s servers'],
      ['Accounts required', 'None', 'Yes'],
      ['Telemetry / network calls', 'Zero', 'Yes'],
      ['Screen + camera (PiP)', 'Yes — split or combined', 'Yes'],
      ['GIF export', 'Optimized two-pass', 'Limited'],
      ['Source code', 'MIT, on GitHub', 'Closed'],
    ],
    payback: 'Against Loom Business, BloomRecorder pays for itself in under two months — and every recording after that stays on hardware you own.',
    steps: [
      ['Buy once on Whop', 'One payment of $29 gets you the packaged installer. Or clone the MIT source and build it yourself for free.'],
      ['Pick your sources', 'Choose screen, camera or both from the live-thumbnail picker, select your mic, set your output folder.'],
      ['Record, trim, export', 'Hit record, stop from the floating pill, trim, then export MP4 or an optimized GIF — straight from your own disk.'],
    ],
    faq: [
      ['Is there really no account or cloud?', 'Really. BloomRecorder makes zero network calls — no telemetry, no login, no upload. Recordings are files in a folder you chose on your own disk.'],
      ['Is recording length limited?', 'No. There are no plan tiers, so there is nothing to gate. Record as long as your disk has space.'],
      ['Can I record my screen and camera at the same time?', 'Yes — either as separate files or combined picture-in-picture, with system audio and your mic mixed into the output.'],
      ['Is the source code available?', 'Yes — BloomRecorder is MIT-licensed at github.com/bensblueprints/bloomrecorder. Buying the $29 package gets you the built installer and updates; building from source is free.'],
      ['How do I share a recording without Loom-style links?', 'Export an MP4 (H.264 faststart plays everywhere) or an optimized GIF and share it however you already share files — Slack, email, Drive, your own server.'],
    ],
    seoRelated: [
      ['/loom-alternative/', 'Loom alternative'],
      ['/open-source-loom-alternative/', 'Open-source Loom alternative'],
      ['/vidyard-alternative/', 'Vidyard alternative'],
    ],
  },
  {
    slug: 'wispertalk',
    brand: 'WisperTalk',
    repo: null,
    price: 49,
    icon: '🎙️',
    tagline: 'Hold a hotkey. Speak. Clean text appears where your cursor is.',
    oneliner: 'Lifetime AI dictation for Windows & macOS — Groq Whisper transcription with Llama 3.3 cleanup. $49 once, not $15 every month.',
    competitor: 'Wispr Flow',
    compPrice: '$15/mo',
    compYr: 144,
    heroLead: 'Wispr Flow charges $15 a month ($144/yr billed annually) for dictation — and there is no way to just buy it. WisperTalk is the same core magic for $49, once: hold the hotkey, speak, release, and polished text lands wherever your cursor is. Transcription runs on Groq Whisper; Llama 3.3 turns the raw transcript into clean, punctuated prose. Need a second machine? Add a device license for $10.',
    buyUrl: 'https://wispertalk.com',
    closedSource: true,
    stamp: 'Desktop app · Windows + macOS · lifetime license',
    features: [
      ['⌨️', 'Hold-to-talk hotkey', 'Hold the hotkey anywhere, speak, release — the text appears at your cursor. No app-switching, no paste step.'],
      ['⚡', 'Groq Whisper transcription', 'Fast, accurate speech-to-text on Groq\'s Whisper — built for daily, all-day dictation.'],
      ['🪄', 'Llama 3.3 cleanup', 'The raw transcript is rewritten into polished, properly punctuated text — not a wall of run-ons.'],
      ['🖱️', 'Works in every app', 'Email, docs, chat, code comments — if your cursor blinks there, WisperTalk types there.'],
      ['💻', 'Windows + macOS', 'One tool across both platforms.'],
      ['🔑', 'Simple lifetime licensing', '$49 once for your first device; additional device licenses are $10 each, one device per license, enforced server-side.'],
    ],
    compRows: [
      ['Price', '$49 once (lifetime)', '$15/mo (~$180/yr; $144/yr annual)'],
      ['Buy-once option', 'Yes — that\'s the whole model', 'None'],
      ['Cost after 3 years', '$49 (+$10 per extra device)', '~$540'],
      ['Transcription engine', 'Groq Whisper', 'Proprietary'],
      ['AI text cleanup', 'Yes (Llama 3.3)', 'Yes'],
      ['Extra devices', '$10 one-time per device license', 'Included per subscription seat'],
      ['Exposure to price hikes', 'None — already owned', 'High (ongoing subscription)'],
    ],
    payback: 'WisperTalk costs less than four months of Wispr Flow — after that, every month of dictation is free, forever.',
    steps: [
      ['Buy your lifetime license', 'One payment of $49 at wispertalk.com. Add extra device licenses for $10 each whenever you need them.'],
      ['Install and set your hotkey', 'Windows or macOS — install, sign in with your license, pick the hold-to-talk key.'],
      ['Talk instead of type', 'Hold, speak, release. Groq Whisper transcribes; Llama 3.3 cleans it up; the text lands at your cursor.'],
    ],
    faq: [
      ['Is WisperTalk really a one-time purchase?', 'Yes — $49 buys a lifetime license. There is no subscription, no renewal, and no annual price creep. Additional devices are a one-time $10 per device license.'],
      ['Is WisperTalk free or open source?', 'No — WisperTalk is a paid, closed-source product. Its releases are compiled binaries, and licenses are enforced server-side. The value here isn\'t "free and open," it\'s buy-once instead of rent-forever: a lifetime license for a fraction of one year of Wispr Flow.'],
      ['How accurate is it?', 'Transcription runs on Groq Whisper — fast, high-quality speech-to-text — and Llama 3.3 rewrites the raw transcript into clean, punctuated prose before it reaches your cursor.'],
      ['How does device licensing work?', 'One device per license, enforced server-side. Your $49 lifetime purchase covers your first device; each additional machine is a one-time $10 device license.'],
      ['Which platforms does it support?', 'Windows and macOS.'],
    ],
    seoRelated: [
      ['/wispr-flow-alternative/', 'Wispr Flow alternative'],
      ['/wispertalk-vs-wispr-flow/', 'WisperTalk vs Wispr Flow'],
    ],
  },
];
