-- Migration: Create full schema for Dance Studio mobile app
-- This migration consolidates all tables needed for the mobile app

-- ============================================================
-- 1. CLASSES table (matches existing web app)
-- ============================================================
CREATE TABLE IF NOT EXISTS "CLASSES" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  class_type TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  instructor TEXT,
  room TEXT,
  price NUMERIC(10,2) DEFAULT 0,
  cost NUMERIC(10,2) DEFAULT 0,
  description TEXT,
  max_capacity INTEGER,
  current_enrollment INTEGER DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE "CLASSES" ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Authenticated users can read CLASSES"
  ON "CLASSES" FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- 2. Users Info table (matches existing web app)
-- ============================================================
CREATE TABLE IF NOT EXISTS "Users Info" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  full_name TEXT,
  current_balance NUMERIC(10,2) DEFAULT 0,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE "Users Info" ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can read own info"
  ON "Users Info" FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own info"
  ON "Users Info" FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own info"
  ON "Users Info" FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 3. Enrollments table (matches existing web app)
-- ============================================================
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, class_id)
);

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can read own enrollments"
  ON enrollments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own enrollments"
  ON enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 4. Push notification tokens (mobile-specific)
-- ============================================================
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, token)
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own push tokens"
  ON push_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 5. Transaction history (mobile-specific - audit trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('topup', 'purchase', 'refund')),
  amount NUMERIC(10,2) NOT NULL,
  balance_after NUMERIC(10,2),
  description TEXT,
  class_ids JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 6. topup_balance RPC (matches existing web app)
-- ============================================================
CREATE OR REPLACE FUNCTION topup_balance(p_amount NUMERIC)
RETURNS TABLE(new_balance NUMERIC, ok BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
  v_new NUMERIC;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN QUERY SELECT NULL::NUMERIC, FALSE;
    RETURN;
  END IF;

  UPDATE "Users Info"
  SET current_balance = COALESCE(current_balance, 0) + p_amount,
      updated_at = now()
  WHERE user_id = v_uid;

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::NUMERIC, FALSE;
    RETURN;
  END IF;

  SELECT current_balance INTO v_new
  FROM "Users Info"
  WHERE user_id = v_uid;

  -- Record transaction
  INSERT INTO transactions (user_id, type, amount, balance_after, description)
  VALUES (v_uid, 'topup', p_amount, v_new, 'Balance top-up');

  RETURN QUERY SELECT v_new, TRUE;
END;
$$;

-- ============================================================
-- 7. Auto-create user info on signup trigger
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO "Users Info" (user_id, name, full_name, current_balance)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    0
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 8. Updated_at trigger helper
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

DROP TRIGGER IF EXISTS classes_updated_at ON "CLASSES";
CREATE TRIGGER classes_updated_at
  BEFORE UPDATE ON "CLASSES"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS users_info_updated_at ON "Users Info";
CREATE TRIGGER users_info_updated_at
  BEFORE UPDATE ON "Users Info"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
