-- Migration: Add budget_line_items table for expandable budget detail
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS budget_line_items (
  id TEXT PRIMARY KEY,
  "partnerId" TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  "activityId" TEXT REFERENCES activities(id) ON DELETE SET NULL,
  description TEXT DEFAULT '',
  amount NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS disabled (consistent with app_users / audit_logs approach)
ALTER TABLE budget_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_budget_line_items" ON budget_line_items FOR ALL USING (true) WITH CHECK (true);
