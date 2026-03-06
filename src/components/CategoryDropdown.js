import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { colors, spacing, fontSize, borderRadius, fontFamily } from '../constants/theme';

export function CategoryDropdown({ categories, selectedCategoryId, onSelect }) {
  const [modalVisible, setModalVisible] = useState(false);
  const { t, locale } = useLanguage();

  const selectedCategory = selectedCategoryId
    ? categories.find((c) => c.id === selectedCategoryId)
    : null;

  const displayName = selectedCategory
    ? (locale === 'zh' ? selectedCategory.name_zh : selectedCategory.name_en)
    : t('classes.allCategories');

  const handleSelect = (categoryId) => {
    onSelect(categoryId);
    setModalVisible(false);
  };

  const allOption = { id: null, name_en: 'All Categories', name_zh: '所有课程', icon: '✨' };
  const options = [allOption, ...categories];

  const renderOption = ({ item }) => {
    const isActive = item.id === selectedCategoryId;
    const name = locale === 'zh' ? item.name_zh : item.name_en;
    return (
      <Pressable
        style={({ pressed }) => [styles.option, isActive && styles.optionActive, pressed && { opacity: 0.85 }]}
        onPress={() => handleSelect(item.id)}
        testID={`category-option-${item.id ?? 'all'}`}
      >
        {item.icon ? <Text style={styles.optionIcon}>{item.icon}</Text> : null}
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
        testID="category-dropdown-trigger"
      >
        <Text style={styles.triggerText}>{displayName}</Text>
        <Text style={styles.chevron}>▼</Text>
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
  container: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  triggerText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodySemiBold,
    fontWeight: '600',
    color: colors.text,
  },
  chevron: {
    fontSize: fontSize.xs,
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
  optionIcon: {
    fontSize: fontSize.lg,
    marginRight: spacing.sm,
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
