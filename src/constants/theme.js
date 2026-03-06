import { StyleSheet } from 'react-native';

// ─── Color Tokens (MASTER-RN Design System) ────────────────────────
export const colors = {
  // Primary Brand — Warm earthy tones
  primary: '#8B6F5E',
  primaryLight: '#A68B7B',
  primaryDark: '#6B5245',

  // Accent / CTA
  accent: '#C5896E',
  accentLight: '#D6A692',
  accentDark: '#A66D55',
  accentContrast: '#FFFFFF',
  cta: '#D4A574',

  // Backgrounds — Warm & Soft
  background: '#FBF8F5',
  surface: '#F5EDE6',
  surfaceAlt: '#EDE4DB',

  // Text — Deep warm brown
  text: '#3D2E24',
  textSecondary: '#8B7B6F',
  textTertiary: '#A69E96',
  textInverse: '#FFFFFF',

  // Borders — Warm
  border: '#E8DDD4',
  borderLight: '#F0E8E0',

  // Status
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Misc
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.4)',

  // Shadows
  shadows: {
    sm: {
      shadowColor: '#3D2E24',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#3D2E24',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor: '#3D2E24',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 8,
    },
    soft: {
      shadowColor: '#C5896E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 4,
    },
  },
};

// ─── Spacing ────────────────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 64,
  container: 24,
};

// ─── Font Sizes ─────────────────────────────────────────────────────
export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  title: 40,
  display: 48,
};

// ─── Border Radius ──────────────────────────────────────────────────
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
  xl: 24,
  xxl: 32,
  full: 9999,
};

// ─── Font Family Constants ──────────────────────────────────────────
export const fontFamily = {
  headingRegular: 'CormorantGaramond_400Regular',
  headingSemiBold: 'CormorantGaramond_600SemiBold',
  headingBold: 'CormorantGaramond_700Bold',
  bodyRegular: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
};

// ─── Typography Styles ──────────────────────────────────────────────
export const typography = StyleSheet.create({
  h1: {
    fontFamily: fontFamily.headingBold,
    fontSize: 32,
    lineHeight: 40,
    color: colors.text,
  },
  h2: {
    fontFamily: fontFamily.headingSemiBold,
    fontSize: 24,
    lineHeight: 32,
    color: colors.text,
  },
  h3: {
    fontFamily: fontFamily.headingSemiBold,
    fontSize: 20,
    lineHeight: 28,
    color: colors.text,
  },
  body: {
    fontFamily: fontFamily.bodyRegular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  bodySmall: {
    fontFamily: fontFamily.bodyRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  label: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  button: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 16,
    lineHeight: 24,
  },
});
