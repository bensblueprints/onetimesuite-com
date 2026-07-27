/*
 * lead-page.js — HTML for /lead/ (lead capture: GitHub link promise)
 * Self-contained page, inline CSS, vanilla JS posting to /api/lead.
 * Visual language mirrors src/site.css: paper ground, ink 1.5px borders,
 * 12px radius, mono accents, sticker orange #e8420c.
 */

const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='22' fill='%23e8420c'/%3E%3Ctext x='50' y='68' font-size='52' font-family='monospace' font-weight='700' fill='white' text-anchor='middle'%3E%241%3C/text%3E%3C/svg%3E";

module.exports = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Get the software links — OneTimeSuite</title>
  <meta name="description" content="Enter your name and email and I'll send you the promised GitHub software link — plus a one-time purchase option if GitHub isn't your thing.">
  <link rel="icon" href="${FAVICON}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Get the software links — OneTimeSuite">
  <meta property="og:description" content="The promised GitHub software link, straight to your inbox.">
  <meta property="og:url" content="https://onetimesuite.com/lead/">
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
    .card {
      width: 100%; max-width: 560px; margin-top: 3rem;
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
    label { display: block; font-family: var(--mono); font-size: 0.8rem; font-weight: 600; margin-bottom: 0.35rem; }
    input {
      width: 100%; font-family: var(--body); font-size: 1rem; color: var(--ink);
      background: var(--paper); border: 1.5px solid var(--ink); border-radius: 12px;
      padding: 0.7rem 0.9rem; margin-bottom: 1.1rem; outline: none;
    }
    input:focus { box-shadow: 3px 3px 0 var(--ink); }
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
    .msg { font-family: var(--mono); font-size: 0.85rem; margin-top: 0.9rem; display: none; }
    .msg.err { display: block; color: var(--price); }
    .done { display: none; text-align: center; padding: 1.5rem 0 0.5rem; }
    .done.show { display: block; }
    .done .big { font-family: var(--display); font-weight: 800; font-size: 1.5rem; margin-bottom: 0.6rem; }
    .done p { color: var(--ink-soft); }
    .done .tick {
      display: inline-block; font-family: var(--mono); font-weight: 700; font-size: 1.6rem;
      width: 3.2rem; height: 3.2rem; line-height: 3rem; text-align: center;
      border: 1.5px solid var(--ink); border-radius: 50%;
      background: var(--price); color: #fff; margin-bottom: 1rem;
      box-shadow: 3px 3px 0 var(--ink);
    }
  </style>
</head>
<body>
  <a class="wordmark" href="/">onetimesuite.com</a>
  <main class="card">
    <span class="stamp">you asked for the link</span>
    <h1>Get the software links</h1>
    <p class="lead">Did I promise you a link to software on GitHub? Enter your name and email below and I'll send it to you. If you don't know how to use GitHub don't worry — I'll also send you a link to the one-time purchase software.</p>
    <form id="lead-form" novalidate>
      <label for="name">Name</label>
      <input id="name" name="name" type="text" autocomplete="name" maxlength="120" required>
      <label for="email">Email</label>
      <input id="email" name="email" type="email" autocomplete="email" required>
      <button id="send" type="submit">Send me the links</button>
      <p class="msg" id="err"></p>
      <p class="small">One email, no spam. Unsubscribe anytime.</p>
    </form>
    <div class="done" id="done">
      <span class="tick">&#10003;</span>
      <p class="big">Check your inbox</p>
      <p>Check your inbox — the links are on their way.</p>
    </div>
  </main>
  <script>
    var form = document.getElementById('lead-form');
    var btn = document.getElementById('send');
    var err = document.getElementById('err');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      err.className = 'msg';
      err.textContent = '';
      var name = document.getElementById('name').value.trim();
      var email = document.getElementById('email').value.trim();
      if (!name || !email) {
        err.textContent = 'Please fill in both fields.';
        err.className = 'msg err';
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Sending…';
      fetch('/api/lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: name, email: email, source: 'lead-page' })
      }).then(function (r) {
        return r.json().then(function (data) { return { ok: r.ok, data: data }; });
      }).then(function (res) {
        if (res.ok && res.data.ok) {
          form.style.display = 'none';
          document.getElementById('done').className = 'done show';
        } else {
          err.textContent = (res.data && res.data.error) ? res.data.error : 'Something went wrong — please try again.';
          err.className = 'msg err';
        }
      }).catch(function () {
        err.textContent = 'Network error — please try again.';
        err.className = 'msg err';
      }).finally(function () {
        btn.disabled = false;
        btn.textContent = 'Send me the links';
      });
    });
  </script>
</body>
</html>
`;
