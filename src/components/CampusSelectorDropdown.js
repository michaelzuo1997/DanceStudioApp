import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useCampus } from '../context/CampusContext';
import { useLanguage } from '../context/LanguageContext';
import { colors, spacing, fontSize, borderRadius, fontFamily } from '../constants/theme';

export function CampusSelectorDropdown() {
  const [modalVisible, setModalVisible] = useState(false);
  const { campuses, selectedCampus, setSelectedCampus, loading } = useCampus();
  const { t, locale } = useLanguage();

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.trigger, { opacity: 0.5 }]}>
          <Text style={styles.triggerText}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  const selected = selectedCampus
    ? campuses.find((c) => c.id === selectedCampus)
    : null;

  const displayName = selected
    ? (locale === 'zh' ? selected.name_zh : selected.name_en)
    : t('campus.all');

  const handleSelect = (campusId) => {
    setSelectedCampus(campusId);
    setModalVisible(false);
  };

  const allOption = { id: null, name_en: 'All Campuses', name_zh: '所有校区' };
  const options = [allOption, ...campuses];

  const renderOption = ({ item }) => {
    const isActive = item.id === selectedCampus;
    const name = locale === 'zh' ? item.name_zh : item.name_en;
    return (
      <Pressable
        style={({ pressed }) => [styles.option, isActive && styles.optionActive, pressed && { opacity: 0.85 }]}
        onPress={() => handleSelect(item.id)}
        testID={`campus-option-${item.id ?? 'all'}`}
      >
        <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
          {name}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [styles.trigger, pressed && { opacity: 0.85 }]}
        onPress={() => setModalVisible(true)}
        testID="campus-dropdown-trigger"
      >
        <Text style={styles.triggerText} numberOfLines={1}>{displayName}</Text>
        <Text style={styles.chevron}>{modalVisible ? '▲' : '▼'}</Text>
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.dropdownSheet}>
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.id ?? 'all')}
              renderItem={renderOption}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  triggerText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
    flexShrink: 1,
  },
  chevron: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: spacing.xl,
  },
  dropdownSheet: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    maxHeight: 400,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  optionActive: {
    backgroundColor: colors.surfaceAlt,
  },
  optionText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodyRegular,
    color: colors.text,
  },
  optionTextActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
});
