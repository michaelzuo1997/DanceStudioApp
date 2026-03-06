import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';

/**
 * Displays the result of a price preview — count of affected classes
 * and the current min/max price range.
 *
 * @param {{ classes: Array<{ price_per_class: number }> }} props
 */
export function PricePreviewCard({ classes = [] }) {
  const { t } = useLanguage();

  if (classes.length === 0) {
    return (
      <View style={styles.card} testID="price-preview-empty">
        <Text style={styles.emptyText}>{t('admin.pricing.noMatches')}</Text>
      </View>
    );
  }

  const prices = classes.map((c) => Number(c.price_per_class ?? 0));
  const min = Math.min(...prices).toFixed(2);
  const max = Math.max(...prices).toFixed(2);

  const summary = t('admin.pricing.previewResult')
    .replace('{count}', String(classes.length))
    .replace('{min}', min)
    .replace('{max}', max);

  return (
    <View style={styles.card} testID="price-preview-card">
      <Text style={styles.count}>{classes.length}</Text>
      <Text style={styles.label}>{summary}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F0FDF4',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  count: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.success,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
});
