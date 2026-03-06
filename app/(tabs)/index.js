import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  StyleSheet,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { useCampus } from '../../src/context/CampusContext';
import { supabase } from '../../src/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius, fontFamily, typography } from '../../src/constants/theme';
import { CampusSelectorDropdown } from '../../src/components/CampusSelectorDropdown';
import { NoticeboardCarousel } from '../../src/components/NoticeboardCarousel';
import { NoticeboardExpandModal } from '../../src/components/NoticeboardExpandModal';
import { UpcomingWeekView } from '../../src/components/UpcomingWeekView';
import { InstructorModal } from '../../src/components/InstructorModal';
import { StudioModal } from '../../src/components/StudioModal';

export default function HomeScreen() {
  const { user, userInfo, refreshUserInfo } = useAuth();
  const { t, locale } = useLanguage();
  const { selectedCampus } = useCampus();
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [notices, setNotices] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [selectedStudio, setSelectedStudio] = useState(null);
  const [selectedNotice, setSelectedNotice] = useState(null);

  const displayName = userInfo?.name ?? userInfo?.full_name ?? user?.user_metadata?.full_name ?? 'Dancer';

  const fetchData = useCallback(async () => {
    if (!user) return;

    // Fetch enrolled classes
    const { data: enrollments, error: enrollmentErr } = await supabase
      .from('enrollments')
      .select('id, timetable_id')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (enrollmentErr) {
      console.error('[HomeScreen] enrollments fetch failed:', enrollmentErr.message);
      return;
    }

    const timetableIds = (enrollments ?? [])
      .map((e) => e.timetable_id)
      .filter(Boolean);

    let timetableRows = [];
    if (timetableIds.length > 0) {
      const { data: ttData, error: ttErr } = await supabase
        .from('class_timetable')
        .select(`
          id, class_date, start_time, duration_minutes, price_per_class, campus_id,
          instructors (id, name, photo_url, bio, experience, awards, contact_email, contact_phone),
          studios (id, name, address, notes),
          class_categories (name_en, name_zh)
        `)
        .in('id', timetableIds);
      if (ttErr) {
        console.error('[HomeScreen] timetable fetch failed:', ttErr.message);
      }
      timetableRows = ttData ?? [];
    }

    const enrollmentMap = new Map(
      (enrollments ?? []).map((e) => [String(e.timetable_id), e.id])
    );

    const todayStr = new Date().toISOString().slice(0, 10);
    const enrolled = timetableRows
      .map((c) => ({
        ...c,
        enrollment_id: enrollmentMap.get(String(c.id)) || null,
      }))
      .filter((c) => c.class_date && c.class_date >= todayStr)
      .sort((a, b) => (a.class_date > b.class_date ? 1 : a.class_date < b.class_date ? -1 : 0));

    setEnrolledClasses(enrolled);
    await refreshUserInfo();
  }, [user, refreshUserInfo]);

  const fetchNotices = useCallback(async () => {
    const now = new Date().toISOString();
    let query = supabase
      .from('noticeboard')
      .select('*')
      .eq('is_active', true)
      .lte('starts_at', now)
      .order('priority', { ascending: false })
      .limit(10);

    if (selectedCampus) {
      query = query.or(`campus_id.is.null,campus_id.eq.${selectedCampus}`);
    }

    const { data, error: noticeErr } = await query;
    if (noticeErr) {
      console.error('[HomeScreen] noticeboard fetch failed:', noticeErr.message);
      setNotices([]);
      return;
    }
    const active = (data ?? []).filter(
      (n) => !n.expires_at || new Date(n.expires_at) >= new Date()
    );
    setNotices(active);
  }, [selectedCampus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), fetchNotices()]);
    setRefreshing(false);
  }, [fetchData, fetchNotices]);

  const handleCancel = async (enrollmentId) => {
    if (!enrollmentId) return;
    const confirmMsg = t('classes.cancelConfirm') || 'Cancel this class?';

    const doCancel = async () => {
      const { data: cancelRes, error: cancelErr } = await supabase
        .rpc('cancel_enrollment', { p_enrollment_id: enrollmentId });

      if (cancelErr || cancelRes?.[0]?.ok === false) {
        const msg = cancelErr?.message || cancelRes?.[0]?.message || t('classes.cancelFailed') || 'Cancel failed';
        Alert.alert(t('common.error') || 'Error', msg);
        return;
      }
      Alert.alert(
        t('common.success') || 'Success',
        t('classes.cancelSuccess') || 'Cancelled. Refund will be applied if eligible.'
      );
      await fetchData();
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(confirmMsg)) {
        await doCancel();
      }
    } else {
      Alert.alert(
        t('classes.cancelClass') || 'Cancel Class',
        confirmMsg,
        [
          { text: t('common.back') || 'Back', style: 'cancel' },
          { text: t('common.confirm') || 'Confirm', style: 'destructive', onPress: doCancel },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

        {/* Header: Welcome + Campus/Calendar */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeLabel}>{t('home.welcomeBack')}</Text>
            <Text style={styles.welcomeName} numberOfLines={1}>{String(displayName)}</Text>
          </View>
          <View style={styles.headerRight}>
            <CampusSelectorDropdown />
            <Pressable
              style={({ pressed }) => [styles.calendarIcon, pressed && { opacity: 0.7 }]}
              onPress={() => router.push('/(tabs)/calendar')}
              testID="calendar-chip"
            >
              <Ionicons name="calendar-outline" size={22} color={colors.accent} />
            </Pressable>
          </View>
        </View>

        {/* Noticeboard Carousel */}
        {notices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('home.notices')}</Text>
            <NoticeboardCarousel
              notices={notices}
              onPressNotice={setSelectedNotice}
            />
          </View>
        )}

        {/* My Enrolled Classes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.myClasses')}</Text>

          {enrolledClasses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{t('home.noUpcoming')}</Text>
              <Pressable
                style={({ pressed }) => [styles.browseButton, pressed && { opacity: 0.85 }]}
                onPress={() => router.push('/(tabs)/classes')}
              >
                <Text style={styles.browseButtonText}>{t('home.browseClasses')}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.classList}>
              {enrolledClasses.map((c) => {
                const startTime = c.class_date && c.start_time
                  ? new Date(`${c.class_date}T${c.start_time}`)
                  : null;
                return (
                  <Pressable
                    key={c.id}
                    style={({ pressed }) => [styles.classItem, pressed && { opacity: 0.85 }]}
                    onPress={() => router.push('/(tabs)/calendar')}
                  >
                    <View style={styles.dateBox}>
                      <Text style={styles.dateDay}>{startTime?.getDate()}</Text>
                      <Text style={styles.dateMonth}>
                        {startTime?.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.classInfo}>
                      <Text style={styles.className} numberOfLines={1}>
                        {c.class_categories
                          ? (locale === 'zh' ? c.class_categories.name_zh : c.class_categories.name_en)
                          : 'Class Session'}
                      </Text>
                      <View style={styles.classMetaRow}>
                        <Text style={styles.classMeta}>
                          {startTime?.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                        </Text>
                        <Text style={styles.classMetaSeparator}>{'\u2022'}</Text>
                        <Pressable style={({ pressed }) => [pressed && { opacity: 0.85 }]} onPress={() => setSelectedInstructor(c.instructors || null)}>
                          <Text style={styles.classMetaLink}>{c.instructors?.name || 'Staff'}</Text>
                        </Pressable>
                      </View>
                      {c.studios?.name && (
                        <Pressable style={({ pressed }) => [pressed && { opacity: 0.85 }]} onPress={() => setSelectedStudio(c.studios)}>
                          <Text style={styles.classSubMeta}>{c.studios.name}</Text>
                        </Pressable>
                      )}
                    </View>

                    <View style={styles.classActions}>
                      <Pressable
                        style={({ pressed }) => [styles.cancelButton, pressed && { opacity: 0.85 }]}
                        onPress={() => handleCancel(c.enrollment_id)}
                      >
                        <Text style={styles.cancelButtonText}>{t('classes.cancelClass')}</Text>
                      </Pressable>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Upcoming This Week */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.upcomingThisWeek')}</Text>
          <UpcomingWeekView />
        </View>

      </ScrollView>
      <InstructorModal instructor={selectedInstructor} onClose={() => setSelectedInstructor(null)} />
      <StudioModal studio={selectedStudio} onClose={() => setSelectedStudio(null)} />
      <NoticeboardExpandModal
        visible={!!selectedNotice}
        notice={selectedNotice}
        notices={notices}
        onClose={() => setSelectedNotice(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  calendarIcon: {
    padding: spacing.xs,
  },
  welcomeLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontFamily: fontFamily.bodyRegular,
    marginBottom: 4,
  },
  welcomeName: {
    fontSize: fontSize.xxl,
    fontFamily: fontFamily.headingBold,
    color: colors.text,
    letterSpacing: -0.5,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.headingSemiBold,
    color: colors.text,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  noticeList: {
    paddingHorizontal: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.lg,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontFamily: fontFamily.bodyRegular,
    marginBottom: spacing.lg,
  },
  browseButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  browseButtonText: {
    color: colors.white,
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.sm,
  },
  classList: {
    gap: spacing.md,
  },
  classItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...colors.shadows.sm,
  },
  dateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginRight: spacing.md,
    minWidth: 50,
  },
  dateDay: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
  },
  dateMonth: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bodyMedium,
    color: colors.textSecondary,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
    marginBottom: 2,
  },
  classMeta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontFamily: fontFamily.bodyRegular,
  },
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
    fontFamily: fontFamily.bodySemiBold,
  },
  classSubMeta: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  classActions: {
    paddingLeft: spacing.md,
    alignItems: 'flex-end',
  },
  cancelButton: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  cancelButtonText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.white,
  },
});
