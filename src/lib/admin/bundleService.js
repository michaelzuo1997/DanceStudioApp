/**
 * Admin Bundle Management Service
 * Pure JS — no React imports. Reusable across mobile & web.
 */
import { supabase } from '../supabase';

const TABLE = 'class_bundles';
const PAGE_SIZE = 20;

/**
 * Fetch bundles with optional filters and pagination.
 */
export async function fetchBundles({ categoryId, audience, isActive, page = 1, limit = PAGE_SIZE } = {}) {
  let query = supabase
    .from(TABLE)
    .select('*, class_categories(key, name_en, name_zh)', { count: 'exact' });

  if (categoryId) query = query.eq('category_id', categoryId);
  if (audience) query = query.eq('audience', audience);
  if (typeof isActive === 'boolean') query = query.eq('is_active', isActive);

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  return { data: data ?? [], error, count };
}

/**
 * Fetch a single bundle by ID with joins.
 */
export async function fetchBundleById(bundleId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*, class_categories(key, name_en, name_zh)')
    .eq('id', bundleId)
    .single();
  return { data, error };
}

/**
 * Create a new bundle.
 */
export async function createBundle(fields) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      category_id: fields.categoryId ?? null,
      audience: fields.audience ?? null,
      class_count: fields.classCount,
      expiry_weeks: fields.expiryWeeks,
      total_price: fields.totalPrice,
      is_active: fields.isActive ?? true,
    })
    .select()
    .single();
  return { data, error };
}

/**
 * Update an existing bundle.
 */
export async function updateBundle(bundleId, updates) {
  const mapped = {};
  if (updates.categoryId !== undefined) mapped.category_id = updates.categoryId;
  if (updates.audience !== undefined) mapped.audience = updates.audience;
  if (updates.classCount !== undefined) mapped.class_count = updates.classCount;
  if (updates.expiryWeeks !== undefined) mapped.expiry_weeks = updates.expiryWeeks;
  if (updates.totalPrice !== undefined) mapped.total_price = updates.totalPrice;
  if (updates.isActive !== undefined) mapped.is_active = updates.isActive;

  const { data, error } = await supabase
    .from(TABLE)
    .update(mapped)
    .eq('id', bundleId)
    .select()
    .single();
  return { data, error };
}

/**
 * Deactivate a bundle (soft delete).
 */
export async function deactivateBundle(bundleId) {
  return updateBundle(bundleId, { isActive: false });
}

/**
 * Activate a previously deactivated bundle.
 */
export async function activateBundle(bundleId) {
  return updateBundle(bundleId, { isActive: true });
}
