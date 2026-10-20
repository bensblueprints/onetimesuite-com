import { DatabaseSync } from 'node:sqlite';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

export function createStore(dir) {
  mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(join(dir, 'studio.sqlite'));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY, dedupe_key TEXT UNIQUE NOT NULL, payload_hash TEXT NOT NULL,
      source TEXT NOT NULL, status TEXT NOT NULL, brief TEXT NOT NULL,
      created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0,
      next_attempt INTEGER NOT NULL DEFAULT 0, lease_until INTEGER NOT NULL DEFAULT 0,
      preview_token TEXT UNIQUE NOT NULL, spec TEXT, evidence TEXT, review TEXT, error TEXT,
      approved_at INTEGER, last_build_day TEXT
    );
    CREATE INDEX IF NOT EXISTS jobs_queue ON jobs(status,next_attempt,created_at);
    CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY,job_id TEXT,at INTEGER,kind TEXT,detail TEXT);
    CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY,job_id TEXT,at INTEGER,name TEXT,email TEXT,message TEXT);
    CREATE TABLE IF NOT EXISTS quota(day TEXT PRIMARY KEY,builds INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);`);
  if(!db.prepare('PRAGMA table_info(jobs)').all().some(c=>c.name==='inventory'))db.exec('ALTER TABLE jobs ADD COLUMN inventory TEXT');
  db.exec(`CREATE TABLE IF NOT EXISTS concept_pages(job_id TEXT NOT NULL,path TEXT NOT NULL,plan TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',content TEXT,review TEXT,PRIMARY KEY(job_id,path))`);
  db.exec('CREATE TABLE IF NOT EXISTS revisions(id INTEGER PRIMARY KEY,job_id TEXT NOT NULL,at INTEGER NOT NULL,snapshot TEXT NOT NULL)');
  const decode = r => r ? { ...r, brief: JSON.parse(r.brief), spec: r.spec && JSON.parse(r.spec), evidence: r.evidence && JSON.parse(r.evidence), review: r.review && JSON.parse(r.review),inventory:r.inventory&&JSON.parse(r.inventory) } : null;
  function event(id, kind, detail) { db.prepare('INSERT INTO events(job_id,at,kind,detail) VALUES(?,?,?,?)').run(id, Date.now(), kind, detail); }
  return {
    db, event,
    enqueue(brief, source, key, max = 100) {
      const hash = createHash('sha256').update(JSON.stringify(brief)).digest('hex');
      const existing = db.prepare('SELECT * FROM jobs WHERE dedupe_key=?').get(key);
      if (existing) {
        if (existing.payload_hash !== hash) throw Object.assign(new Error('This request already exists with different details; update it in the studio'), { status: 409 });
        return { job: decode(existing), duplicate: true };
      }
      if (db.prepare("SELECT count(*) n FROM jobs WHERE status IN ('queued','building','requested')").get().n >= max) throw Object.assign(new Error('The studio is at capacity. Please try again later.'), { status: 503 });
      const id = randomUUID(), now = Date.now(), status = source === 'web' ? 'requested' : 'queued';
      db.prepare('INSERT INTO jobs(id,dedupe_key,payload_hash,source,status,brief,created_at,updated_at,preview_token) VALUES(?,?,?,?,?,?,?,?,?)').run(id, key, hash, source, status, JSON.stringify(brief), now, now, randomBytes(24).toString('base64url'));
      event(id, status, source === 'web' ? 'Concept requested; qualification required' : 'Confirmed brief accepted');
      return { job: this.get(id), duplicate: false };
    },
    get(id) { return decode(db.prepare('SELECT * FROM jobs WHERE id=?').get(id)); },
    byToken(token) { return decode(db.prepare('SELECT * FROM jobs WHERE preview_token=?').get(token)); },
    list() { return db.prepare('SELECT id FROM jobs ORDER BY created_at DESC LIMIT 200').all().map(r => this.get(r.id)); },
    update(id, fields) {
      const allowed = new Set(['status','spec','evidence','review','error','approved_at','lease_until','next_attempt','brief','inventory']);
      const entries = Object.entries(fields).filter(([k]) => allowed.has(k));
      if (!entries.length) return;
      db.prepare(`UPDATE jobs SET ${entries.map(([k]) => `${k}=?`).join(',')},updated_at=? WHERE id=?`).run(...entries.map(([k,v]) => ['spec','evidence','review','brief','inventory'].includes(k) && v !== null ? JSON.stringify(v) : v), Date.now(), id);
    },
    plan(id,pages){db.exec('BEGIN IMMEDIATE');try{const insert=db.prepare('INSERT OR IGNORE INTO concept_pages(job_id,path,plan) VALUES(?,?,?)');for(const p of pages)insert.run(id,p.path,JSON.stringify(p));db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}},
    pages(id){return db.prepare('SELECT * FROM concept_pages WHERE job_id=? ORDER BY path').all(id).map(p=>({...JSON.parse(p.plan),status:p.status,content:p.content&&JSON.parse(p.content),review:p.review&&JSON.parse(p.review)}));},
    page(id,path){const p=db.prepare('SELECT * FROM concept_pages WHERE job_id=? AND path=?').get(id,path);return p?{...JSON.parse(p.plan),status:p.status,content:p.content&&JSON.parse(p.content),review:p.review&&JSON.parse(p.review)}:null;},
    savePage(id,path,content,review){db.prepare('UPDATE concept_pages SET content=?,review=?,status=? WHERE job_id=? AND path=?').run(JSON.stringify(content),JSON.stringify(review),review.passed?'ready':'needs_attention',id,path);},
    replaceCoverage(id,inventory,evidence){
      db.exec('BEGIN IMMEDIATE');try{
        db.prepare('INSERT INTO revisions(job_id,at,snapshot) VALUES(?,?,?)').run(id,Date.now(),JSON.stringify({job:this.get(id),pages:this.pages(id)}));
        db.prepare('DELETE FROM concept_pages WHERE job_id=?').run(id);
        this.update(id,{inventory,evidence,spec:null,review:null,status:'queued',approved_at:null,error:null,next_attempt:0,lease_until:0});
        db.exec('COMMIT');
      }catch(e){db.exec('ROLLBACK');throw e;}
    },
    claim(maxPerDay = 20) {
      const now = Date.now(), day = new Date().toISOString().slice(0,10);
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare("UPDATE jobs SET status=CASE WHEN attempts>=3 THEN 'failed' ELSE 'queued' END,error='Worker interrupted; lease expired' WHERE status='building' AND lease_until<?").run(now);
        db.prepare('INSERT OR IGNORE INTO quota(day,builds) VALUES(?,0)').run(day);
        const used = db.prepare('SELECT builds FROM quota WHERE day=?').get(day).builds;
        const row = used < maxPerDay && db.prepare("SELECT id FROM jobs WHERE status='queued' AND next_attempt<=? ORDER BY created_at LIMIT 1").get(now);
        if (!row) { db.exec('COMMIT'); return null; }
        db.prepare("UPDATE jobs SET status='building',attempts=attempts+1,lease_until=?,updated_at=?,last_build_day=? WHERE id=?").run(now + 15*60000, now, day, row.id);
        db.prepare('UPDATE quota SET builds=builds+1 WHERE day=?').run(day);
        db.exec('COMMIT'); event(row.id, 'building', 'Source review and AI generation started'); return this.get(row.id);
      } catch (e) { db.exec('ROLLBACK'); throw e; }
    },
    events(id) { return db.prepare('SELECT * FROM events WHERE job_id=? ORDER BY at DESC').all(id); },
    message(id, v) { db.prepare('INSERT INTO messages(job_id,at,name,email,message) VALUES(?,?,?,?,?)').run(id,Date.now(),v.name,v.email,v.message); },
    messages(id) { return db.prepare('SELECT * FROM messages WHERE job_id=? ORDER BY at DESC').all(id); },
    setting(key, value) { if (value !== undefined) db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key,value); return db.prepare('SELECT value FROM settings WHERE key=?').get(key)?.value; },
    close() { db.close(); },
  };
}
