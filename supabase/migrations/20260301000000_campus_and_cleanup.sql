-- Migration: Campus system, noticeboard, role column, and cleanup
-- Phase 1 of DanceStudioApp feature expansion

-- ============================================================
-- 1) CAMPUSES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS campuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE campuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read campuses"
  ON campuses FOR SELECT TO anon
  USING (true);

CREATE POLICY "Authenticated can read campuses"
  ON campuses FOR SELECT TO authenticated
  USING (true);

-- Seed 3 Sydney campuses
INSERT INTO campuses (key, name_en, name_zh, address, phone, is_active, sort_order) VALUES
  ('hornsby', 'Hornsby', '霍恩斯比', 'Hornsby, Sydney NSW', NULL, true, 1),
  ('macquarie_park', 'Macquarie Park', '麦格理公园', 'Macquarie Park, Sydney NSW', NULL, true, 2),
  ('carlingford', 'Carlingford', '卡林福德', 'Carlingford, Sydney NSW', NULL, true, 3)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 2) NOTICEBOARD TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS noticeboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en TEXT NOT NULL,
  title_zh TEXT NOT NULL,
  body_en TEXT,
  body_zh TEXT,
  image_url TEXT,
  link_url TEXT,
  campus_id UUID REFERENCES campuses(id),
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE noticeboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read noticeboard"
  ON noticeboard FOR SELECT TO anon
  USING (true);

CREATE POLICY "Authenticated can read noticeboard"
  ON noticeboard FOR SELECT TO authenticated
  USING (true);

-- Seed sample noticeboard items
INSERT INTO noticeboard (title_en, title_zh, body_en, body_zh, campus_id, is_active, priority, starts_at, expires_at) VALUES
  (
    'Welcome to Austar Dance Studio!',
    '欢迎来到澳星舞蹈工作室！',
    'Explore our classes across all campuses. New students get a free trial class!',
    '探索我们所有校区的课程。新学员可免费试课！',
    NULL,
    true,
    10,
    now(),
    now() + interval '90 days'
  ),
  (
    'Term 2 Enrolment Now Open',
    '第二学期招生现已开始',
    'Term 2 classes start soon. Enrol early to secure your spot!',
    '第二学期课程即将开始。尽早报名，锁定您的名额！',
    NULL,
    true,
    8,
    now(),
    now() + interval '30 days'
  ),
  (
    'New Hip Hop Classes at Hornsby',
    '霍恩斯比新增街舞课程',
    'Exciting new Hip Hop classes every Thursday evening. All levels welcome!',
    '每周四晚全新街舞课程。欢迎各级别学员参加！',
    (SELECT id FROM campuses WHERE key = 'hornsby'),
    true,
    5,
    now(),
    now() + interval '60 days'
  );

-- ============================================================
-- 3) ADD campus_id FK TO EXISTING TABLES
-- ============================================================

-- class_timetable: add campus_id FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'class_timetable' AND column_name = 'campus_id'
  ) THEN
    ALTER TABLE class_timetable ADD COLUMN campus_id UUID REFERENCES campuses(id);
  END IF;
END $$;

-- Backfill campus_id from existing TEXT campus column
UPDATE class_timetable ct
SET campus_id = c.id
FROM campuses c
WHERE ct.campus_id IS NULL
  AND ct.campus IS NOT NULL
  AND (
    LOWER(ct.campus) = LOWER(c.name_en)
    OR LOWER(ct.campus) = LOWER(c.key)
    OR LOWER(ct.campus) LIKE LOWER(c.key) || '%'
  );

-- studios: add campus_id FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'studios' AND column_name = 'campus_id'
  ) THEN
    ALTER TABLE studios ADD COLUMN campus_id UUID REFERENCES campuses(id);
  END IF;
END $$;

-- class_bundles: add campus_id FK (nullable = available at all campuses)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'class_bundles' AND column_name = 'campus_id'
  ) THEN
    ALTER TABLE class_bundles ADD COLUMN campus_id UUID REFERENCES campuses(id);
  END IF;
END $$;

-- ============================================================
-- 4) ADD role COLUMN TO "Users Info"
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Users Info' AND column_name = 'role'
  ) THEN
    ALTER TABLE "Users Info" ADD COLUMN role TEXT DEFAULT 'user'
      CHECK (role IN ('user', 'instructor', 'admin', 'owner'));
  END IF;
END $$;

-- ============================================================
-- 5) CLEANUP: Drop unused sync_recurring_classes function
-- ============================================================
DROP FUNCTION IF EXISTS sync_recurring_classes();

-- ============================================================
-- 6) CREATE INDEX for campus_id lookups
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_class_timetable_campus ON class_timetable(campus_id);
CREATE INDEX IF NOT EXISTS idx_noticeboard_active ON noticeboard(is_active, starts_at);
CREATE INDEX IF NOT EXISTS idx_noticeboard_campus ON noticeboard(campus_id);
