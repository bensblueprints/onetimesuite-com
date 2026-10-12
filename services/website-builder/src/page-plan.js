import { createHash } from 'node:crypto';
import { z } from 'zod';

const citation = z.object({url:z.string(),quote:z.string().min(12).max(1000)}).strict();
const entity = z.object({name:z.string().min(2).max(150),summary:z.string().min(15).max(1500),sources:z.array(citation).min(1).max(6)}).strict();
export const inventorySchema = z.object({services:z.array(entity).max(100),locations:z.array(entity).max(200),uncertainties:z.array(z.string().max(1000)).max(100)}).strict();
export const detailPageSchema = z.object({
  title:z.string().min(10).max(170),description:z.string().min(40).max(320),heading:z.string().min(5).max(160),intro:z.string().min(80).max(1500),
  sections:z.array(z.object({heading:z.string().min(5).max(160),body:z.string().min(100).max(2400)}).strict()).min(2).max(5),
  faqs:z.array(z.object({question:z.string().min(10).max(220),answer:z.string().min(40).max(1000)}).strict()).min(2).max(5),
  needs_review:z.array(z.string().max(1000)).max(20),
}).strict();
export const normalize = v => String(v).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
function slug(name){const readable=name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70);return readable||'item';}
export function mergeInventory(parts,evidence){
  const pages=new Map(evidence.pages.map(p=>[p.url,normalize(p.text)]));
  const result={services:[],locations:[],uncertainties:[]};
  for(const part of parts){const parsed=inventorySchema.parse(part);result.uncertainties.push(...parsed.uncertainties);
    for(const kind of ['services','locations'])for(const item of parsed[kind]){
      const sources=item.sources.filter(s=>pages.has(s.url)&&pages.get(s.url).includes(normalize(s.quote))&&normalize(s.quote).includes(normalize(item.name)));
      if(!sources.length){result.uncertainties.push(`Source confirmation needed for ${kind.slice(0,-1)}: ${item.name}`);continue;}
      const existing=result[kind].find(x=>normalize(x.name)===normalize(item.name));
      if(existing)existing.sources=[...new Map([...existing.sources,...sources].map(s=>[s.url+'|'+s.quote,s])).values()];
      else result[kind].push({...item,sources});
    }
  }
  for(const kind of ['services','locations']){
    result[kind].sort((a,b)=>a.name.localeCompare(b.name,'en'));
    const used=new Set();for(const item of result[kind]){let id=slug(item.name);if(used.has(id))id+='-'+createHash('sha256').update(item.name).digest('hex').slice(0,8);used.add(id);item.id=id;}
  }
  if(result.services.length>100||result.locations.length>200)throw Object.assign(new Error('Source inventory exceeds 100 services or 200 locations. An operator must scope this build before generation.'),{permanent:true});
  result.uncertainties=[...new Set(result.uncertainties)];return result;
}
export function planPages(inventory){
  const pages=[];
  for(const s of inventory.services)pages.push({path:`services/${s.id}`,kind:'service',title:s.name,service_id:s.id,location_id:null});
  for(const l of inventory.locations){pages.push({path:`locations/${l.id}`,kind:'location',title:l.name,service_id:null,location_id:l.id});
    for(const s of inventory.services)pages.push({path:`locations/${l.id}/${s.id}`,kind:'service_location',title:`${s.name} in ${l.name}`,service_id:s.id,location_id:l.id});
  }
  return pages;
}
export function pageContext(plan,inventory,evidence){
  const service=inventory.services.find(s=>s.id===plan.service_id),location=inventory.locations.find(l=>l.id===plan.location_id);
  const urls=new Set([...(service?.sources||[]),...(location?.sources||[])].map(s=>s.url));
  return {operator_confirmation:evidence.operator_confirmation||null,plan,service:service||null,location:location||null,available_services:plan.kind==='location'?inventory.services.map(s=>({name:s.name,summary:s.summary})):[],service_areas:plan.kind==='service'?inventory.locations.map(l=>l.name):[],evidence:evidence.pages.filter(p=>urls.has(p.url)).map(p=>({url:p.url,title:p.title,text:p.text})),uncertainties:inventory.uncertainties};
}
function textOf(content){return [content.intro,...content.sections.map(s=>s.body),...content.faqs.map(f=>f.answer)].join(' ');}
export function validatePageSet(pageRows,inventory){
  const issues=[],titles=new Set(),descriptions=new Set(),fingerprints=[];
  const planned=planPages(inventory),actual=new Set(pageRows.map(p=>p.path));
  for(const p of planned)if(!actual.has(p.path))issues.push(`${p.path}: planned page is missing`);
  const expected=new Set(planned.map(p=>p.path));
  for(const p of pageRows)if(!expected.has(p.path))issues.push(`${p.path}: page is outside the current coverage plan`);
  const names=[...inventory.services,...inventory.locations].map(x=>normalize(x.name)).sort((a,b)=>b.length-a.length);
  for(const p of pageRows){
    if(!p.content||!p.review?.passed){issues.push(`${p.path}: generation or independent review is incomplete`);continue;}
    for(const [value,set,label] of [[p.content.title,titles,'title'],[p.content.description,descriptions,'description']]){const n=normalize(value);if(set.has(n))issues.push(`${p.path}: duplicate ${label}`);set.add(n);}
    let text=normalize(textOf(p.content));for(const name of names)text=text.split(name).join('entity');
    const words=text.split(' '),shingles=new Set();for(let i=0;i<words.length-4;i++)shingles.add(words.slice(i,i+5).join(' '));
    for(const other of fingerprints){const common=[...shingles].filter(s=>other.set.has(s)).length;const union=shingles.size+other.set.size-common;if(union&&common/union>0.82){issues.push(`${p.path}: content is too similar to ${other.path} after service/location names are removed`);break;}}
    fingerprints.push({path:p.path,set:shingles});
    if(p.content.needs_review.length)issues.push(...p.content.needs_review.map(s=>`${p.path}: ${s}`));
  }
  return {passed:issues.length===0,issues};
}
