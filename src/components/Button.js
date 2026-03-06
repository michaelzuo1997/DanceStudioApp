import { Pressable, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontFamily } from '../constants/theme';

export function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
  icon,
}) {
  const isDisabled = disabled || loading;

  const buttonStyle = [
    styles.base,
    variant === 'primary' && styles.primary,
    variant === 'secondary' && styles.secondary,
    variant === 'outline' && styles.outline,
    variant === 'danger' && styles.danger,
    variant === 'ghost' && styles.ghost,
    size === 'sm' && styles.sm,
    size === 'lg' && styles.lg,
    isDisabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    variant === 'primary' && styles.textPrimary,
    variant === 'secondary' && styles.textSecondary,
    variant === 'outline' && styles.textOutline,
    variant === 'danger' && styles.textDanger,
    variant === 'ghost' && styles.textGhost,
    size === 'sm' && styles.textSm,
    size === 'lg' && styles.textLg,
    textStyle,
  ];

  return (
    <Pressable
      style={({ pressed }) => [...buttonStyle, pressed && !isDisabled && { opacity: 0.85 }]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.white}
        />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={textStyles}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full, // Pill shape
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  primary: {
    backgroundColor: colors.primary,
    ...colors.shadows.md, // Add depth
  },
  secondary: {
    backgroundColor: colors.accent,
    ...colors.shadows.soft, // Soft colored shadow
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5, // Slightly thicker for visibility
    borderColor: colors.primary,
  },
  danger: {
    backgroundColor: colors.error,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  sm: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  lg: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
  },
  disabled: {
    opacity: 0.5,
    shadowOpacity: 0, // Remove shadow when disabled
  },
  text: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.md,
    letterSpacing: 0.5, // Slight tracking for sophistication
  },
  textPrimary: {
    color: colors.white,
  },
  textSecondary: {
    color: colors.white,
  },
  textOutline: {
    color: colors.primary,
  },
  textDanger: {
    color: colors.white,
  },
  textGhost: {
    color: colors.textSecondary,
  },
  textSm: {
    fontSize: fontSize.sm,
  },
  textLg: {
    fontSize: fontSize.lg,
  },
});
