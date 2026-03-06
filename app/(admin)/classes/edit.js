import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, Platform, ActivityIndicator, Switch,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../../../src/context/LanguageContext';
import { fetchClassById, createClass, updateClass } from '../../../src/lib/admin/classService';
import { fetchInstructors } from '../../../src/lib/admin/instructorService';
import { InstructorPicker } from '../../../src/components/admin/InstructorPicker';
import { supabase } from '../../../src/lib/supabase';
import { colors, spacing, fontSize, borderRadius } from '../../../src/constants/theme';

const DAYS = [0, 1, 2, 3, 4, 5, 6];

export default function ClassEditScreen() {
  const { id, mode } = useLocalSearchParams();
  const isCreate = mode === 'create';
  const { t, locale } = useLanguage();

  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [instructors, setInstructors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [campuses, setCampuses] = useState([]);

  const [form, setForm] = useState({
    categoryId: '',
    campusId: '',
    audience: 'adult',
    dayOfWeek: 1,
    classDate: '',
    startTime: '10:00',
    durationMinutes: '60',
    pricePerClass: '20',
    maxCapacity: '',
    instructorId: '',
    room: '',
    isActive: true,
  });

  const setField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    loadDropdowns();
    if (!isCreate && id) loadClass(id);
  }, [id, isCreate]);

  const loadDropdowns = async () => {
    const [catRes, campRes, instrRes] = await Promise.all([
      supabase.from('class_categories').select('id, key, name_en, name_zh').order('sort_order'),
      supabase.from('campuses').select('id, key, name_en, name_zh').eq('is_active', true).order('sort_order'),
      fetchInstructors(),
    ]);
    setCategories(catRes.data ?? []);
    setCampuses(campRes.data ?? []);
    setInstructors(instrRes.data ?? []);
  };

  const loadClass = async (classId) => {
    const { data } = await fetchClassById(classId);
    if (data) {
      setForm({
        categoryId: data.category_id ?? '',
        campusId: data.campus_id ?? '',
        audience: data.audience ?? 'adult',
        dayOfWeek: data.day_of_week ?? 1,
        classDate: data.class_date ?? '',
        startTime: data.start_time ?? '10:00',
        durationMinutes: String(data.duration_minutes ?? 60),
        pricePerClass: String(data.price_per_class ?? 20),
        maxCapacity: data.max_capacity ? String(data.max_capacity) : '',
        instructorId: data.instructor_id ?? '',
        room: data.room ?? '',
        isActive: data.is_active ?? true,
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      categoryId: form.categoryId || null,
      campusId: form.campusId || null,
      audience: form.audience,
      dayOfWeek: Number(form.dayOfWeek),
      classDate: form.classDate || null,
      startTime: form.startTime,
      durationMinutes: Number(form.durationMinutes),
      pricePerClass: Number(form.pricePerClass),
      maxCapacity: form.maxCapacity ? Number(form.maxCapacity) : null,
      instructorId: form.instructorId || null,
      room: form.room || null,
      isActive: form.isActive,
    };

    const { error } = isCreate
      ? await createClass(payload)
      : await updateClass(id, payload);

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

  const dayLabels = t('admin.days', { returnObjects: true }) || DAYS.map(String);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>
        {isCreate ? t('admin.createClass') : t('admin.editClass')}
      </Text>

      {/* Category */}
      <Text style={styles.label}>{t('admin.classForm.category')}</Text>
      <View style={styles.chipRow}>
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

      {/* Campus */}
      <Text style={styles.label}>{t('admin.classForm.campus')}</Text>
      <View style={styles.chipRow}>
        {campuses.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.chip, form.campusId === c.id && styles.chipActive]}
            onPress={() => setField('campusId', c.id)}
          >
            <Text style={[styles.chipText, form.campusId === c.id && styles.chipTextActive]}>
              {locale === 'zh' ? c.name_zh : c.name_en}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Audience */}
      <Text style={styles.label}>{t('admin.classForm.audience')}</Text>
      <View style={styles.chipRow}>
        {['adult', 'children'].map((a) => (
          <TouchableOpacity
            key={a}
            style={[styles.chip, form.audience === a && styles.chipActive]}
            onPress={() => setField('audience', a)}
          >
            <Text style={[styles.chipText, form.audience === a && styles.chipTextActive]}>
              {t(`classes.${a}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Day of Week */}
      <Text style={styles.label}>{t('admin.classForm.dayOfWeek')}</Text>
      <View style={styles.chipRow}>
        {DAYS.map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.chipSmall, form.dayOfWeek === d && styles.chipActive]}
            onPress={() => setField('dayOfWeek', d)}
          >
            <Text style={[styles.chipText, form.dayOfWeek === d && styles.chipTextActive]}>
              {Array.isArray(dayLabels) ? dayLabels[d]?.slice(0, 3) : String(d)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Start Time */}
      <Text style={styles.label}>{t('admin.classForm.startTime')}</Text>
      <TextInput
        style={styles.input}
        value={form.startTime}
        onChangeText={(v) => setField('startTime', v)}
        placeholder="HH:MM"
        placeholderTextColor={colors.textTertiary}
      />

      {/* Class Date */}
      <Text style={styles.label}>{t('admin.classForm.classDate')}</Text>
      <TextInput
        style={styles.input}
        value={form.classDate}
        onChangeText={(v) => setField('classDate', v)}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.textTertiary}
      />

      {/* Duration */}
      <Text style={styles.label}>{t('admin.classForm.duration')}</Text>
      <TextInput
        style={styles.input}
        value={form.durationMinutes}
        onChangeText={(v) => setField('durationMinutes', v)}
        keyboardType="numeric"
        placeholderTextColor={colors.textTertiary}
      />

      {/* Price */}
      <Text style={styles.label}>{t('admin.classForm.price')}</Text>
      <TextInput
        style={styles.input}
        value={form.pricePerClass}
        onChangeText={(v) => setField('pricePerClass', v)}
        keyboardType="numeric"
        placeholderTextColor={colors.textTertiary}
      />

      {/* Max Capacity */}
      <Text style={styles.label}>{t('admin.classForm.capacity')}</Text>
      <TextInput
        style={styles.input}
        value={form.maxCapacity}
        onChangeText={(v) => setField('maxCapacity', v)}
        keyboardType="numeric"
        placeholder="unlimited"
        placeholderTextColor={colors.textTertiary}
      />

      {/* Instructor */}
      <Text style={styles.label}>{t('admin.classForm.instructor')}</Text>
      <InstructorPicker
        instructors={instructors}
        selectedId={form.instructorId}
        onSelect={(id) => setField('instructorId', id)}
      />

      {/* Room */}
      <Text style={styles.label}>{t('admin.classForm.studio')}</Text>
      <TextInput
        style={styles.input}
        value={form.room}
        onChangeText={(v) => setField('room', v)}
        placeholderTextColor={colors.textTertiary}
      />

      {/* Active Toggle */}
      <View style={styles.switchRow}>
        <Text style={styles.label}>{t('admin.classForm.isActive')}</Text>
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
            {isCreate ? t('admin.createClass') : t('common.save')}
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
  chipSmall: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
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
