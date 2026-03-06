import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, Platform, ActivityIndicator, Switch, Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../../../src/context/LanguageContext';
import { fetchNoticeById, createNotice, updateNotice } from '../../../src/lib/admin/noticeboardService';
import { pickAndUploadNoticeImage } from '../../../src/lib/admin/imageUploadService';
import { supabase } from '../../../src/lib/supabase';
import { colors, spacing, fontSize, borderRadius } from '../../../src/constants/theme';

const PRIORITIES = [
  { value: 0, labelKey: 'admin.noticeForm.priorityNormal' },
  { value: 1, labelKey: 'admin.noticeForm.priorityHigh' },
  { value: 2, labelKey: 'admin.noticeForm.priorityUrgent' },
];

export default function NoticeEditScreen() {
  const { id, mode } = useLocalSearchParams();
  const isCreate = mode === 'create';
  const { t } = useLanguage();

  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [campuses, setCampuses] = useState([]);

  const [form, setForm] = useState({
    titleEn: '',
    titleZh: '',
    bodyEn: '',
    bodyZh: '',
    imageUrl: '',
    linkUrl: '',
    campusId: '',
    priority: 0,
    startsAt: '',
    expiresAt: '',
    isActive: true,
  });

  const setField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    loadDropdowns();
    if (!isCreate && id) loadNotice(id);
  }, [id, isCreate]);

  const loadDropdowns = async () => {
    const { data } = await supabase
      .from('campuses')
      .select('id, key, name_en, name_zh')
      .eq('is_active', true)
      .order('sort_order');
    setCampuses(data ?? []);
  };

  const loadNotice = async (noticeId) => {
    const { data } = await fetchNoticeById(noticeId);
    if (data) {
      setForm({
        titleEn: data.title_en ?? '',
        titleZh: data.title_zh ?? '',
        bodyEn: data.body_en ?? '',
        bodyZh: data.body_zh ?? '',
        imageUrl: data.image_url ?? '',
        linkUrl: data.link_url ?? '',
        campusId: data.campus_id ?? '',
        priority: data.priority ?? 0,
        startsAt: data.starts_at ? data.starts_at.slice(0, 10) : '',
        expiresAt: data.expires_at ? data.expires_at.slice(0, 10) : '',
        isActive: data.is_active ?? true,
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.titleEn.trim() || !form.titleZh.trim()) {
      const msg = 'Title (EN) and Title (ZH) are required.';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert(t('common.error'), msg);
      }
      return;
    }

    setSaving(true);
    const payload = {
      titleEn: form.titleEn.trim(),
      titleZh: form.titleZh.trim(),
      bodyEn: form.bodyEn.trim() || null,
      bodyZh: form.bodyZh.trim() || null,
      imageUrl: form.imageUrl.trim() || null,
      linkUrl: form.linkUrl.trim() || null,
      campusId: form.campusId || null,
      priority: form.priority,
      startsAt: form.startsAt || null,
      expiresAt: form.expiresAt || null,
      isActive: form.isActive,
    };

    const { error } = isCreate
      ? await createNotice(payload)
      : await updateNotice(id, payload);

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>
        {isCreate ? t('admin.createNotice') : t('admin.editNotice')}
      </Text>

      {/* Title EN */}
      <Text style={styles.label}>{t('admin.noticeForm.titleEn')}</Text>
      <TextInput
        style={styles.input}
        value={form.titleEn}
        onChangeText={(v) => setField('titleEn', v)}
        placeholderTextColor={colors.textTertiary}
      />

      {/* Title ZH */}
      <Text style={styles.label}>{t('admin.noticeForm.titleZh')}</Text>
      <TextInput
        style={styles.input}
        value={form.titleZh}
        onChangeText={(v) => setField('titleZh', v)}
        placeholderTextColor={colors.textTertiary}
      />

      {/* Body EN */}
      <Text style={styles.label}>{t('admin.noticeForm.bodyEn')}</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={form.bodyEn}
        onChangeText={(v) => setField('bodyEn', v)}
        multiline
        numberOfLines={4}
        placeholderTextColor={colors.textTertiary}
      />

      {/* Body ZH */}
      <Text style={styles.label}>{t('admin.noticeForm.bodyZh')}</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={form.bodyZh}
        onChangeText={(v) => setField('bodyZh', v)}
        multiline
        numberOfLines={4}
        placeholderTextColor={colors.textTertiary}
      />

      {/* Image */}
      <Text style={styles.label}>{t('admin.noticeForm.image')}</Text>
      {form.imageUrl ? (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: form.imageUrl }} style={styles.imagePreview} />
          <TouchableOpacity
            style={styles.removeImageBtn}
            onPress={() => setField('imageUrl', '')}
          >
            <Text style={styles.removeImageText}>{t('admin.noticeForm.removeImage')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      <View style={styles.imageActions}>
        <TouchableOpacity
          style={[styles.pickImageBtn, uploading && styles.saveBtnDisabled]}
          onPress={async () => {
            const noticeId = id || `new-${Date.now()}`;
            setUploading(true);
            try {
              const result = await pickAndUploadNoticeImage(noticeId);
              if (result) setField('imageUrl', result.url);
            } catch (err) {
              const msg = err.message || t('admin.saveFailed');
              if (Platform.OS === 'web') {
                window.alert(msg);
              } else {
                Alert.alert(t('common.error'), msg);
              }
            } finally {
              setUploading(false);
            }
          }}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.pickImageText}>{t('admin.noticeForm.pickImage')}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Link URL */}
      <Text style={styles.label}>{t('admin.noticeForm.linkUrl')}</Text>
      <TextInput
        style={styles.input}
        value={form.linkUrl}
        onChangeText={(v) => setField('linkUrl', v)}
        placeholder="https://..."
        placeholderTextColor={colors.textTertiary}
        autoCapitalize="none"
      />

      {/* Campus */}
      <Text style={styles.label}>{t('admin.noticeForm.campus')}</Text>
      <View style={styles.chipRow}>
        <TouchableOpacity
          style={[styles.chip, !form.campusId && styles.chipActive]}
          onPress={() => setField('campusId', '')}
        >
          <Text style={[styles.chipText, !form.campusId && styles.chipTextActive]}>
            {t('admin.noticeForm.allCampuses')}
          </Text>
        </TouchableOpacity>
        {campuses.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.chip, form.campusId === c.id && styles.chipActive]}
            onPress={() => setField('campusId', c.id)}
          >
            <Text style={[styles.chipText, form.campusId === c.id && styles.chipTextActive]}>
              {c.name_en}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Priority */}
      <Text style={styles.label}>{t('admin.noticeForm.priority')}</Text>
      <View style={styles.chipRow}>
        {PRIORITIES.map((p) => (
          <TouchableOpacity
            key={p.value}
            style={[styles.chip, form.priority === p.value && styles.chipActive]}
            onPress={() => setField('priority', p.value)}
          >
            <Text style={[styles.chipText, form.priority === p.value && styles.chipTextActive]}>
              {t(p.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Start Date */}
      <Text style={styles.label}>{t('admin.noticeForm.startsAt')}</Text>
      <TextInput
        style={styles.input}
        value={form.startsAt}
        onChangeText={(v) => setField('startsAt', v)}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.textTertiary}
      />

      {/* Expiry Date */}
      <Text style={styles.label}>{t('admin.noticeForm.expiresAt')}</Text>
      <TextInput
        style={styles.input}
        value={form.expiresAt}
        onChangeText={(v) => setField('expiresAt', v)}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.textTertiary}
      />

      {/* Active Toggle */}
      <View style={styles.switchRow}>
        <Text style={styles.label}>{t('admin.noticeForm.isActive')}</Text>
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
            {isCreate ? t('admin.createNotice') : t('common.save')}
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
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
  imagePreviewContainer: {
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  removeImageBtn: {
    padding: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.error,
  },
  removeImageText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  imageActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pickImageBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  pickImageText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
