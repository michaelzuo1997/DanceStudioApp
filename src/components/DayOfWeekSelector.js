import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { colors, spacing, fontSize, borderRadius, fontFamily } from '../constants/theme';

const DAYS = [
  { value: null, en: 'All', zh: '全部' },
  { value: 1, en: 'Mon', zh: '周一' },
  { value: 2, en: 'Tue', zh: '周二' },
  { value: 3, en: 'Wed', zh: '周三' },
  { value: 4, en: 'Thu', zh: '周四' },
  { value: 5, en: 'Fri', zh: '周五' },
  { value: 6, en: 'Sat', zh: '周六' },
  { value: 0, en: 'Sun', zh: '周日' },
];

export function DayOfWeekSelector({ selectedDay, onSelectDay }) {
  const { locale } = useLanguage();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {DAYS.map((day) => {
          const isActive = selectedDay === day.value;
          return (
            <Pressable
              key={day.value ?? 'all'}
              style={({ pressed }) => [styles.chip, isActive && styles.chipActive, pressed && { opacity: 0.85 }]}
              onPress={() => onSelectDay(day.value)}
              testID={`day-chip-${day.value ?? 'all'}`}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {locale === 'zh' ? day.zh : day.en}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  scrollContent: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceAlt,
  },
  chipActive: {
    backgroundColor: colors.accent,
  },
  chipText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bodySemiBold,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.white,
  },
});
