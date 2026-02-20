-- CLEAN REPAIR: Reset CLASSES and rebuild with proper UUID PK
-- WARNING: This deletes legacy data in CLASSES.

-- 1) Remove dependent rows
TRUNCATE TABLE enrollments RESTART IDENTITY CASCADE;

-- 2) Drop and recreate CLASSES with correct PK
DROP TABLE IF EXISTS "CLASSES" CASCADE;

CREATE TABLE "CLASSES" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  class_type TEXT,
  category_id UUID REFERENCES class_categories(id),
  audience TEXT CHECK (audience IN ('adult', 'children')),
  campus TEXT,
  instructor_id UUID REFERENCES instructors(id),
  studio_id UUID REFERENCES studios(id),
  duration_minutes INTEGER DEFAULT 60,
  price NUMERIC(10,2) DEFAULT 0,
  cost NUMERIC(10,2) DEFAULT 0,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_day INTEGER,
  recurrence_time TIME,
  recurrence_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE "CLASSES" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read CLASSES" ON "CLASSES";
CREATE POLICY "Authenticated users can read CLASSES"
  ON "CLASSES" FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Anon can read CLASSES" ON "CLASSES";
CREATE POLICY "Anon can read CLASSES"
  ON "CLASSES" FOR SELECT TO anon
  USING (true);

-- 3) Seed mock classes (recurring definitions)
INSERT INTO "CLASSES" (name, class_type, category_id, audience, campus, instructor_id, studio_id, duration_minutes, price, is_recurring, recurrence_day, recurrence_time, recurrence_count)
SELECT
  'Chinese Classical',
  'chinese_classical',
  cc.id,
  'adult',
  'Hornsby',
  NULL,
  i.id,
  s.id,
  90,
  25,
  true,
  2, -- Tuesday
  '10:00',
  10
FROM class_categories cc
JOIN instructors i ON i.name = 'Mei Lin'
JOIN studios s ON s.name = 'Studio A'
WHERE cc.key = 'chinese_classical'
LIMIT 1;

-- Fallback seed if joins failed (ensure core class types exist)
INSERT INTO "CLASSES" (name, class_type, category_id, audience, campus, duration_minutes, price, is_recurring, recurrence_day, recurrence_time, recurrence_count)
SELECT
  'Chinese Classical',
  'chinese_classical',
  cc.id,
  'adult',
  'Hornsby',
  90,
  25,
  true,
  2,
  '10:00',
  10
FROM class_categories cc
WHERE cc.key = 'chinese_classical'
  AND NOT EXISTS (SELECT 1 FROM "CLASSES" WHERE class_type = 'chinese_classical');

INSERT INTO "CLASSES" (name, class_type, category_id, audience, campus, instructor_id, studio_id, duration_minutes, price, is_recurring, recurrence_day, recurrence_time, recurrence_count)
SELECT
  'Korean Dance',
  'korean_dance',
  cc.id,
  'adult',
  'Macquarie',
  i.id,
  s.id,
  60,
  22,
  true,
  2, -- Tuesday
  '17:00',
  10
FROM class_categories cc
JOIN instructors i ON i.name = 'Yuna Park'
JOIN studios s ON s.name = 'Studio A'
WHERE cc.key = 'korean_dance'
LIMIT 1;

INSERT INTO "CLASSES" (name, class_type, category_id, audience, campus, duration_minutes, price, is_recurring, recurrence_day, recurrence_time, recurrence_count)
SELECT
  'Korean Dance',
  'korean_dance',
  cc.id,
  'adult',
  'Macquarie',
  60,
  22,
  true,
  2,
  '17:00',
  10
FROM class_categories cc
WHERE cc.key = 'korean_dance'
  AND NOT EXISTS (SELECT 1 FROM "CLASSES" WHERE class_type = 'korean_dance');

-- Additional static class types (requested set)
INSERT INTO "CLASSES" (name, class_type, category_id, audience, campus, duration_minutes, price, is_recurring, recurrence_day, recurrence_time, recurrence_count)
SELECT 'Chinese Classical', 'chinese_classical', cc.id, 'children', 'Macquarie', 60, 20, true, 4, '16:00', 10
FROM class_categories cc WHERE cc.key = 'chinese_classical'
  AND NOT EXISTS (SELECT 1 FROM "CLASSES" WHERE class_type = 'chinese_classical' AND audience = 'children' AND campus = 'Macquarie');

INSERT INTO "CLASSES" (name, class_type, category_id, audience, campus, duration_minutes, price, is_recurring, recurrence_day, recurrence_time, recurrence_count)
SELECT 'Ballet', 'ballet', cc.id, 'adult', 'Hornsby', 90, 25, true, 1, '18:00', 10
FROM class_categories cc WHERE cc.key = 'ballet'
  AND NOT EXISTS (SELECT 1 FROM "CLASSES" WHERE class_type = 'ballet' AND audience = 'adult' AND campus = 'Hornsby');

INSERT INTO "CLASSES" (name, class_type, category_id, audience, campus, duration_minutes, price, is_recurring, recurrence_day, recurrence_time, recurrence_count)
SELECT 'Ballet', 'ballet', cc.id, 'children', 'Macquarie', 60, 18, true, 3, '15:30', 10
FROM class_categories cc WHERE cc.key = 'ballet'
  AND NOT EXISTS (SELECT 1 FROM "CLASSES" WHERE class_type = 'ballet' AND audience = 'children' AND campus = 'Macquarie');

INSERT INTO "CLASSES" (name, class_type, category_id, audience, campus, duration_minutes, price, is_recurring, recurrence_day, recurrence_time, recurrence_count)
SELECT 'Hip Hop', 'hip_hop', cc.id, 'adult', 'Hornsby', 60, 20, true, 4, '19:30', 10
FROM class_categories cc WHERE cc.key = 'hip_hop'
  AND NOT EXISTS (SELECT 1 FROM "CLASSES" WHERE class_type = 'hip_hop' AND campus = 'Hornsby');

INSERT INTO "CLASSES" (name, class_type, category_id, audience, campus, duration_minutes, price, is_recurring, recurrence_day, recurrence_time, recurrence_count)
SELECT 'Youth K-pop', 'kpop_youth', cc.id, 'children', 'Hornsby', 90, 22, true, 6, '14:00', 10
FROM class_categories cc WHERE cc.key = 'kpop_youth'
  AND NOT EXISTS (SELECT 1 FROM "CLASSES" WHERE class_type = 'kpop_youth' AND campus = 'Hornsby');

INSERT INTO "CLASSES" (name, class_type, category_id, audience, campus, duration_minutes, price, is_recurring, recurrence_day, recurrence_time, recurrence_count)
SELECT 'Miscellaneous', 'miscellaneous', cc.id, 'adult', 'Macquarie', 60, 20, true, 5, '19:00', 8
FROM class_categories cc WHERE cc.key = 'miscellaneous'
  AND NOT EXISTS (SELECT 1 FROM "CLASSES" WHERE class_type = 'miscellaneous' AND campus = 'Macquarie' AND audience = 'adult');

INSERT INTO "CLASSES" (name, class_type, category_id, audience, campus, duration_minutes, price, is_recurring, recurrence_day, recurrence_time, recurrence_count)
SELECT 'Miscellaneous', 'miscellaneous', cc.id, 'children', 'Hornsby', 60, 18, true, 0, '11:00', 8
FROM class_categories cc WHERE cc.key = 'miscellaneous'
  AND NOT EXISTS (SELECT 1 FROM "CLASSES" WHERE class_type = 'miscellaneous' AND campus = 'Hornsby' AND audience = 'children');

INSERT INTO "CLASSES" (name, class_type, category_id, audience, campus, duration_minutes, price, is_recurring, recurrence_day, recurrence_time, recurrence_count)
SELECT 'Yoga', 'yoga', cc.id, 'adult', 'Hornsby', 60, 20, true, 2, '08:00', 8
FROM class_categories cc WHERE cc.key = 'miscellaneous'
  AND NOT EXISTS (SELECT 1 FROM "CLASSES" WHERE class_type = 'yoga');

INSERT INTO "CLASSES" (name, class_type, category_id, audience, campus, duration_minutes, price, is_recurring, recurrence_day, recurrence_time, recurrence_count)
SELECT 'Pilates', 'pilates', cc.id, 'adult', 'Macquarie', 60, 22, true, 3, '08:00', 8
FROM class_categories cc WHERE cc.key = 'miscellaneous'
  AND NOT EXISTS (SELECT 1 FROM "CLASSES" WHERE class_type = 'pilates');
