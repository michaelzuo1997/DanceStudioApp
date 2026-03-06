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
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { colors, spacing, fontSize, borderRadius, fontFamily } from '../constants/theme';

export function ClassCartSheet({ visible, onClose }) {
  const { items, removeItem, total, clear } = useCart();
  const { user, refreshUserInfo } = useAuth();
  const { t, locale } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle');

  const handleCheckout = async () => {
    if (!user) {
      Alert.alert(t('common.error'), t('cart.signInRequired'));
      return;
    }

    setLoading(true);
    setMessage('');
    setStatus('idle');

    const results = [];
    for (const item of items) {
      const timetableId = item.timetable_id || item.id;
      if (!timetableId) {
        results.push({ ok: false, error: 'Missing timetable id' });
        continue;
      }
      const { data, error } = await supabase.rpc('book_class', { p_timetable_id: timetableId });
      if (error || data?.ok === false) {
        results.push({ ok: false, error: error?.message || data?.error || 'Booking failed' });
      } else {
        results.push({ ok: true });
      }
    }

    const failed = results.filter((r) => !r.ok);
    const succeeded = results.length - failed.length;

    if (failed.length > 0) {
      setStatus('error');
      setMessage(`${succeeded} booked, ${failed.length} failed. ${failed[0]?.error || ''}`);
      setLoading(false);
      return;
    }

    await refreshUserInfo();
    clear();
    setLoading(false);
    setStatus('success');
    setMessage(t('cart.checkoutSuccess'));
  };

  const renderItem = ({ item }) => (
    <View style={styles.cartItem} testID={`class-cart-item-${item.id}`}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemMeta}>
          {item.class_date
            ? new Date(`${item.class_date}T${item.start_time || '00:00'}`).toLocaleDateString(undefined, {
                weekday: 'short', month: 'short', day: 'numeric',
              })
            : ''}
          {' \u2022 A$'}{Number(item.price || 0).toFixed(2)}
        </Text>
      </View>
      <Pressable onPress={() => removeItem(item.id)}>
        <Text style={styles.removeText}>{t('cart.remove')}</Text>
      </Pressable>
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
          <Text style={styles.title}>{t('screens.cart')}</Text>

          {items.length === 0 ? (
            <Text style={styles.emptyText}>
              {status === 'success' ? t('cart.allEnrolled') : t('cart.empty')}
            </Text>
          ) : (
            <>
              <FlatList
                data={items}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderItem}
                style={styles.list}
              />
              {message ? (
                <Text style={[styles.message, status === 'error' ? styles.errorMsg : styles.successMsg]}>
                  {message}
                </Text>
              ) : null}
              <View style={styles.footer}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>{t('cart.total')}</Text>
                  <Text style={styles.totalValue}>A${total.toFixed(2)}</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.checkoutButton, pressed && { opacity: 0.85 }]}
                  onPress={handleCheckout}
                  disabled={loading}
                  testID="class-checkout-button"
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={styles.checkoutText}>{t('common.checkout')}</Text>
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
  itemMeta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  removeText: {
    fontSize: fontSize.sm,
    color: colors.error,
    fontFamily: fontFamily.bodySemiBold,
  },
  message: {
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  errorMsg: { color: colors.error },
  successMsg: { color: colors.success },
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
