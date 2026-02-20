import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { Logo } from '../../src/components/Logo';
import { Button } from '../../src/components/Button';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';
import { useLanguage } from '../../src/context/LanguageContext';

export default function LandingPage() {
  const { t } = useLanguage();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Logo size="lg" />
            <Text style={styles.tagline}>{t('auth.landing.tagline')}</Text>
          </View>

          <View style={styles.actions}>
            <Link href="/(auth)/sign-in" asChild>
              <Button title={t('auth.signIn')} style={styles.button} />
            </Link>

            <Link href="/(auth)/sign-up" asChild>
              <Button title={t('auth.landing.createAccount')} variant="outline" style={styles.button} />
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  content: {
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl * 2,
  },
  tagline: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: spacing.md,
  },
  button: {
    width: '100%',
  },
});
