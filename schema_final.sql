-- ============================================================
-- schema_final.sql — iLEAD PM Dashboard
-- Run this in Supabase SQL Editor (Project: iLEAD project management)
-- ============================================================

-- 1. PARTNERS
CREATE TABLE IF NOT EXISTS partners (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  color       TEXT DEFAULT '#6366f1',
  sector      TEXT,
  region      TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. ACTIVITIES
CREATE TABLE IF NOT EXISTS activities (
  id                  TEXT PRIMARY KEY,
  "partnerId"         TEXT REFERENCES partners(id) ON DELETE CASCADE,
  "activityTypeCode"  TEXT,
  iteration           INT DEFAULT 1,
  name                TEXT NOT NULL,
  status              TEXT DEFAULT 'not_started',
  stage               TEXT DEFAULT 'S1',
  "ballOwner"         TEXT,
  ca                  TEXT,
  "reachTotal"        INT DEFAULT 0,
  "reachWomen"        INT DEFAULT 0,
  "reachMen"          INT DEFAULT 0,
  "budget_planned"    NUMERIC(12,2) DEFAULT 0,
  "budget_actual"     NUMERIC(12,2) DEFAULT 0,
  "startDate"         TEXT,
  "endDate"           TEXT,
  "nextAction"        TEXT,
  notes               TEXT,
  pos                 INT DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- 3. TASKS
CREATE TABLE IF NOT EXISTS tasks (
  id            TEXT PRIMARY KEY,
  "activityId"  TEXT,
  name          TEXT NOT NULL,
  status        TEXT DEFAULT 'todo',
  assignee      TEXT,
  "dueDate"     TEXT,
  notes         TEXT,
  pos           BIGINT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 4. MEL ENTRIES
CREATE TABLE IF NOT EXISTS mel_entries (
  id                TEXT PRIMARY KEY,
  "indicatorGroup"  TEXT,
  "subCode"         TEXT,
  date              TEXT,
  "partnerId"       TEXT,
  "activityId"      TEXT,
  description       TEXT,
  q1_m  INT DEFAULT 0, q1_f  INT DEFAULT 0,
  q2_m  INT DEFAULT 0, q2_f  INT DEFAULT 0,
  q3_m  INT DEFAULT 0, q3_f  INT DEFAULT 0,
  q4_m  INT DEFAULT 0, q4_f  INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ACTIVITY INDICATORS
CREATE TABLE IF NOT EXISTS activity_indicators (
  id                TEXT PRIMARY KEY,
  "activityId"      TEXT,
  "indicatorCode"   TEXT,
  "targetCount"     INT DEFAULT 0,
  "actualCount"     INT DEFAULT 0,
  "femaleCount"     INT DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- 6. PARTNER BUDGETS
CREATE TABLE IF NOT EXISTS partner_budgets (
  "partnerId"  TEXT PRIMARY KEY,
  allocated    NUMERIC(12,2) DEFAULT 0,
  spent        NUMERIC(12,2) DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ── RLS: allow anon access (single-user app, no auth) ──────────
ALTER TABLE partners            ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities          ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE mel_entries         ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_budgets     ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='anon_partners')            THEN CREATE POLICY "anon_partners"            ON partners            FOR ALL TO anon USING (true) WITH CHECK (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='anon_activities')          THEN CREATE POLICY "anon_activities"          ON activities          FOR ALL TO anon USING (true) WITH CHECK (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='anon_tasks')               THEN CREATE POLICY "anon_tasks"               ON tasks               FOR ALL TO anon USING (true) WITH CHECK (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='anon_mel_entries')         THEN CREATE POLICY "anon_mel_entries"         ON mel_entries         FOR ALL TO anon USING (true) WITH CHECK (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='anon_activity_indicators') THEN CREATE POLICY "anon_activity_indicators" ON activity_indicators FOR ALL TO anon USING (true) WITH CHECK (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='anon_partner_budgets')     THEN CREATE POLICY "anon_partner_budgets"     ON partner_budgets     FOR ALL TO anon USING (true) WITH CHECK (true); END IF;
END $$;
