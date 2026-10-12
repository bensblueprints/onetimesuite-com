import { crawlSite } from './crawl.js';
import { validateRenderedSite, siteRoutes } from './render.js';
import { planPages, validatePageSet } from './page-plan.js';

export function createWorker(store, ai, { maxPerDay = 20, maxPages = 200, crawl = crawlSite } = {}) {
  let busy = false;
  return async function tick() {
    if (busy || !ai.configured || store.setting('paused') === 'true') return;
    busy = true;
    let job;
    try {
      job = store.claim(maxPerDay); if (!job) return;
      const evidence = job.evidence || await crawl(job.brief.website_url);
      store.update(job.id,{ evidence }); store.event(job.id,'source_imported',`${evidence.pages.length} pages imported`);
      let inventory=job.inventory;
      if(ai.discover&&!inventory){const discovered=await ai.discover(evidence);inventory=discovered.inventory;store.update(job.id,{inventory,lease_until:Date.now()+15*60000});store.event(job.id,'inventory',`${inventory.services.length} services and ${inventory.locations.length} service areas discovered`);}
      if(inventory){const planned=planPages(inventory);store.plan(job.id,planned);if(planned.length+4+(inventory.locations.length?1:0)>maxPages){store.update(job.id,{status:'needs_attention',lease_until:0,error:`Full page plan saved: ${planned.length+4+(inventory.locations.length?1:0)} pages exceeds the configured ${maxPages}-page build budget. Review the plan and raise MAX_PAGES_PER_BUILD to proceed.`});return;}}
      let generated = job.spec ? {spec:job.spec,usage:{}} : await ai.generate(job.brief,evidence,[],inventory);
      store.update(job.id,{spec:generated.spec,lease_until:Date.now()+15*60000});
      store.event(job.id,'base_review','Main pages generated; independent review started');
      let review = await ai.review(job.brief,evidence,generated.spec);
      const usage = [generated.usage, review.usage];
      if (!review.passed) {
        store.event(job.id,'revision','Reviewer requested one correction pass');
        generated = await ai.generate(job.brief,evidence,review.issues,inventory);
        store.update(job.id,{spec:generated.spec,lease_until:Date.now()+15*60000});
        review = await ai.review(job.brief,evidence,generated.spec);
        usage.push(generated.usage,review.usage);
      }
      store.update(job.id,{spec:generated.spec,lease_until:Date.now()+15*60000});
      if(inventory&&review.passed){
        for(const page of store.pages(job.id)){
          if(page.status==='ready')continue;
          if(store.setting('paused')==='true'){store.update(job.id,{status:'queued',lease_until:0});return;}
          store.update(job.id,{lease_until:Date.now()+15*60000});
          store.event(job.id,'page_building',page.path);
          let built=await ai.generatePage(generated.spec.business_name,page,inventory,evidence,page.review?.issues||[]),checked=await ai.reviewPage(generated.spec.business_name,page,inventory,evidence,built.content);
          if(!checked.passed){built=await ai.generatePage(generated.spec.business_name,page,inventory,evidence,checked.issues);checked=await ai.reviewPage(generated.spec.business_name,page,inventory,evidence,built.content);}
          store.savePage(job.id,page.path,built.content,{...checked,generation_usage:built.usage});
          store.event(job.id,checked.passed?'page_ready':'page_needs_attention',page.path);
        }
      }
      const pageRows=store.pages(job.id),checks = validateRenderedSite(generated.spec,{inventory,pageRows});
      const pageReview=inventory?validatePageSet(pageRows,inventory):{passed:true,issues:[]};
      const coverageIssues=[...(inventory?.uncertainties||[]),...(evidence.warnings||[])];
      if(inventory?.services.length&&!inventory.locations.length)coverageIssues.push('No evidenced service areas found. Confirm the actual locations served before approving this service-business concept.');
      for(const page of pageRows){const failures=pageReview.issues.filter(i=>i.startsWith(page.path+':'));if(failures.length&&page.content)store.savePage(job.id,page.path,page.content,{...page.review,passed:false,issues:failures});}
      review={...review,passed:review.passed&&pageReview.passed&&!coverageIssues.length,issues:[...review.issues,...pageReview.issues,...coverageIssues],page_count:siteRoutes(inventory,pageRows).length};
      const status = review.passed && checks.passed ? 'review' : 'needs_attention';
      store.update(job.id,{ status, spec:generated.spec, review:{ ...review, checks, usage }, error:null, lease_until:0 });
      store.event(job.id,status,status === 'review' ? 'Concept generated; ready for human review' : 'Review found issues; approval is blocked');
    } catch (e) {
      if (job) {
        const status = e.permanent || job.attempts >= 3 ? 'failed' : 'queued';
        store.update(job.id,{ status, error: String(e.message).slice(0,500), lease_until:0, next_attempt:Date.now()+Math.min(3600000,60000*2**job.attempts) });
        store.event(job.id,status,String(e.message).slice(0,500));
      } else console.error('Worker queue error:',e.message);
    } finally { busy = false; }
  };
}
