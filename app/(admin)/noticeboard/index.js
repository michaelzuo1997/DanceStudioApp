import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useLanguage } from '../../../src/context/LanguageContext';
import { fetchNotices } from '../../../src/lib/admin/noticeboardService';
import { AdminNoticeCard } from '../../../src/components/admin/AdminNoticeCard';
import { colors, spacing, fontSize, borderRadius } from '../../../src/constants/theme';

export default function AdminNoticeList() {
  const { t, locale } = useLanguage();

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);

  const load = useCallback(async () => {
    const { data } = await fetchNotices({
      isActive: statusFilter,
    });
    setNotices(data);
    setLoading(false);
    setRefreshing(false);
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const renderItem = useCallback(({ item }) => (
    <AdminNoticeCard
      notice={item}
      locale={locale}
      onEdit={() => router.push({ pathname: '/(admin)/noticeboard/edit', params: { id: item.id, mode: 'edit' } })}
      onRefresh={load}
    />
  ), [locale, load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        {[
          { label: t('admin.allStatuses'), value: null },
          { label: t('admin.active'), value: true },
          { label: t('admin.inactive'), value: false },
        ].map((f) => (
          <TouchableOpacity
            key={String(f.value)}
            style={[styles.filterChip, statusFilter === f.value && styles.filterChipActive]}
            onPress={() => setStatusFilter(f.value)}
          >
            <Text style={[styles.filterText, statusFilter === f.value && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={notices}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>{t('admin.noNotices')}</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push({ pathname: '/(admin)/noticeboard/edit', params: { mode: 'create' } })}
        testID="fab-add-notice"
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  filterBar: {
    flexDirection: 'row',
    padding: spacing.md,
    paddingBottom: 0,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.full,
  },
  filterChipActive: {
    backgroundColor: colors.accent,
  },
  filterText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.white,
  },
  list: { padding: spacing.md },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...colors.shadows.md,
  },
  fabText: { fontSize: 28, color: colors.white, fontWeight: '400', marginTop: -2 },
});
