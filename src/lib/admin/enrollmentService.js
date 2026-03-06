/**
 * Admin Enrollment Management Service
 * Pure JS — no React imports.
 */
import { supabase } from '../supabase';

/**
 * Fetch all enrollments for a given timetable class, with user info.
 */
export async function fetchEnrollmentsForClass(timetableId) {
  const { data, error } = await supabase
    .from('enrollments')
    .select('*, "Users Info"(name, full_name, email:user_id)')
    .eq('class_id', timetableId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  return { data: data ?? [], error };
}

/**
 * Admin-enroll a user into a class.
 */
export async function adminEnrollUser(timetableId, userId, { paymentType = 'cash' } = {}) {
  const { data, error } = await supabase
    .from('enrollments')
    .insert({
      class_id: timetableId,
      user_id: userId,
      status: 'active',
      payment_type: paymentType,
      enrolled_by: 'admin',
    })
    .select()
    .single();
  return { data, error };
}

/**
 * Admin-unenroll (cancel) a single enrollment with optional reason.
 */
export async function adminUnenrollUser(enrollmentId, { reason } = {}) {
  const updates = {
    status: 'cancelled',
    cancelled_at: new Date().toISOString(),
  };
  if (reason) updates.cancel_reason = reason;

  const { data, error } = await supabase
    .from('enrollments')
    .update(updates)
    .eq('id', enrollmentId)
    .select()
    .single();
  return { data, error };
}

/**
 * Bulk-cancel all active enrollments for a class.
 */
export async function adminBulkUnenroll(timetableId, reason = 'class cancelled') {
  const { data, error } = await supabase
    .from('enrollments')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancel_reason: reason,
    })
    .eq('class_id', timetableId)
    .eq('status', 'active')
    .select();
  return { data: data ?? [], error };
}
