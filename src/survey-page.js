/*
 * survey-page.js — HTML for /survey/ (post-signup "what do you use" survey)
 * Self-contained page, inline CSS, vanilla JS posting to /api/survey.
 * Reached via redirect from /lead/ (?email= prefills the hidden email field).
 * Visual language mirrors src/site.css: paper ground, ink 1.5px borders,
 * 12px radius, mono accents, sticker orange #e8420c.
 */

const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='22' fill='%23e8420c'/%3E%3Ctext x='50' y='68' font-size='52' font-family='monospace' font-weight='700' fill='white' text-anchor='middle'%3E%241%3C/text%3E%3C/svg%3E";

const TOOLS = [
  'Trello', 'Notion', 'Asana', 'Monday.com', 'ClickUp', 'Otter.ai', 'Loom',
  'Calendly', 'Typeform', 'DocuSign', 'Adobe Acrobat', 'Canva Pro', 'Figma',
  'Mailchimp', 'Hootsuite', 'Buffer', 'Zapier', 'Slack', 'Zoom', 'Dropbox',
  'Google Workspace', 'Evernote', 'WiseStamp', 'Bitly', 'Jasper', 'Grammarly',
];

const chips = TOOLS.map(t =>
  `      <label class="chip"><input type="checkbox" name="tool" value="${t}"><span>${t}</span></label>`
).join('\n');

module.exports = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>One more thing — OneTimeSuite</title>
  <meta name="description" content="Tell me which subscription tools you're paying for — it decides what OneTimeSuite builds next.">
  <link rel="icon" href="${FAVICON}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="One more thing — OneTimeSuite">
  <meta property="og:description" content="Tick the software you use — it decides what gets built next.">
  <meta property="og:url" content="https://onetimesuite.com/survey/">
  <meta property="og:site_name" content="OneTimeSuite">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;800&family=Instrument+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --paper: #f4f5f2;
      --ink: #17191d;
      --ink-soft: #4b4e55;
      --ink-faint: #85888f;
      --price: #e8420c;
      --paper-raised: #ffffff;
      --display: "Bricolage Grotesque", system-ui, sans-serif;
      --body: "Instrument Sans", system-ui, sans-serif;
      --mono: "IBM Plex Mono", ui-monospace, monospace;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: var(--body); font-size: 1.0625rem; line-height: 1.65;
      color: var(--ink); background: var(--paper);
      min-height: 100vh; display: flex; flex-direction: column; align-items: center;
      padding: 2rem 1.25rem 4rem;
    }
    .wordmark {
      font-family: var(--mono); font-size: 0.85rem; font-weight: 600;
      color: var(--ink); text-decoration: none; letter-spacing: -0.02em;
      border: 1.5px solid var(--ink); border-radius: 999px; padding: 0.3rem 0.9rem;
      background: var(--paper-raised);
    }
    .wordmark:hover { background: var(--ink); color: var(--paper); }
    .notice {
      width: 100%; max-width: 640px; margin-top: 2rem;
      font-family: var(--mono); font-size: 0.85rem; font-weight: 600;
      background: var(--paper-raised); border: 1.5px solid var(--ink);
      border-radius: 12px; padding: 0.7rem 1.1rem; text-align: center;
      box-shadow: 3px 3px 0 var(--ink);
    }
    .card {
      width: 100%; max-width: 640px; margin-top: 1.4rem;
      background: var(--paper-raised); border: 1.5px solid var(--ink);
      border-radius: 12px; padding: 2.4rem 2.2rem;
      box-shadow: 5px 5px 0 var(--ink);
    }
    .stamp {
      display: inline-block; font-family: var(--mono); font-size: 0.78rem; font-weight: 600;
      border: 1.5px solid var(--ink); border-radius: 999px; padding: 0.2rem 0.8rem;
      background: var(--paper); transform: rotate(-2deg); margin-bottom: 1.2rem;
    }
    h1 { font-family: var(--display); font-weight: 800; font-size: 2rem; line-height: 1.15; letter-spacing: -0.02em; margin-bottom: 1rem; }
    .lead { color: var(--ink-soft); font-size: 1.05rem; margin-bottom: 1.8rem; }
    .grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem;
      margin-bottom: 1.4rem;
    }
    @media (max-width: 560px) { .grid { grid-template-columns: repeat(2, 1fr); } }
    .chip { display: block; cursor: pointer; }
    .chip input { position: absolute; opacity: 0; pointer-events: none; }
    .chip span {
      display: block; font-family: var(--mono); font-size: 0.82rem; font-weight: 500;
      text-align: center; padding: 0.5rem 0.4rem;
      background: var(--paper); border: 1.5px solid var(--ink); border-radius: 12px;
      transition: transform 0.08s ease, box-shadow 0.08s ease, background 0.08s ease;
      user-select: none;
    }
    .chip:hover span { box-shadow: 2px 2px 0 var(--ink); transform: translate(-1px, -1px); }
    .chip input:checked + span { background: var(--price); color: #fff; box-shadow: 3px 3px 0 var(--ink); }
    .chip input:focus-visible + span { outline: 2px solid var(--price); outline-offset: 2px; }
    label.field { display: block; font-family: var(--mono); font-size: 0.8rem; font-weight: 600; margin-bottom: 0.35rem; }
    input[type="text"], input[type="email"] {
      width: 100%; font-family: var(--body); font-size: 1rem; color: var(--ink);
      background: var(--paper); border: 1.5px solid var(--ink); border-radius: 12px;
      padding: 0.7rem 0.9rem; margin-bottom: 1.1rem; outline: none;
    }
    input[type="text"]:focus, input[type="email"]:focus { box-shadow: 3px 3px 0 var(--ink); }
    #email-row { display: none; }
    #email-row.show { display: block; }
    button {
      width: 100%; font-family: var(--mono); font-size: 1rem; font-weight: 600;
      color: #fff; background: var(--price); border: 1.5px solid var(--ink);
      border-radius: 12px; padding: 0.85rem 1rem; cursor: pointer;
      box-shadow: 4px 4px 0 var(--ink); transition: transform 0.08s ease, box-shadow 0.08s ease;
    }
    button:hover:not(:disabled) { transform: translate(-1px, -1px); box-shadow: 5px 5px 0 var(--ink); }
    button:active:not(:disabled) { transform: translate(2px, 2px); box-shadow: 2px 2px 0 var(--ink); }
    button:disabled { opacity: 0.6; cursor: wait; }
    .small { font-family: var(--mono); font-size: 0.75rem; color: var(--ink-faint); text-align: center; margin-top: 1rem; }
    .done { display: none; text-align: center; padding: 1.5rem 0 0.5rem; }
    .done.show { display: block; }
    .done .big { font-family: var(--display); font-weight: 800; font-size: 1.5rem; margin-bottom: 0.6rem; }
    .done p { color: var(--ink-soft); margin-bottom: 1.4rem; }
    .done .tick {
      display: inline-block; font-family: var(--mono); font-weight: 700; font-size: 1.6rem;
      width: 3.2rem; height: 3.2rem; line-height: 3rem; text-align: center;
      border: 1.5px solid var(--ink); border-radius: 50%;
      background: var(--price); color: #fff; margin-bottom: 1rem;
      box-shadow: 3px 3px 0 var(--ink);
    }
    .done .browse {
      display: inline-block; font-family: var(--mono); font-size: 1rem; font-weight: 600;
      color: #fff; background: var(--ink); text-decoration: none;
      border: 1.5px solid var(--ink); border-radius: 12px; padding: 0.85rem 1.6rem;
      box-shadow: 4px 4px 0 var(--price); transition: transform 0.08s ease, box-shadow 0.08s ease;
    }
    .done .browse:hover { transform: translate(-1px, -1px); box-shadow: 5px 5px 0 var(--price); }
  </style>
</head>
<body>
  <a class="wordmark" href="/">onetimesuite.com</a>
  <p class="notice">Your links are on their way — check your inbox.</p>
  <main class="card">
    <form id="survey-form" novalidate>
      <span class="stamp">one more thing</span>
      <h1>Help me kill the right subscriptions</h1>
      <p class="lead">What software are you paying for (or fighting with) right now? Tick everything you use — it decides what I build next.</p>
      <div class="grid">
${chips}
      </div>
      <label class="field" for="other">Other (anything I missed?)</label>
      <input type="text" id="other" name="other" maxlength="500" placeholder="e.g. a video editor, an e-sign tool…">
      <div id="email-row">
        <label class="field" for="email">Email (optional — ties this to your signup)</label>
        <input type="email" id="email" name="email" autocomplete="email">
      </div>
      <input type="hidden" id="email-hidden">
      <button id="send" type="submit">Log my answers</button>
      <p class="small">Best-effort — skip it if you're in a hurry.</p>
    </form>
    <div class="done" id="done">
      <span class="tick">&#10003;</span>
      <p class="big">Logged.</p>
      <p>Logged. You'll be first to know when the replacement launches.</p>
      <a class="browse" href="/">Browse the suite &rarr;</a>
    </div>
  </main>
  <script>
    // prefill email from ?email= (arriving from /lead/); otherwise offer an optional field
    var qs = new URLSearchParams(window.location.search);
    var qEmail = (qs.get('email') || '').trim();
    if (qEmail) {
      document.getElementById('email-hidden').value = qEmail;
    } else {
      document.getElementById('email-row').className = 'show';
    }

    var form = document.getElementById('survey-form');
    var btn = document.getElementById('send');

    function showDone() {
      form.style.display = 'none';
      document.getElementById('done').className = 'done show';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = document.getElementById('email-hidden').value.trim() ||
                  document.getElementById('email').value.trim();
      var tools = Array.prototype.slice.call(
        form.querySelectorAll('input[name="tool"]:checked')
      ).map(function (c) { return c.value; });
      var other = document.getElementById('other').value.trim();
      btn.disabled = true;
      btn.textContent = 'Logging…';
      fetch('/api/survey', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email, tools: tools, other: other })
      }).then(function (r) {
        return r.json().then(function (data) { return { ok: r.ok, data: data }; });
      }).then(function (res) {
        if (res.ok && res.data.ok) {
          showDone();
        } else {
          // best-effort: survey failed (e.g. missing email) — still thank them
          console.log('survey post failed:', res.data);
          showDone();
        }
      }).catch(function (err) {
        console.log('survey post error:', err);
        showDone();
      }).finally(function () {
        btn.disabled = false;
        btn.textContent = 'Log my answers';
      });
    });
  </script>
</body>
</html>
`;
