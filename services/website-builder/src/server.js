import http from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, createHmac, timingSafeEqual, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import { z } from 'zod';
import { createStore } from './store.js';
import { createAI, providerConfig } from './ai.js';
import { createWorker } from './worker.js';
import { validateBrief, briefSchema } from './schema.js';
import { renderSite, siteRoutes, escape } from './render.js';
import { validatePageSet, mergeInventory } from './page-plan.js';

const assets = resolve(dirname(fileURLToPath(import.meta.url)),'../public');
const equal = (a,b) => { const aa=createHash('sha256').update(String(a)).digest(),bb=createHash('sha256').update(String(b)).digest();return timingSafeEqual(aa,bb); };
export function createApp(env = process.env, dependencies = {}) {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) throw new Error('SESSION_SECRET must contain at least 32 characters');
  if (!env.WEBHOOK_SECRET || env.WEBHOOK_SECRET.length < 32) throw new Error('WEBHOOK_SECRET must contain at least 32 characters');
  const origin = new URL(env.PUBLIC_URL || 'http://localhost:3180').origin;
  const toolParameters = z.toJSONSchema(briefSchema);
  delete toolParameters.$schema;
  toolParameters.required.push('appointment');
  function simplifyToolSchema(value){if(!value||typeof value!=='object')return;delete value.const;delete value.default;delete value.pattern;for(const child of Object.values(value))simplifyToolSchema(child);}
  simplifyToolSchema(toolParameters);
  toolParameters.properties.consent_to_build.description='Must be true after explicit agreement to a free concept.';
  toolParameters.properties.appointment.properties.attendance_confirmed.description='Must be true after the prospect confirms attendance and ability to view the screen.';
  const store = dependencies.store || createStore(env.DATA_DIR || './data');
  const secret = env.SESSION_SECRET;
  const cryptoKey = createHash('sha256').update(secret).digest();
  function encrypt(value) { const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',cryptoKey,iv),bytes=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),bytes]).toString('base64'); }
  function decrypt(value) { const b=Buffer.from(value,'base64'),cipher=createDecipheriv('aes-256-gcm',cryptoKey,b.subarray(0,12));cipher.setAuthTag(b.subarray(12,28));return Buffer.concat([cipher.update(b.subarray(28)),cipher.final()]).toString('utf8'); }
  const saved = store.setting('kimi_key'),openaiSaved=store.setting('openai_key'),deepinfraSaved=store.setting('deepinfra_key');
  const aiEnv = { ...env, DEEPINFRA_API_KEY:deepinfraSaved?decrypt(deepinfraSaved):env.DEEPINFRA_API_KEY, AI_PROVIDER:store.setting('ai_provider')||env.AI_PROVIDER||(deepinfraSaved?'deepinfra':saved?'kimi':'openai'), KIMI_API_KEY: saved ? decrypt(saved) : env.KIMI_API_KEY,OPENAI_API_KEY:openaiSaved?decrypt(openaiSaved):env.OPENAI_API_KEY };
  let ai = dependencies.ai || createAI(aiEnv);
  const provider = new Proxy({}, {get:(_target,key)=>typeof ai[key]==='function'?ai[key].bind(ai):ai[key]});
  const worker = createWorker(store,provider,{maxPerDay:Number(env.MAX_BUILDS_PER_DAY)||20,maxPages:Number(env.MAX_PAGES_PER_BUILD)||200,...dependencies.worker});
  const limits = new Map();
  const timer = env.WORKER_ENABLED === 'false' ? null : setInterval(()=>worker(),5000);
  timer?.unref();
  function rate(req, key, count, window = 3600000) {
    const ip = env.TRUST_PROXY === 'true' ? String(req.headers['x-forwarded-for']||req.socket.remoteAddress).split(',')[0].trim() : req.socket.remoteAddress;
    const k=key+':'+ip,now=Date.now();
    if(limits.size>5000)for(const [k,v] of limits)if(v.until<now)limits.delete(k);
    const v=limits.get(k);if(!v||v.until<now){limits.set(k,{n:1,until:now+window});return;}
    if(++v.n>count)throw Object.assign(new Error('Too many requests. Please try again later.'),{status:429});
  }
  function signature(value){return createHmac('sha256',secret).update(value).digest('base64url')}
  function session(req){const token=String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('studio_session='))?.slice(15);if(!token)return false;const [until,sig]=token.split('.');return Number(until)>Date.now()&&!!sig&&equal(signature(until),sig);}
  function requireAdmin(req){if(!session(req))throw Object.assign(new Error('Please sign in'),{status:401});}
  function checkOrigin(req){if(req.headers.origin!==origin)throw Object.assign(new Error('Request origin is not allowed'),{status:403});}
  function send(res,status,data,type='application/json; charset=utf-8') {res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'SAMEORIGIN','Permissions-Policy':'camera=(), microphone=(), geolocation=()'});res.end(type.startsWith('application/json')?JSON.stringify(data):data);}
  async function body(req){let size=0;const chunks=[];for await(const c of req){size+=c.length;if(size>65536)throw Object.assign(new Error('Request is too large'),{status:413});chunks.push(c);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw Object.assign(new Error('Invalid JSON'),{status:400});}}
  function publicJob(job){return {job_id:job.id,status:job.status,duplicate:false,message:job.status==='requested'?'Your request is saved. We will confirm the brief and presentation time.':'Build request accepted. The concept will be reviewed before sharing.'};}
  function accept(args,source,key){const old=store.db.prepare('SELECT created_at FROM jobs WHERE dedupe_key=?').get(key);const brief=validateBrief(args,{requireAppointment:source!=='web',now:old?.created_at||Date.now()});const result=store.enqueue(brief,source,key,Number(env.MAX_PENDING_JOBS)||100);return {...publicJob(result.job),duplicate:result.duplicate};}
  const server = http.createServer(async(req,res)=>{
    try{
      const u=new URL(req.url,'http://localhost'),path=u.pathname;
      if(req.method==='GET'&&path==='/api/website-builder/health')return send(res,200,{ok:true,service:'website-studio'});
      if(req.method==='GET'&&path.startsWith('/website-studio/assets/')){
        const name=path.split('/').pop();if(!['landing.css','landing.js','admin.js','preview.css','preview.js'].includes(name))return send(res,404,{error:'Not found'});
        return send(res,200,readFileSync(join(assets,name)),name.endsWith('.css')?'text/css; charset=utf-8':'application/javascript; charset=utf-8');
      }
      if(req.method==='GET'&&['/free-website','/free-website/'].includes(path)){res.writeHead(301,{Location:'/website'});return res.end();}
      if(req.method==='GET'&&['/website','/website/'].includes(path))return send(res,200,readFileSync(join(assets,'landing.html')),'text/html; charset=utf-8');
      if(req.method==='GET'&&['/website-studio','/website-studio/'].includes(path))return send(res,200,readFileSync(join(assets,'admin.html')),'text/html; charset=utf-8');
      if(req.method==='POST'&&path==='/api/website-builder/requests'){
        checkOrigin(req);rate(req,'requests',5);const data=await body(req);
        if(data.company_fax)return send(res,202,{status:'requested',message:'Thank you.'});
        const { company_fax,request_id,...brief }=data;
        if(!/^[a-zA-Z0-9-]{16,80}$/.test(request_id||''))throw new Error('Invalid request identifier');
        return send(res,202,accept(brief,'web','web:'+request_id));
      }
      if(req.method==='POST'&&path==='/api/website-builder/vapi'){
        if(!equal(req.headers.authorization||'',`Bearer ${env.WEBHOOK_SECRET}`))return send(res,401,{error:'Invalid webhook credentials'});
        rate(req,'vapi',500);const data=await body(req),message=data.message;
        if(!message||message.type!=='tool-calls')return send(res,200,{ignored:true});
        const calls=message.toolCallList;
        if(!Array.isArray(calls)||calls.length>5||!message.call?.id)throw new Error('Missing Vapi tool-call context');
        const results=calls.map(call=>{
          try{
            if(call.function?.name!=='start_website_build')throw new Error('Unknown tool');
            const args=typeof call.function.arguments==='string'?JSON.parse(call.function.arguments):call.function.arguments;
            const result=accept(args,'vapi',`vapi:${message.call.id}:website-build`);
            return {toolCallId:call.id,result:JSON.stringify(result)};
          }catch(e){return {toolCallId:call.id,error:e instanceof z.ZodError?'The brief is incomplete or invalid. Check required fields.':e.message};}
        });return send(res,200,{results});
      }
      if(req.method==='POST'&&path==='/api/website-builder/login'){
        checkOrigin(req);rate(req,'login',12,15*60000);const data=await body(req);
        const valid=[1,2].some(i=>env[`ADMIN_USER_${i}`]&&env[`ADMIN_PASS_${i}`]&&equal(data.username,env[`ADMIN_USER_${i}`])&&equal(data.password,env[`ADMIN_PASS_${i}`]));
        if(!valid)return send(res,401,{error:'Invalid username or password'});
        const until=String(Date.now()+8*3600000);res.setHeader('Set-Cookie',`studio_session=${until}.${signature(until)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${origin.startsWith('https:')?'; Secure':''}`);return send(res,200,{ok:true});
      }
      if(req.method==='POST'&&path==='/api/website-builder/logout'){checkOrigin(req);res.setHeader('Set-Cookie','studio_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return send(res,200,{ok:true});}
      if(path.startsWith('/api/website-builder/admin/')){
        requireAdmin(req);if(req.method!=='GET')checkOrigin(req);
        if(req.method==='GET'&&path.endsWith('/overview'))return send(res,200,{jobs:store.list(),provider:{configured:ai.configured,model:ai.model,name:ai.provider,label:ai.label,models:ai.models},max_pages:Number(env.MAX_PAGES_PER_BUILD)||200,paused:store.setting('paused')==='true',webhook_url:origin+'/api/website-builder/vapi'});
        if(req.method==='GET'&&path.endsWith('/tool'))return send(res,200,{type:'function',async:false,function:{name:'start_website_build',description:'Queue a website concept after explicit consent, completed discovery, confirmed budget of $500 plus $50/month if they love it, and successful confirmed calendar booking 24–48 hours from now. Never say the site is already built.',parameters:toolParameters},server:{url:origin+'/api/website-builder/vapi',timeoutSeconds:20},messages:[{type:'request-start',content:'I’m sending your brief to our website team.'}]});
        if(req.method==='POST'&&path.endsWith('/webhook-credential'))return send(res,200,{token:env.WEBHOOK_SECRET});
        if(req.method==='POST'&&path.endsWith('/provider')){
          const data=await body(req);if(typeof data.api_key!=='string'||data.api_key.length<20||data.api_key.length>1000)throw new Error('Enter your provider API key');
          if(store.db.prepare("SELECT count(*) n FROM jobs WHERE status='building'").get().n)throw new Error('Pause builds and wait for the current page to finish before changing provider');
          const cfg=providerConfig({...aiEnv,AI_PROVIDER:data.provider||'openai'});
          const response=await fetch(cfg.base+'/models',{headers:{Authorization:`Bearer ${data.api_key}`},signal:AbortSignal.timeout(15000)});
          if(!response.ok)throw new Error(`${cfg.label} rejected the key (HTTP ${response.status})`);
          const models=await response.json();for(const model of new Set([cfg.model,cfg.reviewModel,cfg.discoveryModel,cfg.chatModel].filter(Boolean)))if(!models.data?.some(x=>x.id===model))throw new Error(`This account does not list ${model}`);
          if(cfg.provider==='deepinfra'){
            const probe=await fetch(cfg.base+'/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${data.api_key}`,'Content-Type':'application/json'},body:JSON.stringify({model:cfg.chatModel,messages:[{role:'user',content:'Reply ready.'}],max_tokens:16,reasoning_effort:'none'}),signal:AbortSignal.timeout(30000)});
            if(!probe.ok)throw new Error(`DeepInfra authentication or billing check failed (HTTP ${probe.status})`);
          }
          store.setting(cfg.provider+'_key',encrypt(data.api_key));store.setting('ai_provider',cfg.provider);aiEnv.AI_PROVIDER=cfg.provider;aiEnv[cfg.provider.toUpperCase()+'_API_KEY']=data.api_key;ai=createAI(aiEnv);return send(res,200,{configured:true,model:ai.model});
        }
        if(req.method==='POST'&&path.endsWith('/pause')){const data=await body(req);store.setting('paused',data.paused?'true':'false');return send(res,200,{paused:!!data.paused});}
        const match=path.match(/^\/api\/website-builder\/admin\/jobs\/([a-f0-9-]+)(?:\/(approve|retry|cancel|qualify|export|coverage))?$/);
        if(match){const job=store.get(match[1]);if(!job)return send(res,404,{error:'Job not found'});
          if(req.method==='GET'&&!match[2])return send(res,200,{job,pages:store.pages(job.id),events:store.events(job.id),messages:store.messages(job.id)});
          if(req.method==='GET'&&match[2]==='export'){
            if(!job.spec)return send(res,409,{error:'No concept generated yet'});
            res.setHeader('Content-Disposition',`attachment; filename="website-${job.id}.json"`);return send(res,200,{spec:job.spec,inventory:job.inventory,pages:store.pages(job.id),source:job.brief.website_url,review:job.review});
          }
          if(req.method==='POST'){
            const action=match[2];
            if(action==='coverage'){
              if(job.status==='building'||!job.inventory)throw new Error('Coverage can be edited after source discovery finishes');
              const input=z.object({services:z.string().max(20000),locations:z.string().max(30000),notes:z.string().trim().min(20).max(6000),confirmed:z.literal(true)}).parse(await body(req));
              const source='operator-confirmation:'+job.id+':'+Date.now();
              const parseLines=(text,max)=>{const lines=text.split('\n').map(s=>s.trim()).filter(Boolean);if(!lines.length||lines.length>max)throw new Error(`Enter between 1 and ${max} items`);return lines.map(line=>{const [name,...rest]=line.split('|'),summary=rest.join('|').trim();if(name.trim().length<2||name.trim().length>150||summary.length<15||summary.length>800)throw new Error('Each item needs a name and at least 15 characters of factual details, separated by |');return {name:name.trim(),summary,sources:[{url:source,quote:name.trim()+': '+summary}]};});};
              const part={services:parseLines(input.services,100),locations:parseLines(input.locations,200),uncertainties:[]};
              const text=[...part.services,...part.locations].map(x=>x.sources[0].quote).join('\n')+'\nOperator-confirmed coverage and restrictions: '+input.notes;
              const evidence={...job.evidence,pages:[...(job.evidence?.pages||[]).filter(p=>!p.url.startsWith('operator-confirmation:')),{url:source,title:'Business-confirmed coverage',text}],warnings:[],incomplete:false,operator_confirmation:{at:new Date().toISOString(),notes:input.notes,previous_warnings:job.evidence?.warnings||[]}};
              store.replaceCoverage(job.id,mergeInventory([part],evidence),evidence);store.event(job.id,'coverage_confirmed','Operator confirmed coverage; previous concept archived and rebuild queued');
            }else if(action==='approve'){
              if(job.status!=='review'||!job.review?.passed||!job.review?.checks?.passed)throw new Error('Resolve review failures before approval');
              if(job.inventory&&!validatePageSet(store.pages(job.id),job.inventory).passed)throw new Error('Resolve page review failures before approval');
              store.update(job.id,{status:'approved',approved_at:Date.now()});store.event(job.id,'approved','Human approved the concept for sharing');
            }else if(action==='retry'){
              if(!['failed','needs_attention'].includes(job.status))throw new Error('Only failed builds can be retried');
              store.update(job.id,{status:'queued',next_attempt:0,error:null});store.event(job.id,'queued','Manual retry requested');
            }else if(action==='cancel'){
              if(job.status==='building')throw new Error('Wait for the active build to finish before cancelling');
              store.update(job.id,{status:'cancelled',approved_at:null});store.event(job.id,'cancelled','Build cancelled; sharing disabled');
            }else if(action==='qualify'){
              if(job.status!=='requested')throw new Error('This request has already been qualified');
              const input=await body(req),brief=validateBrief({...job.brief,appointment:input.appointment});
              store.update(job.id,{brief,status:'queued'});store.event(job.id,'queued','Calendar booking confirmed by operator');
            }else return send(res,404,{error:'Unknown action'});
            return send(res,200,{job:store.get(job.id)});
          }
        }
      }
      const preview=path.match(/^\/website-previews\/([a-zA-Z0-9_-]{32})(?:\/([a-z0-9./-]*))?$/);
      if(req.method==='GET'&&preview){
        const job=store.byToken(preview[1]);if(!job?.spec||job.status==='cancelled'||(!job.approved_at&&!session(req)))return send(res,404,{error:'Preview is not available'});
        const pageRows=store.pages(job.id),page=(preview[2]||'home').replace(/\/$/,''),routes=siteRoutes(job.inventory,pageRows);
        if(page==='sitemap.xml'){res.setHeader('X-Robots-Tag','noindex, nofollow');return send(res,200,`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(p=>`<url><loc>${escape(origin+'/website-previews/'+job.preview_token+'/'+(p==='home'?'':p))}</loc></url>`).join('')}</urlset>`,'application/xml; charset=utf-8');}
        if(!routes.includes(page))return send(res,404,{error:'Page not found'});
        res.setHeader('X-Robots-Tag','noindex, nofollow');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'");
        return send(res,200,renderSite(job.spec,{token:job.preview_token,page,draft:!job.approved_at,inventory:job.inventory,pageRows,origin}),'text/html; charset=utf-8');
      }
      const visitor=path.match(/^\/api\/website-builder\/previews\/([a-zA-Z0-9_-]{32})\/(chat|inquiry)$/);
      if(req.method==='POST'&&visitor){
        checkOrigin(req);const job=store.byToken(visitor[1]);if(!job?.spec||job.status==='cancelled'||(!job.approved_at&&!session(req)))return send(res,404,{error:'Preview is not available'});
        rate(req,visitor[1]+visitor[2],visitor[2]==='chat'?15:5);const data=await body(req);
        if(visitor[2]==='chat'){const v=z.object({message:z.string().trim().min(1).max(1000),page:z.string().max(300).optional()}).parse(data),current=v.page&&store.page(job.id,v.page);return send(res,200,{answer:await ai.chat({...job.spec,service_areas:job.inventory?.locations.map(l=>({name:l.name,summary:l.summary})),current_page:current?.content},v.message)});}
        const v=z.object({name:z.string().trim().min(1).max(120),email:z.email().max(254),message:z.string().trim().min(1).max(4000)}).parse(data);store.message(job.id,v);return send(res,201,{saved:true});
      }
      send(res,404,{error:'Not found'});
    }catch(e){send(res,e.status||(e instanceof z.ZodError?422:400),{error:e instanceof z.ZodError?e.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join(';'):String(e.message).slice(0,500)});}
  });
  server.requestTimeout=30000;server.headersTimeout=15000;
  return {server,store,tick:()=>worker(),close:()=>{clearInterval(timer);server.close();store.close();}};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const app=createApp();app.server.listen(Number(process.env.PORT)||3180,process.env.HOST||'127.0.0.1',()=>console.log('Website Studio listening'));process.on('SIGTERM',()=>{app.server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),10000).unref();});}
