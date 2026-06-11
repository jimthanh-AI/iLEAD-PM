-- ============================================================
-- One-time SQL: Add name_en column + populate English translations
-- Run in Supabase Dashboard > SQL Editor
-- ============================================================

-- Step 1: Add column (safe to run multiple times)
ALTER TABLE activities ADD COLUMN IF NOT EXISTS name_en TEXT;

-- Step 2: Populate English translations
UPDATE activities SET name_en = 'C+ Vietnam Facebook Marketing Campaign'
  WHERE id = '8369aa20-30d4-403f-88f5-37f3cf4f3f3a';

UPDATE activities SET name_en = 'DAFO - Women Entrepreneurship Workshop in Thang Dien Commune (170 participants)'
  WHERE id = 'b888d085-612a-4764-b41b-fa4d8de4e88b';

UPDATE activities SET name_en = 'APED - RBP Workshop in Hanoi'
  WHERE id = '10f8e79f-e9ec-4138-9356-9ee01c637c21';

UPDATE activities SET name_en = 'DAFO - Commune 5: From Idea to Action — Responsible Entrepreneurship in the Digital Age'
  WHERE id = '35c5cbaa-08f1-424d-9e79-27c0aef6b036';

UPDATE activities SET name_en = 'DAFO - Commune 7: From Idea to Action — Responsible Entrepreneurship in the Digital Age'
  WHERE id = '3cab95af-9eb3-4ce3-b294-d57a23360b32';

UPDATE activities SET name_en = 'DAFO - Commune 8: From Idea to Action — Responsible Entrepreneurship in the Digital Age'
  WHERE id = '3e058fae-fb9c-4d21-bbfb-f04f3d8c78d3';

UPDATE activities SET name_en = 'VCCI MTTN - Member Conference on Sustainable Green Economy & Trilateral MOU Signing'
  WHERE id = 'a888b128-1eb0-419c-a4d8-55fb1652274b';

UPDATE activities SET name_en = 'ESG Initiative Conference in Hanoi (with APED/TAC)'
  WHERE id = 'a6';

UPDATE activities SET name_en = 'VCCI HCMC - RBP Training for SMEs in HCMC and Neighboring Provinces'
  WHERE id = '88c9c53b-e2bc-49b5-aeb1-abc39614a542';

UPDATE activities SET name_en = 'VLA - International RBP Workshop for the Logistics Sector'
  WHERE id = '89b47b7d-4bd9-4f9d-95d1-d0a7d0bd3e13';

UPDATE activities SET name_en = 'VCCI MTTN - ToT for Civil Servants on RBP/ESG (Round 2)'
  WHERE id = 'a3';

UPDATE activities SET name_en = 'VNAH - Develop Disability-Inclusive RBP Guideline for the Hospitality Sector'
  WHERE id = 'a9';

UPDATE activities SET name_en = 'DAFO - Commune 4: From Idea to Action — Responsible Entrepreneurship in the Digital Age'
  WHERE id = '0ff7bd47-6384-48b2-a3b7-2448281f1e1b';

UPDATE activities SET name_en = 'VCCI MTTN - Thematic Workshop on Indicator Framework for Civil Servants'
  WHERE id = '68af6664-4df5-4b5d-b0ac-c95a1758760e';

UPDATE activities SET name_en = 'VCCI HCMC - RBP Training for Civil Servants in HCMC and Neighboring Provinces'
  WHERE id = '917a134b-eda3-481c-bfeb-e2447d188966';

UPDATE activities SET name_en = 'APED - Legal Research Review on Current Corporate Law (Governance Pillar)'
  WHERE id = 'a7';

UPDATE activities SET name_en = 'VCCI MTTN - Recognition Workshop for Outstanding RBP Enterprises'
  WHERE id = '2298a130-357b-4f13-a396-857513570646';

UPDATE activities SET name_en = 'VCCI MTTN - RBP Awareness Training for SMEs'
  WHERE id = '52421961-80e3-4fae-9a0f-8db6716e1cf2';

UPDATE activities SET name_en = 'VCCI MTTN - Develop Digital Platform / ESG Dashboard'
  WHERE id = 'a5';

UPDATE activities SET name_en = 'VCCI HCMC - Baseline Research on RBP'
  WHERE id = 'a11';

UPDATE activities SET name_en = 'VNAH - Workshop to Launch Disability-Inclusive RBP Guideline'
  WHERE id = '09b35f88-345d-49c5-a6a8-e6bb1d392e24';

UPDATE activities SET name_en = 'RED Communication - RBP Communication & Awareness Activities'
  WHERE id = 'a10';

UPDATE activities SET name_en = 'DAFO - Commune 3: From Idea to Action — Responsible Entrepreneurship in the Digital Age'
  WHERE id = '5dcd2da7-e621-4778-aa41-b16863aaa72f';

UPDATE activities SET name_en = 'DAFO - Commune 6: From Idea to Action — Responsible Entrepreneurship in the Digital Age'
  WHERE id = 'abe48b69-3dde-4b5d-bf10-3dcafb839354';

UPDATE activities SET name_en = 'VCCI MTTN - Develop Da Nang RBP Index'
  WHERE id = 'a4';

UPDATE activities SET name_en = 'DAFO - Commune 9: From Idea to Action — Responsible Entrepreneurship in the Digital Age'
  WHERE id = '5e69337f-59ce-4dac-8d37-b675bc6eab2f';

UPDATE activities SET name_en = 'VCCI MTTN - International RBP Conference & RBP Index Launch (October)'
  WHERE id = 'eb52d452-08f7-4c83-899c-299b9b711355';

UPDATE activities SET name_en = 'DAFO - Entrepreneurship Training for 150 Women in Thang Dien Commune'
  WHERE id = 'fa66555b-f92b-4893-9431-db35139b4946';

UPDATE activities SET name_en = 'VCCI MTTN - Organize 2 ToT Sessions for SMEs and Civil Servants in Da Nang'
  WHERE id = 'a2';

UPDATE activities SET name_en = 'VCCI MTTN - RBP Awareness Training for 50 Civil Servants (Oct 2026)'
  WHERE id = '7c47c8b1-d2e5-47f8-9f94-9db2aba091cd';

UPDATE activities SET name_en = 'DAFO - International RBP Workshop: Green Era (24 Nov 2025)'
  WHERE id = 'f5f9a1fe-785a-4804-b294-81cfae81376d';

UPDATE activities SET name_en = 'Baseline Research on RBP with Tien Team'
  WHERE id = 'a1';

UPDATE activities SET name_en = 'APED - ESG Workshop in the Hospitality Sector (with SHi)'
  WHERE id = 'a13';

-- Verify
SELECT id, name, name_en FROM activities ORDER BY pos;
