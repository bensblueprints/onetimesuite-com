import test from 'node:test';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createStore } from '../src/store.js';
import { createApp } from '../src/server.js';
import { createWorker } from '../src/worker.js';
import { validateBrief } from '../src/schema.js';
import { crawlSite, publicAddress, safeFetch } from '../src/crawl.js';
import { renderSite, siteRoutes, validateRenderedSite } from '../src/render.js';
import { planPages, mergeInventory, validatePageSet } from '../src/page-plan.js';
import { createAI } from '../src/ai.js';

const brief=()=>({business_name:'Example Garden Studio',contact_name:'Test Owner',email:'owner@example.com',website_url:'https://example.com/',dislikes:'Make the services easier to understand.',requested_features:['AI assistant'],prospect_timezone:'America/New_York',consent_to_build:true,appointment:{event_id:'test-event',start_at:new Date(Date.now()+30*3600000).toISOString(),end_at:new Date(Date.now()+30.5*3600000).toISOString(),attendance_confirmed:true,invitation_received:true}});
const spec={business_name:'Example Garden Studio',tagline:'Thoughtful outdoor spaces',description:'Garden design and planting for spaces that feel like home.',hero_title:'A little more room to grow.',hero_copy:'Thoughtful garden design brings clarity and character to the space outside your door.',about:'Our studio helps people plan outdoor spaces around the way they want to use them.',theme:'forest',services:[{title:'Garden planning',description:'Plan a garden around the way you want to spend time outdoors.'}],faqs:[{question:'How do I get started?',answer:'Use the contact form to tell us about your garden.'},{question:'Can you share a price?',answer:'Please contact the business to discuss the scope and pricing.'}],improvements:['Clear service descriptions','Responsive layouts'],needs_review:['Confirm the final contact details'],feature_coverage:[{request:'AI assistant',status:'included',explanation:'Grounded questions and answers are supported.'}]};
function dbFixture(t){const dir=mkdtempSync(join(tmpdir(),'ots-test-'));const store=createStore(dir);t.after(()=>{store.close();rmSync(dir,{recursive:true,force:true})});return store;}

// Synthetic fixtures; tests make no paid model calls.
const inventory={services:[{id:'garden-planning',name:'Garden planning',summary:'Design a practical layout for the garden.',sources:[]},{id:'planting',name:'Planting',summary:'Choose plants for the conditions of the site.',sources:[]}],locations:[{id:'northfield',name:'Northfield',summary:'The studio serves clients in Northfield.',sources:[]},{id:'westhaven',name:'Westhaven',summary:'The studio serves clients in Westhaven.',sources:[]},{id:'eastbank',name:'Eastbank',summary:'The studio serves clients in Eastbank.',sources:[]}],uncertainties:[]};
const content=p=>({title:p.title+' — useful advice',description:'Learn about '+p.title+' and plan the next steps for your project.',heading:p.title,intro:Array.from({length:60},(_,i)=>createHash('sha256').update(p.path+':'+i).digest('hex').slice(0,10)).join(' '),sections:[{heading:'Plan your next step',body:'Check the brief and contact the team with the scope of your project.'}],faqs:[{question:'How do I start?',answer:'Contact the team to discuss your requirements.'}],needs_review:[]});

test('full Cartesian page plan, unique routing, internal links, and missing-page detection',()=>{
 const plans=planPages(inventory),rows=plans.map(p=>({...p,content:content(p),review:{passed:true}}));
 assert.equal(plans.length,11);assert.equal(plans.filter(p=>p.kind==='service_location').length,6);
 assert.equal(siteRoutes(inventory,rows).length,16);assert.equal(new Set(plans.map(p=>p.path)).size,11);
 assert.equal(validateRenderedSite(spec,{inventory,pageRows:rows}).passed,true);
 assert.equal(validatePageSet(rows,inventory).passed,true);
 assert.equal(validatePageSet(rows.slice(1),inventory).passed,false);
 const html=renderSite(spec,{inventory,pageRows:rows,page:'locations/northfield/planting'});
 assert.ok(html.includes('services/planting'));assert.ok(html.includes('locations/northfield'));
});
test('inventory accepts only source excerpts and rejects invented locations',()=>{
 const url='https://example.com/services',quote='We provide Garden planning, A+B and A B in Northfield.';
 const item=name=>({name,summary:'An evidenced service or coverage area.',sources:[{url,quote}]});
 const inv=mergeInventory([{services:['Garden planning','A+B','A B'].map(item),locations:[item('Northfield'),item('Invented town')],uncertainties:[]}],{pages:[{url,text:quote}]});
 assert.equal(inv.services.length,2);assert.equal(inv.locations.length,1);assert.ok(inv.uncertainties.some(x=>x.includes('Invented town')));
});
test('duplicate page copy is rejected even when individual model reviews pass',()=>{
 const rows=planPages(inventory).map(p=>({...p,content:content(p),review:{passed:true}}));
 rows[1].content={...rows[0].content,title:'Different title',description:'Different description'};
 assert.ok(validatePageSet(rows,inventory).issues.some(x=>x.includes('too similar')));
});
test('crawler follows nested service and area links and sitemap URLs, reporting bounds',async()=>{
 const root='https://example.com',text='Our garden studio plans outdoor spaces and planting projects for local customers. Tell us about the space, the site conditions and the way you would like to use your garden. ';
 const html=links=>'<html><body>'+text+links.map(p=>`<a href="${p}">${p}</a>`).join('')+'</body></html>';
 const map={'/':html(['/services','/locations']),'/services':html(['/services/planting']),'/locations':html(['/locations/northfield']),'/services/planting':html([]),'/locations/northfield':html([]),'/locations/westhaven':html([]),'/sitemap.xml':'<urlset><url><loc>'+root+'/locations/westhaven</loc></url></urlset>'};
 const fake=async url=>{const path=new URL(url).pathname;if(!map[path])throw new Error('Missing');return{url,html:map[path]}};
 const all=await crawlSite(root+'/',{fetchPage:fake});assert.equal(all.pages.length,6);assert.equal(all.incomplete,false);
 const bounded=await crawlSite(root+'/',{fetchPage:fake,maxPages:2});assert.equal(bounded.pages.length,2);assert.equal(bounded.incomplete,true);
});
test('expanded worker checkpoints completed pages across a retry and enforces the full-plan budget',async t=>{
 const store=dbFixture(t),job=store.enqueue(brief(),'vapi','matrix').job;let calls=0,fail=true;
 const ai={configured:true,discover:async()=>({inventory}),generate:async()=>({spec,usage:{}}),review:async()=>({passed:true,issues:[],summary:'Passed',usage:{}}),generatePage:async(_b,p)=>{calls++;if(calls===2&&fail){fail=false;throw new Error('Temporary interruption')}return{content:content(p),usage:{}}},reviewPage:async()=>({passed:true,issues:[],usage:{}})};
 const tick=createWorker(store,ai,{crawl:async()=>({pages:[{text:'Synthetic evidence'}]})});await tick();
 assert.equal(store.pages(job.id).filter(p=>p.status==='ready').length,1);assert.equal(store.get(job.id).status,'queued');
 store.update(job.id,{next_attempt:0});await tick();assert.equal(calls,12);assert.equal(store.get(job.id).status,'review');assert.equal(store.get(job.id).review.page_count,16);
 const second=store.enqueue(brief(),'vapi','budget').job;await createWorker(store,ai,{maxPages:10,crawl:async()=>({pages:[]})})();assert.equal(store.get(second.id).status,'needs_attention');assert.equal(store.pages(second.id).length,11);
});
test('OpenAI uses Responses with strict structured output and rejects incomplete/auth failures',async()=>{
 let sent;const ai=createAI({OPENAI_API_KEY:'test-key'},{fetch:async(url,options)=>{sent={url,body:JSON.parse(options.body)};return{ok:true,json:async()=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({passed:true,issues:[],summary:'Content is grounded in the supplied source.'})}]}]})}}});
 await ai.review(brief(),{pages:[]},spec);assert.equal(sent.url,'https://api.openai.com/v1/responses');assert.equal(sent.body.store,false);assert.equal(sent.body.text.format.strict,true);assert.equal(sent.body.reasoning.effort,'low');
 const incomplete=createAI({OPENAI_API_KEY:'test'},{fetch:async()=>({ok:true,json:async()=>({status:'incomplete'})})});await assert.rejects(incomplete.chat(spec,'hello'),/incomplete/);
 const unauthorized=createAI({OPENAI_API_KEY:'test'},{fetch:async()=>({ok:false,status:401})});await assert.rejects(unauthorized.chat(spec,'hello'),{permanent:true});
});
test('coverage replacement archives the previous concept and revokes sharing',t=>{
 const store=dbFixture(t),job=store.enqueue(brief(),'vapi','coverage').job;store.update(job.id,{spec,inventory,approved_at:Date.now(),status:'approved'});store.plan(job.id,planPages(inventory));store.replaceCoverage(job.id,inventory,{pages:[],warnings:[]});
 assert.equal(store.get(job.id).approved_at,null);assert.equal(store.get(job.id).status,'queued');assert.equal(store.pages(job.id).length,0);const saved=JSON.parse(store.db.prepare('SELECT snapshot FROM revisions WHERE job_id=?').get(job.id).snapshot);assert.equal(saved.pages.length,11);assert.equal(saved.job.spec.business_name,spec.business_name);
});
test('DeepInfra routes writing, review, discovery and chat through the configured model roles',async()=>{
 const sent=[];const ai=createAI({AI_PROVIDER:'deepinfra',DEEPINFRA_API_KEY:'test-key',DEEPINFRA_DISCOVERY_MODEL:'deepseek-ai/DeepSeek-V4-Flash-0731'},{fetch:async(url,options)=>{const body=JSON.parse(options.body);sent.push({url,body});const answer=body.model.includes('Flash')?(body.response_format?JSON.stringify({services:[],locations:[],uncertainties:[]}):'Hello'):JSON.stringify({passed:true,issues:[],summary:'The sample content is supported by the supplied evidence.'});return{ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:answer}}]})}}});
 await ai.discover({pages:[{url:'https://example.com',text:'Source'}]});await ai.review(brief(),{pages:[]},spec);await ai.chat(spec,'Hello');
 assert.equal(ai.models.build,'moonshotai/Kimi-K3');assert.equal(sent[0].body.model,'deepseek-ai/DeepSeek-V4-Flash-0731');assert.equal(sent[1].body.model,'zai-org/GLM-5.3');assert.equal(sent[0].body.response_format.type,'json_object');assert.equal(sent[2].body.reasoning_effort,'none');assert.ok(sent.every(r=>r.url==='https://api.deepinfra.com/v1/openai/chat/completions'));
});
test('schema repair is bounded and includes actionable field validation errors',async()=>{
 let calls=0,repair;const ai=createAI({AI_PROVIDER:'deepinfra',DEEPINFRA_API_KEY:'test-key'},{fetch:async(_url,options)=>{calls++;const body=JSON.parse(options.body);repair=body.messages.at(-1).content;return{ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(calls===1?{}:{passed:true,issues:[],summary:'All supplied content is supported by the source.'})}}]})}}});
 const result=await ai.review(brief(),{pages:[]},spec);assert.equal(result.passed,true);assert.equal(calls,2);assert.ok(repair.includes('Validation errors'));assert.equal(result.usage.attempts.length,2);
});

test('appointment window respects absolute time and requires confirmation',()=>{const b=brief();assert.equal(validateBrief(b).business_name,b.business_name);assert.throws(()=>validateBrief({...b,appointment:undefined}));assert.throws(()=>validateBrief({...b,consent_to_build:false}));assert.throws(()=>validateBrief({...b,prospect_timezone:'ET'}));assert.throws(()=>validateBrief({...b,appointment:{...b.appointment,start_at:new Date(Date.now()+5*3600000).toISOString()}}));assert.throws(()=>validateBrief({...b,appointment:{...b.appointment,start_at:new Date(Date.now()+60*3600000).toISOString()}}));});
test('private, loopback, metadata, mapped and reserved addresses cannot be fetched',async()=>{for(const ip of ['127.0.0.1','10.1.2.3','169.254.169.254','192.168.1.1','100.64.0.1','0.0.0.0','::1','fc00::1','::ffff:127.0.0.1','2001:db8::1'])assert.equal(publicAddress(ip),false,ip);assert.equal(publicAddress('1.1.1.1'),true);await assert.rejects(safeFetch('http://127.0.0.1'));await assert.rejects(safeFetch('file:///etc/passwd'));await assert.rejects(safeFetch('https://user:pass@example.com'));});
test('replayed requests create exactly one durable job; changed payload conflicts',t=>{const s=dbFixture(t),b=brief();const a=s.enqueue(b,'vapi','call:1');assert.equal(s.enqueue(b,'vapi','call:1').duplicate,true);assert.equal(s.list().length,1);assert.throws(()=>s.enqueue({...b,business_name:'Another business'},'vapi','call:1'),{status:409});assert.equal(s.get(a.job.id).status,'queued');});
test('web submissions wait for qualification and queue enforces capacity',t=>{const s=dbFixture(t);s.enqueue(brief(),'web','web:1',1);assert.equal(s.claim(),null);assert.throws(()=>s.enqueue(brief(),'vapi','vapi:2',1),{status:503});});
test('exclusive claims, daily cap and expired lease recovery',t=>{const s=dbFixture(t);s.enqueue(brief(),'vapi','call:1');s.enqueue(brief(),'vapi','call:2');const one=s.claim(1);assert.ok(one);assert.equal(s.claim(1),null);s.update(one.id,{lease_until:1});const two=s.claim(2);assert.equal(two.id,one.id);assert.equal(two.attempts,2);});
test('escaped content cannot introduce scripts or active attributes; all four pages validate',()=>{const html=renderSite({...spec,hero_title:'<img src=x onerror=alert(1)>'});assert.ok(html.includes('&lt;img'));assert.equal(validateRenderedSite(spec).passed,true);});
test('worker separately reviews, revises once and leaves passing work awaiting human approval',async t=>{const s=dbFixture(t);const job=s.enqueue(brief(),'vapi','call:1').job;let generations=0,reviews=0;const ai={configured:true,generate:async()=>{generations++;return{spec,usage:{}}},review:async()=>{reviews++;return{passed:reviews>1,issues:reviews===1?['Fix wording']:[],summary:'The content satisfies the supplied brief.',usage:{}}}};const tick=createWorker(s,ai,{crawl:async()=>({pages:[{text:'Example source'}]})});await tick();const result=s.get(job.id);assert.equal(result.status,'review');assert.equal(result.approved_at,null);assert.equal(generations,2);assert.equal(reviews,2);});
test('review failure blocks approval readiness and permanent provider failure stops retry',async t=>{const s=dbFixture(t),job=s.enqueue(brief(),'vapi','call:1').job;const ai={configured:true,generate:async()=>{throw Object.assign(new Error('Kimi API returned HTTP 401'),{permanent:true})}};await createWorker(s,ai,{crawl:async()=>({pages:[]})})();assert.equal(s.get(job.id).status,'failed');});
test('HTTP webhook authentication, idempotency, admin sessions, CSRF and private preview gate',async t=>{
  const dir=mkdtempSync(join(tmpdir(),'ots-http-')),env={SESSION_SECRET:'s'.repeat(40),WEBHOOK_SECRET:'w'.repeat(40),DATA_DIR:dir,PUBLIC_URL:'http://localhost:3180',WORKER_ENABLED:'false',ADMIN_USER_1:'tester',ADMIN_PASS_1:'test-only-password'};
  const app=createApp(env);app.server.listen(0,'127.0.0.1');await once(app.server,'listening');t.after(()=>{app.close();rmSync(dir,{recursive:true,force:true})});const base='http://127.0.0.1:'+app.server.address().port;
  const post=(path,data,headers={})=>fetch(base+'/api/website-builder/'+path,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(data)});
  const payload={message:{type:'tool-calls',call:{id:'call-1'},toolCallList:[{id:'tool-1',function:{name:'start_website_build',arguments:brief()}}]}};
  assert.equal((await post('vapi',payload)).status,401);
  const r=await post('vapi',payload,{Authorization:'Bearer '+env.WEBHOOK_SECRET});assert.equal(r.status,200);assert.equal(JSON.parse((await r.json()).results[0].result).status,'queued');
  const replay=await post('vapi',payload,{Authorization:'Bearer '+env.WEBHOOK_SECRET});assert.equal(JSON.parse((await replay.json()).results[0].result).duplicate,true);
  const j=app.store.list()[0];app.store.update(j.id,{spec,status:'review',review:{passed:true,checks:{passed:true}}});assert.equal((await fetch(base+'/website-previews/'+j.preview_token+'/')).status,404);
  assert.equal((await fetch(base+'/api/website-builder/admin/overview')).status,401);
  assert.equal((await post('admin/webhook-credential',{}, {Origin:env.PUBLIC_URL})).status,401);
  assert.equal((await post('login',{username:'tester',password:'test-only-password'})).status,403);
  const login=await post('login',{username:'tester',password:'test-only-password'},{Origin:env.PUBLIC_URL});assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];
  assert.equal((await post('admin/webhook-credential',{}, {Cookie:cookie,Origin:'https://evil.example'})).status,403);
  assert.equal((await (await post('admin/webhook-credential',{}, {Cookie:cookie,Origin:env.PUBLIC_URL})).json()).token,env.WEBHOOK_SECRET);
  const tool=await (await fetch(base+'/api/website-builder/admin/tool',{headers:{Cookie:cookie}})).json();assert.ok(tool.function.parameters.required.includes('appointment'));
  assert.equal((await fetch(base+'/website-previews/'+j.preview_token+'/',{headers:{Cookie:cookie}})).status,200);
  assert.equal((await post('admin/jobs/'+j.id+'/approve',{}, {Cookie:cookie,Origin:'https://evil.example'})).status,403);
  assert.equal((await post('admin/jobs/'+j.id+'/approve',{}, {Cookie:cookie,Origin:env.PUBLIC_URL})).status,200);
  assert.equal((await fetch(base+'/website-previews/'+j.preview_token+'/')).status,200);
  assert.equal((await post('previews/'+j.preview_token+'/inquiry',{name:'Visitor',email:'visitor@example.com',message:'Tell me more.'},{Origin:env.PUBLIC_URL})).status,201);
  assert.equal(app.store.messages(j.id).length,1);
  app.store.update(j.id,{inventory,status:'review',approved_at:null});app.store.plan(j.id,planPages(inventory));
  assert.equal((await post('admin/jobs/'+j.id+'/approve',{}, {Cookie:cookie,Origin:env.PUBLIC_URL})).status,400);
  for(const p of planPages(inventory))app.store.savePage(j.id,p.path,content(p),{passed:true});
  const nested='/website-previews/'+j.preview_token+'/locations/northfield/planting';
  assert.equal((await fetch(base+nested)).status,404);
  assert.equal((await fetch(base+nested,{headers:{Cookie:cookie}})).status,200);
  assert.equal((await post('admin/jobs/'+j.id+'/approve',{}, {Cookie:cookie,Origin:env.PUBLIC_URL})).status,200);
  assert.equal((await fetch(base+nested)).status,200);
  assert.equal((await fetch(base+nested+'/missing')).status,404);
  const sitemap=await fetch(base+'/website-previews/'+j.preview_token+'/sitemap.xml');assert.equal(sitemap.status,200);assert.equal(sitemap.headers.get('x-robots-tag'),'noindex, nofollow');assert.equal((await sitemap.text()).match(/<loc>/g).length,16);
  const correction={services:'Garden planning | Draw a plan for a residential garden.',locations:'Northfield | Residential garden planning is available in Northfield.',notes:'Confirmed with the owner during the internal test. All listed services are available throughout Northfield.',confirmed:true};
  assert.equal((await post('admin/jobs/'+j.id+'/coverage',{...correction,confirmed:false},{Cookie:cookie,Origin:env.PUBLIC_URL})).status,422);
  assert.equal((await post('admin/jobs/'+j.id+'/coverage',correction,{Cookie:cookie,Origin:env.PUBLIC_URL})).status,200);
  assert.equal((await fetch(base+nested)).status,404);assert.equal(app.store.get(j.id).inventory.locations.length,1);
});
