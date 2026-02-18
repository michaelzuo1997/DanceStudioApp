import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Button } from '../../src/components/Button';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';

export default function ProfileScreen() {
  const { user, userInfo, signOut } = useAuth();

  const displayName = userInfo?.name ?? userInfo?.full_name ?? user?.user_metadata?.full_name ?? 'Dancer';
  const email = user?.email ?? '';

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/sign-in');
        },
      },
    ]);
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.infoCard}>
          <InfoRow label="Full Name" value={String(displayName)} />
          <InfoRow label="Email" value={email} />
          <InfoRow label="User ID" value={user?.id?.slice(0, 8) + '...' ?? 'N/A'} />
          <InfoRow
            label="Member Since"
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
        <Text style={styles.sectionTitle}>Balance</Text>
        <View style={styles.infoCard}>
          <InfoRow
            label="Current Balance"
            value={`$${Number(userInfo?.current_balance ?? 0).toFixed(2)}`}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Info</Text>
        <View style={styles.infoCard}>
          <InfoRow label="Version" value="1.0.0" />
          <InfoRow label="Platform" value="iOS & Android" />
          <InfoRow label="Backend" value="Supabase" />
        </View>
      </View>

      <Button
        title="Sign Out"
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
  avatarSection: { alignItems: 'center', marginBottom: spacing.xxxl },
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
  avatarText: { fontSize: fontSize.xxxl, fontWeight: '700', color: colors.white },
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
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    ...colors.shadows.soft,
    overflow: 'hidden',
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
