import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, Platform, ActivityIndicator, Switch,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../../../src/context/LanguageContext';
import { fetchBundleById, createBundle, updateBundle } from '../../../src/lib/admin/bundleService';
import { supabase } from '../../../src/lib/supabase';
import { colors, spacing, fontSize, borderRadius } from '../../../src/constants/theme';

export default function BundleEditScreen() {
  const { id, mode } = useLocalSearchParams();
  const isCreate = mode === 'create';
  const { t, locale } = useLanguage();

  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    categoryId: '',
    audience: '',
    classCount: '10',
    expiryWeeks: '12',
    totalPrice: '200',
    isActive: true,
  });

  const setField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    loadDropdowns();
    if (!isCreate && id) loadBundle(id);
  }, [id, isCreate]);

  const loadDropdowns = async () => {
    const { data } = await supabase
      .from('class_categories')
      .select('id, key, name_en, name_zh')
      .order('sort_order');
    setCategories(data ?? []);
  };

  const loadBundle = async (bundleId) => {
    const { data } = await fetchBundleById(bundleId);
    if (data) {
      setForm({
        categoryId: data.category_id ?? '',
        audience: data.audience ?? '',
        classCount: String(data.class_count ?? 10),
        expiryWeeks: String(data.expiry_weeks ?? 12),
        totalPrice: String(data.total_price ?? 200),
        isActive: data.is_active ?? true,
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    const classCount = Number(form.classCount);
    const expiryWeeks = Number(form.expiryWeeks);
    const totalPrice = Number(form.totalPrice);

    if (!classCount || classCount <= 0) {
      const msg = 'Class count must be greater than 0.';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert(t('common.error'), msg);
      }
      return;
    }

    setSaving(true);
    const payload = {
      categoryId: form.categoryId || null,
      audience: form.audience || null,
      classCount,
      expiryWeeks,
      totalPrice,
      isActive: form.isActive,
    };

    const { error } = isCreate
      ? await createBundle(payload)
      : await updateBundle(id, payload);

    setSaving(false);

    if (error) {
      const msg = error.message || t('admin.saveFailed');
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert(t('common.error'), msg);
      }
      return;
    }

    if (Platform.OS === 'web') {
      window.alert(t('admin.saveSuccess'));
    } else {
      Alert.alert(t('common.success'), t('admin.saveSuccess'));
    }
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const classCount = Number(form.classCount);
  const totalPrice = Number(form.totalPrice);
  const perClass = classCount > 0 ? (totalPrice / classCount).toFixed(2) : '--';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>
        {isCreate ? t('admin.createBundle') : t('admin.editBundle')}
      </Text>

      {/* Category */}
      <Text style={styles.label}>{t('admin.bundleForm.category')}</Text>
      <View style={styles.chipRow}>
        <TouchableOpacity
          style={[styles.chip, !form.categoryId && styles.chipActive]}
          onPress={() => setField('categoryId', '')}
        >
          <Text style={[styles.chipText, !form.categoryId && styles.chipTextActive]}>
            {t('admin.bundleForm.anyCategory')}
          </Text>
        </TouchableOpacity>
        {categories.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.chip, form.categoryId === c.id && styles.chipActive]}
            onPress={() => setField('categoryId', c.id)}
          >
            <Text style={[styles.chipText, form.categoryId === c.id && styles.chipTextActive]}>
              {locale === 'zh' ? c.name_zh : c.name_en}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Audience */}
      <Text style={styles.label}>{t('admin.bundleForm.audience')}</Text>
      <View style={styles.chipRow}>
        {[
          { value: '', label: t('admin.bundleForm.allAudience') },
          { value: 'adult', label: t('classes.adult') },
          { value: 'children', label: t('classes.children') },
        ].map((a) => (
          <TouchableOpacity
            key={a.value}
            style={[styles.chip, form.audience === a.value && styles.chipActive]}
            onPress={() => setField('audience', a.value)}
          >
            <Text style={[styles.chipText, form.audience === a.value && styles.chipTextActive]}>
              {a.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Class Count */}
      <Text style={styles.label}>{t('admin.bundleForm.classCount')}</Text>
      <TextInput
        style={styles.input}
        value={form.classCount}
        onChangeText={(v) => setField('classCount', v)}
        keyboardType="numeric"
        placeholderTextColor={colors.textTertiary}
      />

      {/* Expiry Weeks */}
      <Text style={styles.label}>{t('admin.bundleForm.expiryWeeks')}</Text>
      <TextInput
        style={styles.input}
        value={form.expiryWeeks}
        onChangeText={(v) => setField('expiryWeeks', v)}
        keyboardType="numeric"
        placeholderTextColor={colors.textTertiary}
      />

      {/* Total Price */}
      <Text style={styles.label}>{t('admin.bundleForm.totalPrice')}</Text>
      <TextInput
        style={styles.input}
        value={form.totalPrice}
        onChangeText={(v) => setField('totalPrice', v)}
        keyboardType="numeric"
        placeholderTextColor={colors.textTertiary}
      />

      {/* Per-class price display */}
      <View style={styles.perClassRow}>
        <Text style={styles.perClassLabel}>{t('admin.bundleForm.perClassPrice')}:</Text>
        <Text style={styles.perClassValue}>A${perClass}</Text>
      </View>

      {/* Active Toggle */}
      <View style={styles.switchRow}>
        <Text style={styles.label}>{t('admin.bundleForm.isActive')}</Text>
        <Switch
          value={form.isActive}
          onValueChange={(v) => setField('isActive', v)}
          trackColor={{ true: colors.accent, false: colors.surfaceAlt }}
          thumbColor={colors.white}
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.saveBtnText}>
            {isCreate ? t('admin.createBundle') : t('common.save')}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.full,
  },
  chipActive: {
    backgroundColor: colors.accent,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.white,
  },
  perClassRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
  },
  perClassLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  perClassValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.accent,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xxl,
    ...colors.shadows.soft,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.white,
  },
});
