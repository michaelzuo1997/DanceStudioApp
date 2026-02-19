-- Migration: Class expansion - categories, bundles, timetables, and sample data
-- This migration adds all missing tables, columns, functions, and sample data

-- ============================================================
-- 0. Updated_at trigger helper (required if full_schema not run)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- 1. CLASS CATEGORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS class_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  icon TEXT,
  has_children BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE class_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read class_categories"
  ON class_categories FOR SELECT TO anon
  USING (true);

-- ============================================================
-- 2. ALTER CLASSES TABLE - Add missing columns
-- ============================================================
DO $alter_classes$
BEGIN
  -- Add category_id column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'CLASSES' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE "CLASSES" ADD COLUMN category_id UUID REFERENCES class_categories(id);
  END IF;

  -- Add audience column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'CLASSES' AND column_name = 'audience'
  ) THEN
    ALTER TABLE "CLASSES" ADD COLUMN audience TEXT CHECK (audience IN ('adult', 'children'));
  END IF;

  -- Add duration_minutes column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'CLASSES' AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE "CLASSES" ADD COLUMN duration_minutes INTEGER DEFAULT 60;
  END IF;
END $alter_classes$;

-- ============================================================
-- 3. CLASS TIMETABLE TABLE (recurring weekly schedule)
-- ============================================================
CREATE TABLE IF NOT EXISTS class_timetable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES class_categories(id) ON DELETE SET NULL,
  audience TEXT CHECK (audience IN ('adult', 'children')),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  instructor TEXT,
  room TEXT,
  price_per_class NUMERIC(10,2) DEFAULT 20,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE class_timetable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read class_timetable"
  ON class_timetable FOR SELECT TO PUBLIC
  USING (true);

-- Updated_at trigger for class_timetable
DROP TRIGGER IF EXISTS class_timetable_updated_at ON class_timetable;
CREATE TRIGGER class_timetable_updated_at
  BEFORE UPDATE ON class_timetable
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 4. CLASS BUNDLES TABLE (次卡)
-- ============================================================
CREATE TABLE IF NOT EXISTS class_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES class_categories(id) ON DELETE SET NULL,
  audience TEXT CHECK (audience IN ('adult', 'children')),
  class_count INTEGER NOT NULL,
  expiry_weeks INTEGER NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE class_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read class_bundles"
  ON class_bundles FOR SELECT TO PUBLIC
  USING (true);

-- ============================================================
-- 5. USER BUNDLES TABLE (purchased bundles)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bundle_id UUID NOT NULL REFERENCES class_bundles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES class_categories(id),
  audience TEXT,
  classes_remaining INTEGER NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE user_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own user_bundles"
  ON user_bundles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own user_bundles"
  ON user_bundles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user_bundles"
  ON user_bundles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 6. PRIVATE TUITION REQUESTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS private_tuition_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES class_categories(id) ON DELETE SET NULL,
  preferred_date DATE,
  preferred_time TIME,
  duration_minutes INTEGER DEFAULT 60,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE private_tuition_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own private_tuition_requests"
  ON private_tuition_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own private_tuition_requests"
  ON private_tuition_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 7. ALTER ENROLLMENTS TABLE - Add missing columns
-- ============================================================
DO $alter_enrollments$
BEGIN
  -- Add status column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enrollments' AND column_name = 'status'
  ) THEN
    ALTER TABLE enrollments ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled'));
  END IF;

  -- Add cancelled_at column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enrollments' AND column_name = 'cancelled_at'
  ) THEN
    ALTER TABLE enrollments ADD COLUMN cancelled_at TIMESTAMPTZ;
  END IF;

  -- Add bundle_id column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enrollments' AND column_name = 'bundle_id'
  ) THEN
    ALTER TABLE enrollments ADD COLUMN bundle_id UUID REFERENCES user_bundles(id);
  END IF;
END $alter_enrollments$;

-- ============================================================
-- 8. TRANSACTIONS TABLE (create if not exists, add bundle_id)
-- ============================================================
DO $transactions$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
    -- Create table (full_schema not run)
    CREATE TABLE transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('topup', 'purchase', 'refund')),
      amount NUMERIC(10,2) NOT NULL,
      balance_after NUMERIC(10,2),
      description TEXT,
      class_ids JSONB,
      bundle_id UUID REFERENCES class_bundles(id),
      created_at TIMESTAMPTZ DEFAULT now()
    );

    ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can read own transactions"
      ON transactions FOR SELECT TO authenticated
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert own transactions"
      ON transactions FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  ELSE
    -- Table exists (from full_schema), add bundle_id if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'transactions' AND column_name = 'bundle_id'
    ) THEN
      ALTER TABLE transactions ADD COLUMN bundle_id UUID REFERENCES class_bundles(id);
    END IF;
  END IF;
END $transactions$;

-- ============================================================
-- 9. PURCHASE_BUNDLE RPC FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION purchase_bundle(p_bundle_id UUID)
RETURNS TABLE(ok BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
  v_bundle RECORD;
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
  v_expires_at TIMESTAMPTZ;
BEGIN
  v_uid := auth.uid();
  
  IF v_uid IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Not authenticated';
    RETURN;
  END IF;

  -- Get bundle details
  SELECT * INTO v_bundle FROM class_bundles WHERE id = p_bundle_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Bundle not found or inactive';
    RETURN;
  END IF;

  -- Get current user balance
  SELECT current_balance INTO v_current_balance
  FROM "Users Info"
  WHERE user_id = v_uid;

  IF v_current_balance IS NULL THEN
    RETURN QUERY SELECT FALSE, 'User info not found';
    RETURN;
  END IF;

  IF v_current_balance < v_bundle.total_price THEN
    RETURN QUERY SELECT FALSE, 'Insufficient balance';
    RETURN;
  END IF;

  -- Calculate expiry date
  v_expires_at := now() + (v_bundle.expiry_weeks || ' weeks')::interval;

  -- Deduct balance
  UPDATE "Users Info"
  SET current_balance = current_balance - v_bundle.total_price,
      updated_at = now()
  WHERE user_id = v_uid;

  v_new_balance := v_current_balance - v_bundle.total_price;

  -- Create user_bundle
  INSERT INTO user_bundles (
    user_id, bundle_id, category_id, audience,
    classes_remaining, expires_at, is_active
  ) VALUES (
    v_uid, p_bundle_id, v_bundle.category_id, v_bundle.audience,
    v_bundle.class_count, v_expires_at, true
  );

  -- Log transaction
  INSERT INTO transactions (user_id, type, amount, balance_after, description, bundle_id)
  VALUES (v_uid, 'purchase', -v_bundle.total_price, v_new_balance, 
          'Purchased ' || v_bundle.class_count || ' class bundle', p_bundle_id);

  RETURN QUERY SELECT TRUE, 'Bundle purchased successfully';
END;
$$;

-- ============================================================
-- 10. CANCEL_ENROLLMENT RPC FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION cancel_enrollment(p_enrollment_id UUID)
RETURNS TABLE(ok BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
  v_enrollment RECORD;
  v_class RECORD;
  v_bundle RECORD;
  v_new_balance NUMERIC;
BEGIN
  v_uid := auth.uid();
  
  IF v_uid IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Not authenticated';
    RETURN;
  END IF;

  -- Get enrollment details
  SELECT * INTO v_enrollment 
  FROM enrollments 
  WHERE id = p_enrollment_id AND user_id = v_uid AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Enrollment not found or already cancelled';
    RETURN;
  END IF;

  -- Get class details
  SELECT * INTO v_class FROM "CLASSES" WHERE id = v_enrollment.class_id;

  -- If booked via bundle, restore classes_remaining
  IF v_enrollment.bundle_id IS NOT NULL THEN
    UPDATE user_bundles
    SET classes_remaining = classes_remaining + 1
    WHERE id = v_enrollment.bundle_id;
  ELSE
    -- Refund to balance
    UPDATE "Users Info"
    SET current_balance = current_balance + v_class.price,
        updated_at = now()
    WHERE user_id = v_uid;

    SELECT current_balance INTO v_new_balance
    FROM "Users Info"
    WHERE user_id = v_uid;

    -- Log refund transaction
    INSERT INTO transactions (user_id, type, amount, balance_after, description, class_ids)
    VALUES (v_uid, 'refund', v_class.price, v_new_balance, 
            'Class cancellation refund', jsonb_build_array(v_class.id));
  END IF;

  -- Mark enrollment as cancelled
  UPDATE enrollments
  SET status = 'cancelled', cancelled_at = now()
  WHERE id = p_enrollment_id;

  RETURN QUERY SELECT TRUE, 'Enrollment cancelled successfully';
END;
$$;

-- ============================================================
-- 11. SEED CLASS CATEGORIES
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
-- 12. SEED CLASS BUNDLES
-- ============================================================
INSERT INTO class_bundles (class_count, expiry_weeks, total_price, is_active) VALUES
  (10, 10, 180, true),
  (20, 20, 340, true),
  (30, 30, 480, true),
  (40, 40, 600, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 13. SEED CLASS TIMETABLE (Sample weekly schedule)
-- ============================================================
DO $timetable$
DECLARE
  v_chinese_classical UUID;
  v_ballet UUID;
  v_hip_hop UUID;
  v_kpop_youth UUID;
  v_korean_dance UUID;
BEGIN
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
END $timetable$;

-- ============================================================
-- 14. SEED UPCOMING CLASSES (Generate from timetable for next 4 weeks)
-- ============================================================
DO $seed_classes$
DECLARE
  tt_rec RECORD;
  v_class_date DATE;
  v_start_datetime TIMESTAMPTZ;
  v_end_datetime TIMESTAMPTZ;
  v_days_ahead INTEGER;
BEGIN
  -- Generate classes for the next 28 days
  FOR tt_rec IN 
    SELECT ct.*, cc.key as category_key
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
      
      -- Check if class already exists for this time slot
      IF NOT EXISTS (
        SELECT 1 FROM "CLASSES" 
        WHERE start_time = v_start_datetime 
        AND room = tt_rec.room
      ) THEN
        INSERT INTO "CLASSES" (
          name, class_type, category_id, audience, 
          start_time, end_time, instructor, room, 
          price, cost, duration_minutes, 
          max_capacity, current_enrollment
        ) VALUES (
          COALESCE(
            (SELECT name_en FROM class_categories WHERE id = tt_rec.category_id),
            'Dance Class'
          ),
          tt_rec.category_key,
          tt_rec.category_id,
          tt_rec.audience,
          v_start_datetime,
          v_end_datetime,
          tt_rec.instructor,
          tt_rec.room,
          tt_rec.price_per_class,
          tt_rec.price_per_class * 0.4, -- Cost is 40% of price
          tt_rec.duration_minutes,
          20, -- max capacity
          0
        );
      END IF;
    END LOOP;
  END LOOP;
END $seed_classes$;

-- ============================================================
-- 15. CREATE INDEXES FOR BETTER PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_classes_category_id ON "CLASSES"(category_id);
CREATE INDEX IF NOT EXISTS idx_classes_start_time ON "CLASSES"(start_time);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_user_bundles_user_id ON user_bundles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bundles_expires_at ON user_bundles(expires_at);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_class_timetable_category ON class_timetable(category_id);
CREATE INDEX IF NOT EXISTS idx_class_timetable_day ON class_timetable(day_of_week);

-- ============================================================
-- 16. GRANT PERMISSIONS
-- ============================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
