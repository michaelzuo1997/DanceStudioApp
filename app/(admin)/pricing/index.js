import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useLanguage } from '../../../src/context/LanguageContext';
import { useCampus } from '../../../src/context/CampusContext';
import { supabase } from '../../../src/lib/supabase';
import { previewPriceChange, bulkUpdatePrice } from '../../../src/lib/admin/priceService';
import { PricePreviewCard } from '../../../src/components/admin/PricePreviewCard';
import { colors, spacing, fontSize, borderRadius } from '../../../src/constants/theme';

const AUDIENCES = [
  { key: null, labelKey: 'admin.pricing.allAudience' },
  { key: 'adult', labelKey: 'classes.adult' },
  { key: 'children', labelKey: 'classes.children' },
];

export default function BulkPricingScreen() {
  const { t } = useLanguage();
  const { campuses } = useCampus();

  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(null);
  const [campusId, setCampusId] = useState(null);
  const [audience, setAudience] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [previewClasses, setPreviewClasses] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase
      .from('class_categories')
      .select('id, key, name_en, name_zh')
      .order('sort_order', { ascending: true })
      .then(({ data }) => setCategories(data ?? []));
  }, []);

  const buildFilters = useCallback(() => ({
    categoryId: categoryId || undefined,
    campusId: campusId || undefined,
    audience: audience || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  }), [categoryId, campusId, audience, dateFrom, dateTo]);

  const handlePreview = useCallback(async () => {
    const filters = buildFilters();
    if (!filters.categoryId && !filters.campusId && !filters.audience && !filters.dateFrom && !filters.dateTo) {
      Alert.alert(t('common.error'), t('admin.pricing.filterRequired'));
      return;
    }
    setLoading(true);
    const { data, error } = await previewPriceChange(filters);
    setLoading(false);
    if (error) {
      Alert.alert(t('common.error'), error.message);
      return;
    }
    setPreviewClasses(data);
  }, [buildFilters, t]);

  const handleApply = useCallback(async () => {
    const price = parseFloat(newPrice);
    if (!price || price <= 0) {
      Alert.alert(t('common.error'), t('admin.pricing.invalidPrice'));
      return;
    }

    Alert.alert(
      t('admin.pricing.confirmTitle'),
      t('admin.pricing.confirmMessage')
        .replace('{count}', String(previewClasses?.length ?? 0))
        .replace('{price}', price.toFixed(2)),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const { error } = await bulkUpdatePrice({
              ...buildFilters(),
              newPrice: price,
            });
            setLoading(false);
            if (error) {
              Alert.alert(t('common.error'), t('admin.pricing.updateFailed'));
              return;
            }
            Alert.alert(t('common.success'), t('admin.pricing.updateSuccess'));
            setPreviewClasses(null);
          },
        },
      ],
    );
  }, [newPrice, previewClasses, buildFilters, t]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('admin.pricing.title')}</Text>

      {/* Category selector */}
      <Text style={styles.label}>{t('admin.pricing.category')}</Text>
      <View style={styles.chipRow}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.chip, categoryId === cat.id && styles.chipActive]}
            onPress={() => setCategoryId(categoryId === cat.id ? null : cat.id)}
          >
            <Text style={[styles.chipText, categoryId === cat.id && styles.chipTextActive]}>
              {cat.name_en}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Campus selector */}
      <Text style={styles.label}>{t('admin.pricing.campus')}</Text>
      <View style={styles.chipRow}>
        {(campuses ?? []).map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.chip, campusId === c.id && styles.chipActive]}
            onPress={() => setCampusId(campusId === c.id ? null : c.id)}
          >
            <Text style={[styles.chipText, campusId === c.id && styles.chipTextActive]}>
              {c.name_en}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Audience selector */}
      <Text style={styles.label}>{t('admin.pricing.audience')}</Text>
      <View style={styles.chipRow}>
        {AUDIENCES.map((a) => (
          <TouchableOpacity
            key={String(a.key)}
            style={[styles.chip, audience === a.key && styles.chipActive]}
            onPress={() => setAudience(audience === a.key ? null : a.key)}
          >
            <Text style={[styles.chipText, audience === a.key && styles.chipTextActive]}>
              {t(a.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date range */}
      <View style={styles.dateRow}>
        <View style={styles.dateField}>
          <Text style={styles.label}>{t('admin.pricing.dateFrom')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('admin.pricing.datePlaceholder')}
            placeholderTextColor={colors.textTertiary}
            value={dateFrom}
            onChangeText={setDateFrom}
            testID="input-date-from"
          />
        </View>
        <View style={styles.dateField}>
          <Text style={styles.label}>{t('admin.pricing.dateTo')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('admin.pricing.datePlaceholder')}
            placeholderTextColor={colors.textTertiary}
            value={dateTo}
            onChangeText={setDateTo}
            testID="input-date-to"
          />
        </View>
      </View>

      {/* New price */}
      <Text style={styles.label}>{t('admin.pricing.newPrice')}</Text>
      <TextInput
        style={styles.input}
        placeholder="0.00"
        placeholderTextColor={colors.textTertiary}
        keyboardType="numeric"
        value={newPrice}
        onChangeText={setNewPrice}
        testID="input-new-price"
      />

      {/* Preview button */}
      <TouchableOpacity
        style={styles.previewBtn}
        onPress={handlePreview}
        disabled={loading}
        testID="btn-preview"
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.previewBtnText}>{t('admin.pricing.preview')}</Text>
        )}
      </TouchableOpacity>

      {/* Preview result */}
      {previewClasses !== null && (
        <PricePreviewCard classes={previewClasses} />
      )}

      {/* Apply button */}
      {previewClasses !== null && previewClasses.length > 0 && (
        <TouchableOpacity
          style={styles.applyBtn}
          onPress={handleApply}
          disabled={loading}
          testID="btn-apply"
        >
          <Text style={styles.applyBtnText}>{t('admin.pricing.apply')}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl },
  title: {
    fontSize: fontSize.xxl,
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
  dateRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateField: { flex: 1 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  previewBtnText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.white,
  },
  applyBtn: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  applyBtnText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.white,
  },
});
