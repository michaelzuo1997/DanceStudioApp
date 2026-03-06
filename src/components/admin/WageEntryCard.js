import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';

/**
 * Displays one person's wage breakdown.
 *
 * @param {Object} props
 * @param {string} props.name
 * @param {string} props.role - 'Instructor' | 'Admin'
 * @param {number|null} props.hours
 * @param {number|null} props.rate - hourly rate
 * @param {number|null} props.total
 * @param {boolean} [props.editable=false] - if true, hours is an editable TextInput
 * @param {function} [props.onHoursChange] - called with new hours string
 * @param {boolean} [props.noRate=false] - if true, shows "Rate not set" warning
 * @param {string} [props.testID]
 */
export default function WageEntryCard({
  name,
  role,
  hours,
  rate,
  total,
  editable = false,
  onHoursChange,
  noRate = false,
  testID,
}) {
  const { t } = useLanguage();

  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.left}>
        <Text style={styles.name}>{name}</Text>
        <View style={[styles.badge, role === 'Instructor' ? styles.badgeInstructor : styles.badgeAdmin]}>
          <Text style={styles.badgeText}>{role}</Text>
        </View>
      </View>
      <View style={styles.right}>
        {noRate ? (
          <Text style={styles.noRate} testID="no-rate-warning">{t('admin.wages.noRateSet')}</Text>
        ) : (
          <>
            <View style={styles.hoursRow}>
              {editable ? (
                <TextInput
                  style={styles.hoursInput}
                  value={String(hours ?? '')}
                  onChangeText={onHoursChange}
                  keyboardType="numeric"
                  placeholder="0"
                  testID="input-hours"
                />
              ) : (
                <Text style={styles.hoursText}>{hours}</Text>
              )}
              <Text style={styles.formula}> hrs x A${rate}</Text>
            </View>
            <Text style={styles.total}>= A${total != null ? total.toFixed(2) : '0.00'}</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...colors.shadows.sm,
  },
  left: { flex: 1 },
  right: { alignItems: 'flex-end' },
  name: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  badge: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeInstructor: {
    backgroundColor: '#EDE9FE',
  },
  badgeAdmin: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hoursText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  hoursInput: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    minWidth: 48,
    textAlign: 'center',
  },
  formula: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  total: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.accent,
    marginTop: 2,
  },
  noRate: {
    fontSize: fontSize.sm,
    color: colors.warning,
    fontStyle: 'italic',
  },
});
