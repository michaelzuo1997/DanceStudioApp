import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { colors, spacing, fontSize, borderRadius, fontFamily } from '../constants/theme';

const TIME_PRESETS = [
  { key: 'all', minTime: null, maxTime: null },
  { key: 'morning', minTime: '00:00', maxTime: '12:00' },
  { key: 'afternoon', minTime: '12:00', maxTime: '17:00' },
  { key: 'evening', minTime: '17:00', maxTime: '23:59' },
];

export function FilterModal({ visible, onClose, filters, onApply }) {
  const { t } = useLanguage();
  const [localFilters, setLocalFilters] = useState({ ...filters });

  useEffect(() => {
    if (visible) {
      setLocalFilters({ ...filters });
    }
  }, [visible, filters]);

  const setAudience = (audience) => {
    setLocalFilters((prev) => ({ ...prev, audience }));
  };

  const setTimePreset = (preset) => {
    setLocalFilters((prev) => ({
      ...prev,
      minTime: preset.minTime,
      maxTime: preset.maxTime,
    }));
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = { audience: null, minTime: null, maxTime: null };
    setLocalFilters(resetFilters);
    onApply(resetFilters);
    onClose();
  };

  const activeTimeKey = TIME_PRESETS.find(
    (p) => p.minTime === localFilters.minTime && p.maxTime === localFilters.maxTime
  )?.key ?? 'all';

  const audienceOptions = [
    { value: null, label: t('classes.allAudience') },
    { value: 'adult', label: t('classes.adult') },
    { value: 'children', label: t('classes.children') },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.overlay}
        onPress={onClose}
        testID="filter-overlay"
      />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <Text style={styles.sectionTitle}>{t('classes.audience')}</Text>
        <View style={styles.chipRow}>
          {audienceOptions.map((opt) => {
            const isActive = localFilters.audience === opt.value;
            return (
              <Pressable
                key={opt.value ?? 'all'}
                style={({ pressed }) => [styles.chip, isActive && styles.chipActive, pressed && { opacity: 0.85 }]}
                onPress={() => setAudience(opt.value)}
                testID={`audience-${opt.value ?? 'all'}`}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>{t('classes.timeOfDay')}</Text>
        <View style={styles.chipRow}>
          {TIME_PRESETS.map((preset) => {
            const isActive = activeTimeKey === preset.key;
            const labelKey = preset.key === 'all' ? 'classes.allAudience' : `classes.${preset.key}`;
            return (
              <Pressable
                key={preset.key}
                style={({ pressed }) => [styles.chip, isActive && styles.chipActive, pressed && { opacity: 0.85 }]}
                onPress={() => setTimePreset(preset)}
                testID={`time-${preset.key}`}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {t(labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.buttonRow}>
          <Pressable
            style={({ pressed }) => [styles.resetButton, pressed && { opacity: 0.85 }]}
            onPress={handleReset}
            testID="filter-reset"
          >
            <Text style={styles.resetText}>{t('classes.resetFilters')}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.applyButton, pressed && { opacity: 0.85 }]}
            onPress={handleApply}
            testID="filter-apply"
          >
            <Text style={styles.applyText}>{t('classes.applyFilters')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodyMedium,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
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
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  resetButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  resetText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodySemiBold,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  applyButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  applyText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodySemiBold,
    fontWeight: '700',
    color: colors.white,
  },
});
