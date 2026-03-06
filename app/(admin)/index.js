import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useLanguage } from '../../src/context/LanguageContext';
import { supabase } from '../../src/lib/supabase';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({ activeClasses: 0, totalEnrolled: 0, activeNotices: 0, activeBundles: 0, totalUsers: 0 });
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const [classRes, enrollRes, noticeRes, bundleRes, userRes] = await Promise.all([
        supabase.from('class_timetable').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('noticeboard').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('class_bundles').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('Users Info').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        activeClasses: classRes.count ?? 0,
        totalEnrolled: enrollRes.count ?? 0,
        activeNotices: noticeRes.count ?? 0,
        activeBundles: bundleRes.count ?? 0,
        totalUsers: userRes.count ?? 0,
      });
    } catch {
      // stats are non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('admin.dashboard')}</Text>

      {/* Stats Row 1 */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          {loading ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Text style={styles.statNumber}>{stats.activeClasses}</Text>
          )}
          <Text style={styles.statLabel}>{t('admin.activeClasses')}</Text>
        </View>
        <View style={styles.statCard}>
          {loading ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Text style={styles.statNumber}>{stats.totalEnrolled}</Text>
          )}
          <Text style={styles.statLabel}>{t('admin.totalEnrolled')}</Text>
        </View>
      </View>

      {/* Stats Row 2 */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          {loading ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Text style={styles.statNumber}>{stats.activeNotices}</Text>
          )}
          <Text style={styles.statLabel}>{t('admin.activeNotices')}</Text>
        </View>
        <View style={styles.statCard}>
          {loading ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Text style={styles.statNumber}>{stats.activeBundles}</Text>
          )}
          <Text style={styles.statLabel}>{t('admin.activeBundles')}</Text>
        </View>
      </View>

      {/* Stats Row 3 */}
      <View style={styles.statsRowCentered}>
        <View style={styles.statCard}>
          {loading ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Text style={styles.statNumber}>{stats.totalUsers}</Text>
          )}
          <Text style={styles.statLabel}>{t('admin.totalUsers')}</Text>
        </View>
      </View>

      {/* Navigation Cards */}
      <TouchableOpacity
        style={styles.navCard}
        onPress={() => router.push('/(admin)/classes')}
        testID="nav-class-management"
      >
        <Text style={styles.navCardIcon}>📋</Text>
        <View style={styles.navCardText}>
          <Text style={styles.navCardTitle}>{t('admin.classManagement')}</Text>
          <Text style={styles.navCardSub}>{t('admin.manageClasses')}</Text>
        </View>
        <Text style={styles.navArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navCard}
        onPress={() => router.push('/(admin)/noticeboard')}
        testID="nav-noticeboard"
      >
        <Text style={styles.navCardIcon}>📢</Text>
        <View style={styles.navCardText}>
          <Text style={styles.navCardTitle}>{t('admin.noticeboard')}</Text>
          <Text style={styles.navCardSub}>{t('admin.manageNotices')}</Text>
        </View>
        <Text style={styles.navArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navCard}
        onPress={() => router.push('/(admin)/bundles')}
        testID="nav-bundle-management"
      >
        <Text style={styles.navCardIcon}>🎟️</Text>
        <View style={styles.navCardText}>
          <Text style={styles.navCardTitle}>{t('admin.bundleManagement')}</Text>
          <Text style={styles.navCardSub}>{t('admin.manageBundles')}</Text>
        </View>
        <Text style={styles.navArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navCard}
        onPress={() => router.push('/(admin)/pricing')}
        testID="nav-price-management"
      >
        <Text style={styles.navCardIcon}>💰</Text>
        <View style={styles.navCardText}>
          <Text style={styles.navCardTitle}>{t('admin.priceManagement')}</Text>
          <Text style={styles.navCardSub}>{t('admin.managePrices')}</Text>
        </View>
        <Text style={styles.navArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navCard}
        onPress={() => router.push('/(admin)/users')}
        testID="nav-user-management"
      >
        <Text style={styles.navCardIcon}>👥</Text>
        <View style={styles.navCardText}>
          <Text style={styles.navCardTitle}>{t('admin.userManagement')}</Text>
          <Text style={styles.navCardSub}>{t('admin.manageUsers')}</Text>
        </View>
        <Text style={styles.navArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navCard}
        onPress={() => router.push('/(admin)/wages')}
        testID="nav-wage-calculator"
      >
        <Text style={styles.navCardIcon}>🧮</Text>
        <View style={styles.navCardText}>
          <Text style={styles.navCardTitle}>{t('admin.wages.wageCalculator')}</Text>
          <Text style={styles.navCardSub}>{t('admin.wages.calculateWages')}</Text>
        </View>
        <Text style={styles.navArrow}>›</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statsRowCentered: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...colors.shadows.sm,
  },
  statNumber: {
    fontSize: fontSize.xxl,
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
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...colors.shadows.sm,
  },
  navCardIcon: { fontSize: 28, marginRight: spacing.md },
  navCardText: { flex: 1 },
  navCardTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  navCardSub: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  navArrow: {
    fontSize: 24,
    color: colors.textTertiary,
    fontWeight: '300',
  },
});
