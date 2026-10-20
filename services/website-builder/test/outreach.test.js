import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createStore } from '../src/store.js';
import { createOutreach } from '../src/outreach.js';
import { createApp } from '../src/server.js';

const campaignId='10000000-0000-4000-8000-000000000001';
const contact={phone:'+12025550123',country:'US',lead_id:'synthetic-1',variant:'a',timezone:'America/New_York',
  timezone_evidence:'Synthetic test: location explicitly verified',eligibility_verified:true,
  eligibility_evidence:'Synthetic test permission record (not a real prospect)'};
const message={type:'campaign.predial',campaignId,contact:{id:'contact-1',number:contact.phone}};
function fixture(t){
  const dir=mkdtempSync(join(tmpdir(),'ots-outreach-')),store=createStore(dir);
  let time=Date.parse('2026-10-12T13:00:00Z');
  const outreach=createOutreach(store,()=>time);
  t.after(()=>{store.close();rmSync(dir,{recursive:true,force:true})});
  return {store,outreach,setTime:v=>{time=Date.parse(v)}};
}
test('pre-dial is closed by default and checks local hours, variant, suppression and phone-level replay',t=>{
  const {outreach:o,store,setTime}=fixture(t);
  o.importContacts([contact]);o.register({id:campaignId,variant:'a'});
  assert.equal(o.predial(message).eligible,false);
  o.pause({paused:false});
  setTime('2026-10-12T12:59:59Z');assert.equal(o.predial(message).eligible,false);
  setTime('2026-10-12T13:00:00Z');assert.equal(o.predial(message).eligible,true);
  assert.equal(o.predial(message).eligible,true); // Retry of the same provider contact.
  assert.equal(o.predial({...message,contact:{...message.contact,id:'other-contact'}}).eligible,false);
  const otherCampaign='10000000-0000-4000-8000-000000000002';
  o.register({id:otherCampaign,variant:'a'});
  assert.equal(o.predial({...message,campaignId:otherCampaign}).eligible,false);
  setTime('2026-10-12T21:00:00Z');assert.equal(o.predial(message).eligible,false);
  setTime('2026-10-17T15:00:00Z');assert.equal(o.predial(message).eligible,false);
  setTime('2026-11-02T13:59:59Z');assert.equal(o.predial(message).eligible,false); // DST ended.
  setTime('2026-11-02T14:00:00Z');assert.equal(o.predial(message).eligible,true);
  store.setting('paused','true');assert.equal(o.predial(message).eligible,false);
  store.setting('paused','false');
  o.suppress({id:'call-1',customer:{number:contact.phone}},{reason:'Please do not call again'});
  assert.equal(o.predial(message).eligible,false);
  assert.equal(createOutreach(store).summary().suppressed,1);
});
test('import rolls back oversized batches and refuses missing evidence or duplicate phones across offers',t=>{
  const {outreach:o}=fixture(t);
  assert.throws(()=>o.importContacts([{...contact,eligibility_verified:false}]));
  assert.throws(()=>o.importContacts([{...contact,country:'CA'}]));
  assert.throws(()=>o.importContacts([{...contact,timezone:'EST'}]));
  const rows=Array.from({length:251},(_,i)=>({...contact,phone:'+1202555'+String(i).padStart(4,'0'),lead_id:String(i)}));
  assert.throws(()=>o.importContacts(rows),/250/);
  assert.equal(o.summary().contacts.length,0);
  o.importContacts([contact]);assert.throws(()=>o.importContacts([{...contact,variant:'b'}]),/different/);
  o.register({id:campaignId,variant:'b'});o.pause({paused:false});assert.equal(o.predial(message).eligible,false);
});
test('terminal outcomes survive duplicate and out-of-order campaign events and cannot redial',t=>{
  const {outreach:o}=fixture(t);o.importContacts([contact]);o.register({id:campaignId,variant:'a'});o.pause({paused:false});o.predial(message);
  const event={campaignId,data:{contactId:'contact-1',callId:'call-1'}};
  o.event({...event,eventType:'contact.completed'});
  o.event({...event,eventType:'contact.dispatched'});
  o.event({...event,eventType:'contact.completed'});
  assert.equal(o.summary().contacts[0].state,'completed');
  assert.equal(o.predial(message).eligible,false);
});
test('authenticated flat and function-style opt-out tools use call metadata, never an arbitrary argument phone',async t=>{
  const dir=mkdtempSync(join(tmpdir(),'ots-dnc-http-'));
  const env={SESSION_SECRET:'s'.repeat(40),WEBHOOK_SECRET:'w'.repeat(40),DATA_DIR:dir,WORKER_ENABLED:'false'};
  const app=createApp(env);app.server.listen(0,'127.0.0.1');await once(app.server,'listening');
  t.after(()=>{app.close();rmSync(dir,{recursive:true,force:true})});
  const url='http://127.0.0.1:'+app.server.address().port+'/api/website-builder/vapi';
  const payload={message:{type:'tool-calls',call:{id:'call-1',customer:{number:contact.phone}},toolCallList:[
    {id:'tool-1',name:'record_website_do_not_call',parameters:{reason:'Do not call again'}},
  ]}};
  const post=(body,auth=true)=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer '+env.WEBHOOK_SECRET}:{})},body:JSON.stringify(body)});
  assert.equal((await post(payload,false)).status,401);
  assert.equal(JSON.parse((await (await post(payload)).json()).results[0].result).suppressed,true);
  payload.message.toolCallList=[{id:'tool-2',function:{name:'record_website_do_not_call',arguments:'{"reason":"Repeat request"}'}}];
  assert.equal(JSON.parse((await (await post(payload)).json()).results[0].result).suppressed,true);
  assert.equal(app.store.db.prepare('SELECT count(*) n FROM outreach_suppression').get().n,1);
  delete payload.message.call.customer;
  assert.ok((await (await post(payload)).json()).results[0].error);
  assert.equal((await post({message},false)).status,401);
  assert.equal((await (await post({message})).json()).eligible,false);
});
