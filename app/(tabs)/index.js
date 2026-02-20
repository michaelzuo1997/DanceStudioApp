import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { supabase } from '../../src/lib/supabase';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';
import { InstructorModal } from '../../src/components/InstructorModal';
import { StudioModal } from '../../src/components/StudioModal';

export default function HomeScreen() {
  const { user, userInfo, refreshUserInfo } = useAuth();
  const { t, locale } = useLanguage();
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [userBundles, setUserBundles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [selectedStudio, setSelectedStudio] = useState(null);

  const balance = userInfo?.current_balance ?? 0;
  const displayName = userInfo?.name ?? userInfo?.full_name ?? user?.user_metadata?.full_name ?? 'Dancer';

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

    const enrolledClasses = (timetableRows ?? [])
      .map((c) => ({
        ...c,
        enrollment_id: enrollmentByTimetableId.get(String(c.id)) || null,
      }))
      .filter(c => c && c.class_date && new Date(c.class_date) >= new Date())
      .sort((a, b) => new Date(a.class_date) - new Date(b.class_date))
      .slice(0, 5);

    setUpcomingClasses(enrolledClasses);
    setEnrolledCount(enrollments?.length ?? 0);

    // Fetch user bundles
    const { data: bundles } = await supabase
      .from('user_bundles')
      .select(`
        *,
        class_categories (name_en, name_zh)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .gt('classes_remaining', 0)
      .gt('expires_at', new Date().toISOString());

    setUserBundles(bundles || []);

    await refreshUserInfo();
  }, [user, refreshUserInfo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // Calculate total bundle classes
  const totalBundleClasses = userBundles.reduce((sum, b) => sum + (b.classes_remaining || 0), 0);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        
        <View style={styles.header}>
          <Text style={styles.welcomeLabel}>{t('home.welcomeBack')}</Text>
          <Text style={styles.welcomeName} numberOfLines={1}>{String(displayName)}</Text>
        </View>

      <View style={styles.statsRow}>
        <TouchableOpacity
          style={[styles.statCard, styles.balanceCard]}
          onPress={() => router.push('/(tabs)/balance')}
          activeOpacity={0.8}
        >
          <View>
            <Text style={[styles.statLabel, styles.whiteText]}>{t('home.currentBalance')}</Text>
            <Text style={[styles.statValue, styles.whiteText]}>A${Number(balance).toFixed(2)}</Text>
          </View>
          <View style={styles.statAction}>
             <Text style={styles.statActionText}>{t('common.topUp')}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => router.push('/(tabs)/calendar')}
          activeOpacity={0.8}
        >
           <View>
            <Text style={styles.statLabel}>{t('home.activeClasses')}</Text>
            <Text style={styles.statValue}>{enrolledCount}</Text>
          </View>
          <View style={styles.statAction}>
             <Text style={styles.statActionText}>{t('home.seeFullCalendar')}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* My Bundles Card */}
      {userBundles.length > 0 && (
        <TouchableOpacity
          style={styles.bundlesCard}
          onPress={() => router.push('/(tabs)/classes/bundles')}
          activeOpacity={0.8}
        >
          <View style={styles.bundlesHeader}>
            <Text style={styles.bundlesTitle}>🎫 {t('home.myBundles')}</Text>
            <Text style={styles.bundlesArrow}>→</Text>
          </View>
          <View style={styles.bundlesList}>
            {userBundles.slice(0, 3).map((b, idx) => (
              <View key={b.id || idx} style={styles.bundleItem}>
                <Text style={styles.bundleCount}>{b.classes_remaining}</Text>
                <Text style={styles.bundleLabel}>
                  {b.class_categories 
                    ? (locale === 'zh' ? b.class_categories.name_zh : b.class_categories.name_en)
                    : (locale === 'zh' ? '节课' : 'classes')}
                </Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.yourSchedule')}</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/calendar')}>
            <Text style={styles.seeAllText}>{t('home.seeFullCalendar')}</Text>
          </TouchableOpacity>
        </View>

        {upcomingClasses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t('home.noUpcoming')}</Text>
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={() => router.push('/(tabs)/classes')}
            >
              <Text style={styles.browseButtonText}>{t('home.browseClasses')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.classList}>
            {upcomingClasses.map((c) => {
              const startTime = c.class_date && c.start_time
                ? new Date(`${c.class_date}T${c.start_time}`)
                : null;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={styles.classItem}
                  onPress={() => router.push('/(tabs)/calendar')}
                  activeOpacity={0.7}
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
                    {typeof c.price_per_class !== 'undefined' && (
                      <Text style={styles.classSubMeta}>A${Number(c.price_per_class || 0).toFixed(0)}</Text>
                    )}
                  </View>
                  
                  <View style={styles.classActions}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={async () => {
                        if (!c.enrollment_id) return;
                        const confirmMsg = t('classes.cancelConfirm') || 'Cancel this class?';
                        const shouldCancel = typeof window !== 'undefined'
                          ? window.confirm(confirmMsg)
                          : true;
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
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
      </ScrollView>
      <InstructorModal instructor={selectedInstructor} onClose={() => setSelectedInstructor(null)} />
      <StudioModal studio={selectedStudio} onClose={() => setSelectedStudio(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  content: { 
    padding: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  header: { 
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xs,
  },
  welcomeLabel: { 
    fontSize: fontSize.md, 
    color: colors.textSecondary,
    marginBottom: 4,
  },
  welcomeName: { 
    fontSize: fontSize.xxl, 
    fontWeight: '700', 
    color: colors.text,
    letterSpacing: -0.5,
  },
  statsRow: { 
    flexDirection: 'row', 
    gap: spacing.md, 
    marginBottom: spacing.lg 
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    justifyContent: 'space-between',
    minHeight: 120,
    ...colors.shadows.sm,
  },
  balanceCard: {
    backgroundColor: colors.primary,
    ...colors.shadows.lg,
  },
  whiteText: {
    color: colors.white,
  },
  statLabel: { 
    fontSize: fontSize.xs, 
    color: colors.textSecondary, 
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  statValue: { 
    fontSize: fontSize.xxl, 
    fontWeight: '700', 
    color: colors.text,
  },
  statAction: {
    marginTop: spacing.md,
  },
  statActionText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.accent,
  },
  bundlesCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...colors.shadows.soft,
  },
  bundlesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  bundlesTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  bundlesArrow: {
    fontSize: fontSize.lg,
    color: colors.accent,
  },
  bundlesList: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  bundleItem: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  bundleCount: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.accent,
  },
  bundleLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  section: {
    marginTop: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: { 
    fontSize: fontSize.xl, 
    fontWeight: '700', 
    color: colors.text,
    letterSpacing: -0.5,
  },
  seeAllText: { 
    fontSize: fontSize.sm, 
    color: colors.accent, 
    fontWeight: '600' 
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
    fontWeight: '600',
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
    fontWeight: '700',
    color: colors.text,
  },
  dateMonth: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  classMeta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
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
    fontWeight: '600',
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
    fontWeight: '600',
    color: colors.white,
  },
});
