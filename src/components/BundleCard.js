import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, fontSize } from '../constants/theme';

export function BundleCard({ bundle, onPurchase, locale = 'en', currency = 'A$' }) {
  const perClassPrice = bundle.total_price / bundle.class_count;
  
  const getAudienceLabel = (audience) => {
    if (!audience) return null;
    if (locale === 'zh') {
      return audience === 'children' ? '少儿' : '成人';
    }
    return audience === 'children' ? 'Children' : 'Adult';
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onPurchase?.(bundle)}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <View style={styles.classCountBadge}>
          <Text style={styles.classCountNumber}>{bundle.class_count}</Text>
          <Text style={styles.classCountLabel}>
            {locale === 'zh' ? '节课' : 'classes'}
          </Text>
        </View>
        {bundle.audience && (
          <View style={styles.audienceBadge}>
            <Text style={styles.audienceText}>{getAudienceLabel(bundle.audience)}</Text>
          </View>
        )}
      </View>

      <View style={styles.priceSection}>
        <Text style={styles.totalPrice}>{currency}{Number(bundle.total_price).toFixed(0)}</Text>
        <Text style={styles.perClassPrice}>
          {locale === 'zh' 
            ? `${currency}${perClassPrice.toFixed(0)}/节` 
            : `${currency}${perClassPrice.toFixed(0)} per class`}
        </Text>
      </View>

      <View style={styles.expirySection}>
        <Text style={styles.expiryLabel}>
          {locale === 'zh' ? '有效期' : 'Valid for'}
        </Text>
        <Text style={styles.expiryValue}>
          {bundle.expiry_weeks} {locale === 'zh' ? '周' : 'weeks'}
        </Text>
      </View>

      {bundle.category_name && (
        <Text style={styles.categoryText}>{bundle.category_name}</Text>
      )}

      <View style={styles.buyButton}>
        <Text style={styles.buyButtonText}>
          {locale === 'zh' ? '购买' : 'Purchase'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...colors.shadows.soft,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  classCountBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  classCountNumber: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.white,
  },
  classCountLabel: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  audienceBadge: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  audienceText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  priceSection: {
    marginBottom: spacing.md,
  },
  totalPrice: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  perClassPrice: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  expirySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  expiryLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  expiryValue: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  categoryText: {
    fontSize: fontSize.xs,
    color: colors.accent,
    marginBottom: spacing.md,
  },
  buyButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  buyButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.white,
  },
});
