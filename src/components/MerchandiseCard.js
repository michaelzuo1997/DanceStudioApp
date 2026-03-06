import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { colors, spacing, fontSize, borderRadius, fontFamily } from '../constants/theme';

export function MerchandiseCard({ item, cartQuantity, onAddToCart, onUpdateQuantity }) {
  const { t, locale } = useLanguage();

  if (!item) return null;

  const name = locale === 'zh' ? item.name_zh : item.name_en;
  const outOfStock = item.stock <= 0;
  const inCart = cartQuantity > 0;

  return (
    <View style={styles.card} testID={`merch-card-${item.id}`}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="cube-outline" size={40} color={colors.textTertiary} />
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{name}</Text>
        <Text style={styles.price}>A${Number(item.price).toFixed(2)}</Text>

        {outOfStock ? (
          <View style={styles.stockBadgeOut}>
            <Text style={styles.stockTextOut}>{t('shop.outOfStock')}</Text>
          </View>
        ) : (
          <View style={styles.stockBadgeIn}>
            <Text style={styles.stockTextIn}>{t('shop.inStock')}</Text>
          </View>
        )}
      </View>

      {inCart ? (
        <View style={styles.stepper}>
          <Pressable
            style={({ pressed }) => [styles.stepButton, pressed && { opacity: 0.7 }]}
            onPress={() => onUpdateQuantity(item.id, cartQuantity - 1)}
            testID={`merch-minus-${item.id}`}
          >
            <Text style={styles.stepText}>−</Text>
          </Pressable>
          <Text style={styles.qtyText}>{cartQuantity}</Text>
          <Pressable
            style={({ pressed }) => [styles.stepButton, pressed && { opacity: 0.7 }]}
            onPress={() => onUpdateQuantity(item.id, cartQuantity + 1)}
            testID={`merch-plus-${item.id}`}
          >
            <Text style={styles.stepText}>+</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [styles.addButton, outOfStock && styles.addButtonDisabled, pressed && { opacity: 0.85 }]}
          onPress={() => !outOfStock && onAddToCart(item)}
          disabled={outOfStock}
          testID={`merch-add-${item.id}`}
        >
          <Text style={[styles.addButtonText, outOfStock && styles.addButtonTextDisabled]}>
            {t('shop.addToCart')}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    ...colors.shadows.sm,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  info: {
    marginBottom: spacing.sm,
  },
  name: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  price: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  stockBadgeIn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  stockTextIn: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.white,
  },
  stockBadgeOut: {
    alignSelf: 'flex-start',
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  stockTextOut: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.white,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  stepButton: {
    width: 30,
    height: 30,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
  },
  qtyText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: colors.surfaceAlt,
  },
  addButtonText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.white,
  },
  addButtonTextDisabled: {
    color: colors.textTertiary,
  },
});
