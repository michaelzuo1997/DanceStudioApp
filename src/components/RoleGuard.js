import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRequireRole } from '../hooks/useRequireRole';
import { useLanguage } from '../context/LanguageContext';
import { colors, spacing, fontSize } from '../constants/theme';

/**
 * Wraps children and blocks rendering if user lacks the required role.
 * Shows a loading spinner while checking, or an unauthorized message.
 */
export function RoleGuard({ roles = ['admin', 'owner'], children }) {
  const { authorized, loading } = useRequireRole(roles);
  const { t } = useLanguage();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!authorized) {
    return (
      <View style={styles.center}>
        <Text style={styles.icon}>🔒</Text>
        <Text style={styles.title}>{t('admin.unauthorized')}</Text>
        <Text style={styles.subtitle}>{t('admin.unauthorizedMessage')}</Text>
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
