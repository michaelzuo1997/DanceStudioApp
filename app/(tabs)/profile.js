import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { supabase } from '../../src/lib/supabase';
import { Button } from '../../src/components/Button';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';

export default function ProfileScreen() {
  const { user, userInfo, signOut } = useAuth();
  const { t, locale, setLocale } = useLanguage();
  const [userBundles, setUserBundles] = useState([]);

  const displayName = userInfo?.name ?? userInfo?.full_name ?? user?.user_metadata?.full_name ?? 'Dancer';
  const email = user?.email ?? '';

  useEffect(() => {
    if (user) {
      fetchUserBundles();
    }
  }, [user]);

  const fetchUserBundles = async () => {
    const { data } = await supabase
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
    
    setUserBundles(data || []);
  };

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined'
        ? window.confirm(t('auth.signOutConfirm'))
        : true;
      if (!confirmed) return;
      signOut().finally(() => {
        try {
          router.dismissAll();
        } catch (e) {
          // dismissAll might not be available in all versions
        }
        router.replace('/(auth)');
      });
      return;
    }

    Alert.alert(
      t('common.signOut'), 
      t('auth.signOutConfirm'), 
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.signOut'),
          style: 'destructive',
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              Alert.alert(
                locale === 'zh' ? '登出失败' : 'Sign Out Failed',
                error.message || (locale === 'zh' ? '请重试' : 'Please try again')
              );
            }
            // Always navigate to auth landing page after local sign-out
            // Using dismissAll() then replace() ensures clean navigation state
            try {
              router.dismissAll();
            } catch (e) {
              // dismissAll might not be available in all versions
            }
            router.replace('/(auth)');
          },
        },
      ]
    );
  };

  const toggleLanguage = () => {
    setLocale(locale === 'en' ? 'zh' : 'en');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {String(displayName).charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{String(displayName)}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      {/* Language Toggle */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profile.language')}</Text>
        <TouchableOpacity style={styles.languageCard} onPress={toggleLanguage}>
          <View style={styles.languageToggle}>
            <View style={[styles.langOption, locale === 'en' && styles.langActive]}>
              <Text style={[styles.langText, locale === 'en' && styles.langTextActive]}>EN</Text>
            </View>
            <View style={[styles.langOption, locale === 'zh' && styles.langActive]}>
              <Text style={[styles.langText, locale === 'zh' && styles.langTextActive]}>中文</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* My Bundles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profile.myBundles')}</Text>
        {userBundles.length === 0 ? (
          <View style={styles.infoCard}>
            <Text style={styles.emptyBundles}>{t('profile.noBundles')}</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/classes/bundles')}>
              <Text style={styles.buyBundlesLink}>
                {locale === 'zh' ? '购买次卡 →' : 'Buy Bundles →'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.infoCard}>
            {userBundles.map((b, idx) => (
              <View key={b.id || idx} style={styles.bundleRow}>
                <View style={styles.bundleInfo}>
                  <Text style={styles.bundleCount}>{b.classes_remaining} {t('profile.classesLeft')}</Text>
                  {b.class_categories && (
                    <Text style={styles.bundleCategory}>
                      {locale === 'zh' ? b.class_categories.name_zh : b.class_categories.name_en}
                    </Text>
                  )}
                </View>
                <Text style={styles.bundleExpiry}>
                  {t('profile.expires')}: {new Date(b.expires_at).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profile.account')}</Text>
        <View style={styles.infoCard}>
          <InfoRow label={t('profile.fullName')} value={String(displayName)} />
          <InfoRow label={t('profile.email')} value={email} />
          <InfoRow label={t('profile.userId')} value={user?.id?.slice(0, 8) + '...' ?? 'N/A'} />
          <InfoRow
            label={t('profile.memberSince')}
            value={user?.created_at
              ? new Date(user.created_at).toLocaleDateString(undefined, {
                  year: 'numeric', month: 'long', day: 'numeric',
                })
              : 'N/A'
            }
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profile.balance')}</Text>
        <View style={styles.infoCard}>
          <InfoRow
            label={t('profile.balance')}
            value={`A$${Number(userInfo?.current_balance ?? 0).toFixed(2)}`}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profile.appInfo')}</Text>
        <View style={styles.infoCard}>
          <InfoRow label={t('profile.version')} value="1.0.0" />
          <InfoRow label={t('profile.platform')} value="iOS & Android" />
          <InfoRow label={t('profile.backend')} value="Supabase" />
        </View>
      </View>

      <Button
        title={t('common.signOut')}
        variant="danger"
        onPress={handleSignOut}
        style={styles.signOutBtn}
      />
    </ScrollView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl },
  avatarSection: { alignItems: 'center', marginBottom: spacing.xxl },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...colors.shadows.sm,
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: colors.white },
  name: { fontSize: fontSize.xl, fontWeight: '600', color: colors.text },
  email: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  section: { marginBottom: spacing.xxl },
  sectionTitle: { 
    fontSize: fontSize.xs, 
    fontWeight: '700', 
    color: colors.textSecondary, 
    marginBottom: spacing.md, 
    textTransform: 'uppercase', 
    letterSpacing: 1.5 
  },
  languageCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...colors.shadows.soft,
  },
  languageToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.full,
    padding: 2,
  },
  langOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.full,
  },
  langActive: {
    backgroundColor: colors.primary,
  },
  langText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  langTextActive: {
    color: colors.white,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    ...colors.shadows.soft,
    overflow: 'hidden',
  },
  emptyBundles: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.lg,
  },
  buyBundlesLink: {
    fontSize: fontSize.sm,
    color: colors.accent,
    fontWeight: '600',
    textAlign: 'center',
    paddingBottom: spacing.lg,
  },
  bundleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  bundleInfo: {
    flex: 1,
  },
  bundleCount: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.accent,
  },
  bundleCategory: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  bundleExpiry: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  infoLabel: { fontSize: fontSize.md, color: colors.textSecondary },
  infoValue: { fontSize: fontSize.md, fontWeight: '500', color: colors.text, maxWidth: '60%', textAlign: 'right' },
  signOutBtn: { marginTop: spacing.lg, marginBottom: spacing.xxxl },
});
