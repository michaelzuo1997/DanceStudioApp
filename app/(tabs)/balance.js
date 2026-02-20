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
import { useLanguage } from '../../src/context/LanguageContext';
import { supabase } from '../../src/lib/supabase';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';

export default function BalanceScreen() {
  const { user, userInfo, refreshUserInfo } = useAuth();
  const { t, locale } = useLanguage();
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
      setMessage(t('balance.enterAmount'));
      return;
    }
    const num = parseFloat(value);
    if (!Number.isFinite(num) || num <= 0) {
      setStatus('error');
      setMessage(t('balance.invalidAmount'));
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

    // Check if RPC call succeeded and returned ok: true
    if (!rpcError && result?.ok === true) {
      success = true;
      newBalance = result.new_balance;
    } else if (!rpcError && result?.ok === false) {
      // RPC returned ok: false with an error message
      setLoading(false);
      setStatus('error');
      setMessage(result?.error || t('balance.topUpFailed') || 'Top-up failed');
      return;
    } else {
      // RPC failed, try client-side fallback
      console.log('RPC failed, attempting client-side top-up:', rpcError.message);
      
      // Check if this is the updated_at trigger error - user needs to run migration
      if (rpcError.message && rpcError.message.includes('updated_at')) {
        setLoading(false);
        setStatus('error');
        setMessage(locale === 'zh' 
          ? '数据库需要更新。请运行最新的迁移脚本。' 
          : 'Database needs migration. Please run the latest migration script.');
        return;
      }
      
      // 1. Get current balance again to be safe (use limit(1) to avoid "Cannot coerce to single JSON" when 0 or 2+ rows)
      const { data: userRows, error: fetchError } = await supabase
        .from('Users Info')
        .select('current_balance')
        .eq('user_id', user.id)
        .limit(1);

      if (fetchError) {
        setLoading(false);
        setStatus('error');
        setMessage(`Failed to fetch user data: ${fetchError.message}`);
        return;
      }

      let userData = userRows?.[0];

      // If user profile doesn't exist, create it using upsert
      if (!userData) {
        console.log('Creating missing Users Info record for user:', user.id);
        const { error: createError } = await supabase
          .from('Users Info')
          .upsert({
            user_id: user.id,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            current_balance: 0,
          }, {
            onConflict: 'user_id',
            ignoreDuplicates: true,
          });

        if (createError) {
          setLoading(false);
          setStatus('error');
          setMessage(`Failed to create profile: ${createError.message}`);
          return;
        }

        // Fetch the newly created (or existing) record
        const { data: newUserRows } = await supabase
          .from('Users Info')
          .select('current_balance')
          .eq('user_id', user.id)
          .limit(1);

        userData = newUserRows?.[0];
        if (!userData) {
          setLoading(false);
          setStatus('error');
          setMessage('Failed to fetch user profile after creation.');
          return;
        }
      }

      const currentBal = Number(userData?.current_balance ?? 0);
      const updatedBal = currentBal + num;

      // 2. Update balance - try with updated_at first, then without if it fails
      let updateError = null;
      
      // First try with updated_at (for databases where column exists)
      const updateResult = await supabase
        .from('Users Info')
        .update({ current_balance: updatedBal, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      updateError = updateResult.error;
      
      // If updated_at column doesn't exist, try without it
      if (updateError && updateError.message && updateError.message.includes('updated_at')) {
        console.log('updated_at column not found, trying without it');
        const retryResult = await supabase
          .from('Users Info')
          .update({ current_balance: updatedBal })
          .eq('user_id', user.id);
        updateError = retryResult.error;
      }

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
          type: 'topup',  // Must match CHECK constraint: 'topup', 'purchase', 'refund'
          balance_after: updatedBal,
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
      setMessage(t('balance.topUpSuccess'));
      setAmount('');
    }
  };

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.warningText}>{t('cart.signInRequired')}</Text>
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
          <Text style={styles.balanceLabel}>{t('balance.totalBalance')}</Text>
          <Text style={styles.balanceCurrency}>AUD</Text>
        </View>
        <Text style={styles.balanceValue}>A${Number(balance).toFixed(2)}</Text>
        <Text style={styles.balanceHint}>
          {t('balance.readyToSpend')}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>{t('balance.quickTopUp')}</Text>
      <View style={styles.topUpCard}>
        <View style={styles.presetGrid}>
          {[10, 25, 50, 100].map((preset) => (
            <Button
              key={preset}
              title={`A$${preset}`}
              variant="outline"
              size="sm"
              onPress={() => setAmount(String(preset))}
              style={styles.presetBtn}
              textStyle={styles.presetBtnText}
            />
          ))}
        </View>

        <Input
          label={t('balance.customAmount')}
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
          title={loading ? t('balance.processing') : t('balance.addFunds')}
          onPress={handleTopUp}
          loading={loading}
          size="lg"
        />
      </View>

      <View style={styles.infoCard}>
         <Text style={styles.infoText}>
           {t('balance.fundsInfo')}
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
