import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Modal, TextInput, FlatList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { searchUsers } from '../../lib/admin/userSearchService';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';

export function UserSearchModal({ visible, onClose, onSelectUser }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async (text) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const { data } = await searchUsers(text);
    setResults(data);
    setLoading(false);
  }, []);

  const handleSelect = useCallback((userId) => {
    setQuery('');
    setResults([]);
    onSelectUser(userId);
  }, [onSelectUser]);

  const handleClose = useCallback(() => {
    setQuery('');
    setResults([]);
    onClose();
  }, [onClose]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('admin.searchUsers')}</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.closeBtn}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            value={query}
            onChangeText={handleSearch}
            placeholder={t('admin.searchPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            autoFocus
          />

          {loading && <ActivityIndicator style={styles.loader} color={colors.accent} />}

          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.resultRow} onPress={() => handleSelect(item.user_id)}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(item.name || item.full_name || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{item.name || item.full_name}</Text>
                  <Text style={styles.resultRole}>{item.role}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              query.length >= 2 && !loading ? (
                <Text style={styles.emptyText}>{t('admin.noResults')}</Text>
              ) : null
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  closeBtn: {
    fontSize: fontSize.md,
    color: colors.accent,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.md,
  },
  loader: { marginVertical: spacing.md },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
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
  resultInfo: { flex: 1 },
  resultName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  resultRole: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.xl,
  },
});
