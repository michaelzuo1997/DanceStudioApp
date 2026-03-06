-- Admin RLS policies for noticeboard and class_bundles
-- Uses existing is_admin_or_owner() SECURITY DEFINER function

-- Noticeboard: INSERT/UPDATE/DELETE for admins
CREATE POLICY "Admins can insert noticeboard" ON noticeboard FOR INSERT TO authenticated WITH CHECK (is_admin_or_owner());
CREATE POLICY "Admins can update noticeboard" ON noticeboard FOR UPDATE TO authenticated USING (is_admin_or_owner()) WITH CHECK (is_admin_or_owner());
CREATE POLICY "Admins can delete noticeboard" ON noticeboard FOR DELETE TO authenticated USING (is_admin_or_owner());

-- class_bundles: INSERT/UPDATE/DELETE for admins
CREATE POLICY "Admins can insert class_bundles" ON class_bundles FOR INSERT TO authenticated WITH CHECK (is_admin_or_owner());
CREATE POLICY "Admins can update class_bundles" ON class_bundles FOR UPDATE TO authenticated USING (is_admin_or_owner()) WITH CHECK (is_admin_or_owner());
CREATE POLICY "Admins can delete class_bundles" ON class_bundles FOR DELETE TO authenticated USING (is_admin_or_owner());
