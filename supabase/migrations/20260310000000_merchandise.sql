-- Merchandise table for the Shop tab
CREATE TABLE IF NOT EXISTS merchandise (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '商品',
  barcode TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  description_en TEXT,
  description_zh TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE merchandise ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read merchandise"
  ON merchandise FOR SELECT
  USING (true);

CREATE POLICY "Admin manage merchandise"
  ON merchandise FOR ALL
  USING (is_admin_or_owner())
  WITH CHECK (is_admin_or_owner());

CREATE INDEX idx_merchandise_active ON merchandise (is_active) WHERE is_active = true;
CREATE INDEX idx_merchandise_category ON merchandise (category);

-- RPC for purchasing merchandise (deducts from user balance, decrements stock)
CREATE OR REPLACE FUNCTION purchase_merchandise(p_items JSON)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_balance NUMERIC(10,2);
  v_total NUMERIC(10,2) := 0;
  v_item JSON;
  v_merch RECORD;
  v_qty INTEGER;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'Not authenticated');
  END IF;

  -- Get current balance
  SELECT current_balance INTO v_balance
  FROM "Users Info"
  WHERE user_id = v_user_id;

  IF v_balance IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'User profile not found');
  END IF;

  -- Validate items and calculate total
  FOR v_item IN SELECT * FROM json_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::INTEGER;
    IF v_qty IS NULL OR v_qty <= 0 THEN
      RETURN json_build_object('ok', false, 'error', 'Invalid quantity');
    END IF;

    SELECT * INTO v_merch
    FROM merchandise
    WHERE id = (v_item->>'item_id')::UUID
      AND is_active = true
    FOR UPDATE;

    IF v_merch IS NULL THEN
      RETURN json_build_object('ok', false, 'error', 'Item not found: ' || (v_item->>'item_id'));
    END IF;

    IF v_merch.stock < v_qty THEN
      RETURN json_build_object('ok', false, 'error', 'Insufficient stock for: ' || v_merch.name_en);
    END IF;

    v_total := v_total + (v_merch.price * v_qty);
  END LOOP;

  -- Check balance
  IF v_balance < v_total THEN
    RETURN json_build_object('ok', false, 'error', 'Insufficient balance');
  END IF;

  -- Deduct balance
  UPDATE "Users Info"
  SET current_balance = current_balance - v_total,
      updated_at = now()
  WHERE user_id = v_user_id;

  -- Decrement stock
  FOR v_item IN SELECT * FROM json_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::INTEGER;
    UPDATE merchandise
    SET stock = stock - v_qty,
        updated_at = now()
    WHERE id = (v_item->>'item_id')::UUID;
  END LOOP;

  -- Log transaction
  INSERT INTO transactions (user_id, type, amount, balance_after, description)
  VALUES (
    v_user_id,
    'purchase',
    v_total,
    v_balance - v_total,
    'Merchandise purchase'
  );

  RETURN json_build_object('ok', true, 'new_balance', v_balance - v_total);
END;
$$;
