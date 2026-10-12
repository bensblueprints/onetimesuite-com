import { crawlSite } from './crawl.js';
import { validateRenderedSite } from './render.js';

export function createWorker(store, ai, { maxPerDay = 20, crawl = crawlSite } = {}) {
  let busy = false;
  return async function tick() {
    if (busy || !ai.configured || store.setting('paused') === 'true') return;
    busy = true;
    let job;
    try {
      job = store.claim(maxPerDay); if (!job) return;
      const evidence = await crawl(job.brief.website_url);
      store.update(job.id,{ evidence }); store.event(job.id,'source_imported',`${evidence.pages.length} pages imported`);
      let generated = await ai.generate(job.brief,evidence);
      let review = await ai.review(job.brief,evidence,generated.spec);
      const usage = [generated.usage, review.usage];
      if (!review.passed) {
        store.event(job.id,'revision','Reviewer requested one correction pass');
        generated = await ai.generate(job.brief,evidence,review.issues);
        review = await ai.review(job.brief,evidence,generated.spec);
        usage.push(generated.usage,review.usage);
      }
      const checks = validateRenderedSite(generated.spec);
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
