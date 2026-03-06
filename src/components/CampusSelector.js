import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useCampus } from '../context/CampusContext';
import { useLanguage } from '../context/LanguageContext';
import { colors, spacing, fontSize, borderRadius, fontFamily } from '../constants/theme';

export function CampusSelector() {
  const { campuses, selectedCampus, setSelectedCampus, loading } = useCampus();
  const { t, locale } = useLanguage();

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.chip, styles.chipPlaceholder]}>
          <Text style={styles.chipText}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  if (campuses.length === 0) {
    return (
      <View style={styles.container}>
        <View style={[styles.chip, styles.chipActive]}>
          <Text style={styles.chipTextActive}>{t('campus.all')}</Text>
        </View>
      </View>
    );
  }

  const isSelected = (campusId) =>
    campusId === null ? selectedCampus === null : selectedCampus === campusId;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Pressable
          style={({ pressed }) => [styles.chip, isSelected(null) && styles.chipActive, pressed && { opacity: 0.85 }]}
          onPress={() => setSelectedCampus(null)}
        >
          <Text style={[styles.chipText, isSelected(null) && styles.chipTextActive]}>
            {t('campus.all')}
          </Text>
        </Pressable>

        {campuses.map((campus) => (
          <Pressable
            key={campus.id}
            style={({ pressed }) => [styles.chip, isSelected(campus.id) && styles.chipActive, pressed && { opacity: 0.85 }]}
            onPress={() => setSelectedCampus(campus.id)}
          >
            <Text style={[styles.chipText, isSelected(campus.id) && styles.chipTextActive]}>
              {locale === 'zh' ? campus.name_zh : campus.name_en}
            </Text>
          </Pressable>
        ))}
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
  chipPlaceholder: {
    opacity: 0.5,
  },
});
