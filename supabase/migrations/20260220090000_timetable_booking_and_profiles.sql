-- Migration: Timetable booking as source of truth + instructor/studio profiles

-- ============================================================
-- 1) INSTRUCTORS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  photo_url TEXT,
  bio TEXT,
  experience TEXT,
  awards TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read instructors" ON instructors;
CREATE POLICY "Anyone can read instructors"
  ON instructors FOR SELECT TO anon
  USING (true);
DROP POLICY IF EXISTS "Authenticated can read instructors" ON instructors;
CREATE POLICY "Authenticated can read instructors"
  ON instructors FOR SELECT TO authenticated
  USING (true);

-- ============================================================
-- 2) STUDIOS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS studios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  lat NUMERIC,
  lng NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read studios" ON studios;
CREATE POLICY "Anyone can read studios"
  ON studios FOR SELECT TO anon
  USING (true);
DROP POLICY IF EXISTS "Authenticated can read studios" ON studios;
CREATE POLICY "Authenticated can read studios"
  ON studios FOR SELECT TO authenticated
  USING (true);

-- ============================================================
-- 3) CLASSES TABLE (static definitions)
-- ============================================================
DO $$
BEGIN
  -- Ensure CLASSES.id is a PK so it can be referenced by FK (required before adding class_timetable.class_id)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'CLASSES' AND column_name = 'id'
  ) THEN
    ALTER TABLE "CLASSES" ADD COLUMN id UUID;
    UPDATE "CLASSES" SET id = gen_random_uuid() WHERE id IS NULL;
    ALTER TABLE "CLASSES" ALTER COLUMN id SET NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'CLASSES' AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE "CLASSES" ADD CONSTRAINT classes_pkey PRIMARY KEY (id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'CLASSES' AND column_name = 'is_recurring'
  ) THEN
    ALTER TABLE "CLASSES" ADD COLUMN is_recurring BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'CLASSES' AND column_name = 'recurrence_day'
  ) THEN
    ALTER TABLE "CLASSES" ADD COLUMN recurrence_day INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'CLASSES' AND column_name = 'recurrence_time'
  ) THEN
    ALTER TABLE "CLASSES" ADD COLUMN recurrence_time TIME;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'CLASSES' AND column_name = 'recurrence_count'
  ) THEN
    ALTER TABLE "CLASSES" ADD COLUMN recurrence_count INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'CLASSES' AND column_name = 'instructor_id'
  ) THEN
    ALTER TABLE "CLASSES" ADD COLUMN instructor_id UUID REFERENCES instructors(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'CLASSES' AND column_name = 'studio_id'
  ) THEN
    ALTER TABLE "CLASSES" ADD COLUMN studio_id UUID REFERENCES studios(id);
  END IF;
END $$;

-- Backfill class_date for legacy timetable rows using next occurrence of day_of_week
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'class_timetable' AND column_name = 'class_date'
  ) THEN
    UPDATE class_timetable
    SET class_date = CURRENT_DATE + ((day_of_week - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 7) % 7)
    WHERE class_date IS NULL
      AND day_of_week IS NOT NULL;
  END IF;
END $$;

-- Backfill campus from CLASSES when class_id is present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'class_timetable' AND column_name = 'campus'
  ) THEN
    UPDATE class_timetable ct
    SET campus = c.campus
    FROM "CLASSES" c
    WHERE ct.campus IS NULL
      AND ct.class_id = c.id;
  END IF;
END $$;

-- Map legacy instructor/room names to new FK columns when possible
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'class_timetable' AND column_name = 'instructor_id'
  ) THEN
    UPDATE class_timetable ct
    SET instructor_id = i.id
    FROM instructors i
    WHERE ct.instructor_id IS NULL
      AND ct.instructor IS NOT NULL
      AND i.name = ct.instructor;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'class_timetable' AND column_name = 'studio_id'
  ) THEN
    UPDATE class_timetable ct
    SET studio_id = s.id
    FROM studios s
    WHERE ct.studio_id IS NULL
      AND ct.room IS NOT NULL
      AND s.name = ct.room;
  END IF;
END $$;

-- ============================================================
-- 4) CLASS TIMETABLE TABLE (single-session source of truth)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'class_timetable' AND column_name = 'class_id'
  ) THEN
    -- NOTE: If you see "no unique constraint matching given keys" here,
    -- CLASSES.id is not a PK/unique. Ensure section (3) ran successfully.
    ALTER TABLE class_timetable ADD COLUMN class_id UUID REFERENCES "CLASSES"(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'class_timetable' AND column_name = 'class_date'
  ) THEN
    ALTER TABLE class_timetable ADD COLUMN class_date DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'class_timetable' AND column_name = 'instructor_id'
  ) THEN
    ALTER TABLE class_timetable ADD COLUMN instructor_id UUID REFERENCES instructors(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'class_timetable' AND column_name = 'studio_id'
  ) THEN
    ALTER TABLE class_timetable ADD COLUMN studio_id UUID REFERENCES studios(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'class_timetable' AND column_name = 'max_capacity'
  ) THEN
    ALTER TABLE class_timetable ADD COLUMN max_capacity INTEGER DEFAULT 20;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'class_timetable' AND column_name = 'current_enrollment'
  ) THEN
    ALTER TABLE class_timetable ADD COLUMN current_enrollment INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'class_timetable' AND column_name = 'campus'
  ) THEN
    ALTER TABLE class_timetable ADD COLUMN campus TEXT;
  END IF;
END $$;

-- Enforce timetable rows must reference a defined class
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'class_timetable' AND column_name = 'class_id'
  ) THEN
    ALTER TABLE class_timetable ALTER COLUMN class_id SET NOT NULL;
  END IF;
EXCEPTION
  WHEN others THEN
    -- If existing data has nulls, keep as-is to avoid failure
    RAISE NOTICE 'class_timetable.class_id NOT NULL not enforced (existing nulls).';
END $$;

-- ============================================================
-- 5) ENROLLMENTS TABLE (reference timetable)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'enrollments' AND column_name = 'timetable_id'
  ) THEN
    ALTER TABLE enrollments ADD COLUMN timetable_id UUID REFERENCES class_timetable(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'enrollments' AND column_name = 'class_date'
  ) THEN
    ALTER TABLE enrollments ADD COLUMN class_date DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'enrollments' AND column_name = 'start_time'
  ) THEN
    ALTER TABLE enrollments ADD COLUMN start_time TIME;
  END IF;
END $$;

-- Allow NULL class_id for timetable-based bookings (legacy column)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'enrollments' AND column_name = 'class_id'
  ) THEN
    ALTER TABLE enrollments ALTER COLUMN class_id DROP NOT NULL;
  END IF;
END $$;

-- ============================================================
-- 6) RPC: SYNC RECURRING CLASSES INTO TIMETABLE
-- ============================================================
CREATE OR REPLACE FUNCTION sync_recurring_classes()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_count INTEGER := 0;
  v_start_date DATE;
  v_next_date DATE;
BEGIN
  FOR r IN
    SELECT *
    FROM "CLASSES"
    WHERE is_recurring = true
      AND recurrence_day IS NOT NULL
      AND recurrence_time IS NOT NULL
      AND COALESCE(recurrence_count, 0) > 0
  LOOP
    v_start_date := CURRENT_DATE;

    FOR i IN 1..r.recurrence_count LOOP
      v_next_date := v_start_date + ((r.recurrence_day - EXTRACT(DOW FROM v_start_date)::INTEGER + 7) % 7);
      IF v_next_date = v_start_date THEN
        v_next_date := v_next_date + 7;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM class_timetable
        WHERE class_id = r.id
          AND class_date = v_next_date
          AND start_time = r.recurrence_time
      ) THEN
        INSERT INTO class_timetable (
          class_id, class_date, start_time, duration_minutes,
          category_id, audience, instructor_id, studio_id, price_per_class,
          max_capacity, current_enrollment, is_active, campus
        ) VALUES (
          r.id, v_next_date, r.recurrence_time, r.duration_minutes,
          r.category_id, r.audience, r.instructor_id, r.studio_id, COALESCE(r.price, 0),
          20, 0, true, r.campus
        );
        v_count := v_count + 1;
      END IF;

      v_start_date := v_next_date + 1;
    END LOOP;
  END LOOP;

  RETURN json_build_object('ok', true, 'inserted', v_count);
END;
$$;

GRANT EXECUTE ON FUNCTION sync_recurring_classes() TO authenticated;

-- ============================================================
-- 7) RPC: BOOK CLASS FROM TIMETABLE
-- ============================================================
CREATE OR REPLACE FUNCTION book_class(p_timetable_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
  v_tt RECORD;
  v_bundle RECORD;
  v_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO v_tt
  FROM class_timetable
  WHERE id = p_timetable_id
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'Class not found');
  END IF;

  IF v_tt.class_date IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'Class date missing');
  END IF;

  IF v_tt.max_capacity IS NOT NULL AND v_tt.current_enrollment >= v_tt.max_capacity THEN
    RETURN json_build_object('ok', false, 'error', 'Class is full');
  END IF;

  -- Prevent double enrollment
  IF EXISTS (
    SELECT 1 FROM enrollments
    WHERE user_id = v_uid
      AND timetable_id = v_tt.id
      AND status = 'active'
  ) THEN
    RETURN json_build_object('ok', false, 'error', 'Already enrolled');
  END IF;

  -- Find eligible bundle (match category + not expired + has remaining)
  SELECT ub.* INTO v_bundle
  FROM user_bundles ub
  WHERE ub.user_id = v_uid
    AND ub.is_active = true
    AND ub.classes_remaining > 0
    AND ub.expires_at > now()
    AND (ub.category_id IS NULL OR ub.category_id = v_tt.category_id)
  ORDER BY ub.expires_at ASC
  LIMIT 1;

  IF FOUND THEN
    -- Consume bundle pass
    UPDATE user_bundles
    SET classes_remaining = classes_remaining - 1
    WHERE id = v_bundle.id;

    INSERT INTO enrollments (user_id, timetable_id, class_id, class_date, start_time, status, bundle_id)
    VALUES (v_uid, v_tt.id, v_tt.class_id, v_tt.class_date, v_tt.start_time, 'active', v_bundle.id);

    UPDATE class_timetable
    SET current_enrollment = current_enrollment + 1
    WHERE id = v_tt.id;

    INSERT INTO transactions (user_id, type, amount, balance_after, description, bundle_id)
    VALUES (v_uid, 'purchase', 0, NULL, 'Bundle booking', v_bundle.bundle_id);

    RETURN json_build_object('ok', true, 'used_bundle', true);
  END IF;

  -- Fallback to balance charge
  SELECT COALESCE(current_balance, 0) INTO v_balance
  FROM "Users Info"
  WHERE user_id = v_uid;

  IF v_balance < COALESCE(v_tt.price_per_class, 0) THEN
    RETURN json_build_object('ok', false, 'error', 'Insufficient balance');
  END IF;

  v_new_balance := v_balance - COALESCE(v_tt.price_per_class, 0);
  UPDATE "Users Info"
  SET current_balance = v_new_balance
  WHERE user_id = v_uid;

  INSERT INTO enrollments (user_id, timetable_id, class_id, class_date, start_time, status)
  VALUES (v_uid, v_tt.id, v_tt.class_id, v_tt.class_date, v_tt.start_time, 'active');

  UPDATE class_timetable
  SET current_enrollment = current_enrollment + 1
  WHERE id = v_tt.id;

  INSERT INTO transactions (user_id, type, amount, balance_after, description, class_ids)
  VALUES (v_uid, 'purchase', -COALESCE(v_tt.price_per_class, 0), v_new_balance, 'Class booking', NULL);

  RETURN json_build_object('ok', true, 'used_bundle', false, 'new_balance', v_new_balance);
END;
$$;

GRANT EXECUTE ON FUNCTION book_class(UUID) TO authenticated;

-- ============================================================
-- 8) UPDATE cancel_enrollment FOR TIMETABLE + COUNTS
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
  v_tt RECORD;
  v_new_balance NUMERIC;
BEGIN
  v_uid := auth.uid();
  
  IF v_uid IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Not authenticated';
    RETURN;
  END IF;

  SELECT * INTO v_enrollment 
  FROM enrollments 
  WHERE id = p_enrollment_id AND user_id = v_uid AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Enrollment not found or already cancelled';
    RETURN;
  END IF;

  SELECT * INTO v_tt
  FROM class_timetable
  WHERE id = v_enrollment.timetable_id;

  -- If booked via bundle, restore classes_remaining
  IF v_enrollment.bundle_id IS NOT NULL THEN
    UPDATE user_bundles
    SET classes_remaining = classes_remaining + 1
    WHERE id = v_enrollment.bundle_id;
  ELSE
    -- Refund to balance
    UPDATE "Users Info"
    SET current_balance = current_balance + COALESCE(v_tt.price_per_class, 0)
    WHERE user_id = v_uid;

    SELECT current_balance INTO v_new_balance
    FROM "Users Info"
    WHERE user_id = v_uid;

    -- Log refund transaction
    INSERT INTO transactions (user_id, type, amount, balance_after, description, class_ids)
    VALUES (v_uid, 'refund', COALESCE(v_tt.price_per_class, 0), v_new_balance, 
            'Class cancellation refund', NULL);
  END IF;

  -- Decrement current enrollment if possible
  IF v_tt.id IS NOT NULL THEN
    UPDATE class_timetable
    SET current_enrollment = GREATEST(current_enrollment - 1, 0)
    WHERE id = v_tt.id;
  END IF;

  -- Mark enrollment as cancelled
  UPDATE enrollments
  SET status = 'cancelled', cancelled_at = now()
  WHERE id = p_enrollment_id;

  RETURN QUERY SELECT TRUE, 'Enrollment cancelled successfully';
END;
$$;

GRANT EXECUTE ON FUNCTION cancel_enrollment(UUID) TO authenticated;

-- ============================================================
-- 9) SEED MOCK INSTRUCTORS + STUDIOS
-- ============================================================
INSERT INTO instructors (name, photo_url, bio, experience, awards, contact_email, contact_phone)
VALUES
  ('Mei Lin', NULL, 'Classical Chinese dance specialist.', '10+ years teaching experience', 'National Dance Award 2019', 'mei@example.com', '+61 400 000 001'),
  ('Yuna Park', NULL, 'Korean dance and performance coach.', '8 years teaching K-pop dance', 'Korea Dance Festival Finalist', 'yuna@example.com', '+61 400 000 002')
ON CONFLICT DO NOTHING;

INSERT INTO studios (name, address, lat, lng, notes)
VALUES
  ('Studio A', '123 Main St, Sydney NSW', NULL, NULL, 'Level 2, front desk'),
  ('Studio B', '45 Market Rd, Sydney NSW', NULL, NULL, 'Enter via side door')
ON CONFLICT DO NOTHING;
