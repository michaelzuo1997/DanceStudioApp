-- Migration: Fix CLASSES visibility and topup_balance issues
-- Issue 1: CLASSES RLS policy only allowed authenticated users
-- Issue 2: topup_balance RPC didn't handle all edge cases
-- Issue 3: class_timetable RLS used PUBLIC which may not work correctly
-- Issue 4: CLASSES table might be missing columns from expansion migration

-- ============================================================
-- 0. ENSURE CLASSES TABLE HAS ALL REQUIRED COLUMNS
-- ============================================================
DO $ensure_classes_columns$
BEGIN
  -- Add name column if not exists (PRIMARY requirement - was missing!)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'CLASSES' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE "CLASSES" ADD COLUMN name TEXT;
  END IF;

  -- Add class_type column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'CLASSES' 
    AND column_name = 'class_type'
  ) THEN
    ALTER TABLE "CLASSES" ADD COLUMN class_type TEXT;
  END IF;

  -- Add start_time column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'CLASSES' 
    AND column_name = 'start_time'
  ) THEN
    ALTER TABLE "CLASSES" ADD COLUMN start_time TIMESTAMPTZ;
  END IF;

  -- Add end_time column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'CLASSES' 
    AND column_name = 'end_time'
  ) THEN
    ALTER TABLE "CLASSES" ADD COLUMN end_time TIMESTAMPTZ;
  END IF;

  -- Add category_id column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'CLASSES' 
    AND column_name = 'category_id'
  ) THEN
    ALTER TABLE "CLASSES" ADD COLUMN category_id UUID;
  END IF;

  -- Add audience column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'CLASSES' 
    AND column_name = 'audience'
  ) THEN
    ALTER TABLE "CLASSES" ADD COLUMN audience TEXT CHECK (audience IN ('adult', 'children'));
  END IF;

  -- Add duration_minutes column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'CLASSES' 
    AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE "CLASSES" ADD COLUMN duration_minutes INTEGER DEFAULT 60;
  END IF;

  -- Add room column if not exists (this was causing the error!)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'CLASSES' 
    AND column_name = 'room'
  ) THEN
    ALTER TABLE "CLASSES" ADD COLUMN room TEXT;
  END IF;

  -- Add instructor column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'CLASSES' 
    AND column_name = 'instructor'
  ) THEN
    ALTER TABLE "CLASSES" ADD COLUMN instructor TEXT;
  END IF;

  -- Add price column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'CLASSES' 
    AND column_name = 'price'
  ) THEN
    ALTER TABLE "CLASSES" ADD COLUMN price NUMERIC(10,2) DEFAULT 0;
  END IF;

  -- Add cost column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'CLASSES' 
    AND column_name = 'cost'
  ) THEN
    ALTER TABLE "CLASSES" ADD COLUMN cost NUMERIC(10,2) DEFAULT 0;
  END IF;

  -- Add max_capacity column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'CLASSES' 
    AND column_name = 'max_capacity'
  ) THEN
    ALTER TABLE "CLASSES" ADD COLUMN max_capacity INTEGER;
  END IF;

  -- Add current_enrollment column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'CLASSES' 
    AND column_name = 'current_enrollment'
  ) THEN
    ALTER TABLE "CLASSES" ADD COLUMN current_enrollment INTEGER DEFAULT 0;
  END IF;

  -- Add description column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'CLASSES' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE "CLASSES" ADD COLUMN description TEXT;
  END IF;

  -- Add image_url column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'CLASSES' 
    AND column_name = 'image_url'
  ) THEN
    ALTER TABLE "CLASSES" ADD COLUMN image_url TEXT;
  END IF;

  -- Add created_at column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'CLASSES' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE "CLASSES" ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;

  -- Add updated_at column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'CLASSES' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE "CLASSES" ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $ensure_classes_columns$;

-- ============================================================
-- 1. FIX CLASSES RLS POLICY - Allow anonymous users to read
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can read CLASSES" ON "CLASSES";

CREATE POLICY "Anyone can read CLASSES"
  ON "CLASSES" FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Anon can read CLASSES"
  ON "CLASSES" FOR SELECT TO anon
  USING (true);

-- ============================================================
-- 2. FIX class_timetable RLS POLICY
-- ============================================================
DROP POLICY IF EXISTS "Anyone can read class_timetable" ON class_timetable;

CREATE POLICY "Authenticated can read class_timetable"
  ON class_timetable FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Anon can read class_timetable"
  ON class_timetable FOR SELECT TO anon
  USING (true);

-- ============================================================
-- 3. FIX class_bundles RLS POLICY
-- ============================================================
DROP POLICY IF EXISTS "Anyone can read class_bundles" ON class_bundles;

CREATE POLICY "Authenticated can read class_bundles"
  ON class_bundles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Anon can read class_bundles"
  ON class_bundles FOR SELECT TO anon
  USING (true);

-- ============================================================
-- 4. FIX topup_balance RPC - Better error handling
-- ============================================================
-- Drop the old function first (it had different return type)
DROP FUNCTION IF EXISTS topup_balance(NUMERIC);

CREATE OR REPLACE FUNCTION topup_balance(p_amount NUMERIC)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  -- Get authenticated user ID
  v_uid := auth.uid();
  
  IF v_uid IS NULL THEN
    RETURN json_build_object(
      'ok', FALSE,
      'error', 'Not authenticated'
    );
  END IF;

  -- Validate amount
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN json_build_object(
      'ok', FALSE,
      'error', 'Invalid amount'
    );
  END IF;

  -- Get current balance
  SELECT COALESCE(current_balance, 0) INTO v_current_balance
  FROM "Users Info"
  WHERE user_id = v_uid;

  IF NOT FOUND THEN
    -- User info doesn't exist, create it first
    INSERT INTO "Users Info" (user_id, name, full_name, current_balance)
    VALUES (
      v_uid,
      (SELECT email FROM auth.users WHERE id = v_uid),
      (SELECT COALESCE(raw_user_meta_data->>'full_name', email) FROM auth.users WHERE id = v_uid),
      0
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    v_current_balance := 0;
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance + p_amount;

  -- Update balance
  UPDATE "Users Info"
  SET current_balance = v_new_balance,
      updated_at = now()
  WHERE user_id = v_uid;

  -- Record transaction
  INSERT INTO transactions (user_id, type, amount, balance_after, description)
  VALUES (v_uid, 'topup', p_amount, v_new_balance, 'Balance top-up');

  RETURN json_build_object(
    'ok', TRUE,
    'new_balance', v_new_balance
  );
END;
$$;

-- ============================================================
-- 5. ENSURE CLASS CATEGORIES EXIST
-- ============================================================
INSERT INTO class_categories (key, name_en, name_zh, icon, has_children, sort_order) VALUES
  ('chinese_classical', 'Chinese Classical', '中国舞', '💃', true, 1),
  ('ballet', 'Ballet', '芭蕾', '🩰', true, 2),
  ('hip_hop', 'Hip Hop', '街舞', '🎤', true, 3),
  ('kpop_youth', 'Youth K-pop', '青少年 K-pop', '🎵', true, 4),
  ('korean_dance', 'Korean Dance', '韩舞', '🌟', true, 5),
  ('miscellaneous', 'Miscellaneous', '其他', '✨', false, 6)
ON CONFLICT (key) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_zh = EXCLUDED.name_zh,
  icon = EXCLUDED.icon,
  has_children = EXCLUDED.has_children,
  sort_order = EXCLUDED.sort_order;

-- ============================================================
-- 6. ENSURE CLASS BUNDLES EXIST
-- ============================================================
INSERT INTO class_bundles (class_count, expiry_weeks, total_price, is_active) VALUES
  (10, 10, 180, true),
  (20, 20, 340, true),
  (30, 30, 480, true),
  (40, 40, 600, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 7. RE-SEED CLASS TIMETABLE (if empty)
-- ============================================================
DO $seed_timetable$
DECLARE
  v_count INTEGER;
  v_chinese_classical UUID;
  v_ballet UUID;
  v_hip_hop UUID;
  v_kpop_youth UUID;
  v_korean_dance UUID;
BEGIN
  SELECT COUNT(*) INTO v_count FROM class_timetable;
  
  IF v_count = 0 THEN
    SELECT id INTO v_chinese_classical FROM class_categories WHERE key = 'chinese_classical';
    SELECT id INTO v_ballet FROM class_categories WHERE key = 'ballet';
    SELECT id INTO v_hip_hop FROM class_categories WHERE key = 'hip_hop';
    SELECT id INTO v_kpop_youth FROM class_categories WHERE key = 'kpop_youth';
    SELECT id INTO v_korean_dance FROM class_categories WHERE key = 'korean_dance';

    -- Monday
    INSERT INTO class_timetable (category_id, audience, day_of_week, start_time, duration_minutes, instructor, room, price_per_class) VALUES
      (v_chinese_classical, 'adult', 1, '10:00', 90, 'Mei Lin', 'Studio A', 25),
      (v_chinese_classical, 'children', 1, '16:00', 60, 'Mei Lin', 'Studio A', 20),
      (v_ballet, 'adult', 1, '18:00', 90, 'Sophie Chen', 'Studio B', 25);

    -- Tuesday
    INSERT INTO class_timetable (category_id, audience, day_of_week, start_time, duration_minutes, instructor, room, price_per_class) VALUES
      (v_hip_hop, 'adult', 2, '19:00', 60, 'Jay Kim', 'Studio C', 20),
      (v_korean_dance, 'adult', 2, '17:00', 60, 'Yuna Park', 'Studio A', 22);

    -- Wednesday
    INSERT INTO class_timetable (category_id, audience, day_of_week, start_time, duration_minutes, instructor, room, price_per_class) VALUES
      (v_ballet, 'children', 3, '15:30', 60, 'Sophie Chen', 'Studio B', 18),
      (v_chinese_classical, 'adult', 3, '18:30', 90, 'Mei Lin', 'Studio A', 25);

    -- Thursday
    INSERT INTO class_timetable (category_id, audience, day_of_week, start_time, duration_minutes, instructor, room, price_per_class) VALUES
      (v_kpop_youth, 'children', 4, '16:00', 60, 'Jay Kim', 'Studio C', 18),
      (v_hip_hop, 'adult', 4, '19:30', 60, 'Jay Kim', 'Studio C', 20);

    -- Friday
    INSERT INTO class_timetable (category_id, audience, day_of_week, start_time, duration_minutes, instructor, room, price_per_class) VALUES
      (v_korean_dance, 'adult', 5, '18:00', 60, 'Yuna Park', 'Studio A', 22),
      (v_ballet, 'adult', 5, '19:30', 90, 'Sophie Chen', 'Studio B', 25);

    -- Saturday
    INSERT INTO class_timetable (category_id, audience, day_of_week, start_time, duration_minutes, instructor, room, price_per_class) VALUES
      (v_chinese_classical, 'children', 6, '10:00', 60, 'Mei Lin', 'Studio A', 20),
      (v_ballet, 'children', 6, '11:30', 60, 'Sophie Chen', 'Studio B', 18),
      (v_kpop_youth, 'children', 6, '14:00', 90, 'Jay Kim', 'Studio C', 22),
      (v_hip_hop, 'adult', 6, '16:00', 60, 'Jay Kim', 'Studio C', 20);

    -- Sunday
    INSERT INTO class_timetable (category_id, audience, day_of_week, start_time, duration_minutes, instructor, room, price_per_class) VALUES
      (v_korean_dance, 'adult', 0, '14:00', 60, 'Yuna Park', 'Studio A', 22),
      (v_chinese_classical, 'adult', 0, '15:30', 90, 'Mei Lin', 'Studio A', 25);
      
    RAISE NOTICE 'Seeded % timetable entries', (SELECT COUNT(*) FROM class_timetable);
  END IF;
END $seed_timetable$;

-- ============================================================
-- 8. RE-SEED UPCOMING CLASSES (if empty or stale)
-- Now safe because we ensured all columns exist above
-- ============================================================
DO $seed_classes$
DECLARE
  tt_rec RECORD;
  v_class_date DATE;
  v_start_datetime TIMESTAMPTZ;
  v_end_datetime TIMESTAMPTZ;
  v_days_ahead INTEGER;
  v_inserted INTEGER := 0;
BEGIN
  -- Check if we have recent classes
  SELECT COUNT(*) INTO v_inserted FROM "CLASSES" 
  WHERE start_time >= CURRENT_DATE;
  
  IF v_inserted < 10 THEN
    -- Generate classes for the next 28 days
    FOR tt_rec IN 
      SELECT ct.*, cc.key as category_key, cc.name_en as category_name
      FROM class_timetable ct
      LEFT JOIN class_categories cc ON ct.category_id = cc.id
      WHERE ct.is_active = true
    LOOP
      -- Calculate next occurrence of this day_of_week
      v_days_ahead := (tt_rec.day_of_week - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 7) % 7;
      IF v_days_ahead = 0 THEN
        v_days_ahead := 7; -- Skip today, start from next week
      END IF;
      
      -- Generate for 4 weeks
      FOR i IN 0..3 LOOP
        v_class_date := CURRENT_DATE + (v_days_ahead + (i * 7));
        v_start_datetime := (v_class_date || ' ' || tt_rec.start_time)::TIMESTAMPTZ;
        v_end_datetime := v_start_datetime + (tt_rec.duration_minutes || ' minutes')::interval;
        
        -- Check if class already exists for this time slot (by start_time and instructor)
        -- Using instructor instead of room for dedup since room might have been just added
        IF NOT EXISTS (
          SELECT 1 FROM "CLASSES" 
          WHERE start_time = v_start_datetime 
          AND instructor = tt_rec.instructor
        ) THEN
          INSERT INTO "CLASSES" (
            name, class_type, category_id, audience, 
            start_time, end_time, instructor, room, 
            price, cost, duration_minutes, 
            max_capacity, current_enrollment
          ) VALUES (
            COALESCE(tt_rec.category_name, 'Dance Class'),
            tt_rec.category_key,
            tt_rec.category_id,
            tt_rec.audience,
            v_start_datetime,
            v_end_datetime,
            tt_rec.instructor,
            tt_rec.room,
            tt_rec.price_per_class,
            tt_rec.price_per_class * 0.4,
            tt_rec.duration_minutes,
            20,
            0
          );
          v_inserted := v_inserted + 1;
        END IF;
      END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Inserted % new classes', v_inserted;
  END IF;
END $seed_classes$;

-- ============================================================
-- 9. CREATE INDEXES FOR BETTER PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_classes_category_id ON "CLASSES"(category_id);
CREATE INDEX IF NOT EXISTS idx_classes_start_time ON "CLASSES"(start_time);

-- ============================================================
-- 10. GRANT PERMISSIONS
-- ============================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON "CLASSES" TO anon;
GRANT SELECT ON class_categories TO anon;
GRANT SELECT ON class_timetable TO anon;
GRANT SELECT ON class_bundles TO anon;
GRANT EXECUTE ON FUNCTION topup_balance(NUMERIC) TO authenticated;
