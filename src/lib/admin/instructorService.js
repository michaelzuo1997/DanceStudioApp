/**
 * Admin Instructor Service
 * Pure JS — no React imports.
 */
import { supabase } from '../supabase';

/**
 * Fetch all instructors for use in pickers/dropdowns.
 */
export async function fetchInstructors() {
  const { data, error } = await supabase
    .from('instructors')
    .select('id, name, user_id')
    .order('name', { ascending: true });
  return { data: data ?? [], error };
}
