import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, Platform, RefreshControl,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../../../src/context/LanguageContext';
import { fetchClassById } from '../../../src/lib/admin/classService';
import {
  fetchEnrollmentsForClass,
  adminUnenrollUser,
  adminBulkUnenroll,
} from '../../../src/lib/admin/enrollmentService';
import { EnrollmentRow } from '../../../src/components/admin/EnrollmentRow';
import { UserSearchModal } from '../../../src/components/admin/UserSearchModal';
import { adminEnrollUser } from '../../../src/lib/admin/enrollmentService';
import { colors, spacing, fontSize, borderRadius } from '../../../src/constants/theme';

export default function EnrollmentsScreen() {
  const { id } = useLocalSearchParams();
  const { t } = useLanguage();

  const [classInfo, setClassInfo] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const load = useCallback(async () => {
    const [classRes, enrollRes] = await Promise.all([
      fetchClassById(id),
      fetchEnrollmentsForClass(id),
    ]);
    setClassInfo(classRes.data);
    setEnrollments(enrollRes.data);
    setLoading(false);
    setRefreshing(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const handleRemove = useCallback(async (enrollmentId) => {
    const doRemove = async () => {
      const { error } = await adminUnenrollUser(enrollmentId);
      if (error) {
        const msg = error.message || t('admin.unenrollFailed');
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert(t('common.error'), msg);
        return;
      }
      load();
    };

    if (Platform.OS === 'web') {
      if (window.confirm(t('admin.unenrollConfirm'))) doRemove();
    } else {
      Alert.alert(t('admin.unenrollUser'), t('admin.unenrollConfirm'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('admin.removeUser'), style: 'destructive', onPress: doRemove },
      ]);
    }
  }, [load, t]);

  const handleBulkRemove = useCallback(async () => {
    const doRemove = async () => {
      const { error } = await adminBulkUnenroll(id);
      if (error) {
        const msg = error.message || t('admin.unenrollFailed');
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert(t('common.error'), msg);
        return;
      }
      load();
    };

    if (Platform.OS === 'web') {
      if (window.confirm(t('admin.bulkUnenrollConfirm'))) doRemove();
    } else {
      Alert.alert(t('admin.bulkUnenroll'), t('admin.bulkUnenrollConfirm'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('admin.removeUser'), style: 'destructive', onPress: doRemove },
      ]);
    }
  }, [id, load, t]);

  const handleEnrollUser = useCallback(async (userId) => {
    const { error } = await adminEnrollUser(id, userId, { paymentType: 'cash' });
    setShowSearch(false);
    if (error) {
      const msg = error.message || t('admin.enrollFailed');
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert(t('common.error'), msg);
      return;
    }
    load();
  }, [id, load, t]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Class Info Header */}
      {classInfo && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {classInfo.class_categories
              ? classInfo.class_categories.name_en
              : 'Class'}
          </Text>
          <Text style={styles.headerSub}>
            {classInfo.start_time} · {enrollments.length} {t('admin.enrolled')}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowSearch(true)}>
          <Text style={styles.actionBtnText}>{t('admin.addUser')}</Text>
        </TouchableOpacity>
        {enrollments.length > 0 && (
          <TouchableOpacity style={[styles.actionBtn, styles.dangerBtn]} onPress={handleBulkRemove}>
            <Text style={[styles.actionBtnText, styles.dangerText]}>{t('admin.bulkUnenroll')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Enrollment List */}
      <FlatList
        data={enrollments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EnrollmentRow enrollment={item} onRemove={() => handleRemove(item.id)} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>{t('admin.noEnrollments')}</Text>
          </View>
        }
      />

      {/* User Search Modal */}
      <UserSearchModal
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        onSelectUser={handleEnrollUser}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  header: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  headerSub: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.white,
  },
  dangerBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.error,
  },
  dangerText: {
    color: colors.error,
  },
  list: { padding: spacing.md },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary },
});
