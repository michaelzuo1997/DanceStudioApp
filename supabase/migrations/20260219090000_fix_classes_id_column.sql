-- Migration: Fix CLASSES id column for legacy schemas
-- Adds "id" UUID PK if missing, backfills from class_id when present.

DO $$
BEGIN
  -- 1) Add id column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'CLASSES'
      AND column_name = 'id'
  ) THEN
    ALTER TABLE "CLASSES" ADD COLUMN id UUID;
  END IF;

  -- 2) Backfill id from class_id if it exists AND is UUID typed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'CLASSES'
      AND column_name = 'class_id'
  ) THEN
    DECLARE v_class_id_type TEXT;
    BEGIN
      SELECT data_type INTO v_class_id_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'CLASSES'
        AND column_name = 'class_id';

      IF v_class_id_type = 'uuid' THEN
        UPDATE "CLASSES"
        SET id = class_id
        WHERE id IS NULL;
      ELSE
        RAISE NOTICE 'Skipping id backfill from class_id because class_id type is %', v_class_id_type;
      END IF;
    END;
  END IF;

  -- 3) Fill any remaining null ids with generated UUIDs
  UPDATE "CLASSES"
  SET id = gen_random_uuid()
  WHERE id IS NULL;

  -- 4) Ensure id is NOT NULL
  ALTER TABLE "CLASSES" ALTER COLUMN id SET NOT NULL;

  -- 5) Add PK if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'CLASSES'
      AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE "CLASSES" ADD CONSTRAINT classes_pkey PRIMARY KEY (id);
  END IF;
END $$;

-- Optional: index on class_id for legacy lookups
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'CLASSES'
      AND column_name = 'class_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_classes_class_id ON "CLASSES"(class_id);
  END IF;
END $$;
