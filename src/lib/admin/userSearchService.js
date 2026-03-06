/**
 * Admin User Search Service
 * Pure JS — no React imports.
 */
import { supabase } from '../supabase';

/**
 * Search users by name or email (case-insensitive).
 * Returns up to `limit` results.
 */
export async function searchUsers(query, { limit = 20 } = {}) {
  if (!query || query.trim().length < 2) {
    return { data: [], error: null };
  }

  const pattern = `%${query.trim()}%`;

  const { data, error } = await supabase
    .from('Users Info')
    .select('id, user_id, name, full_name, role')
    .or(`name.ilike.${pattern},full_name.ilike.${pattern}`)
    .limit(limit)
    .order('name', { ascending: true });

  return { data: data ?? [], error };
}
