import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { deactivateBundle, activateBundle } from '../../lib/admin/bundleService';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';

export function AdminBundleCard({ bundle, locale, onEdit, onRefresh }) {
  const { t } = useLanguage();
  const cat = bundle.class_categories;

  const handleToggle = async () => {
    if (bundle.is_active) {
      await deactivateBundle(bundle.id);
    } else {
      await activateBundle(bundle.id);
    }
    onRefresh?.();
  };

  const perClass = bundle.class_count > 0
    ? (Number(bundle.total_price) / bundle.class_count).toFixed(2)
    : '--';

  return (
    <View style={[styles.card, !bundle.is_active && styles.cardInactive]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>
            {bundle.class_count} {t('bundles.classes')} · {bundle.expiry_weeks} {t('bundles.weeks')}
          </Text>
          <Text style={styles.subtitle}>
            {cat ? (locale === 'zh' ? cat.name_zh : cat.name_en) : t('bundles.anyCategory')}
          </Text>
        </View>
        <View style={[styles.badge, bundle.is_active ? styles.badgeActive : styles.badgeInactive]}>
          <Text style={[styles.badgeText, bundle.is_active ? styles.badgeTextActive : styles.badgeTextInactive]}>
            {bundle.is_active ? t('admin.active') : t('admin.inactive')}
          </Text>
        </View>
      </View>

      <View style={styles.priceRow}>
        <Text style={styles.price}>A${Number(bundle.total_price ?? 0).toFixed(2)}</Text>
        <Text style={styles.perClass}>A${perClass} {t('bundles.perClass')}</Text>
        {bundle.audience && (
          <Text style={styles.audience}>{t(`classes.${bundle.audience}`)}</Text>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
          <Text style={styles.actionText}>{t('admin.editBundle')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, bundle.is_active ? styles.deactivateBtn : styles.activateBtn]}
          onPress={handleToggle}
        >
          <Text style={[styles.actionText, bundle.is_active ? styles.deactivateText : styles.activateText]}>
            {bundle.is_active ? t('admin.deactivate') : t('admin.activate')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...colors.shadows.sm,
  },
  cardInactive: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: { flex: 1 },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  badgeActive: { backgroundColor: '#D1FAE5' },
  badgeInactive: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: fontSize.xs, fontWeight: '600' },
  badgeTextActive: { color: '#065F46' },
  badgeTextInactive: { color: '#991B1B' },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  price: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.accent,
  },
  perClass: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  audience: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  actionText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.text,
  },
  deactivateBtn: {
    backgroundColor: '#FEF2F2',
  },
  deactivateText: {
    color: colors.error,
  },
  activateBtn: {
    backgroundColor: '#ECFDF5',
  },
  activateText: {
    color: '#065F46',
  },
});
