import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { supabase } from '../../src/lib/supabase';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';
import { InstructorModal } from '../../src/components/InstructorModal';
import { StudioModal } from '../../src/components/StudioModal';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function CalendarScreen() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const [monthCursor, setMonthCursor] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [classesByDate, setClassesByDate] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [selectedStudio, setSelectedStudio] = useState(null);

  const fetchData = useCallback(async () => {
    if (!user) return;

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('id, timetable_id')
      .eq('user_id', user.id)
      .eq('status', 'active');

    const timetableIds = (enrollments ?? [])
      .map((e) => e.timetable_id)
      .filter((id) => Boolean(id));

    let timetableRows = [];
    if (timetableIds.length > 0) {
      ({ data: timetableRows } = await supabase
        .from('class_timetable')
        .select(`
          id, class_date, start_time, duration_minutes, price_per_class,
          instructors (id, name, photo_url, bio, experience, awards, contact_email, contact_phone),
          studios (id, name, address, notes),
          class_categories (name_en, name_zh)
        `)
        .in('id', timetableIds));
    }

    const enrollmentByTimetableId = new Map(
      (enrollments ?? []).map((e) => [String(e.timetable_id), e.id])
    );

    const start = startOfMonth(monthCursor);
    const end = endOfMonth(monthCursor);
    const mapped = {};

    (timetableRows ?? []).forEach((c) => {
      if (!c.class_date) return;
      const dt = new Date(c.class_date);
      if (dt < start || dt > end) return;
      const key = formatDateKey(dt);
      if (!mapped[key]) mapped[key] = [];
      mapped[key].push({
        ...c,
        enrollment_id: enrollmentByTimetableId.get(String(c.id)) || null,
      });
    });

    Object.keys(mapped).forEach((k) => {
      mapped[k].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    });

    setClassesByDate(mapped);
  }, [user, monthCursor]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      const now = new Date();
      setMonthCursor(startOfMonth(now));
      setSelectedDate(now);
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const weeks = useMemo(() => {
    const first = startOfMonth(monthCursor);
    const daysInMonth = endOfMonth(monthCursor).getDate();
    const startDay = first.getDay();
    const rows = [];
    let day = 1 - startDay;
    for (let r = 0; r < 6; r++) {
      const row = [];
      for (let c = 0; c < 7; c++) {
        const date = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), day);
        row.push(date);
        day += 1;
      }
      rows.push(row);
    }
    // Ensure we only display enough weeks for the month
    return rows.filter((row) => row.some((d) => d.getMonth() === monthCursor.getMonth() && d.getDate() <= daysInMonth));
  }, [monthCursor]);

  const selectedKey = formatDateKey(selectedDate);
  const selectedClasses = classesByDate[selectedKey] || [];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setMonthCursor(startOfMonth(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1)))}>
            <Text style={styles.navText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {monthCursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={() => setMonthCursor(startOfMonth(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1)))}>
            <Text style={styles.navText}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.weekHeader}>
          {DAYS.map((d) => (
            <Text key={d} style={styles.weekDay}>{d}</Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {weeks.map((row, idx) => (
            <View key={idx} style={styles.weekRow}>
              {row.map((date) => {
                const inMonth = date.getMonth() === monthCursor.getMonth();
                const key = formatDateKey(date);
                const hasClasses = (classesByDate[key] || []).length > 0;
                const isSelected = key === selectedKey;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.dayCell, !inMonth && styles.dayCellMuted, isSelected && styles.dayCellSelected]}
                    onPress={() => setSelectedDate(date)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dayText, !inMonth && styles.dayTextMuted, isSelected && styles.dayTextSelected]}>
                      {date.getDate()}
                    </Text>
                    {hasClasses && <View style={styles.dot} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.yourSchedule')}</Text>
          {selectedClasses.length === 0 ? (
            <Text style={styles.emptyText}>{t('classes.noClassesDate')}</Text>
          ) : (
            selectedClasses.map((c) => {
              const startTime = c.class_date && c.start_time
                ? new Date(`${c.class_date}T${c.start_time}`)
                : null;
              return (
                <View key={c.id ?? c.class_id} style={styles.classItem}>
                  <View style={styles.classInfo}>
                    <Text style={styles.className} numberOfLines={1}>
                      {c.class_categories
                        ? (locale === 'zh' ? c.class_categories.name_zh : c.class_categories.name_en)
                        : (c.name || 'Class Session')}
                    </Text>
                    <View style={styles.classMetaRow}>
                      <Text style={styles.classMeta}>
                        {startTime?.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                      </Text>
                      <Text style={styles.classMetaSeparator}>{'\u2022'}</Text>
                      <TouchableOpacity onPress={() => setSelectedInstructor(c.instructors || null)}>
                        <Text style={styles.classMetaLink}>{c.instructors?.name || 'Staff'}</Text>
                      </TouchableOpacity>
                    </View>
                    {c.studios?.name && (
                      <TouchableOpacity onPress={() => setSelectedStudio(c.studios)}>
                        <Text style={styles.classSubMeta}>{c.studios.name}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={async () => {
                      if (!c.enrollment_id) return;
                      const confirmMsg = t('classes.cancelConfirm') || 'Cancel this class?';
                      const shouldCancel = typeof window !== 'undefined' ? window.confirm(confirmMsg) : true;
                      if (!shouldCancel) return;
                      const { data: cancelRes, error: cancelErr } = await supabase
                        .rpc('cancel_enrollment', { p_enrollment_id: c.enrollment_id });
                      if (cancelErr || cancelRes?.[0]?.ok === false) {
                        const msg = cancelErr?.message || cancelRes?.[0]?.message || t('classes.cancelFailed') || 'Cancel failed';
                        if (typeof window !== 'undefined') window.alert(msg);
                        return;
                      }
                      if (typeof window !== 'undefined') {
                        window.alert(t('classes.cancelSuccess') || 'Cancelled. Refund will be applied if eligible.');
                      }
                      await fetchData();
                    }}
                  >
                    <Text style={styles.cancelButtonText}>{t('classes.cancelClass')}</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
      <InstructorModal instructor={selectedInstructor} onClose={() => setSelectedInstructor(null)} />
      <StudioModal studio={selectedStudio} onClose={() => setSelectedStudio(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  navText: {
    fontSize: fontSize.xl,
    color: colors.accent,
    fontWeight: '600',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  weekDay: {
    width: '14.2%',
    textAlign: 'center',
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  calendarGrid: {
    marginBottom: spacing.xl,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  dayCell: {
    width: '14.2%',
    height: 58,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellMuted: {
    backgroundColor: colors.surfaceAlt,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '600',
  },
  dayTextMuted: {
    color: colors.textTertiary,
  },
  dayTextSelected: {
    color: colors.white,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginTop: 2,
  },
  section: {
    gap: spacing.sm,
    marginTop: spacing.xxl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  classItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...colors.shadows.sm,
  },
  classInfo: { flex: 1 },
  className: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  classMeta: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  classMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  classMetaSeparator: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  classMetaLink: {
    fontSize: fontSize.sm,
    color: colors.accent,
    fontWeight: '600',
  },
  classSubMeta: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: 2 },
  cancelButton: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginLeft: spacing.md,
  },
  cancelButtonText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.white,
  },
});
