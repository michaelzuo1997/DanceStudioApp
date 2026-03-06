import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useLanguage } from '../../../src/context/LanguageContext';
import { fetchUsers } from '../../../src/lib/admin/userManagementService';
import { AdminUserCard } from '../../../src/components/admin/AdminUserCard';
import { colors, spacing, fontSize, borderRadius } from '../../../src/constants/theme';

const ROLE_FILTERS = [
  { key: null, labelKey: 'admin.users.allRoles' },
  { key: 'user', labelKey: 'admin.users.roleUser' },
  { key: 'instructor', labelKey: 'admin.users.roleInstructor' },
  { key: 'admin', labelKey: 'admin.users.roleAdmin' },
  { key: 'owner', labelKey: 'admin.users.roleOwner' },
];

export default function AdminUserList() {
  const { t } = useLanguage();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState(null);
  const debounceRef = useRef(null);

  const load = useCallback(async (query, role) => {
    const { data } = await fetchUsers({
      query: query || undefined,
      role: role || undefined,
    });
    setUsers(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    // Debounce search input
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      load(searchQuery, roleFilter);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery, roleFilter, load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(searchQuery, roleFilter);
  }, [load, searchQuery, roleFilter]);

  const renderItem = useCallback(({ item }) => (
    <AdminUserCard
      user={item}
      onPress={() => router.push({ pathname: '/(admin)/users/detail', params: { id: item.id } })}
    />
  ), []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder={t('admin.users.searchPlaceholder')}
        placeholderTextColor={colors.textTertiary}
        value={searchQuery}
        onChangeText={setSearchQuery}
        testID="input-user-search"
      />

      <View style={styles.filterBar}>
        {ROLE_FILTERS.map((f) => (
          <TouchableOpacity
            key={String(f.key)}
            style={[styles.filterChip, roleFilter === f.key && styles.filterChipActive]}
            onPress={() => setRoleFilter(f.key)}
          >
            <Text style={[styles.filterText, roleFilter === f.key && styles.filterTextActive]}>
              {t(f.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>{t('admin.users.noUsers')}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  searchInput: {
    margin: spacing.md,
    marginBottom: 0,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterBar: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    flexWrap: 'wrap',
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
});
