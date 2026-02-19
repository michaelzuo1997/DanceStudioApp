import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';
import { useLanguage } from '../../../src/context/LanguageContext';
import { supabase } from '../../../src/lib/supabase';
import { BundleCard } from '../../../src/components/BundleCard';
import { colors, spacing, fontSize, borderRadius } from '../../../src/constants/theme';

// Default bundles if database is empty
const DEFAULT_BUNDLES = [
  { id: '1', class_count: 10, expiry_weeks: 10, total_price: 180, category_id: null, audience: null },
  { id: '2', class_count: 20, expiry_weeks: 20, total_price: 340, category_id: null, audience: null },
  { id: '3', class_count: 30, expiry_weeks: 30, total_price: 480, category_id: null, audience: null },
  { id: '4', class_count: 40, expiry_weeks: 40, total_price: 600, category_id: null, audience: null },
];

export default function BundlesScreen() {
  const { user, refreshUserInfo } = useAuth();
  const { t, locale } = useLanguage();
  const [bundles, setBundles] = useState(DEFAULT_BUNDLES);
  const [categories, setCategories] = useState([]);
  const [userBundles, setUserBundles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    // Fetch bundles
    const { data: bundlesData } = await supabase
      .from('class_bundles')
      .select('*')
      .eq('is_active', true)
      .order('class_count', { ascending: true });

    if (bundlesData && bundlesData.length > 0) {
      setBundles(bundlesData);
    }

    // Fetch categories for display names
    const { data: categoriesData } = await supabase
      .from('class_categories')
      .select('*');

    if (categoriesData) {
      setCategories(categoriesData);
    }

    // Fetch user's active bundles
    if (user) {
      const { data: userBundlesData } = await supabase
        .from('user_bundles')
        .select(`
          *,
          class_bundles (class_count, expiry_weeks),
          class_categories (name_en, name_zh)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gt('classes_remaining', 0)
        .gt('expires_at', new Date().toISOString());

      setUserBundles(userBundlesData || []);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handlePurchase = async (bundle) => {
    if (!user) {
      Alert.alert(
        locale === 'zh' ? '请登录' : 'Sign In Required',
        locale === 'zh' ? '请先登录后再购买次卡' : 'Please sign in to purchase bundles',
        [
          { text: locale === 'zh' ? '取消' : 'Cancel', style: 'cancel' },
          { text: locale === 'zh' ? '登录' : 'Sign In', onPress: () => router.push('/(auth)/sign-in') },
        ]
      );
      return;
    }

    Alert.alert(
      locale === 'zh' ? '确认购买' : 'Confirm Purchase',
      locale === 'zh' 
        ? `确定要购买 ${bundle.class_count} 节课的次卡吗？\n价格: A$${bundle.total_price}`
        : `Purchase ${bundle.class_count} class bundle?\nPrice: A$${bundle.total_price}`,
      [
        { text: locale === 'zh' ? '取消' : 'Cancel', style: 'cancel' },
        { 
          text: locale === 'zh' ? '确认' : 'Confirm', 
          onPress: () => processPurchase(bundle) 
        },
      ]
    );
  };

  const processPurchase = async (bundle) => {
    setLoading(true);
    try {
      // Check balance (use limit(1) to avoid "Cannot coerce to single JSON" when 0 or 2+ rows)
      const { data: userRows, error: userError } = await supabase
        .from('Users Info')
        .select('current_balance')
        .eq('user_id', user.id)
        .limit(1);

      const userInfo = userRows?.[0];
      if (userError || !userInfo) {
        Alert.alert('Error', locale === 'zh' ? '无法获取用户信息' : 'Unable to fetch user info');
        setLoading(false);
        return;
      }

      const currentBalance = Number(userInfo.current_balance || 0);
      if (currentBalance < bundle.total_price) {
        Alert.alert(
          locale === 'zh' ? '余额不足' : 'Insufficient Balance',
          locale === 'zh' 
            ? `当前余额: A$${currentBalance.toFixed(2)}\n需要: A$${bundle.total_price}`
            : `Current balance: A$${currentBalance.toFixed(2)}\nRequired: A$${bundle.total_price}`,
          [
            { text: locale === 'zh' ? '取消' : 'Cancel', style: 'cancel' },
            { text: locale === 'zh' ? '充值' : 'Top Up', onPress: () => router.push('/(tabs)/balance') },
          ]
        );
        setLoading(false);
        return;
      }

      // Try RPC first
      const { data: rpcResult, error: rpcError } = await supabase.rpc('purchase_bundle', {
        p_bundle_id: bundle.id,
      });

      if (!rpcError && rpcResult?.ok) {
        await refreshUserInfo();
        await fetchData();
        Alert.alert(
          locale === 'zh' ? '购买成功' : 'Success',
          locale === 'zh' ? '次卡购买成功！' : 'Bundle purchased successfully!'
        );
      } else {
        // Manual fallback
        console.log('RPC failed, using manual fallback:', rpcError?.message);
        
        const newBalance = currentBalance - bundle.total_price;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (bundle.expiry_weeks * 7));

        // Deduct balance
        const { error: updateError } = await supabase
          .from('Users Info')
          .update({ current_balance: newBalance })
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        // Create user_bundle
        const { error: bundleError } = await supabase
          .from('user_bundles')
          .insert({
            user_id: user.id,
            bundle_id: bundle.id,
            category_id: bundle.category_id || null,
            audience: bundle.audience || null,
            classes_remaining: bundle.class_count,
            purchased_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            is_active: true,
          });

        if (bundleError) throw bundleError;

        // Log transaction
        await supabase.from('transactions').insert({
          user_id: user.id,
          type: 'purchase',
          amount: -bundle.total_price,
          balance_after: newBalance,
          description: `Purchased ${bundle.class_count} class bundle`,
          bundle_id: bundle.id,
        });

        await refreshUserInfo();
        await fetchData();
        Alert.alert(
          locale === 'zh' ? '购买成功' : 'Success',
          locale === 'zh' ? '次卡购买成功！' : 'Bundle purchased successfully!'
        );
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', error.message || 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (bundle) => {
    if (!bundle.category_id) return null;
    const cat = categories.find(c => c.id === bundle.category_id);
    if (!cat) return null;
    return locale === 'zh' ? cat.name_zh : cat.name_en;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('bundles.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* User's Active Bundles */}
        {userBundles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{locale === 'zh' ? '我的次卡' : 'My Active Bundles'}</Text>
            {userBundles.map((ub, idx) => (
              <View key={ub.id || idx} style={styles.userBundleCard}>
                <View style={styles.userBundleInfo}>
                  <Text style={styles.userBundleCount}>{ub.classes_remaining}</Text>
                  <Text style={styles.userBundleLabel}>
                    {locale === 'zh' ? '节剩余' : 'classes left'}
                  </Text>
                </View>
                <View style={styles.userBundleMeta}>
                  {ub.class_categories && (
                    <Text style={styles.userBundleCategory}>
                      {locale === 'zh' ? ub.class_categories.name_zh : ub.class_categories.name_en}
                    </Text>
                  )}
                  <Text style={styles.userBundleExpiry}>
                    {locale === 'zh' ? '到期: ' : 'Expires: '}
                    {new Date(ub.expires_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Available Bundles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {locale === 'zh' ? '购买次卡' : 'Purchase Class Pass'}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {locale === 'zh' 
              ? '次卡可用于预约任何符合条件的课程' 
              : 'Class passes can be used for any eligible class'}
          </Text>

          {bundles.map((bundle) => (
            <BundleCard
              key={bundle.id}
              bundle={{
                ...bundle,
                category_name: getCategoryName(bundle),
              }}
              onPurchase={handlePurchase}
              locale={locale}
              currency="A$"
            />
          ))}
        </View>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    padding: spacing.sm,
  },
  backText: {
    fontSize: fontSize.xl,
    color: colors.text,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: { 
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  userBundleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...colors.shadows.sm,
  },
  userBundleInfo: {
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  userBundleCount: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.accent,
  },
  userBundleLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  userBundleMeta: {
    flex: 1,
  },
  userBundleCategory: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  userBundleExpiry: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
