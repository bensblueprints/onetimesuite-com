#!/usr/bin/env node
/**
 * Sync the Clip Pipeline changelog page with GitHub releases.
 *
 * Source of truth: https://github.com/bensblueprints/clip-pipeline/releases
 * Output:          v2-pages/clip-pipeline/changelog/{index.html,data.json}
 *
 * Runs from build.js before the v2 overlay is copied into public/. If the
 * GitHub API is unreachable (offline build, rate limit) the last committed
 * page is kept as-is so a deploy never ships an empty changelog.
 *
 * Manual run: node scripts/sync-clip-changelog.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'v2-pages', 'clip-pipeline', 'changelog')
const PAGE = path.join(OUT_DIR, 'index.html')
const DATA = path.join(OUT_DIR, 'data.json')

const REPO = 'bensblueprints/clip-pipeline'
const REPO_URL = `https://github.com/${REPO}`
const RELEASES_API = `https://api.github.com/repos/${REPO}/releases?per_page=50`

const esc = s =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const inline = s =>
  esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" rel="noopener">$1</a>')
    .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" rel="noopener">$2</a>')

/** Tiny markdown renderer for release notes: headings, lists, paragraphs. */
function renderMarkdown(md) {
  const lines = String(md || '').replace(/\r\n/g, '\n').split('\n')
  const out = []
  let list = null // 'ul' | 'ol'
  const closeList = () => {
    if (list) {
      out.push(`</${list}>`)
      list = null
    }
  }
  for (const raw of lines) {
    // Trim both ends: GitHub release notes indent nested bullets by two spaces,
    // and the flat list is fine at this length.
    const line = raw.trim()
    if (!line.trim()) {
      closeList()
      continue
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(line)
    if (h) {
      closeList()
      const level = Math.min(4, Math.max(3, h[1].length + 1))
      out.push(`<h${level}>${inline(h[2])}</h${level}>`)
      continue
    }
    const ul = /^[-*]\s+(.*)$/.exec(line)
    if (ul) {
      if (list !== 'ul') {
        closeList()
        out.push('<ul>')
        list = 'ul'
      }
      out.push(`<li>${inline(ul[1])}</li>`)
      continue
    }
    const ol = /^\d+[.)]\s+(.*)$/.exec(line)
    if (ol) {
      if (list !== 'ol') {
        closeList()
        out.push('<ol>')
        list = 'ol'
      }
      out.push(`<li>${inline(ol[1])}</li>`)
      continue
    }
    closeList()
    out.push(`<p>${inline(line)}</p>`)
  }
  closeList()
  return out.join('\n')
}

const fmtDate = iso => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
}

const fmtSize = bytes => {
  if (!bytes) return ''
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(0)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

async function fetchReleases() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'onetimesuite-changelog-sync',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  const res = await fetch(RELEASES_API, { headers, signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`GitHub API ${res.status} ${res.statusText}`)
  const data = await res.json()
  if (!Array.isArray(data)) throw new Error('unexpected GitHub response')
  return data
    .filter(r => !r.draft)
    .map(r => ({
      tag: r.tag_name,
      name: r.name || r.tag_name,
      date: r.published_at || r.created_at,
      url: r.html_url,
      prerelease: !!r.prerelease,
      body: r.body || '',
      assets: (r.assets || []).map(a => ({
        name: a.name,
        size: a.size,
        url: a.browser_download_url,
        downloads: a.download_count,
      })),
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

function renderPage(releases, syncedAt) {
  const latest = releases[0]
  const entries = releases
    .map(r => {
      const assets = r.assets.length
        ? `<div class="assets">
            <div class="assets-label">Downloads</div>
            ${r.assets
              .map(
                a => `<a class="asset" href="${esc(a.url)}" rel="noopener">
                  <span class="asset-name">${esc(a.name)}</span>
                  <span class="asset-size">${esc(fmtSize(a.size))}</span>
                </a>`
              )
              .join('\n')}
          </div>`
        : ''
      return `<article class="entry" id="${esc(r.tag)}">
        <div class="entry-head">
          <div class="entry-title">
            <span class="tag">${esc(r.tag)}</span>
            ${r.prerelease ? '<span class="pill soon">Pre-release</span>' : '<span class="pill ok">Release</span>'}
            <h2>${esc(r.name)}</h2>
          </div>
          <div class="entry-meta">
            <time datetime="${esc(r.date)}">${esc(fmtDate(r.date))}</time>
            <a href="${esc(r.url)}" rel="noopener">View on GitHub →</a>
          </div>
        </div>
        <div class="notes">${renderMarkdown(r.body)}</div>
        ${assets}
      </article>`
    })
    .join('\n')
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Clip Pipeline Changelog — every release, synced from GitHub</title>
<meta name="description" content="Clip Pipeline release notes and version history, synced from the GitHub releases feed. Download the latest Windows installer and macOS Apple Silicon DMG." />
<link rel="canonical" href="https://onetimesuite.com/clip-pipeline/changelog/" />
<link rel="icon" href="/favicon.ico" sizes="48x48" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;800&family=Instrument+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
<style>
  :root{
    --paper:#f4f5f2; --raised:#ffffff; --ink:#17191d; --ink-soft:#4b4e55; --ink-faint:#85888f;
    --price:#e8420c; --line:#d8dad4; --blue:#2b4bdd; --mint:#0f7a55;
    --display:"Bricolage Grotesque",system-ui,sans-serif; --body:"Instrument Sans",system-ui,sans-serif;
    --mono:"IBM Plex Mono",ui-monospace,monospace;
  }
  *{box-sizing:border-box}
  html{scroll-behavior:smooth;scroll-padding-top:90px}
  body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--body);line-height:1.65;font-size:17px}
  a{color:var(--blue);text-decoration:none}
  a:hover{text-decoration:underline;text-underline-offset:3px}
  .top{position:sticky;top:0;z-index:20;background:rgba(244,245,242,.94);backdrop-filter:blur(8px);border-bottom:1.5px solid var(--ink)}
  .top .inner{max-width:1000px;margin:0 auto;padding:.7rem 1.2rem;display:flex;align-items:center;gap:1rem}
  .brand{display:flex;align-items:center;gap:.55rem;font-family:var(--display);font-weight:800;font-size:1.05rem;letter-spacing:-.02em;color:var(--ink)}
  .brand img{height:30px;width:auto}
  .brand span{color:var(--price)}
  .top .product{font-family:var(--mono);font-size:.74rem;font-weight:600;text-transform:uppercase;letter-spacing:.12em;color:var(--ink-faint);border-left:1px solid var(--line);padding-left:1rem}
  .top .actions{margin-left:auto;display:flex;gap:.5rem}
  .btn{display:inline-flex;align-items:center;gap:.45rem;font-family:var(--mono);font-size:.78rem;font-weight:700;padding:.55rem .9rem;border-radius:999px;border:1.5px solid var(--ink);background:var(--raised);color:var(--ink)}
  .btn.primary{background:var(--price);border-color:var(--price);color:#fff}
  .btn:hover{text-decoration:none;transform:translateY(-1px)}
  .hero{max-width:1000px;margin:0 auto;padding:3.2rem 1.2rem 1.4rem}
  .kicker{font-family:var(--mono);font-size:.74rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--price)}
  h1{font-family:var(--display);font-weight:800;font-size:clamp(2rem,4.4vw,3.3rem);line-height:1.04;letter-spacing:-.035em;margin:.6rem 0 1rem;max-width:900px}
  .lede{font-size:1.08rem;color:var(--ink-soft);max-width:720px;margin:0 0 1.2rem}
  .meta{font-family:var(--mono);font-size:.75rem;color:var(--ink-faint);display:flex;flex-wrap:wrap;gap:.4rem 1rem}
  main{max-width:1000px;margin:0 auto;padding:1rem 1.2rem 4rem}
  .entry{border:1.5px solid var(--ink);border-radius:14px;background:var(--raised);box-shadow:5px 5px 0 rgba(23,25,29,.1);padding:1.3rem 1.4rem 1.4rem;margin:0 0 1.6rem}
  .entry-head{display:flex;flex-wrap:wrap;gap:.6rem 1rem;align-items:baseline;justify-content:space-between;border-bottom:1px solid var(--line);padding-bottom:.9rem;margin-bottom:1rem}
  .entry-title{display:flex;flex-wrap:wrap;align-items:center;gap:.55rem}
  .entry-title h2{font-family:var(--display);font-weight:800;font-size:1.3rem;letter-spacing:-.02em;margin:0}
  .tag{font-family:var(--mono);font-size:.78rem;font-weight:700;background:var(--ink);color:#fff;border-radius:999px;padding:.2rem .6rem}
  .entry-meta{display:flex;gap:1rem;align-items:center;font-family:var(--mono);font-size:.75rem;color:var(--ink-faint)}
  .pill{display:inline-block;font-family:var(--mono);font-size:.66rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:.16rem .5rem;border-radius:999px;border:1px solid var(--line);color:var(--ink-faint);background:#f1f2ed}
  .pill.ok{color:var(--mint);border-color:#b9d9cb;background:#eef8f2}
  .pill.soon{color:#9a6400;border-color:#ecd39a;background:#fff8e6}
  .notes h3{font-family:var(--display);font-weight:700;font-size:1.05rem;margin:1.2rem 0 .4rem}
  .notes h4,.notes h5{font-family:var(--display);font-size:.98rem;margin:1rem 0 .3rem}
  .notes p{margin:.45rem 0 .7rem}
  .notes ul,.notes ol{margin:.4rem 0 .9rem;padding-left:1.25rem}
  .notes li{margin:.25rem 0}
  .notes code{font-family:var(--mono);font-size:.85em;background:#e9ebe5;border:1px solid var(--line);border-radius:5px;padding:.06rem .3rem}
  .assets{border-top:1px dashed var(--line);margin-top:1.1rem;padding-top:.9rem;display:flex;flex-wrap:wrap;gap:.5rem;align-items:center}
  .assets-label{font-family:var(--mono);font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-faint);width:100%}
  .asset{display:inline-flex;align-items:center;gap:.5rem;font-family:var(--mono);font-size:.78rem;font-weight:600;border:1.5px solid var(--ink);border-radius:999px;padding:.4rem .8rem;background:var(--raised);color:var(--ink)}
  .asset:hover{text-decoration:none;background:var(--ink);color:#fff}
  .asset-size{color:var(--ink-faint);font-weight:400}
  .asset:hover .asset-size{color:#c9ccd2}
  .empty{color:var(--ink-soft)}
  footer{border-top:1.5px solid var(--ink);padding:2rem 1.2rem;background:var(--raised)}
  footer .inner{max-width:1000px;margin:0 auto;display:flex;flex-wrap:wrap;gap:.8rem 1.5rem;align-items:center;font-family:var(--mono);font-size:.75rem;color:var(--ink-faint)}
  footer .inner a{color:var(--ink-soft)}
  @media (max-width:620px){body{font-size:16px}.top .product{display:none}.hero{padding-top:2rem}.entry{padding:1rem}.entry-head{flex-direction:column}}
</style>
</head>
<body>
<header class="top">
  <div class="inner">
    <a class="brand" href="/"><img src="/ots-mark.png" alt="" />OneTime<span>Suite</span></a>
    <span class="product">Clip Pipeline · Changelog</span>
    <div class="actions">
      <a class="btn" href="/clip-pipeline/guide/">User guide</a>
      <a class="btn primary" href="/clip-pipeline/#downloads">Download</a>
    </div>
  </div>
</header>

<div class="hero">
  <div class="kicker">Changelog · synced from GitHub</div>
  <h1>Every Clip Pipeline release, in one place.</h1>
  <p class="lede">Release notes are pulled from the <a href="${REPO_URL}/releases" rel="noopener">GitHub releases feed</a> whenever the site is built, so this page matches what shipped.${latest ? ` Latest: <strong>${esc(latest.name)}</strong> (${esc(fmtDate(latest.date))}).` : ''}</p>
  <div class="meta">
    <span>Source: github.com/${REPO}</span>
    <span>Last synced: ${esc(syncedAt)}</span>
    <a href="${REPO_URL}/releases.atom" rel="noopener">RSS feed</a>
  </div>
</div>

<main>
  ${entries || '<p class="empty">No published releases yet. <a href="' + REPO_URL + '/releases">Check GitHub</a>.</p>'}
</main>

<footer>
  <div class="inner">
    <span>© 2026 OneTimeSuite</span>
    <a href="/clip-pipeline/">Clip Pipeline</a>
    <a href="/clip-pipeline/guide/">User guide</a>
    <a href="${REPO_URL}/releases" rel="noopener">GitHub releases</a>
    <a href="/terms/">Terms</a>
    <a href="/privacy/">Privacy</a>
    <span style="margin-left:auto">Generated from GitHub releases · app version ${latest ? esc(latest.tag) : '—'}</span>
  </div>
</footer>
</body>
</html>
`
}

async function main() {
  let releases
  try {
    releases = await fetchReleases()
  } catch (err) {
    console.warn(`changelog sync: could not reach GitHub (${err.message})`)
    if (fs.existsSync(PAGE)) {
      console.warn('changelog sync: keeping the existing committed page')
      return
    }
    throw err
  }
  if (!releases.length) {
    console.warn('changelog sync: no public releases returned; keeping existing page')
    if (fs.existsSync(PAGE)) return
  }
  const syncedAt = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.writeFileSync(PAGE, renderPage(releases, syncedAt), 'utf8')
  fs.writeFileSync(
    DATA,
    JSON.stringify(
      { repo: REPO, syncedAt: new Date().toISOString(), releases },
      null,
      2
    ) + '\n',
    'utf8'
  )
  console.log(`changelog sync: ${releases.length} release(s) → ${path.relative(ROOT, PAGE)}`)
}

main().catch(err => {
  console.error('changelog sync failed:', err.message)
  process.exit(1)
})
