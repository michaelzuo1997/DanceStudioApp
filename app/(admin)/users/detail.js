import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useLanguage } from '../../../src/context/LanguageContext';
import { useRequireRole } from '../../../src/hooks/useRequireRole';
import {
  fetchUserById, updateUserRole,
  deactivateUser, reactivateUser, fetchUserStats,
  updateUserHourlyRate,
} from '../../../src/lib/admin/userManagementService';
import { colors, spacing, fontSize, borderRadius } from '../../../src/constants/theme';

const ROLES = ['user', 'instructor', 'admin', 'owner'];

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams();
  const { t } = useLanguage();
  const { role: callerRole } = useRequireRole(['admin', 'owner']);

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [hourlyRate, setHourlyRate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadUser = useCallback(async () => {
    setLoading(true);
    const { data } = await fetchUserById(id);
    if (data) {
      setUser(data);
      setSelectedRole(data.role);
      setHourlyRate(data.hourly_rate != null ? String(data.hourly_rate) : '');
      setIsActive(data.is_active !== false);
      // Load stats using auth user_id
      const { data: statsData } = await fetchUserStats(data.user_id);
      setStats(statsData);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleSave = useCallback(async () => {
    setSaving(true);

    // Update role if changed
    if (selectedRole !== user.role) {
      const { error } = await updateUserRole(id, selectedRole, callerRole);
      if (error) {
        Alert.alert(t('common.error'), error.message);
        setSaving(false);
        return;
      }
    }

    // Update hourly rate if changed
    const currentRate = user.hourly_rate != null ? String(user.hourly_rate) : '';
    if (hourlyRate !== currentRate) {
      const newRate = hourlyRate.trim() === '' ? null : parseFloat(hourlyRate);
      const { error } = await updateUserHourlyRate(id, newRate);
      if (error) {
        Alert.alert(t('common.error'), t('admin.users.saveFailed'));
        setSaving(false);
        return;
      }
    }

    // Update active status if changed
    const currentlyActive = user.is_active !== false;
    if (isActive !== currentlyActive) {
      const fn = isActive ? reactivateUser : deactivateUser;
      const { error } = await fn(id);
      if (error) {
        Alert.alert(t('common.error'), t('admin.users.saveFailed'));
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    Alert.alert(t('common.success'), t('admin.users.saveSuccess'));
    router.back();
  }, [id, selectedRole, hourlyRate, isActive, user, callerRole, t]);

  const handleDeactivateToggle = useCallback(() => {
    if (isActive) {
      Alert.alert(
        t('admin.users.deactivateConfirm'),
        t('admin.users.deactivateMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.confirm'), style: 'destructive', onPress: () => setIsActive(false) },
        ],
      );
    } else {
      setIsActive(true);
    }
  }, [isActive, t]);

  if (loading || !user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const displayName = user.full_name || user.name || 'Unknown';
  const initial = displayName[0].toUpperCase();
  const memberSince = user.created_at ? new Date(user.created_at).toLocaleDateString() : '—';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar + Name */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.memberSince}>{t('admin.users.memberSince')}: {memberSince}</Text>
      </View>

      {/* Stats */}
      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.enrollmentCount}</Text>
            <Text style={styles.statLabel}>{t('admin.users.enrollments')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.activeBundles}</Text>
            <Text style={styles.statLabel}>{t('admin.users.activeBundles')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>A${stats.balance.toFixed(2)}</Text>
            <Text style={styles.statLabel}>{t('admin.users.balance')}</Text>
          </View>
        </View>
      )}

      {/* Role picker */}
      <Text style={styles.sectionTitle}>{t('admin.users.role')}</Text>
      <View style={styles.chipRow}>
        {ROLES.map((r) => {
          const disabled = r === 'owner' && callerRole !== 'owner';
          return (
            <TouchableOpacity
              key={r}
              style={[
                styles.chip,
                selectedRole === r && styles.chipActive,
                disabled && styles.chipDisabled,
              ]}
              onPress={() => !disabled && setSelectedRole(r)}
              disabled={disabled}
              testID={`role-chip-${r}`}
            >
              <Text style={[
                styles.chipText,
                selectedRole === r && styles.chipTextActive,
                disabled && styles.chipTextDisabled,
              ]}>
                {t(`admin.users.role${r.charAt(0).toUpperCase() + r.slice(1)}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Hourly Rate — visible for instructor/admin/owner roles */}
      {['instructor', 'admin', 'owner'].includes(selectedRole) && (
        <>
          <Text style={styles.sectionTitle}>{t('admin.users.hourlyRate')}</Text>
          <TextInput
            style={styles.input}
            value={hourlyRate}
            onChangeText={setHourlyRate}
            keyboardType="numeric"
            placeholder={t('admin.users.hourlyRatePlaceholder')}
            testID="input-hourly-rate"
          />
        </>
      )}

      {/* Active toggle */}
      <Text style={styles.sectionTitle}>{t('admin.users.status')}</Text>
      <TouchableOpacity
        style={[styles.statusToggle, isActive ? styles.statusActive : styles.statusInactive]}
        onPress={handleDeactivateToggle}
        testID="toggle-active"
      >
        <Text style={[styles.statusText, isActive ? styles.statusTextActive : styles.statusTextInactive]}>
          {isActive ? t('admin.users.statusActive') : t('admin.users.statusDeactivated')}
        </Text>
      </TouchableOpacity>

      {/* Save */}
      <TouchableOpacity
        style={styles.saveBtn}
        onPress={handleSave}
        disabled={saving}
        testID="btn-save-user"
      >
        {saving ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.saveBtnText}>{t('common.save')}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.white,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  memberSince: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...colors.shadows.sm,
  },
  statNumber: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.accent,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.full,
  },
  chipActive: {
    backgroundColor: colors.accent,
  },
  chipDisabled: {
    opacity: 0.4,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.white,
  },
  chipTextDisabled: {
    color: colors.textTertiary,
  },
  statusToggle: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  statusActive: {
    backgroundColor: '#ECFDF5',
  },
  statusInactive: {
    backgroundColor: '#FEF2F2',
  },
  statusText: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#065F46',
  },
  statusTextInactive: {
    color: '#991B1B',
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveBtnText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.white,
  },
});
