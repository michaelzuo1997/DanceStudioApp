import { useState } from 'react';
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
import { supabase } from '../../src/lib/supabase';
import { Button } from '../../src/components/Button';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';

export default function CartScreen() {
  const { items, removeItem, total, clear } = useCart();
  const { user, refreshUserInfo } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle');

  const handleCheckout = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to checkout.', [
        { text: 'Cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/sign-in') },
      ]);
      return;
    }

    setLoading(true);
    setMessage('');
    setStatus('idle');

    // Check balance
    const { data: userRows, error: userError } = await supabase
      .from('Users Info')
      .select('current_balance')
      .eq('user_id', user.id)
      .limit(1);

    if (userError || !userRows?.length) {
      setLoading(false);
      setStatus('error');
      setMessage('No balance record found. Please contact support.');
      return;
    }

    const currentBalance = Number(userRows[0]?.current_balance ?? 0);
    if (currentBalance < total) {
      setLoading(false);
      setStatus('error');
      setMessage(`Insufficient balance ($${currentBalance.toFixed(2)}). Top up first.`);
      return;
    }

    // Verify class prices
    const classIds = items.map((i) => i.id);
    const { data: classRows, error: classesError } = await supabase
      .from('CLASSES')
      .select('id, price, cost')
      .in('id', classIds);

    if (classesError) {
      setLoading(false);
      setStatus('error');
      setMessage(`Failed to verify classes: ${classesError.message}`);
      return;
    }

    const computedTotal = (classRows ?? []).reduce(
      (sum, c) => sum + Number(c.price ?? c.cost ?? 0), 0
    );

    if (Math.abs(computedTotal - total) > 0.01) {
      setLoading(false);
      setStatus('error');
      setMessage('Cart total mismatch. Please refresh and try again.');
      return;
    }

    // Deduct balance
    const newBalance = currentBalance - total;
    const { error: updateError } = await supabase
      .from('Users Info')
      .update({ current_balance: newBalance })
      .eq('user_id', user.id);

    if (updateError) {
      setLoading(false);
      setStatus('error');
      setMessage(`Failed to update balance: ${updateError.message}`);
      return;
    }

    // Log transaction
    try {
      await supabase.from('transactions').insert({
        user_id: user.id,
        amount: -total, // Negative for spending
        type: 'purchase',
        created_at: new Date().toISOString(),
        description: `Purchased ${items.length} class${items.length > 1 ? 'es' : ''}`
      });
    } catch (e) {
      console.warn('Failed to log purchase transaction:', e);
      // Continue - this is non-blocking for the user
    }

    // Insert enrollments
    const enrollments = classIds.map((class_id) => ({
      user_id: user.id,
      class_id,
    }));

    const { error: insertError } = await supabase
      .from('enrollments')
      .insert(enrollments);

    if (insertError) {
      setLoading(false);
      setStatus('error');
      setMessage(`Payment succeeded but enrollment failed: ${insertError.message}`);
      return;
    }

    await refreshUserInfo();
    clear();
    setLoading(false);
    setStatus('success');
    setMessage('Checkout successful! Your classes have been enrolled.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            {status === 'success' ? 'All enrolled!' : 'Your cart is empty.'}
          </Text>
          {status === 'success' && (
            <Text style={styles.successMessage}>{message}</Text>
          )}
          <TouchableOpacity
            style={styles.browseLink}
            onPress={() => router.push('/(tabs)/classes')}
          >
            <Text style={styles.browseLinkText}>Browse classes</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {items.map((c) => (
            <View key={c.id} style={styles.cartItem}>
              <View style={styles.cartItemLeft}>
                <Text style={styles.cartItemName} numberOfLines={1}>{c.name}</Text>
                <Text style={styles.cartItemMeta}>
                  {c.start_time
                    ? new Date(c.start_time).toLocaleDateString(undefined, {
                        weekday: 'short', month: 'short', day: 'numeric',
                      })
                    : ''}
                  {' \u2022 $'}{c.price.toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => removeItem(c.id)}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.totalCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>

            {message ? (
              <Text style={[styles.message, status === 'error' ? styles.errorMsg : styles.successMsg]}>
                {message}
              </Text>
            ) : null}

            <Button
              title={loading ? 'Processing...' : 'Checkout'}
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
