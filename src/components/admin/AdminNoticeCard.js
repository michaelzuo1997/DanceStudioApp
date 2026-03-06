import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { deactivateNotice, activateNotice } from '../../lib/admin/noticeboardService';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';

const PRIORITY_LABELS = { 0: 'Normal', 1: 'High', 2: 'Urgent' };

export function AdminNoticeCard({ notice, locale, onEdit, onRefresh }) {
  const { t } = useLanguage();
  const campus = notice.campuses;

  const handleToggle = async () => {
    if (notice.is_active) {
      await deactivateNotice(notice.id);
    } else {
      await activateNotice(notice.id);
    }
    onRefresh?.();
  };

  const title = locale === 'zh' ? notice.title_zh : notice.title_en;
  const body = locale === 'zh' ? notice.body_zh : notice.body_en;
  const priorityLabel = PRIORITY_LABELS[notice.priority] ?? 'Normal';

  return (
    <View style={[styles.card, !notice.is_active && styles.cardInactive]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title} numberOfLines={2}>{title || 'Untitled'}</Text>
          {campus && (
            <Text style={styles.meta}>
              {locale === 'zh' ? campus.name_zh : campus.name_en}
            </Text>
          )}
          {!campus && (
            <Text style={styles.meta}>{t('admin.noticeForm.allCampuses')}</Text>
          )}
        </View>
        <View style={[styles.badge, notice.is_active ? styles.badgeActive : styles.badgeInactive]}>
          <Text style={[styles.badgeText, notice.is_active ? styles.badgeTextActive : styles.badgeTextInactive]}>
            {notice.is_active ? t('admin.active') : t('admin.inactive')}
          </Text>
        </View>
      </View>

      {body ? (
        <Text style={styles.body} numberOfLines={2}>{body}</Text>
      ) : null}

      <View style={styles.metaRow}>
        <Text style={styles.priorityBadge}>
          {priorityLabel}
        </Text>
        {notice.expires_at && (
          <Text style={styles.expiry}>
            Expires: {notice.expires_at.slice(0, 10)}
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
          <Text style={styles.actionText}>{t('admin.editNotice')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, notice.is_active ? styles.deactivateBtn : styles.activateBtn]}
          onPress={handleToggle}
        >
          <Text style={[styles.actionText, notice.is_active ? styles.deactivateText : styles.activateText]}>
            {notice.is_active ? t('admin.deactivate') : t('admin.activate')}
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
  body: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  priorityBadge: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  expiry: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
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
