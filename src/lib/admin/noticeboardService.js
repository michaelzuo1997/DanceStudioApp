/**
 * Admin Noticeboard Management Service
 * Pure JS — no React imports. Reusable across mobile & web.
 */
import { supabase } from '../supabase';

const TABLE = 'noticeboard';
const PAGE_SIZE = 20;

/**
 * Fetch notices with optional filters and pagination.
 */
export async function fetchNotices({ campusId, isActive, page = 1, limit = PAGE_SIZE } = {}) {
  let query = supabase
    .from(TABLE)
    .select('*, campuses(key, name_en, name_zh)', { count: 'exact' });

  if (campusId) query = query.eq('campus_id', campusId);
  if (typeof isActive === 'boolean') query = query.eq('is_active', isActive);

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.order('priority', { ascending: false }).order('created_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  return { data: data ?? [], error, count };
}

/**
 * Fetch a single notice by ID with joins.
 */
export async function fetchNoticeById(noticeId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*, campuses(key, name_en, name_zh)')
    .eq('id', noticeId)
    .single();
  return { data, error };
}

/**
 * Create a new notice.
 */
export async function createNotice(fields) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      title_en: fields.titleEn,
      title_zh: fields.titleZh,
      body_en: fields.bodyEn ?? null,
      body_zh: fields.bodyZh ?? null,
      image_url: fields.imageUrl ?? null,
      link_url: fields.linkUrl ?? null,
      campus_id: fields.campusId ?? null,
      priority: fields.priority ?? 0,
      starts_at: fields.startsAt ?? new Date().toISOString(),
      expires_at: fields.expiresAt ?? null,
      is_active: fields.isActive ?? true,
    })
    .select()
    .single();
  return { data, error };
}

/**
 * Update an existing notice.
 */
export async function updateNotice(noticeId, updates) {
  const mapped = {};
  if (updates.titleEn !== undefined) mapped.title_en = updates.titleEn;
  if (updates.titleZh !== undefined) mapped.title_zh = updates.titleZh;
  if (updates.bodyEn !== undefined) mapped.body_en = updates.bodyEn;
  if (updates.bodyZh !== undefined) mapped.body_zh = updates.bodyZh;
  if (updates.imageUrl !== undefined) mapped.image_url = updates.imageUrl;
  if (updates.linkUrl !== undefined) mapped.link_url = updates.linkUrl;
  if (updates.campusId !== undefined) mapped.campus_id = updates.campusId;
  if (updates.priority !== undefined) mapped.priority = updates.priority;
  if (updates.startsAt !== undefined) mapped.starts_at = updates.startsAt;
  if (updates.expiresAt !== undefined) mapped.expires_at = updates.expiresAt;
  if (updates.isActive !== undefined) mapped.is_active = updates.isActive;

  const { data, error } = await supabase
    .from(TABLE)
    .update(mapped)
    .eq('id', noticeId)
    .select()
    .single();
  return { data, error };
}

/**
 * Deactivate a notice (soft delete).
 */
export async function deactivateNotice(noticeId) {
  return updateNotice(noticeId, { isActive: false });
}

/**
 * Activate a previously deactivated notice.
 */
export async function activateNotice(noticeId) {
  return updateNotice(noticeId, { isActive: true });
}
