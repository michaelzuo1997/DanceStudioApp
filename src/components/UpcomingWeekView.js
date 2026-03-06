import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useCampus } from '../context/CampusContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { colors, spacing, fontSize, borderRadius, fontFamily } from '../constants/theme';

export function UpcomingWeekView() {
  const { selectedCampus } = useCampus();
  const { t, locale } = useLanguage();
  const [classesByDay, setClassesByDay] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchUpcoming = useCallback(async () => {
    setLoading(true);
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    let query = supabase
      .from('class_timetable')
      .select(`
        id, class_date, start_time, duration_minutes, price_per_class, campus_id,
        class_categories (name_en, name_zh),
        instructors (name),
        studios (name)
      `)
      .eq('is_active', true)
      .gte('class_date', today.toISOString().slice(0, 10))
      .lte('class_date', nextWeek.toISOString().slice(0, 10))
      .order('class_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(20);

    if (selectedCampus) {
      query = query.eq('campus_id', selectedCampus);
    }

    const { data } = await query;
    const grouped = {};
    (data ?? []).forEach((cls) => {
      const day = cls.class_date || 'unknown';
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(cls);
    });
    setClassesByDay(grouped);
    setLoading(false);
  }, [selectedCampus]);

  useEffect(() => {
    fetchUpcoming();
  }, [fetchUpcoming]);

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const days = Object.keys(classesByDay);
  if (days.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>{t('home.noUpcomingWeek')}</Text>
      </View>
    );
  }

  return (
    <View>
      {days.map((day) => (
        <View key={day} style={styles.daySection}>
          <Text style={styles.dayTitle}>
            {new Date(day).toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          {classesByDay[day].map((cls) => {
            const categoryName = cls.class_categories
              ? (locale === 'zh' ? cls.class_categories.name_zh : cls.class_categories.name_en)
              : '';
            return (
              <Pressable
                key={cls.id}
                style={({ pressed }) => [styles.classRow, pressed && { opacity: 0.85 }]}
                onPress={() => router.push('/(tabs)/classes')}
              >
                <View style={styles.timeCol}>
                  <Text style={styles.timeText}>{formatTime(cls.start_time)}</Text>
                  <Text style={styles.durationText}>{cls.duration_minutes}min</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.className} numberOfLines={1}>{categoryName}</Text>
                  <Text style={styles.metaText} numberOfLines={1}>
                    {cls.instructors?.name || ''}{cls.studios?.name ? ` \u2022 ${cls.studios.name}` : ''}
                  </Text>
                </View>
                <Text style={styles.priceText}>A${Number(cls.price_per_class || 0).toFixed(0)}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
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
    marginBottom: spacing.md,
  },
  dayTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    fontFamily: fontFamily.bodySemiBold,
    color: colors.accent,
    marginBottom: spacing.sm,
  },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    ...colors.shadows.sm,
  },
  timeCol: {
    minWidth: 64,
  },
  timeText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
  },
  durationText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textTertiary,
  },
  infoCol: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  className: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
  },
  metaText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textSecondary,
  },
  priceText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
    marginLeft: spacing.sm,
  },
});
