import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';
import { useLanguage } from '../../../src/context/LanguageContext';
import { useCampus } from '../../../src/context/CampusContext';
import { supabase } from '../../../src/lib/supabase';
import { CampusSelector } from '../../../src/components/CampusSelector';
import { CategoryDropdown } from '../../../src/components/CategoryDropdown';
import { DayOfWeekSelector } from '../../../src/components/DayOfWeekSelector';
import { FilterModal } from '../../../src/components/FilterModal';
import { ClassCartFloatingButton } from '../../../src/components/ClassCartFloatingButton';
import { colors, spacing, fontSize, borderRadius, fontFamily } from '../../../src/constants/theme';

export default function ClassesScreen() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const { selectedCampus } = useCampus();

  const [categories, setCategories] = useState([]);
  const [classes, setClasses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [advancedFilters, setAdvancedFilters] = useState({
    audience: null,
    minTime: null,
    maxTime: null,
  });
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fetch categories
    const { data: catData, error: catErr } = await supabase
      .from('class_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (catErr) {
      console.error('[ClassesScreen] categories fetch failed:', catErr.message);
    } else if (catData) {
      setCategories(catData);
    }

    // Fetch classes from timetable
    const todayStr = new Date().toISOString().slice(0, 10);
    let query = supabase
      .from('class_timetable')
      .select(`
        id, class_date, start_time, duration_minutes, price_per_class,
        campus_id, day_of_week, audience,
        class_categories (id, key, name_en, name_zh),
        instructors (id, name),
        studios (id, name)
      `)
      .eq('is_active', true)
      .gte('class_date', todayStr)
      .order('start_time', { ascending: true })
      .order('class_date', { ascending: true })
      .limit(200);

    if (selectedCampus) {
      query = query.eq('campus_id', selectedCampus);
    }

    const { data: classData, error: classErr } = await query;
    if (classErr) {
      console.error('[ClassesScreen] timetable fetch failed:', classErr.message);
    }
    setClasses(classData ?? []);

    // Fetch enrolled timetable IDs
    if (user) {
      const { data: enrollments, error: enrollErr } = await supabase
        .from('enrollments')
        .select('timetable_id')
        .eq('user_id', user.id)
        .eq('status', 'active');
      if (enrollErr) {
        console.error('[ClassesScreen] enrollments fetch failed:', enrollErr.message);
      }
      setEnrolledIds(new Set((enrollments ?? []).map((e) => String(e.timetable_id))));
    }

    setLoading(false);
  }, [selectedCampus, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      if (selectedCategoryId && c.class_categories?.id !== selectedCategoryId) return false;
      if (selectedDay !== null && c.day_of_week !== selectedDay) return false;
      if (advancedFilters.audience && c.audience !== null && c.audience !== advancedFilters.audience) return false;
      if (advancedFilters.minTime && c.start_time < advancedFilters.minTime) return false;
      if (advancedFilters.maxTime && c.start_time > advancedFilters.maxTime) return false;
      return true;
    });
  }, [classes, selectedCategoryId, selectedDay, advancedFilters]);

  const activeFilterCount = [
    advancedFilters.audience,
    advancedFilters.minTime,
  ].filter(Boolean).length;

  const handleAddToCart = (classItem) => {
    router.push({
      pathname: `/(tabs)/classes/${classItem.class_categories?.key || classItem.class_categories?.id || 'browse'}`,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('screens.classes')}</Text>
        </View>

        {/* Campus Selector */}
        <CampusSelector />

        {/* Category Dropdown */}
        <CategoryDropdown
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelect={setSelectedCategoryId}
        />

        {/* Day of Week Selector */}
        <DayOfWeekSelector
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
        />

        {/* Filter Button */}
        <Pressable
          style={({ pressed }) => [styles.filterRow, pressed && { opacity: 0.85 }]}
          onPress={() => setFilterModalVisible(true)}
          testID="filter-button"
        >
          <Text style={styles.filterLabel}>{t('classes.filters')}</Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>

        {/* Class List */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
        ) : filteredClasses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t('classes.noClasses')}</Text>
          </View>
        ) : (
          <View style={styles.classList}>
            {filteredClasses.map((c) => {
              const categoryName = c.class_categories
                ? (locale === 'zh' ? c.class_categories.name_zh : c.class_categories.name_en)
                : '';
              const isEnrolled = enrolledIds.has(String(c.id));
              const timeStr = c.start_time?.slice(0, 5) || '';
              const dateStr = c.class_date || '';

              return (
                <View key={c.id} style={styles.classCard}>
                  <View style={styles.classTimeCol}>
                    <Text style={styles.classTime}>{timeStr}</Text>
                    <Text style={styles.classDate}>{dateStr}</Text>
                  </View>
                  <View style={styles.classInfoCol}>
                    <Text style={styles.className} numberOfLines={1}>{categoryName}</Text>
                    <Text style={styles.classMeta}>
                      {c.instructors?.name || 'Staff'}
                      {c.studios?.name ? ` · ${c.studios.name}` : ''}
                    </Text>
                    <Text style={styles.classDetails}>
                      {c.duration_minutes || 60}min
                      {c.audience ? ` · ${c.audience === 'adult' ? t('classes.adult') : t('classes.children')}` : ''}
                    </Text>
                  </View>
                  <View style={styles.classActionCol}>
                    <Text style={styles.classPrice}>
                      A${Number(c.price_per_class || 20).toFixed(0)}
                    </Text>
                    {isEnrolled ? (
                      <View style={styles.enrolledBadge}>
                        <Text style={styles.enrolledText}>{t('classes.enrolled')}</Text>
                      </View>
                    ) : (
                      <Pressable
                        style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.85 }]}
                        onPress={() => handleAddToCart(c)}
                      >
                        <Text style={styles.addButtonText}>{t('classes.bookClass')}</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Action Cards */}
        <View style={styles.actionSection}>
          <Pressable
            style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.85 }]}
            onPress={() => router.push('/(tabs)/classes/bundles')}
          >
            <View style={styles.actionCardContent}>
              <Text style={styles.actionCardIcon}>🎫</Text>
              <View style={styles.actionCardText}>
                <Text style={styles.actionCardTitle}>{t('screens.bundles')}</Text>
              </View>
              <Text style={styles.actionCardArrow}>→</Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.85 }]}
            onPress={() => router.push('/(tabs)/classes/private')}
          >
            <View style={styles.actionCardContent}>
              <Text style={styles.actionCardIcon}>👤</Text>
              <View style={styles.actionCardText}>
                <Text style={styles.actionCardTitle}>{t('screens.privateTuition')}</Text>
              </View>
              <Text style={styles.actionCardArrow}>→</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={advancedFilters}
        onApply={setAdvancedFilters}
      />
      <ClassCartFloatingButton />
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
    paddingBottom: spacing.xxxl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontFamily: fontFamily.headingBold,
    color: colors.text,
    letterSpacing: -0.5,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  filterLabel: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.accent,
  },
  filterBadge: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
    marginLeft: spacing.xs,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.white,
  },
  loader: {
    marginVertical: spacing.xxxl,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.lg,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textSecondary,
  },
  classList: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...colors.shadows.sm,
  },
  classTimeCol: {
    alignItems: 'center',
    minWidth: 56,
    marginRight: spacing.md,
  },
  classTime: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
  },
  classDate: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  classInfoCol: {
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
    fontFamily: fontFamily.bodyRegular,
    color: colors.textSecondary,
  },
  classDetails: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  classActionCol: {
    alignItems: 'flex-end',
    paddingLeft: spacing.sm,
  },
  classPrice: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  enrolledBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  enrolledText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.white,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  addButtonText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.white,
  },
  actionSection: {
    gap: spacing.md,
  },
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    ...colors.shadows.soft,
    overflow: 'hidden',
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  actionCardIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  actionCardText: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
  },
  actionCardArrow: {
    fontSize: fontSize.xl,
    color: colors.accent,
    fontFamily: fontFamily.bodySemiBold,
  },
});
