-- Phase 3: Admin user management support

-- 1. Add is_active column for soft-deactivation
ALTER TABLE "Users Info" ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_info_is_active ON "Users Info"(is_active);

-- 2. Admin UPDATE policy on "Users Info" (role + is_active changes)
CREATE POLICY "Admins can update users"
  ON "Users Info" FOR UPDATE
  TO authenticated
  USING (is_admin_or_owner())
  WITH CHECK (is_admin_or_owner());
