import https from 'node:https';
import http from 'node:http';
import { lookup } from 'node:dns/promises';
import ipaddr from 'ipaddr.js';
import { load } from 'cheerio';

export function publicAddress(value) {
  try { let ip = ipaddr.parse(value); if (ip.kind() === 'ipv6' && ip.isIPv4MappedAddress()) ip = ip.toIPv4Address(); return ip.range() === 'unicast'; } catch { return false; }
}
export async function safeFetch(input, redirects = 0, xml = false) {
  const u = new URL(input);
  if (!['https:', 'http:'].includes(u.protocol) || u.username || u.password || !['', '80', '443'].includes(u.port)) throw new Error('Unsupported website URL');
  const hostname = u.hostname.replace(/^\[|\]$/g, '');
  const ips = await lookup(hostname, { all: true });
  if (!ips.length || ips.some(x => !publicAddress(x.address))) throw new Error('Only public websites can be imported');
  const ip = ips[0];
  const result = await new Promise((resolve, reject) => {
    const req = (u.protocol === 'https:' ? https : http).get(u, {
      headers: { 'user-agent': 'OneTimeSuite-ConceptBuilder/1.1', accept: xml?'application/xml,text/xml':'text/html', 'accept-encoding': 'identity' },
      lookup: (_host, options, cb) => options?.all ? cb(null,[ip]) : cb(null,ip.address,ip.family),
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400) { res.resume(); resolve({ redirect: res.headers.location }); return; }
      if (res.statusCode !== 200 || !(xml?/xml|text\/plain/:/text\/html/).test(String(res.headers['content-type']))) { res.resume(); reject(new Error(`Website returned HTTP ${res.statusCode} or unsupported content`)); return; }
      const chunks = []; let size = 0;
      res.on('data', chunk => { size += chunk.length; if (size > 2_000_000) req.destroy(new Error('Website page exceeds import size limit')); else chunks.push(chunk); });
      res.on('end', () => resolve({ html: Buffer.concat(chunks).toString('utf8'), url: u.href }));
      res.on('error', reject);
    });
    const timer = setTimeout(() => req.destroy(new Error('Website request timed out')), 15000);
    req.on('close', () => clearTimeout(timer)); req.on('error', reject);
  });
  if (result.redirect) { if (redirects >= 4) throw new Error('Too many redirects'); return safeFetch(new URL(result.redirect,u).href,redirects+1,xml); }
  return result;
}
export function extractPage(html, url) {
  const $ = load(html); $('script,style,noscript,iframe,svg,form').remove();
  const clean = x => x.replace(/\s+/g,' ').trim();
  const links = $('a[href]').map((_,a) => { try { const u = new URL($(a).attr('href'),url);u.hash=''; return u.origin === new URL(url).origin && !u.search && !/\.(pdf|jpg|png|webp|zip|svg|mp4)$/i.test(u.pathname) && !/\/(login|cart|checkout|privacy|terms|tag|author|wp-admin)(\/|$)/i.test(u.pathname) ? u.href : null; } catch { return null; } }).get();
  const text=clean($('body').text());
  return { url, title: clean($('title').text()).slice(0,200), description: $('meta[name="description"]').attr('content')?.slice(0,500) || '', text: text.slice(0,14000), truncated:text.length>14000, links_truncated:new Set(links).size>600, links: [...new Set(links)].slice(0,600) };
}
export async function crawlSite(url,{maxPages=60,maxMs=180000,fetchPage=safeFetch}={}) {
  const started=Date.now(),first = await fetchPage(url); const root = extractPage(first.html,first.url);
  const pages = [root], warnings = [],seen=new Set([root.url]),queue=new Set(root.links),origin=new URL(root.url).origin;
  const priority=u=>/service|location|area|coverage|cities|town|region|where-we/i.test(u)?0:/about|contact/i.test(u)?1:/blog|news/i.test(u)?3:2;
  try{
    const sitemap=await fetchPage(origin+'/sitemap.xml',0,true),$=load(sitemap.html,{xmlMode:true});
    let docs=[sitemap];
    if($('sitemapindex').length){docs=[];for(const loc of $('sitemap > loc').toArray().slice(0,4)){const link=$(loc).text().trim();if(new URL(link).origin===origin)try{docs.push(await fetchPage(link,0,true))}catch{warnings.push('A linked sitemap could not be read');}}if($('sitemap > loc').length>4)warnings.push('Sitemap index limit reached; verify the full service and location list');}
    for(const doc of docs){const xml=load(doc.html,{xmlMode:true});for(const loc of xml('url > loc').toArray()){try{const link=new URL(xml(loc).text().trim());if(link.origin===origin&&!link.search){if(queue.size<3000)queue.add(link.href);else warnings.push('Discovered URL limit reached; confirm the complete coverage list')}}catch{}}}
  }catch{/* HTML navigation remains the primary source. */}
  while(queue.size&&pages.length<maxPages&&Date.now()-started<maxMs){
    const link=[...queue].sort((a,b)=>priority(a)-priority(b))[0];queue.delete(link);if(seen.has(link))continue;seen.add(link);
    try{const p=await fetchPage(link);if(new URL(p.url).origin!==origin){warnings.push('A secondary page redirected to another domain and was omitted');continue;}if(p.url!==link&&seen.has(p.url))continue;seen.add(p.url);const page=extractPage(p.html,p.url);pages.push(page);for(const next of page.links)if(!seen.has(next)){if(queue.size<3000)queue.add(next);else warnings.push('Discovered URL limit reached; confirm the complete coverage list');}}catch{warnings.push(`Could not import ${new URL(link).pathname}`);}
  }
  const remaining=[...queue].filter(u=>!seen.has(u));
  if(remaining.length)warnings.push(`Crawl stopped with ${remaining.length} discovered URLs remaining; verify that all services and service areas were found.`);
  for(const p of pages)if(p.links_truncated)warnings.push(`Navigation links were truncated: ${new URL(p.url).pathname}`);
  for(const p of pages)if(p.truncated)warnings.push(`Source text was truncated: ${new URL(p.url).pathname}`);
  if (root.text.length < 150) throw new Error('Not enough readable website content. Supply a source brief for manual review.');
  return { fetched_at: new Date().toISOString(), pages, warnings:[...new Set(warnings)], incomplete:remaining.length>0||warnings.length>0, limitation: 'Bounded text and sitemap import; verify coverage in the studio. JavaScript-rendered content and imagery may need manual work.' };
}
