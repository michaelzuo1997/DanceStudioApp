import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { deactivateClass, activateClass } from '../../lib/admin/classService';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';

const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_ZH = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function AdminClassCard({ classItem, locale, onEdit, onEnrollments, onRefresh }) {
  const { t } = useLanguage();
  const cat = classItem.class_categories;
  const campus = classItem.campuses;
  const dayLabel = (locale === 'zh' ? DAYS_ZH : DAYS_EN)[classItem.day_of_week] ?? '';

  const handleToggle = async () => {
    if (classItem.is_active) {
      await deactivateClass(classItem.id);
    } else {
      await activateClass(classItem.id);
    }
    onRefresh?.();
  };

  return (
    <View style={[styles.card, !classItem.is_active && styles.cardInactive]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>
            {cat ? (locale === 'zh' ? cat.name_zh : cat.name_en) : 'Untitled'}
          </Text>
          <Text style={styles.subtitle}>
            {dayLabel} · {classItem.start_time?.slice(0, 5)} · {classItem.duration_minutes}min
          </Text>
          {campus && (
            <Text style={styles.meta}>
              {locale === 'zh' ? campus.name_zh : campus.name_en}
            </Text>
          )}
        </View>
        <View style={[styles.badge, classItem.is_active ? styles.badgeActive : styles.badgeInactive]}>
          <Text style={[styles.badgeText, classItem.is_active ? styles.badgeTextActive : styles.badgeTextInactive]}>
            {classItem.is_active ? t('admin.active') : t('admin.inactive')}
          </Text>
        </View>
      </View>

      <View style={styles.priceRow}>
        <Text style={styles.price}>A${Number(classItem.price_per_class ?? 0).toFixed(2)}</Text>
        {classItem.audience && (
          <Text style={styles.audience}>{t(`classes.${classItem.audience}`)}</Text>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
          <Text style={styles.actionText}>{t('admin.editClass')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onEnrollments}>
          <Text style={styles.actionText}>{t('admin.enrollments')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, classItem.is_active ? styles.deactivateBtn : styles.activateBtn]}
          onPress={handleToggle}
        >
          <Text style={[styles.actionText, classItem.is_active ? styles.deactivateText : styles.activateText]}>
            {classItem.is_active ? t('admin.deactivate') : t('admin.activate')}
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
  meta: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
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
