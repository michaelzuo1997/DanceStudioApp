import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';

export function EnrollmentRow({ enrollment, onRemove }) {
  const { t } = useLanguage();
  const userInfo = enrollment['Users Info'];
  const displayName = userInfo?.name || userInfo?.full_name || 'Unknown User';

  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.meta}>
          {enrollment.payment_type ?? 'balance'} · {enrollment.enrolled_by ?? 'self'}
        </Text>
      </View>
      <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
        <Text style={styles.removeText}>{t('admin.removeUser')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...colors.shadows.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.white,
  },
  info: { flex: 1 },
  name: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  meta: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  removeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: '#FEF2F2',
    borderRadius: borderRadius.md,
  },
  removeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.error,
  },
});
