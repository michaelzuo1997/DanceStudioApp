/**
 * Admin Wage Calculator Service
 * Pure JS — no React imports.
 */
import { supabase } from '../supabase';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Calculate instructor wages for a date range.
 * Sums duration_minutes from class_timetable for each instructor,
 * joins with Users Info for hourly_rate.
 *
 * @param {Object} params
 * @param {string} params.dateFrom - YYYY-MM-DD
 * @param {string} params.dateTo - YYYY-MM-DD
 * @param {string} [params.campusId] - Optional campus filter
 * @returns {{ data: Array, error: object|null }}
 */
export async function calculateInstructorWages({ dateFrom, dateTo, campusId } = {}) {
  if (!dateFrom || !dateTo) {
    return { data: [], error: { message: 'Date range (dateFrom, dateTo) is required.' } };
  }

  try {
    // Fetch timetable entries with instructor info
    let q = supabase
      .from('class_timetable')
      .select('instructor_id, duration_minutes, instructors(id, name, user_id)')
      .gte('class_date', dateFrom)
      .lte('class_date', dateTo)
      .eq('is_active', true);

    if (campusId) {
      q = q.eq('campus_id', campusId);
    }

    const { data: classes, error: classError } = await q;
    if (classError) return { data: [], error: classError };

    // Filter out entries with no instructor
    const withInstructor = (classes ?? []).filter(
      (c) => c.instructor_id && c.instructors
    );

    // Group by instructor
    const grouped = {};
    for (const c of withInstructor) {
      const key = c.instructor_id;
      if (!grouped[key]) {
        grouped[key] = {
          instructorId: key,
          instructorName: c.instructors.name,
          userId: c.instructors.user_id,
          totalMinutes: 0,
        };
      }
      grouped[key].totalMinutes += c.duration_minutes ?? 0;
    }

    // Fetch hourly rates for these instructors' user_ids
    const instructorEntries = Object.values(grouped);
    const userIds = instructorEntries
      .map((e) => e.userId)
      .filter(Boolean);

    let rateMap = {};
    if (userIds.length > 0) {
      const { data: usersInfo } = await supabase
        .from('Users Info')
        .select('user_id, hourly_rate')
        .in('user_id', userIds);

      for (const u of usersInfo ?? []) {
        if (u.hourly_rate != null) {
          rateMap[u.user_id] = Number(u.hourly_rate);
        }
      }
    }

    // Build result with hours and pay
    const result = instructorEntries.map((entry) => {
      const hourlyRate = rateMap[entry.userId] ?? null;
      const totalHours = Number((entry.totalMinutes / 60).toFixed(2));
      const totalPay = hourlyRate != null ? Number((totalHours * hourlyRate).toFixed(2)) : null;

      return {
        instructorId: entry.instructorId,
        instructorName: entry.instructorName,
        userId: entry.userId,
        hourlyRate,
        totalMinutes: entry.totalMinutes,
        totalHours,
        totalPay,
      };
    });

    return { data: result, error: null };
  } catch (err) {
    return { data: [], error: { message: err.message } };
  }
}

/**
 * Fetch admin/owner staff who have an hourly_rate set.
 *
 * @returns {{ data: Array, error: object|null }}
 */
export async function fetchWageStaff() {
  const { data, error } = await supabase
    .from('Users Info')
    .select('id, user_id, name, full_name, role, hourly_rate')
    .in('role', ['admin', 'owner'])
    .not('hourly_rate', 'is', null);

  return { data: data ?? [], error };
}

/**
 * Generate CSV string from wage entries.
 *
 * @param {Array<{name: string, role: string, hours: number, rate: number, total: number}>} entries
 * @returns {string} CSV content
 */
export function generateWageCSV(entries) {
  const header = 'Name,Role,Hours,Hourly Rate (A$),Total (A$)';
  const rows = entries.map(
    (e) => `${escapeCSV(e.name)},${escapeCSV(e.role)},${e.hours},${e.rate},${e.total}`
  );
  const grandTotal = entries.reduce((sum, e) => sum + (e.total ?? 0), 0);
  const totalRow = `Grand Total,,,,${grandTotal.toFixed(2)}`;

  return [header, ...rows, totalRow].join('\n');
}

/**
 * Export CSV to device and open share dialog.
 *
 * @param {string} csvString
 * @param {string} filename
 * @returns {{ success: boolean, error?: string }}
 */
export async function exportWageCSV(csvString, filename) {
  try {
    const fileUri = `${FileSystem.documentDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(fileUri, csvString, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Wages',
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function escapeCSV(value) {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
