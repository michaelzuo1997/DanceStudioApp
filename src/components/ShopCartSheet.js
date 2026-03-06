import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useShopCart } from '../context/ShopCartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { colors, spacing, fontSize, borderRadius, fontFamily } from '../constants/theme';

export function ShopCartSheet({ visible, onClose }) {
  const { items, removeItem, updateQuantity, total, clear } = useShopCart();
  const { user, refreshUserInfo } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      Alert.alert(t('common.error'), t('cart.signInRequired'));
      return;
    }

    setLoading(true);
    const payload = items.map((i) => ({ item_id: i.id, quantity: i.quantity || 1 }));
    const { data, error } = await supabase.rpc('purchase_merchandise', { p_items: payload });

    if (error || data?.ok === false) {
      const msg = error?.message || data?.error || t('shop.checkoutFailed') || 'Checkout failed';
      Alert.alert(t('common.error'), msg);
      setLoading(false);
      return;
    }

    await refreshUserInfo();
    clear();
    setLoading(false);
    Alert.alert(t('common.success'), t('shop.checkoutSuccess'));
    onClose();
  };

  const renderItem = ({ item }) => (
    <View style={styles.cartItem} testID={`shop-cart-item-${item.id}`}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name_en}</Text>
        <Text style={styles.itemPrice}>A${Number(item.price).toFixed(2)}</Text>
      </View>
      <View style={styles.itemActions}>
        <View style={styles.stepper}>
          <Pressable
            style={({ pressed }) => [styles.stepBtn, pressed && { opacity: 0.7 }]}
            onPress={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
          >
            <Text style={styles.stepText}>−</Text>
          </Pressable>
          <Text style={styles.qtyText}>{item.quantity || 1}</Text>
          <Pressable
            style={({ pressed }) => [styles.stepBtn, pressed && { opacity: 0.7 }]}
            onPress={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
          >
            <Text style={styles.stepText}>+</Text>
          </Pressable>
        </View>
        <Pressable onPress={() => removeItem(item.id)}>
          <Text style={styles.removeText}>{t('cart.remove')}</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>{t('shop.viewCart')}</Text>

          {items.length === 0 ? (
            <Text style={styles.emptyText}>{t('cart.empty')}</Text>
          ) : (
            <>
              <FlatList
                data={items}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderItem}
                style={styles.list}
              />
              <View style={styles.footer}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>{t('cart.total')}</Text>
                  <Text style={styles.totalValue}>A${total.toFixed(2)}</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.checkoutButton, pressed && { opacity: 0.85 }]}
                  onPress={handleCheckout}
                  disabled={loading}
                  testID="shop-checkout-button"
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={styles.checkoutText}>{t('shop.checkout')}</Text>
                  )}
                </Pressable>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '70%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.headingSemiBold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  list: {
    maxHeight: 300,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  itemName: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
  },
  itemPrice: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemActions: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
  },
  qtyText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
    minWidth: 20,
    textAlign: 'center',
  },
  removeText: {
    fontSize: fontSize.xs,
    color: colors.error,
    fontFamily: fontFamily.bodySemiBold,
  },
  footer: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  totalLabel: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
  },
  totalValue: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.headingSemiBold,
    color: colors.text,
  },
  checkoutButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  checkoutText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.white,
  },
});
