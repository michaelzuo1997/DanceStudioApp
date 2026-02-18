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
import { router } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { format } from 'date-fns';
import { useAuth } from '../../../src/context/AuthContext';
import { useCart } from '../../../src/context/CartContext';
import { supabase } from '../../../src/lib/supabase';
import { ClassCard } from '../../../src/components/ClassCard';
import { ClassDetailModal } from '../../../src/components/ClassDetailModal';
import { colors, spacing, fontSize, borderRadius } from '../../../src/constants/theme';

export default function ClassesScreen() {
  const { user } = useAuth();
  const { items: cartItems, addItem } = useCart();
  const [classes, setClasses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [selectedClass, setSelectedClass] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const fetchData = useCallback(async () => {
    const { data } = await supabase
      .from('CLASSES')
      .select('id, name, class_type, start_time, end_time, instructor, room, price, cost')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(100);
    setClasses(data ?? []);

    if (user) {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('class_id')
        .eq('user_id', user.id);
      setEnrolledIds(new Set((enrollments ?? []).map((e) => String(e.class_id))));
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const cartIds = new Set(cartItems.map((i) => i.id));

  const toCartClass = (c) => ({
    id: String(c.id),
    name: String(c.name),
    class_type: c.class_type || undefined,
    start_time: c.start_time,
    end_time: c.end_time,
    instructor: c.instructor || undefined,
    room: c.room || undefined,
    price: Number(c.price ?? c.cost ?? 0),
  });

  // Calculate marked dates for calendar
  const markedDates = useMemo(() => {
    const marks = {};
    classes.forEach((c) => {
      const date = format(new Date(c.start_time), 'yyyy-MM-dd');
      if (!marks[date]) {
        marks[date] = { marked: true, dotColor: colors.accent };
      }
    });

    // Add selected date styling
    if (selectedDate) {
      marks[selectedDate] = {
        ...marks[selectedDate],
        selected: true,
        selectedColor: colors.primary,
        disableTouchEvent: true,
      };
    }
    return marks;
  }, [classes, selectedDate]);

  // Filter classes for selected date in calendar mode
  const displayedClasses = useMemo(() => {
    if (viewMode === 'list') return classes;
    return classes.filter(c => 
      format(new Date(c.start_time), 'yyyy-MM-dd') === selectedDate
    );
  }, [classes, viewMode, selectedDate]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segment, viewMode === 'list' && styles.segmentActive]}
            onPress={() => setViewMode('list')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, viewMode === 'list' && styles.segmentTextActive]}>
              List
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segment, viewMode === 'calendar' && styles.segmentActive]}
            onPress={() => setViewMode('calendar')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, viewMode === 'calendar' && styles.segmentTextActive]}>
              Calendar
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => router.push('/(tabs)/classes/browse')}
        >
          <Text style={styles.browseButtonText}>Browse All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {viewMode === 'calendar' && (
          <View style={styles.calendarWrapper}>
            <Calendar
              current={selectedDate}
              onDayPress={(day) => setSelectedDate(day.dateString)}
              markedDates={markedDates}
              theme={{
                backgroundColor: colors.surface,
                calendarBackground: colors.surface,
                textSectionTitleColor: colors.textSecondary,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: colors.white,
                todayTextColor: colors.accent,
                dayTextColor: colors.text,
                textDisabledColor: colors.textTertiary,
                dotColor: colors.accent,
                selectedDotColor: colors.white,
                arrowColor: colors.primary,
                monthTextColor: colors.text,
                indicatorColor: colors.primary,
                textDayFontWeight: '500',
                textMonthFontWeight: '600',
                textDayHeaderFontWeight: '500',
                textDayFontSize: fontSize.sm,
                textMonthFontSize: fontSize.md,
                textDayHeaderFontSize: fontSize.xs,
              }}
            />
            <View style={styles.dateHeader}>
              <Text style={styles.dateTitle}>
                {format(new Date(selectedDate), 'EEEE, MMMM d')}
              </Text>
              <Text style={styles.classCount}>
                {displayedClasses.length} class{displayedClasses.length !== 1 ? 'es' : ''}
              </Text>
            </View>
          </View>
        )}

        {displayedClasses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {viewMode === 'calendar' 
                ? 'No classes scheduled for this date.' 
                : 'No upcoming classes found.'}
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {displayedClasses.map((c) => (
              <ClassCard
                key={c.id}
                classData={toCartClass(c)}
                enrolled={enrolledIds.has(String(c.id))}
                inCart={cartIds.has(String(c.id))}
                onPress={() => setSelectedClass(toCartClass(c))}
                onAddToCart={(item) => addItem(item)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {selectedClass && (
        <ClassDetailModal
          classData={selectedClass}
          enrolledIds={enrolledIds}
          onClose={() => setSelectedClass(null)}
        />
      )}
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
    backgroundColor: colors.background, // Transparent/blend with bg
    zIndex: 10,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.full,
    padding: 2,
    alignItems: 'center',
  },
  segment: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
  },
  segmentActive: {
    backgroundColor: colors.white,
    ...colors.shadows.sm,
  },
  segmentText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.text,
  },
  browseButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  browseButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.accent,
  },
  content: { 
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  calendarWrapper: {
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...colors.shadows.sm, // Soft shadow
    paddingBottom: spacing.md,
  },
  dateHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  dateTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  classCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.lg,
  },
  emptyText: { 
    fontSize: fontSize.md, 
    color: colors.textSecondary 
  },
  listContainer: {
    gap: spacing.sm,
  },
});
