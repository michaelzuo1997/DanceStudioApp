import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';

const ROLE_COLORS = {
  owner: '#7C3AED',
  admin: '#2563EB',
  instructor: '#059669',
  user: colors.textSecondary,
};

/**
 * Card displaying a user with name, role badge, and active status.
 *
 * @param {{ user: object, onPress: () => void }} props
 */
export function AdminUserCard({ user, onPress }) {
  const { t } = useLanguage();
  const initial = (user.full_name || user.name || '?')[0].toUpperCase();
  const displayName = user.full_name || user.name || 'Unknown';
  const roleColor = ROLE_COLORS[user.role] ?? ROLE_COLORS.user;
  const roleLabel = t(`admin.users.role${capitalize(user.role ?? 'user')}`);
  const isActive = user.is_active !== false;

  return (
    <TouchableOpacity
      style={[styles.card, !isActive && styles.cardInactive]}
      onPress={onPress}
      testID={`user-card-${user.id}`}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
        <View style={styles.badges}>
          <View style={[styles.roleBadge, { backgroundColor: roleColor + '1A' }]}>
            <Text style={[styles.roleBadgeText, { color: roleColor }]}>{roleLabel}</Text>
          </View>
          {!isActive && (
            <View style={styles.deactivatedBadge}>
              <Text style={styles.deactivatedText}>{t('admin.users.statusDeactivated')}</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...colors.shadows.sm,
  },
  cardInactive: {
    opacity: 0.6,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.white,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: 4,
  },
  roleBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  roleBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  deactivatedBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: '#FEE2E2',
  },
  deactivatedText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: '#991B1B',
  },
  arrow: {
    fontSize: 24,
    color: colors.textTertiary,
    fontWeight: '300',
  },
});
