/**
 * Admin Price Management Service
 * Pure JS — no React imports.
 */
import { supabase } from '../supabase';

const TABLE = 'class_timetable';

/**
 * Build a filtered query on class_timetable.
 * Shared between preview and update to guarantee identical filtering.
 */
function buildFilteredQuery(filters, selectClause = '*') {
  const { categoryId, campusId, audience, dateFrom, dateTo } = filters;

  let query = supabase.from(TABLE).select(selectClause);

  if (categoryId) query = query.eq('category_id', categoryId);
  if (campusId) query = query.eq('campus_id', campusId);
  if (audience) query = query.eq('audience', audience);
  if (dateFrom) query = query.gte('class_date', dateFrom);
  if (dateTo) query = query.lte('class_date', dateTo);

  // Only target active classes
  query = query.eq('is_active', true);

  return query;
}

/**
 * Check that at least one meaningful filter is provided.
 */
function hasFilters({ categoryId, campusId, audience, dateFrom, dateTo }) {
  return !!(categoryId || campusId || audience || dateFrom || dateTo);
}

/**
 * Preview how many classes would be affected by a price change.
 * Returns the matching classes with their current prices.
 *
 * @param {Object} filters
 * @param {string} [filters.categoryId]
 * @param {string} [filters.campusId]
 * @param {string} [filters.audience]
 * @param {string} [filters.dateFrom] - YYYY-MM-DD
 * @param {string} [filters.dateTo]   - YYYY-MM-DD
 * @returns {{ data: Array, error: object|null, count: number }}
 */
export async function previewPriceChange(filters = {}) {
  if (!hasFilters(filters)) {
    return { data: [], error: { message: 'At least one filter is required.' }, count: 0 };
  }

  const query = buildFilteredQuery(
    filters,
    'id, price_per_class, class_categories(key, name_en, name_zh), campuses(key, name_en, name_zh)',
  );

  const { data, error } = await query;
  return { data: data ?? [], error, count: (data ?? []).length };
}

/**
 * Apply a bulk price update to all matching active classes.
 *
 * Safety:
 *  - Rejects if no filters provided (prevents accidental update-all)
 *  - Rejects if newPrice <= 0
 *
 * @param {Object} params
 * @param {string} [params.categoryId]
 * @param {string} [params.campusId]
 * @param {string} [params.audience]
 * @param {string} [params.dateFrom]
 * @param {string} [params.dateTo]
 * @param {number} params.newPrice
 * @returns {{ data: object|null, error: object|null, count: number }}
 */
export async function bulkUpdatePrice({ categoryId, campusId, audience, dateFrom, dateTo, newPrice }) {
  if (!hasFilters({ categoryId, campusId, audience, dateFrom, dateTo })) {
    return { data: null, error: { message: 'At least one filter is required.' }, count: 0 };
  }

  if (!newPrice || newPrice <= 0) {
    return { data: null, error: { message: 'Price must be greater than 0.' }, count: 0 };
  }

  let query = supabase.from(TABLE).update({
    price_per_class: newPrice,
    updated_at: new Date().toISOString(),
  });

  if (categoryId) query = query.eq('category_id', categoryId);
  if (campusId) query = query.eq('campus_id', campusId);
  if (audience) query = query.eq('audience', audience);
  if (dateFrom) query = query.gte('class_date', dateFrom);
  if (dateTo) query = query.lte('class_date', dateTo);
  query = query.eq('is_active', true);

  const { data, error } = await query.select();
  return { data, error, count: (data ?? []).length };
}
