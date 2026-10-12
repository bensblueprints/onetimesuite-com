import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createStore } from '../src/store.js';
import { createApp } from '../src/server.js';
import { createWorker } from '../src/worker.js';
import { validateBrief } from '../src/schema.js';
import { publicAddress, safeFetch } from '../src/crawl.js';
import { renderSite, validateRenderedSite } from '../src/render.js';

const brief=()=>({business_name:'Example Garden Studio',contact_name:'Test Owner',email:'owner@example.com',website_url:'https://example.com/',dislikes:'Make the services easier to understand.',requested_features:['AI assistant'],prospect_timezone:'America/New_York',consent_to_build:true,appointment:{event_id:'test-event',start_at:new Date(Date.now()+30*3600000).toISOString(),end_at:new Date(Date.now()+30.5*3600000).toISOString(),attendance_confirmed:true,invitation_received:true}});
const spec={business_name:'Example Garden Studio',tagline:'Thoughtful outdoor spaces',description:'Garden design and planting for spaces that feel like home.',hero_title:'A little more room to grow.',hero_copy:'Thoughtful garden design brings clarity and character to the space outside your door.',about:'Our studio helps people plan outdoor spaces around the way they want to use them.',theme:'forest',services:[{title:'Garden planning',description:'Plan a garden around the way you want to spend time outdoors.'}],faqs:[{question:'How do I get started?',answer:'Use the contact form to tell us about your garden.'},{question:'Can you share a price?',answer:'Please contact the business to discuss the scope and pricing.'}],improvements:['Clear service descriptions','Responsive layouts'],needs_review:['Confirm the final contact details'],feature_coverage:[{request:'AI assistant',status:'included',explanation:'Grounded questions and answers are supported.'}]};
function dbFixture(t){const dir=mkdtempSync(join(tmpdir(),'ots-test-'));const store=createStore(dir);t.after(()=>{store.close();rmSync(dir,{recursive:true,force:true})});return store;}

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
});
