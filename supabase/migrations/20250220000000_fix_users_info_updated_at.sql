-- Migration: Fix Users Info table - ensure updated_at column exists
-- Issue: Trigger "users_info_updated_at" references NEW.updated_at but column may not exist
-- Error: "record 'new' has no field 'updated_at'"

-- ============================================================
-- 1. ADD updated_at COLUMN IF MISSING
-- ============================================================
DO $add_updated_at$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Users Info' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE "Users Info" ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    RAISE NOTICE 'Added updated_at column to Users Info';
  END IF;
END $add_updated_at$;

-- ============================================================
-- 2. ADD created_at COLUMN IF MISSING (for completeness)
-- ============================================================
DO $add_created_at$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Users Info' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE "Users Info" ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
    RAISE NOTICE 'Added created_at column to Users Info';
  END IF;
END $add_created_at$;

-- ============================================================
-- 3. RECREATE THE TRIGGER SAFELY
-- ============================================================
-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS users_info_updated_at ON "Users Info";

-- Create or replace the helper function (safer version that checks column exists)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only set updated_at if the column exists in NEW record
  -- This prevents "record 'new' has no field 'updated_at'" error
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = TG_TABLE_NAME 
    AND column_name = 'updated_at'
  ) THEN
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER users_info_updated_at
  BEFORE UPDATE ON "Users Info"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 4. FIX topup_balance RPC - Don't rely on trigger for updated_at
-- ============================================================
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
  v_has_updated_at BOOLEAN;
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

  -- Check if updated_at column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Users Info' 
    AND column_name = 'updated_at'
  ) INTO v_has_updated_at;

  -- Get current balance
  SELECT COALESCE(current_balance, 0) INTO v_current_balance
  FROM "Users Info"
  WHERE user_id = v_uid;

  IF NOT FOUND THEN
    -- User info doesn't exist, create it first
    IF v_has_updated_at THEN
      INSERT INTO "Users Info" (user_id, name, full_name, current_balance, created_at, updated_at)
      VALUES (
        v_uid,
        (SELECT email FROM auth.users WHERE id = v_uid),
        (SELECT COALESCE(raw_user_meta_data->>'full_name', email) FROM auth.users WHERE id = v_uid),
        0,
        now(),
        now()
      )
      ON CONFLICT (user_id) DO NOTHING;
    ELSE
      INSERT INTO "Users Info" (user_id, name, full_name, current_balance)
      VALUES (
        v_uid,
        (SELECT email FROM auth.users WHERE id = v_uid),
        (SELECT COALESCE(raw_user_meta_data->>'full_name', email) FROM auth.users WHERE id = v_uid),
        0
      )
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
    
    v_current_balance := 0;
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance + p_amount;

  -- Update balance (conditionally include updated_at)
  IF v_has_updated_at THEN
    UPDATE "Users Info"
    SET current_balance = v_new_balance,
        updated_at = now()
    WHERE user_id = v_uid;
  ELSE
    UPDATE "Users Info"
    SET current_balance = v_new_balance
    WHERE user_id = v_uid;
  END IF;

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
-- 5. GRANT PERMISSIONS
-- ============================================================
GRANT EXECUTE ON FUNCTION topup_balance(NUMERIC) TO authenticated;
