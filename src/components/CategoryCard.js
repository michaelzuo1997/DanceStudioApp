import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, fontSize } from '../constants/theme';

export function CategoryCard({ category, classCount, onPress }) {
  const displayName = category.name_zh || category.name_en || category.key;
  const subtitle = category.name_en || category.key;
  
  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress} 
      activeOpacity={0.85}
    >
      <View style={styles.content}>
        {category.icon && (
          <Text style={styles.icon}>{category.icon}</Text>
        )}
        <Text style={styles.nameZh} numberOfLines={1}>{displayName}</Text>
        <Text style={styles.nameEn} numberOfLines={1}>{subtitle}</Text>
        {classCount !== undefined && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{classCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    minHeight: 140,
    ...colors.shadows.soft,
    overflow: 'hidden',
  },
  content: {
    padding: spacing.lg,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  nameZh: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  nameEn: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  countBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.white,
  },
});
