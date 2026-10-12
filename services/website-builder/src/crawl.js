import https from 'node:https';
import http from 'node:http';
import { lookup } from 'node:dns/promises';
import ipaddr from 'ipaddr.js';
import { load } from 'cheerio';

export function publicAddress(value) {
  try { let ip = ipaddr.parse(value); if (ip.kind() === 'ipv6' && ip.isIPv4MappedAddress()) ip = ip.toIPv4Address(); return ip.range() === 'unicast'; } catch { return false; }
}
export async function safeFetch(input, redirects = 0) {
  const u = new URL(input);
  if (!['https:', 'http:'].includes(u.protocol) || u.username || u.password || !['', '80', '443'].includes(u.port)) throw new Error('Unsupported website URL');
  const hostname = u.hostname.replace(/^\[|\]$/g, '');
  const ips = await lookup(hostname, { all: true });
  if (!ips.length || ips.some(x => !publicAddress(x.address))) throw new Error('Only public websites can be imported');
  const ip = ips[0];
  const result = await new Promise((resolve, reject) => {
    const req = (u.protocol === 'https:' ? https : http).get(u, {
      headers: { 'user-agent': 'OneTimeSuite-ConceptBuilder/1.0', accept: 'text/html', 'accept-encoding': 'identity' },
      lookup: (_host, options, cb) => options?.all ? cb(null,[ip]) : cb(null,ip.address,ip.family),
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400) { res.resume(); resolve({ redirect: res.headers.location }); return; }
      if (res.statusCode !== 200 || !String(res.headers['content-type']).includes('text/html')) { res.resume(); reject(new Error(`Website returned HTTP ${res.statusCode} or unsupported content`)); return; }
      const chunks = []; let size = 0;
      res.on('data', chunk => { size += chunk.length; if (size > 2_000_000) req.destroy(new Error('Website page exceeds import size limit')); else chunks.push(chunk); });
      res.on('end', () => resolve({ html: Buffer.concat(chunks).toString('utf8'), url: u.href }));
      res.on('error', reject);
    });
    const timer = setTimeout(() => req.destroy(new Error('Website request timed out')), 15000);
    req.on('close', () => clearTimeout(timer)); req.on('error', reject);
  });
  if (result.redirect) { if (redirects >= 4) throw new Error('Too many redirects'); return safeFetch(new URL(result.redirect,u).href,redirects+1); }
  return result;
}
export function extractPage(html, url) {
  const $ = load(html); $('script,style,noscript,iframe,svg,form').remove();
  const clean = x => x.replace(/\s+/g,' ').trim();
  const links = $('a[href]').map((_,a) => { try { const u = new URL($(a).attr('href'),url); return u.origin === new URL(url).origin && /about|service|contact/i.test(u.pathname) ? u.href.split('#')[0] : null; } catch { return null; } }).get();
  return { url, title: clean($('title').text()).slice(0,200), description: $('meta[name="description"]').attr('content')?.slice(0,500) || '', text: clean($('body').text()).slice(0,18000), links: [...new Set(links)].slice(0,3) };
}
export async function crawlSite(url) {
  const first = await safeFetch(url); const root = extractPage(first.html,first.url);
  const pages = [root], warnings = [];
  for (const link of root.links) { try { const p = await safeFetch(link); if (new URL(p.url).origin !== new URL(root.url).origin) { warnings.push('A secondary page redirected to another domain and was omitted'); continue; } pages.push(extractPage(p.html,p.url)); } catch { warnings.push(`Could not import ${new URL(link).pathname}`); } }
  if (root.text.length < 150) throw new Error('Not enough readable website content. Supply a source brief for manual review.');
  return { fetched_at: new Date().toISOString(), pages, warnings, limitation: 'Text import only; JavaScript-rendered content, imagery and original functionality may require manual work.' };
}
