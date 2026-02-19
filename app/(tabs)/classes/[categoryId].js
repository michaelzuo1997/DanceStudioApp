import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';
import { useLanguage } from '../../../src/context/LanguageContext';
import { useCart } from '../../../src/context/CartContext';
import { supabase } from '../../../src/lib/supabase';
import { Button } from '../../../src/components/Button';
import { colors, spacing, fontSize, borderRadius } from '../../../src/constants/theme';

// Category mapping
const CATEGORY_MAP = {
  'chinese_classical': { name_en: 'Chinese Classical', name_zh: '中国舞', icon: '💃' },
  'ballet': { name_en: 'Ballet', name_zh: '芭蕾', icon: '🩰' },
  'hip_hop': { name_en: 'Hip Hop', name_zh: '街舞', icon: '🎤' },
  'kpop_youth': { name_en: 'Youth K-pop', name_zh: '青少年 K-pop', icon: '🎵' },
  'korean_dance': { name_en: 'Korean Dance', name_zh: '韩舞', icon: '🌟' },
  'miscellaneous': { name_en: 'Miscellaneous', name_zh: '其他', icon: '✨' },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CategoryDetailScreen() {
  const { categoryId } = useLocalSearchParams();
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const { addItem } = useCart();
  
  const [category, setCategory] = useState(null);
  const [timetable, setTimetable] = useState([]);
  const [classes, setClasses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [audience, setAudience] = useState('adult'); // 'adult' | 'children'
  const [duration, setDuration] = useState(null); // null | 60 | 90

  const fetchData = useCallback(async () => {
    // Fetch category from database or use default
    const { data: categoryData } = await supabase
      .from('class_categories')
      .select('*')
      .or(`key.eq.${categoryId},id.eq.${categoryId}`)
      .maybeSingle();
    
    if (categoryData) {
      setCategory(categoryData);
    } else {
      setCategory(CATEGORY_MAP[categoryId] || { 
        key: categoryId, 
        name_en: categoryId, 
        name_zh: categoryId 
      });
    }

    const catId = categoryData?.id;

    // Fetch timetable (category_id is UUID; only filter when we have it)
    let timetableQuery = supabase
      .from('class_timetable')
      .select('*')
      .eq('is_active', true)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });
    if (catId) {
      timetableQuery = timetableQuery.eq('category_id', catId);
    }
    const { data: timetableData } = await timetableQuery;
    setTimetable(timetableData || []);

    // Fetch upcoming classes: match by category_id (UUID) or class_type (key) for DBs where category_id may be null
    let classesQuery = supabase
      .from('CLASSES')
      .select('*')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(20);
    if (catId) {
      classesQuery = classesQuery.or(`category_id.eq.${catId},class_type.eq.${categoryId}`);
    } else {
      classesQuery = classesQuery.eq('class_type', categoryId);
    }
    const { data: classesData } = await classesQuery;
    setClasses(classesData || []);

    // Fetch enrollments
    if (user) {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('class_id')
        .eq('user_id', user.id);
      setEnrolledIds(new Set((enrollments || []).map(e => String(e.class_id))));
    }
  }, [categoryId, user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // Filter timetable by audience and duration
  const filteredTimetable = useMemo(() => {
    return timetable.filter(item => {
      if (audience && item.audience && item.audience !== audience) return false;
      if (duration && item.duration_minutes !== duration) return false;
      return true;
    });
  }, [timetable, audience, duration]);

  // Group timetable by day
  const timetableByDay = useMemo(() => {
    const grouped = {};
    filteredTimetable.forEach(item => {
      const day = item.day_of_week;
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(item);
    });
    return grouped;
  }, [filteredTimetable]);

  const getCategoryName = () => {
    if (!category) return categoryId;
    return locale === 'zh' ? (category.name_zh || category.name_en) : (category.name_en || category.name_zh);
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleBookClass = (classItem) => {
    addItem({
      id: String(classItem.id),
      name: classItem.name,
      class_type: getCategoryName(),
      start_time: classItem.start_time,
      end_time: classItem.end_time,
      instructor: classItem.instructor,
      room: classItem.room,
      price: Number(classItem.price || classItem.cost || 0),
    });
  };

  const handleBookTimetable = (item) => {
    // For timetable items, we'd need to create a class instance
    // For now, just show an alert or navigate to booking
    alert(`Book ${item.instructor}'s class at ${formatTime(item.start_time)}`);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{getCategoryName()}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Audience Toggle */}
        {categoryId !== 'miscellaneous' && (
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>{t('classes.selectAudience')}</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, audience === 'adult' && styles.toggleActive]}
                onPress={() => setAudience('adult')}
              >
                <Text style={[styles.toggleText, audience === 'adult' && styles.toggleTextActive]}>
                  {t('classes.adult')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, audience === 'children' && styles.toggleActive]}
                onPress={() => setAudience('children')}
              >
                <Text style={[styles.toggleText, audience === 'children' && styles.toggleTextActive]}>
                  {t('classes.children')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Duration Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>{t('classes.selectDuration')}</Text>
          <View style={styles.pillContainer}>
            <TouchableOpacity
              style={[styles.pill, duration === null && styles.pillActive]}
              onPress={() => setDuration(null)}
            >
              <Text style={[styles.pillText, duration === null && styles.pillTextActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pill, duration === 60 && styles.pillActive]}
              onPress={() => setDuration(60)}
            >
              <Text style={[styles.pillText, duration === 60 && styles.pillTextActive]}>{t('classes.oneHour')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pill, duration === 90 && styles.pillActive]}
              onPress={() => setDuration(90)}
            >
              <Text style={[styles.pillText, duration === 90 && styles.pillTextActive]}>{t('classes.oneHalfHour')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Timetable */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('classes.timetable')}</Text>
          {Object.keys(timetableByDay).length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{t('classes.noClasses')}</Text>
            </View>
          ) : (
            Object.entries(timetableByDay).map(([day, items]) => (
              <View key={day} style={styles.daySection}>
                <Text style={styles.dayTitle}>{DAYS[day]}</Text>
                {items.map((item, idx) => (
                  <View key={item.id || idx} style={styles.timetableItem}>
                    <View style={styles.timetimeContainer}>
                      <Text style={styles.timeText}>{formatTime(item.start_time)}</Text>
                      <Text style={styles.durationText}>{item.duration_minutes} min</Text>
                    </View>
                    <View style={styles.timeInfo}>
                      <Text style={styles.instructorText}>{item.instructor}</Text>
                      <Text style={styles.roomText}>{item.room}</Text>
                    </View>
                    <View style={styles.timePrice}>
                      <Text style={styles.priceText}>A${Number(item.price_per_class || 0).toFixed(0)}</Text>
                      <Button
                        title={t('common.book')}
                        size="sm"
                        variant="secondary"
                        onPress={() => handleBookTimetable(item)}
                      />
                    </View>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>

        {/* Upcoming Classes */}
        {classes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('classes.upcoming')}</Text>
            {classes.map((c) => {
              const classId = c.id ?? c.class_id;
              const isEnrolled = enrolledIds.has(String(classId));
              const startTime = c.start_time ? new Date(c.start_time) : null;
              const displayName = c.name || c.duration_name || c.class_type || 'Dance Class';
              
              return (
                <View key={classId} style={styles.classItem}>
                  <View style={styles.classInfo}>
                    <Text style={styles.className}>{displayName}</Text>
                    <Text style={styles.classMeta}>
                      {startTime?.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      {' at '}
                      {startTime?.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                    </Text>
                    {c.instructor && <Text style={styles.classInstructor}>with {c.instructor}</Text>}
                  </View>
                  <View style={styles.classActions}>
                    <Text style={styles.classPrice}>A${Number(c.price || c.cost || 0).toFixed(0)}</Text>
                    {isEnrolled ? (
                      <View style={styles.enrolledBadge}>
                        <Text style={styles.enrolledText}>{t('classes.enrolled')}</Text>
                      </View>
                    ) : (
                      <Button
                        title={t('common.book')}
                        size="sm"
                        variant="secondary"
                        onPress={() => handleBookClass(c)}
                      />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    padding: spacing.sm,
  },
  backText: {
    fontSize: fontSize.xl,
    color: colors.text,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: { 
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  filterSection: {
    marginBottom: spacing.lg,
  },
  filterLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.full,
    padding: 2,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.full,
  },
  toggleActive: {
    backgroundColor: colors.surface,
    ...colors.shadows.sm,
  },
  toggleText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.text,
  },
  pillContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceAlt,
  },
  pillActive: {
    backgroundColor: colors.primary,
  },
  pillText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: colors.white,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  emptyState: {
    padding: spacing.xl,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  daySection: {
    marginBottom: spacing.lg,
  },
  dayTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: spacing.sm,
  },
  timetableItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...colors.shadows.sm,
  },
  timetimeContainer: {
    minWidth: 70,
  },
  timeText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  durationText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  timeInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  instructorText: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  roomText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  timePrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  classItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...colors.shadows.sm,
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
  classInstructor: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  classActions: {
    alignItems: 'flex-end',
  },
  classPrice: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  enrolledBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  enrolledText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.success,
  },
});
