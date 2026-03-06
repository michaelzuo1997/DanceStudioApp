import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, FlatList, Alert,
} from 'react-native';
import { useLanguage } from '../../../src/context/LanguageContext';
import { useCampus } from '../../../src/context/CampusContext';
import {
  calculateInstructorWages, fetchWageStaff,
  generateWageCSV, exportWageCSV,
} from '../../../src/lib/admin/wageService';
import WageEntryCard from '../../../src/components/admin/WageEntryCard';
import { colors, spacing, fontSize, borderRadius } from '../../../src/constants/theme';

export default function WageCalculatorScreen() {
  const { t } = useLanguage();
  const { campuses } = useCampus();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCampus, setSelectedCampus] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [calculated, setCalculated] = useState(false);

  // Instructor wages (auto-calculated)
  const [instructorEntries, setInstructorEntries] = useState([]);
  // Admin staff (manual hours)
  const [adminStaff, setAdminStaff] = useState([]);

  const handleCalculate = useCallback(async () => {
    if (!dateFrom.trim() || !dateTo.trim()) {
      Alert.alert(t('common.error'), t('admin.wages.dateRequired'));
      return;
    }

    setCalculating(true);

    const { data: wages, error } = await calculateInstructorWages({
      dateFrom: dateFrom.trim(),
      dateTo: dateTo.trim(),
      campusId: selectedCampus,
    });

    if (error) {
      Alert.alert(t('common.error'), error.message);
      setCalculating(false);
      return;
    }

    setInstructorEntries(wages);

    // Fetch admin staff with hourly rates
    const { data: staff } = await fetchWageStaff();
    const staffWithHours = staff.map((s) => ({
      ...s,
      displayName: s.full_name || s.name || 'Unknown',
      hours: '',
    }));
    setAdminStaff(staffWithHours);
    setCalculated(true);
    setCalculating(false);
  }, [dateFrom, dateTo, selectedCampus, t]);

  const handleAdminHoursChange = useCallback((index, hours) => {
    setAdminStaff((prev) =>
      prev.map((s, i) => (i === index ? { ...s, hours } : s))
    );
  }, []);

  const getGrandTotal = useCallback(() => {
    const instructorTotal = instructorEntries
      .filter((e) => e.totalPay != null)
      .reduce((sum, e) => sum + e.totalPay, 0);

    const adminTotal = adminStaff.reduce((sum, s) => {
      const h = parseFloat(s.hours) || 0;
      return sum + h * Number(s.hourly_rate);
    }, 0);

    return instructorTotal + adminTotal;
  }, [instructorEntries, adminStaff]);

  const handleExport = useCallback(async () => {
    const allEntries = [];

    for (const e of instructorEntries) {
      if (e.totalPay != null) {
        allEntries.push({
          name: e.instructorName,
          role: 'Instructor',
          hours: e.totalHours,
          rate: e.hourlyRate,
          total: e.totalPay,
        });
      }
    }

    for (const s of adminStaff) {
      const h = parseFloat(s.hours) || 0;
      if (h > 0) {
        allEntries.push({
          name: s.displayName,
          role: s.role,
          hours: h,
          rate: Number(s.hourly_rate),
          total: Number((h * Number(s.hourly_rate)).toFixed(2)),
        });
      }
    }

    if (allEntries.length === 0) {
      Alert.alert(t('common.error'), t('admin.wages.noWageData'));
      return;
    }

    const csv = generateWageCSV(allEntries);
    const filename = `wages_${dateFrom}_${dateTo}.csv`;
    const { success, error } = await exportWageCSV(csv, filename);

    if (success) {
      Alert.alert(t('common.success'), t('admin.wages.exportSuccess'));
    } else {
      Alert.alert(t('common.error'), error || t('admin.wages.exportFailed'));
    }
  }, [instructorEntries, adminStaff, dateFrom, dateTo, t]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('admin.wages.title')}</Text>

      {/* Date Range */}
      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={styles.label}>{t('admin.wages.dateFrom')}</Text>
          <TextInput
            style={styles.input}
            value={dateFrom}
            onChangeText={setDateFrom}
            placeholder={t('admin.wages.datePlaceholder')}
            testID="input-date-from"
          />
        </View>
        <View style={styles.halfField}>
          <Text style={styles.label}>{t('admin.wages.dateTo')}</Text>
          <TextInput
            style={styles.input}
            value={dateTo}
            onChangeText={setDateTo}
            placeholder={t('admin.wages.datePlaceholder')}
            testID="input-date-to"
          />
        </View>
      </View>

      {/* Campus filter */}
      <Text style={styles.label}>{t('admin.wages.campus')}</Text>
      <View style={styles.chipRow}>
        <TouchableOpacity
          style={[styles.chip, !selectedCampus && styles.chipActive]}
          onPress={() => setSelectedCampus(null)}
        >
          <Text style={[styles.chipText, !selectedCampus && styles.chipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {campuses.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.chip, selectedCampus === c.id && styles.chipActive]}
            onPress={() => setSelectedCampus(c.id)}
          >
            <Text style={[styles.chipText, selectedCampus === c.id && styles.chipTextActive]}>
              {c.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Calculate Button */}
      <TouchableOpacity
        style={styles.calculateBtn}
        onPress={handleCalculate}
        disabled={calculating}
        testID="btn-calculate"
      >
        {calculating ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.calculateBtnText}>{t('admin.wages.calculate')}</Text>
        )}
      </TouchableOpacity>

      {calculated && (
        <>
          {/* Instructors Section */}
          <Text style={styles.sectionTitle}>{t('admin.wages.instructors')}</Text>
          {instructorEntries.length === 0 ? (
            <Text style={styles.emptyText}>{t('admin.wages.noResults')}</Text>
          ) : (
            instructorEntries.map((entry) => (
              <WageEntryCard
                key={entry.instructorId}
                name={entry.instructorName}
                role="Instructor"
                hours={entry.totalHours}
                rate={entry.hourlyRate}
                total={entry.totalPay}
                noRate={entry.hourlyRate == null}
                testID={`wage-instructor-${entry.instructorId}`}
              />
            ))
          )}

          {/* Admin Staff Section */}
          <Text style={styles.sectionTitle}>{t('admin.wages.adminStaff')}</Text>
          {adminStaff.length === 0 ? (
            <Text style={styles.emptyText}>{t('admin.wages.noResults')}</Text>
          ) : (
            adminStaff.map((staff, index) => (
              <WageEntryCard
                key={staff.id}
                name={staff.displayName}
                role="Admin"
                hours={staff.hours}
                rate={Number(staff.hourly_rate)}
                total={Number(((parseFloat(staff.hours) || 0) * Number(staff.hourly_rate)).toFixed(2))}
                editable={true}
                onHoursChange={(val) => handleAdminHoursChange(index, val)}
                testID={`wage-admin-${staff.id}`}
              />
            ))
          )}

          {/* Grand Total */}
          <View style={styles.grandTotalCard}>
            <Text style={styles.grandTotalLabel}>{t('admin.wages.grandTotal')}</Text>
            <Text style={styles.grandTotalAmount}>A${getGrandTotal().toFixed(2)}</Text>
          </View>

          {/* Export Button */}
          <TouchableOpacity
            style={styles.exportBtn}
            onPress={handleExport}
            testID="btn-export"
          >
            <Text style={styles.exportBtnText}>{t('admin.wages.exportCSV')}</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  halfField: { flex: 1 },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.full,
  },
  chipActive: { backgroundColor: colors.accent },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: { color: colors.white },
  calculateBtn: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  calculateBtnText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.white,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  grandTotalCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    ...colors.shadows.md,
  },
  grandTotalLabel: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.white,
  },
  grandTotalAmount: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.accentLight,
  },
  exportBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  exportBtnText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.accent,
  },
});
