-- Migration: Migrate legacy class_id references to CLASSES.id (UUID)
-- Schema facts:
--   CLASSES.class_id = bigint (legacy)
--   CLASSES.id       = uuid (new)
--   enrollments.class_id = text (legacy)
--   transactions.class_ids = jsonb (legacy)

DO $$
BEGIN
  -- Ensure CLASSES.id is present (should already be added by prior migration)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'CLASSES'
      AND column_name = 'id'
  ) THEN
    RAISE EXCEPTION 'CLASSES.id (uuid) is missing. Run the id column migration first.';
  END IF;
END $$;

-- 1) Normalize enrollments.class_id to UUID text by mapping legacy bigint -> uuid
-- Only update rows where class_id looks like a numeric value
UPDATE enrollments e
SET class_id = c.id::text
FROM "CLASSES" c
WHERE e.class_id ~ '^[0-9]+$'
  AND c.class_id::text = e.class_id;

-- 2) Migrate transactions.class_ids JSONB array values
-- Replace numeric entries with matching CLASSES.id (uuid) strings
WITH mapped AS (
  SELECT
    t.id AS tx_id,
    jsonb_agg(
      CASE
        WHEN elem_text ~ '^[0-9]+$' THEN COALESCE(c.id::text, elem_text)
        ELSE elem_text
      END
    ) AS new_class_ids
  FROM transactions t
  CROSS JOIN LATERAL jsonb_array_elements_text(t.class_ids) AS elem_text
  LEFT JOIN "CLASSES" c
    ON c.class_id::text = elem_text
  WHERE t.class_ids IS NOT NULL
  GROUP BY t.id
)
UPDATE transactions t
SET class_ids = mapped.new_class_ids
FROM mapped
WHERE t.id = mapped.tx_id;

-- 3) Optional: keep legacy class_id index for lookups
CREATE INDEX IF NOT EXISTS idx_classes_class_id ON "CLASSES"(class_id);

