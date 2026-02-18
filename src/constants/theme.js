export const colors = {
  // Primary Brand
  primary: '#18181b', // Zinc 900 - Strong, definitive
  primaryLight: '#27272a', // Zinc 800
  primaryDark: '#000000', // Pure Black

  // Accent - Warm Clay (Sophisticated, earthy, energetic)
  accent: '#C5896E',
  accentLight: '#D6A692', // Softer clay
  accentDark: '#A66D55', // Deep terracotta
  accentContrast: '#FFFFFF',

  // Backgrounds - Warm & Clean
  background: '#FAFAFA', // Warm white base
  surface: '#FFFFFF', // Pure white surface
  surfaceAlt: '#F4F4F5', // Zinc 100 - Subtle contrast
  
  // Text
  text: '#18181b', // Zinc 900
  textSecondary: '#71717a', // Zinc 500 - Muted
  textTertiary: '#a1a1aa', // Zinc 400 - Very subtle
  textInverse: '#FFFFFF',

  // Borders - Minimal
  border: '#E4E4E7', // Zinc 200
  borderLight: '#F4F4F5', // Zinc 100

  // Status - Refined
  success: '#10B981', // Emerald 500
  error: '#EF4444', // Red 500
  warning: '#F59E0B', // Amber 500
  info: '#3B82F6', // Blue 500

  // Misc
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.4)',

  // Shadows - Nested inside colors for easy access
  shadows: {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor: "#18181b",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 8,
    },
    soft: {
      shadowColor: "#C5896E",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 10,
    },
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16, // Generous base spacing
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 64,
  container: 24, // Standard container padding
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  title: 40, // Large, impactful titles
  display: 48,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 16, // Soft standard
  lg: 24, // Very soft
  xl: 32,
  full: 9999,
};
