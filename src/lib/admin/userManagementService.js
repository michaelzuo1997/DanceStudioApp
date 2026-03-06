/**
 * Admin User Management Service
 * Pure JS — no React imports.
 */
import { supabase } from '../supabase';

const TABLE = 'Users Info';
const PAGE_SIZE = 20;

/**
 * Fetch users with optional search, role filter, active filter, and pagination.
 *
 * @param {Object} params
 * @param {string} [params.query] - Search by name/full_name
 * @param {string} [params.role] - Filter by role
 * @param {boolean} [params.isActive] - Filter by is_active
 * @param {number} [params.page=1]
 * @param {number} [params.limit=20]
 * @returns {{ data: Array, error: object|null, count: number }}
 */
export async function fetchUsers({ query, role, isActive, page = 1, limit = PAGE_SIZE } = {}) {
  let q = supabase
    .from(TABLE)
    .select('id, user_id, name, full_name, role, is_active, created_at', { count: 'exact' });

  if (query && query.trim().length >= 2) {
    const pattern = `%${query.trim()}%`;
    q = q.or(`name.ilike.${pattern},full_name.ilike.${pattern}`);
  }

  if (role) q = q.eq('role', role);
  if (typeof isActive === 'boolean') q = q.eq('is_active', isActive);

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  q = q.order('created_at', { ascending: false }).range(from, to);

  const { data, error, count } = await q;
  return { data: data ?? [], error, count: count ?? 0 };
}

/**
 * Fetch a single user by their "Users Info" row id.
 *
 * @param {string} userInfoId
 * @returns {{ data: object|null, error: object|null }}
 */
export async function fetchUserById(userInfoId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', userInfoId)
    .single();
  return { data, error };
}

/**
 * Update a user's role.
 * Client-side ownership guard: only owners can grant the 'owner' role.
 *
 * @param {string} userInfoId
 * @param {string} newRole - 'user' | 'instructor' | 'admin' | 'owner'
 * @param {string} callerRole - the role of the admin making the change
 * @returns {{ data: object|null, error: object|null }}
 */
export async function updateUserRole(userInfoId, newRole, callerRole) {
  if (newRole === 'owner' && callerRole !== 'owner') {
    return { data: null, error: { message: 'Only owners can grant the owner role.' } };
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq('id', userInfoId)
    .select()
    .single();
  return { data, error };
}

/**
 * Soft-deactivate a user (set is_active = false).
 *
 * @param {string} userInfoId
 * @returns {{ data: object|null, error: object|null }}
 */
export async function deactivateUser(userInfoId) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', userInfoId)
    .select()
    .single();
  return { data, error };
}

/**
 * Reactivate a previously deactivated user.
 *
 * @param {string} userInfoId
 * @returns {{ data: object|null, error: object|null }}
 */
export async function reactivateUser(userInfoId) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('id', userInfoId)
    .select()
    .single();
  return { data, error };
}

/**
 * Update a user's hourly rate.
 *
 * @param {string} userInfoId
 * @param {number|null} hourlyRate - null to clear
 * @returns {{ data: object|null, error: object|null }}
 */
export async function updateUserHourlyRate(userInfoId, hourlyRate) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ hourly_rate: hourlyRate, updated_at: new Date().toISOString() })
    .eq('id', userInfoId)
    .select()
    .single();
  return { data, error };
}

/**
 * Fetch aggregated stats for a user (by auth user_id).
 *
 * @param {string} authUserId - the auth.users.id
 * @returns {{ data: { enrollmentCount: number, activeBundles: number, balance: number }, error: object|null }}
 */
export async function fetchUserStats(authUserId) {
  try {
    const [enrollRes, bundleRes, userRes] = await Promise.all([
      supabase
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', authUserId)
        .eq('status', 'active'),
      supabase
        .from('user_bundles')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', authUserId)
        .eq('is_active', true),
      supabase
        .from(TABLE)
        .select('current_balance')
        .eq('user_id', authUserId)
        .single(),
    ]);

    return {
      data: {
        enrollmentCount: enrollRes.count ?? 0,
        activeBundles: bundleRes.count ?? 0,
        balance: Number(userRes.data?.current_balance ?? 0),
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: { message: err.message } };
  }
}
