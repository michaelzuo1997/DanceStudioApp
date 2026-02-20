import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useCart } from '../../src/context/CartContext';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { supabase } from '../../src/lib/supabase';
import { Button } from '../../src/components/Button';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';

export default function CartScreen() {
  const { items, removeItem, total, clear } = useCart();
  const { user, refreshUserInfo } = useAuth();
  const { t, locale } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle');

  const handleCheckout = async () => {
    if (!user) {
      Alert.alert(
        locale === 'zh' ? '请登录' : 'Sign In Required', 
        locale === 'zh' ? '请先登录后再结账' : 'Please sign in to checkout.', 
        [
          { text: locale === 'zh' ? '取消' : 'Cancel' },
          { text: locale === 'zh' ? '登录' : 'Sign In', onPress: () => router.push('/(auth)/sign-in') },
        ]
      );
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

  const resetStateIfEmpty = useCallback(() => {
    if (items.length === 0) {
      setStatus('idle');
      setMessage('');
    }
  }, [items.length]);

  useEffect(() => {
    resetStateIfEmpty();
  }, [resetStateIfEmpty]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            {status === 'success' ? t('cart.allEnrolled') : t('cart.empty')}
          </Text>
          {status === 'success' && (
            <Text style={styles.successMessage}>{message}</Text>
          )}
          <TouchableOpacity
            style={styles.browseLink}
            onPress={() => router.push('/(tabs)/classes')}
          >
            <Text style={styles.browseLinkText}>{t('cart.browseClasses')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {items.map((c) => (
            <View key={c.id} style={styles.cartItem}>
              <View style={styles.cartItemLeft}>
                <Text style={styles.cartItemName} numberOfLines={1}>{c.name}</Text>
                <Text style={styles.cartItemMeta}>
                  {c.class_date
                    ? new Date(`${c.class_date}T${c.start_time || '00:00'}`).toLocaleDateString(undefined, {
                        weekday: 'short', month: 'short', day: 'numeric',
                      })
                    : ''}
                  {' \u2022 A$'}{Number(c.price || 0).toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => removeItem(c.id)}>
                <Text style={styles.removeText}>{t('cart.remove')}</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.totalCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('cart.total')}</Text>
              <Text style={styles.totalValue}>A${total.toFixed(2)}</Text>
            </View>

            {message ? (
              <Text style={[styles.message, status === 'error' ? styles.errorMsg : styles.successMsg]}>
                {message}
              </Text>
            ) : null}

            <Button
              title={loading ? t('balance.processing') : t('common.checkout')}
              onPress={handleCheckout}
              loading={loading}
              style={styles.checkoutBtn}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    ...colors.shadows.soft,
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  emptyText: { fontSize: fontSize.lg, color: colors.textSecondary, fontWeight: '500' },
  successMessage: { fontSize: fontSize.sm, color: colors.success, marginTop: spacing.sm, textAlign: 'center' },
  browseLink: { marginTop: spacing.xl },
  browseLinkText: { fontSize: fontSize.md, color: colors.accent, fontWeight: '600' },
  cartItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    ...colors.shadows.soft,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartItemLeft: { flex: 1, marginRight: spacing.md },
  cartItemName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  cartItemMeta: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  removeText: { fontSize: fontSize.sm, color: colors.error, fontWeight: '500' },
  totalCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    ...colors.shadows.soft,
    padding: spacing.xl,
    marginTop: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  totalValue: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.text },
  message: { fontSize: fontSize.sm, marginTop: spacing.md, textAlign: 'center' },
  errorMsg: { color: colors.error },
  successMsg: { color: colors.success },
  checkoutBtn: { marginTop: spacing.lg },
});
