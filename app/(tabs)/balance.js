import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';

export default function BalanceScreen() {
  const { user, userInfo, refreshUserInfo } = useAuth();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle');
  const [refreshing, setRefreshing] = useState(false);

  const balance = userInfo?.current_balance ?? 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshUserInfo();
    setRefreshing(false);
  }, [refreshUserInfo]);

  const handleTopUp = async () => {
    const value = amount.trim();
    if (!value) {
      setStatus('error');
      setMessage('Enter an amount to add.');
      return;
    }
    const num = parseFloat(value);
    if (!Number.isFinite(num) || num <= 0) {
      setStatus('error');
      setMessage('Enter a valid amount greater than 0.');
      return;
    }

    setLoading(true);
    setMessage('');
    setStatus('idle');

    const { data: result, error: rpcError } = await supabase.rpc('topup_balance', {
      p_amount: num,
    });

    let success = false;
    let newBalance = null;

    if (!rpcError) {
      // RPC succeeded
      success = true;
    } else {
      // RPC failed, try client-side fallback
      console.log('RPC failed, attempting client-side top-up:', rpcError.message);
      
      // 1. Get current balance again to be safe
      const { data: userData, error: fetchError } = await supabase
        .from('Users Info')
        .select('current_balance')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        setLoading(false);
        setStatus('error');
        setMessage(`Failed to fetch user data: ${fetchError.message}`);
        return;
      }

      const currentBal = Number(userData?.current_balance ?? 0);
      const updatedBal = currentBal + num;

      // 2. Update balance
      const { error: updateError } = await supabase
        .from('Users Info')
        .update({ current_balance: updatedBal })
        .eq('user_id', user.id);

      if (updateError) {
        setLoading(false);
        setStatus('error');
        setMessage(`Failed to update balance: ${updateError.message}`);
        return;
      }

      // 3. Try to log transaction (best effort)
      try {
        await supabase.from('transactions').insert({
          user_id: user.id,
          amount: num,
          type: 'top_up',
          created_at: new Date().toISOString(),
          description: 'Balance Top Up'
        });
      } catch (e) {
        console.warn('Failed to log transaction:', e);
      }

      success = true;
    }

    if (success) {
      await refreshUserInfo();
      setLoading(false);
      setStatus('success');
      setMessage('Balance topped up successfully!');
      setAmount('');
    }
  };

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.warningText}>Sign in to view your balance.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceCurrency}>USD</Text>
        </View>
        <Text style={styles.balanceValue}>${Number(balance).toFixed(2)}</Text>
        <Text style={styles.balanceHint}>
          Ready to spend
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Quick Top Up</Text>
      <View style={styles.topUpCard}>
        <View style={styles.presetGrid}>
          {[10, 25, 50, 100].map((preset) => (
            <Button
              key={preset}
              title={`$${preset}`}
              variant="outline"
              size="sm"
              onPress={() => setAmount(String(preset))}
              style={styles.presetBtn}
              textStyle={styles.presetBtnText}
            />
          ))}
        </View>

        <Input
          label="Custom amount"
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
          editable={!loading}
          style={styles.amountInput}
        />

        {message ? (
          <View style={[styles.messageBox, status === 'error' ? styles.errorBox : styles.successBox]}>
            <Text style={[styles.messageText, status === 'error' ? styles.errorText : styles.successText]}>
              {message}
            </Text>
          </View>
        ) : null}

        <Button
          title={loading ? 'Processing...' : 'Add Funds'}
          onPress={handleTopUp}
          loading={loading}
          size="lg"
        />
      </View>

      <View style={styles.infoCard}>
         <Text style={styles.infoText}>
           Funds are added immediately and can be used for any class booking.
         </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.background,
  },
  warningText: { fontSize: fontSize.md, color: colors.warning, fontWeight: '500' },
  
  balanceCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...colors.shadows.lg,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  balanceLabel: { 
    fontSize: fontSize.sm, 
    fontWeight: '600', 
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceCurrency: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    fontWeight: '700',
  },
  balanceValue: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: -1,
  },
  balanceHint: { 
    fontSize: fontSize.sm, 
    color: colors.textTertiary, 
    marginTop: spacing.xs 
  },
  
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  topUpCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...colors.shadows.sm,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  presetBtn: {
    flex: 1,
    minWidth: '45%',
  },
  presetBtnText: {
    fontSize: fontSize.lg,
  },
  amountInput: {
    marginBottom: spacing.lg,
  },
  
  messageBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
  },
  successBox: {
    backgroundColor: '#ECFDF5',
  },
  messageText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  errorText: { color: colors.error },
  successText: { color: colors.success },
  
  infoCard: {
    padding: spacing.lg,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
