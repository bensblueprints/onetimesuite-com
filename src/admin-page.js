/*
 * admin-page.js — HTML for /admin/ (password-protected lead list + checklist)
 * Self-contained page, inline CSS, vanilla JS against /api/admin/*.
 * Token lives in sessionStorage only. No frameworks, no CDN scripts.
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
  <title>Admin — OneTimeSuite</title>
  <link rel="icon" href="${FAVICON}">
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
      --line: #d8dad4;
      --display: "Bricolage Grotesque", system-ui, sans-serif;
      --body: "Instrument Sans", system-ui, sans-serif;
      --mono: "IBM Plex Mono", ui-monospace, monospace;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: var(--body); font-size: 1rem; line-height: 1.6;
      color: var(--ink); background: var(--paper);
      min-height: 100vh; padding: 2rem 1.25rem 4rem;
    }
    .card {
      background: var(--paper-raised); border: 1.5px solid var(--ink);
      border-radius: 12px; padding: 2rem 1.8rem; box-shadow: 5px 5px 0 var(--ink);
    }
    /* login */
    #login-view { max-width: 420px; margin: 4rem auto 0; }
    h1 { font-family: var(--display); font-weight: 800; font-size: 1.7rem; letter-spacing: -0.02em; margin-bottom: 1.4rem; }
    label { display: block; font-family: var(--mono); font-size: 0.78rem; font-weight: 600; margin-bottom: 0.3rem; }
    input {
      width: 100%; font-family: var(--body); font-size: 1rem; color: var(--ink);
      background: var(--paper); border: 1.5px solid var(--ink); border-radius: 12px;
      padding: 0.65rem 0.9rem; margin-bottom: 1rem; outline: none;
    }
    input:focus { box-shadow: 3px 3px 0 var(--ink); }
    .btn {
      font-family: var(--mono); font-size: 0.9rem; font-weight: 600;
      color: #fff; background: var(--ink); border: 1.5px solid var(--ink);
      border-radius: 12px; padding: 0.6rem 1.1rem; cursor: pointer;
    }
    .btn.orange { background: var(--price); }
    .btn.ghost { background: var(--paper-raised); color: var(--ink); }
    .btn:disabled { opacity: 0.6; cursor: wait; }
    #login-btn { width: 100%; }
    .msg { font-family: var(--mono); font-size: 0.82rem; color: var(--price); margin-top: 0.8rem; display: none; }
    .msg.show { display: block; }
    /* dashboard */
    #dash-view { display: none; max-width: 1000px; margin: 0 auto; }
    #dash-view.show { display: block; }
    .dash-head { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.8rem; margin-bottom: 1.4rem; }
    .dash-head h1 { margin: 0; }
    .tabs { display: flex; gap: 0.5rem; margin-bottom: 1.2rem; }
    .tab {
      font-family: var(--mono); font-size: 0.85rem; font-weight: 600;
      background: var(--paper-raised); color: var(--ink);
      border: 1.5px solid var(--ink); border-radius: 999px; padding: 0.4rem 1.1rem; cursor: pointer;
    }
    .tab.active { background: var(--ink); color: var(--paper); }
    .toolbar { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; margin-bottom: 1rem; }
    .count { font-family: var(--mono); font-size: 0.85rem; color: var(--ink-soft); margin-right: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    th, td { text-align: left; padding: 0.5rem 0.6rem; border-bottom: 1px solid var(--line); vertical-align: top; }
    th { font-family: var(--mono); font-size: 0.72rem; font-weight: 600; color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.04em; }
    td.mono { font-family: var(--mono); font-size: 0.78rem; white-space: nowrap; }
    .table-wrap { overflow-x: auto; }
    .empty { font-family: var(--mono); font-size: 0.85rem; color: var(--ink-faint); padding: 1.5rem 0; text-align: center; }
    pre.checklist {
      font-family: var(--mono); font-size: 0.82rem; line-height: 1.6;
      white-space: pre-wrap; word-break: break-word;
      background: var(--paper); border: 1.5px solid var(--ink); border-radius: 12px;
      padding: 1.4rem 1.3rem; max-height: 70vh; overflow: auto;
    }
    .panel-title { font-family: var(--display); font-weight: 800; font-size: 1.1rem; margin-bottom: 0.8rem; }
    #pane-checklist { display: none; }
    #pane-checklist.show { display: block; }
    #pane-leads.hide { display: none; }
  </style>
</head>
<body>

  <main id="login-view" class="card">
    <h1>OneTimeSuite Admin</h1>
    <form id="login-form">
      <label for="username">Username</label>
      <input id="username" type="text" autocomplete="username" required>
      <label for="password">Password</label>
      <input id="password" type="password" autocomplete="current-password" required>
      <button class="btn orange" id="login-btn" type="submit">Log in</button>
      <p class="msg" id="login-err"></p>
    </form>
  </main>

  <main id="dash-view">
    <div class="dash-head">
      <h1>OneTimeSuite Admin</h1>
      <button class="btn ghost" id="logout-btn">Logout</button>
    </div>
    <div class="tabs">
      <button class="tab active" id="tab-leads">Leads</button>
      <button class="tab" id="tab-checklist">Checklist</button>
    </div>

    <section id="pane-leads" class="card">
      <div class="toolbar">
        <span class="count" id="lead-count"></span>
        <button class="btn ghost" id="refresh-btn">Refresh</button>
        <button class="btn" id="csv-btn">Copy CSV</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Time</th><th>Name</th><th>Email</th><th>Source</th><th>Contact</th><th>Welcome</th></tr>
          </thead>
          <tbody id="lead-rows"></tbody>
        </table>
        <p class="empty" id="leads-empty" style="display:none;">No leads yet.</p>
      </div>
    </section>

    <section id="pane-checklist" class="card">
      <p class="panel-title">Launch checklist (NEXT-UP.md)</p>
      <pre class="checklist" id="checklist-pre">Loading…</pre>
    </section>
  </main>

  <script>
    var TOKEN_KEY = 'ots_admin_token';
    var leads = [];

    function token() { return sessionStorage.getItem(TOKEN_KEY) || ''; }
    function esc(s) {
      return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    function api(path, opts) {
      opts = opts || {};
      opts.headers = opts.headers || {};
      if (token()) opts.headers['authorization'] = 'Bearer ' + token();
      return fetch(path, opts).then(function (r) {
        if (r.status === 401 && token()) { logout(); throw new Error('unauthorized'); }
        return r.json().then(function (data) { return { status: r.status, data: data }; });
      });
    }

    /* ---- login ---- */
    var loginView = document.getElementById('login-view');
    var dashView = document.getElementById('dash-view');
    var loginErr = document.getElementById('login-err');

    function showDash() {
      loginView.style.display = 'none';
      dashView.className = 'show';
      loadLeads();
    }
    function logout() {
      sessionStorage.removeItem(TOKEN_KEY);
      dashView.className = '';
      loginView.style.display = '';
    }
    document.getElementById('logout-btn').addEventListener('click', logout);

    document.getElementById('login-form').addEventListener('submit', function (e) {
      e.preventDefault();
      loginErr.className = 'msg';
      var btn = document.getElementById('login-btn');
      btn.disabled = true;
      fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          username: document.getElementById('username').value,
          password: document.getElementById('password').value
        })
      }).then(function (r) {
        return r.json().then(function (data) { return { status: r.status, data: data }; });
      }).then(function (res) {
        if (res.status === 200 && res.data.token) {
          sessionStorage.setItem(TOKEN_KEY, res.data.token);
          document.getElementById('password').value = '';
          showDash();
        } else if (res.status === 401) {
          loginErr.textContent = 'Wrong username or password';
          loginErr.className = 'msg show';
        } else {
          loginErr.textContent = res.data.error || 'Login failed';
          loginErr.className = 'msg show';
        }
      }).catch(function () {
        loginErr.textContent = 'Network error — please try again.';
        loginErr.className = 'msg show';
      }).finally(function () { btn.disabled = false; });
    });

    /* ---- tabs ---- */
    var tabLeads = document.getElementById('tab-leads');
    var tabChecklist = document.getElementById('tab-checklist');
    var paneLeads = document.getElementById('pane-leads');
    var paneChecklist = document.getElementById('pane-checklist');
    var checklistLoaded = false;

    tabLeads.addEventListener('click', function () {
      tabLeads.className = 'tab active'; tabChecklist.className = 'tab';
      paneLeads.className = 'card'; paneChecklist.className = 'card';
    });
    tabChecklist.addEventListener('click', function () {
      tabChecklist.className = 'tab active'; tabLeads.className = 'tab';
      paneChecklist.className = 'card show'; paneLeads.className = 'card hide';
      if (!checklistLoaded) loadChecklist();
    });

    /* ---- leads ---- */
    function loadLeads() {
      api('/api/admin/leads').then(function (res) {
        leads = res.data.leads || [];
        renderLeads();
      }).catch(function () {});
    }
    function renderLeads() {
      var tbody = document.getElementById('lead-rows');
      document.getElementById('lead-count').textContent = leads.length + (leads.length === 1 ? ' lead' : ' leads');
      document.getElementById('leads-empty').style.display = leads.length ? 'none' : '';
      tbody.innerHTML = leads.map(function (l) {
        var time = '';
        try { time = new Date(l.ts).toLocaleString(); } catch (e) { time = l.ts || ''; }
        var yes = '<span style="color:#1a7f37;font-weight:700;">\\u2713</span>';
        var no = '<span style="color:#e8420c;font-weight:700;">\\u2717</span>';
        return '<tr>' +
          '<td class="mono">' + esc(time) + '</td>' +
          '<td>' + esc(l.name) + '</td>' +
          '<td>' + esc(l.email) + '</td>' +
          '<td>' + esc(l.source || '') + '</td>' +
          '<td>' + (l.resendContact ? yes : no) + '</td>' +
          '<td>' + (l.resendEmail ? yes : no) + '</td>' +
          '</tr>';
      }).join('');
    }
    document.getElementById('refresh-btn').addEventListener('click', loadLeads);
    document.getElementById('csv-btn').addEventListener('click', function () {
      var rows = [['time', 'name', 'email', 'source']].concat(leads.map(function (l) {
        return [l.ts || '', l.name || '', l.email || '', l.source || ''];
      }));
      var csv = rows.map(function (r) {
        return r.map(function (c) {
          c = String(c);
          return /[",\\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c;
        }).join(',');
      }).join('\\n');
      navigator.clipboard.writeText(csv).then(function () {
        var b = document.getElementById('csv-btn');
        b.textContent = 'Copied!';
        setTimeout(function () { b.textContent = 'Copy CSV'; }, 1500);
      });
    });

    /* ---- checklist ---- */
    function loadChecklist() {
      api('/api/admin/checklist').then(function (res) {
        checklistLoaded = true;
        document.getElementById('checklist-pre').textContent =
          res.data.markdown || ('Error: ' + (res.data.error || 'could not load checklist'));
      }).catch(function () {
        document.getElementById('checklist-pre').textContent = 'Error: could not load checklist';
      });
    }

    /* ---- boot ---- */
    if (token()) showDash();
  </script>
</body>
</html>
`;
