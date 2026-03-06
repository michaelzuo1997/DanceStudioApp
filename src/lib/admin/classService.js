/**
 * Admin Class Management Service
 * Pure JS — no React imports. Reusable across mobile & web.
 */
import { supabase } from '../supabase';

const TABLE = 'class_timetable';
const PAGE_SIZE = 20;

/**
 * Fetch classes with optional filters and pagination.
 */
export async function fetchClasses({ campusId, categoryId, isActive, page = 1, limit = PAGE_SIZE } = {}) {
  let query = supabase
    .from(TABLE)
    .select('*, class_categories(key, name_en, name_zh), campuses(key, name_en, name_zh), instructors(id, name)', { count: 'exact' });

  if (campusId) query = query.eq('campus_id', campusId);
  if (categoryId) query = query.eq('category_id', categoryId);
  if (typeof isActive === 'boolean') query = query.eq('is_active', isActive);

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.order('day_of_week', { ascending: true }).order('start_time', { ascending: true }).range(from, to);

  const { data, error, count } = await query;
  return { data: data ?? [], error, count };
}

/**
 * Fetch a single class by ID with joins.
 */
export async function fetchClassById(classId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*, class_categories(key, name_en, name_zh), campuses(key, name_en, name_zh), instructors(id, name)')
    .eq('id', classId)
    .single();
  return { data, error };
}

/**
 * Create a new class entry.
 */
export async function createClass(fields) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      category_id: fields.categoryId,
      campus_id: fields.campusId,
      audience: fields.audience,
      day_of_week: fields.dayOfWeek,
      class_date: fields.classDate ?? null,
      start_time: fields.startTime,
      duration_minutes: fields.durationMinutes ?? 60,
      price_per_class: fields.pricePerClass ?? 20,
      max_capacity: fields.maxCapacity ?? null,
      instructor_id: fields.instructorId ?? null,
      room: fields.room ?? null,
      is_active: fields.isActive ?? true,
    })
    .select()
    .single();
  return { data, error };
}

/**
 * Update an existing class.
 */
export async function updateClass(classId, updates) {
  const mapped = {};
  if (updates.categoryId !== undefined) mapped.category_id = updates.categoryId;
  if (updates.campusId !== undefined) mapped.campus_id = updates.campusId;
  if (updates.audience !== undefined) mapped.audience = updates.audience;
  if (updates.dayOfWeek !== undefined) mapped.day_of_week = updates.dayOfWeek;
  if (updates.classDate !== undefined) mapped.class_date = updates.classDate;
  if (updates.startTime !== undefined) mapped.start_time = updates.startTime;
  if (updates.durationMinutes !== undefined) mapped.duration_minutes = updates.durationMinutes;
  if (updates.pricePerClass !== undefined) mapped.price_per_class = updates.pricePerClass;
  if (updates.maxCapacity !== undefined) mapped.max_capacity = updates.maxCapacity;
  if (updates.instructorId !== undefined) mapped.instructor_id = updates.instructorId;
  if (updates.room !== undefined) mapped.room = updates.room;
  if (updates.isActive !== undefined) mapped.is_active = updates.isActive;
  mapped.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from(TABLE)
    .update(mapped)
    .eq('id', classId)
    .select()
    .single();
  return { data, error };
}

/**
 * Deactivate a class (soft delete).
 */
export async function deactivateClass(classId) {
  return updateClass(classId, { isActive: false });
}

/**
 * Activate a previously deactivated class.
 */
export async function activateClass(classId) {
  return updateClass(classId, { isActive: true });
}

/**
 * Reschedule a class to a new date/time.
 */
export async function rescheduleClass(classId, { classDate, startTime, dayOfWeek }) {
  return updateClass(classId, { classDate, startTime, dayOfWeek });
}

/**
 * Change the instructor for a class.
 */
export async function changeInstructor(classId, instructorId) {
  return updateClass(classId, { instructorId });
}
