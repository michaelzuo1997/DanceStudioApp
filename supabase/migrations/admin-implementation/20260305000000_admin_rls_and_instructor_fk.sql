-- Admin RLS policies, instructor user linking, enrollment metadata
-- Phase 1: Class Management admin controls

-- 1. Link instructors to auth accounts
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_instructors_user_id ON instructors(user_id) WHERE user_id IS NOT NULL;

-- 2. Admin role-check function (SECURITY DEFINER so RLS can call it)
CREATE OR REPLACE FUNCTION is_admin_or_owner()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM "Users Info"
    WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. Performance index for role lookups
CREATE INDEX IF NOT EXISTS idx_users_info_role ON "Users Info"(user_id, role);

-- 4. Admin RLS policies for class_timetable
CREATE POLICY "Admins can insert class_timetable"
  ON class_timetable FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_owner());

CREATE POLICY "Admins can update class_timetable"
  ON class_timetable FOR UPDATE
  TO authenticated
  USING (is_admin_or_owner())
  WITH CHECK (is_admin_or_owner());

CREATE POLICY "Admins can delete class_timetable"
  ON class_timetable FOR DELETE
  TO authenticated
  USING (is_admin_or_owner());

-- 5. Admin RLS policies for enrollments
CREATE POLICY "Admins can insert enrollments"
  ON enrollments FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_owner());

CREATE POLICY "Admins can update enrollments"
  ON enrollments FOR UPDATE
  TO authenticated
  USING (is_admin_or_owner())
  WITH CHECK (is_admin_or_owner());

CREATE POLICY "Admins can delete enrollments"
  ON enrollments FOR DELETE
  TO authenticated
  USING (is_admin_or_owner());

-- 6. Admin SELECT on Users Info (for user search)
CREATE POLICY "Admins can read all users"
  ON "Users Info" FOR SELECT
  TO authenticated
  USING (is_admin_or_owner() OR user_id = auth.uid());

-- 7. Admin policies for instructors
CREATE POLICY "Admins can insert instructors"
  ON instructors FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_owner());

CREATE POLICY "Admins can update instructors"
  ON instructors FOR UPDATE
  TO authenticated
  USING (is_admin_or_owner())
  WITH CHECK (is_admin_or_owner());

-- 8. Enrollment metadata columns
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'balance'
  CHECK (payment_type IN ('balance', 'bundle', 'cash', 'trial'));
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS enrolled_by TEXT DEFAULT 'self'
  CHECK (enrolled_by IN ('self', 'admin'));
