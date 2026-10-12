-- Run on Hetzner leadscraper, not the website-builder SQLite database.
-- Audience staging only. This file cannot place calls or enable a campaign.
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '180s';
CREATE SCHEMA IF NOT EXISTS ots_outreach;
CREATE TABLE IF NOT EXISTS ots_outreach.settings (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  paused boolean NOT NULL DEFAULT true,
  local_start time NOT NULL DEFAULT '09:00',
  local_end time NOT NULL DEFAULT '17:00',
  weekdays integer[] NOT NULL DEFAULT ARRAY[1,2,3,4,5],
  daily_call_limit integer CHECK (daily_call_limit > 0),
  daily_budget_usd numeric(12,2) CHECK (daily_budget_usd > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO ots_outreach.settings(singleton) VALUES(true) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS ots_outreach.audience (
  lead_id bigint PRIMARY KEY,
  cohort text NOT NULL,
  priority integer NOT NULL,
  state text NOT NULL DEFAULT 'held' CHECK(state IN ('held','reviewed','suppressed','completed')),
  eligibility_verified boolean NOT NULL DEFAULT false,
  eligibility_evidence text,
  verified_timezone text,
  timezone_evidence text,
  imported_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ots_outreach.suppression (
  phone_e164 text PRIMARY KEY,
  reason text NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
-- Do not merge businesses on a shared phone/domain. Preserve catalog IDs.
-- The calling export below chooses one reviewed record per phone separately.
WITH fishing AS (
  SELECT DISTINCT lead_id FROM catalog.lead_categories WHERE category_id='gcid:fishing_charter'
), source AS (
  SELECT l.id,
    CASE WHEN l.name ~* '(fishing|angling|fly.fish).*(guide)|guide.*(fishing|angling|fly.fish)' THEN 'fishing_guides_review'
         WHEN f.lead_id IS NOT NULL THEN 'fishing_charters' ELSE 'general' END AS cohort
  FROM catalog.leads l LEFT JOIN fishing f ON f.lead_id=l.id
  WHERE NOT EXISTS(SELECT 1 FROM catalog.duplicates d WHERE d.lead_id=l.id)
)
INSERT INTO ots_outreach.audience(lead_id,cohort,priority)
SELECT id,cohort,CASE cohort WHEN 'fishing_guides_review' THEN 10 WHEN 'fishing_charters' THEN 20 ELSE 100 END
FROM source
ON CONFLICT(lead_id) DO UPDATE SET cohort=excluded.cohort,priority=excluded.priority;
CREATE INDEX IF NOT EXISTS audience_priority ON ots_outreach.audience(priority,lead_id);
CREATE OR REPLACE VIEW ots_outreach.review_queue AS
SELECT a.*, l.name AS business_name,l.website,l.platform,l.country,l.state AS source_state,l.city,l.address,
       l.phone AS source_phone,l.fields->>'timezone' AS source_timezone,
       CASE WHEN l.country IN ('US','USA','United States') AND regexp_replace(l.phone,'[^0-9]','','g') ~ '^[2-9][0-9]{2}[2-9][0-9]{6}$'
              THEN '+1'||regexp_replace(l.phone,'[^0-9]','','g')
            WHEN l.country IN ('US','USA','United States') AND regexp_replace(l.phone,'[^0-9]','','g') ~ '^1[2-9][0-9]{2}[2-9][0-9]{6}$'
              THEN '+'||regexp_replace(l.phone,'[^0-9]','','g') END AS phone_e164
FROM ots_outreach.audience a JOIN catalog.leads l ON l.id=a.lead_id
WHERE NOT EXISTS(SELECT 1 FROM catalog.duplicates d WHERE d.lead_id=l.id);
-- Fail closed. An operator must validate source location, eligibility and budget.
-- A future dispatcher must additionally reserve daily budget atomically, persist
-- call outcomes/opt-outs and recheck this gate immediately before EACH dial.
CREATE OR REPLACE VIEW ots_outreach.currently_reviewed_us_candidates AS
SELECT DISTINCT ON (q.phone_e164) q.*
FROM ots_outreach.review_queue q CROSS JOIN ots_outreach.settings s
WHERE NOT s.paused AND s.daily_call_limit IS NOT NULL AND s.daily_budget_usd IS NOT NULL
  AND q.state='reviewed' AND q.eligibility_verified
  AND nullif(trim(q.eligibility_evidence),'') IS NOT NULL
  AND nullif(trim(q.timezone_evidence),'') IS NOT NULL
  AND q.verified_timezone IN (SELECT name FROM pg_timezone_names WHERE name LIKE 'America/%' OR name='Pacific/Honolulu')
  AND q.phone_e164 IS NOT NULL
  AND NOT EXISTS(SELECT 1 FROM ots_outreach.suppression d WHERE d.phone_e164=q.phone_e164)
  AND extract(isodow FROM now() AT TIME ZONE q.verified_timezone)::integer = ANY(s.weekdays)
  AND (now() AT TIME ZONE q.verified_timezone)::time >= s.local_start
  AND (now() AT TIME ZONE q.verified_timezone)::time < s.local_end
ORDER BY q.phone_e164,q.priority,q.lead_id;
COMMIT;
SELECT cohort,count(*) FROM ots_outreach.audience GROUP BY cohort ORDER BY min(priority);
SELECT paused,local_start,local_end,weekdays,daily_call_limit,daily_budget_usd FROM ots_outreach.settings;
