import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';
import { useLanguage } from '../../../src/context/LanguageContext';
import { supabase } from '../../../src/lib/supabase';
import { Button } from '../../../src/components/Button';
import { colors, spacing, fontSize, borderRadius } from '../../../src/constants/theme';

// Default categories
const DEFAULT_CATEGORIES = [
  { id: '1', key: 'chinese_classical', name_en: 'Chinese Classical', name_zh: '中国舞' },
  { id: '2', key: 'ballet', name_en: 'Ballet', name_zh: '芭蕾' },
  { id: '3', key: 'hip_hop', name_en: 'Hip Hop', name_zh: '街舞' },
  { id: '4', key: 'kpop_youth', name_en: 'Youth K-pop', name_zh: '青少年 K-pop' },
  { id: '5', key: 'korean_dance', name_en: 'Korean Dance', name_zh: '韩舞' },
  { id: '6', key: 'miscellaneous', name_en: 'Miscellaneous', name_zh: '其他' },
];

const DURATION_OPTIONS = [60, 90, 120];

export default function PrivateTuitionScreen() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('class_categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (data && data.length > 0) {
        setCategories(data);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert(
        locale === 'zh' ? '请登录' : 'Sign In Required',
        locale === 'zh' ? '请先登录后再提交申请' : 'Please sign in to submit a request',
        [
          { text: locale === 'zh' ? '取消' : 'Cancel', style: 'cancel' },
          { text: locale === 'zh' ? '登录' : 'Sign In', onPress: () => router.push('/(auth)/sign-in') },
        ]
      );
      return;
    }

    if (!selectedCategory) {
      Alert.alert(locale === 'zh' ? '请选择课程类型' : 'Please select a category');
      return;
    }

    if (!selectedDate) {
      Alert.alert(locale === 'zh' ? '请选择日期' : 'Please select a preferred date');
      return;
    }

    if (!selectedTime) {
      Alert.alert(locale === 'zh' ? '请选择时间' : 'Please select a preferred time');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('private_tuition_requests')
        .insert({
          user_id: user.id,
          category_id: selectedCategory.id || selectedCategory.key,
          preferred_date: selectedDate,
          preferred_time: selectedTime,
          duration_minutes: duration,
          notes: notes || null,
          status: 'pending',
        });

      if (error) throw error;

      setSubmitted(true);
      Alert.alert(
        locale === 'zh' ? '提交成功' : 'Request Submitted',
        locale === 'zh' 
          ? '您的私教课程申请已提交，我们会尽快与您联系！' 
          : 'Your private tuition request has been submitted. We will contact you soon!'
      );
      
      // Reset form
      setSelectedCategory(null);
      setSelectedDate('');
      setSelectedTime('');
      setDuration(60);
      setNotes('');
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', error.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (cat) => {
    return locale === 'zh' ? (cat.name_zh || cat.name_en) : (cat.name_en || cat.name_zh);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('private.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Description */}
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionText}>
            {locale === 'zh' 
              ? '私教课程提供一对一的专业指导，根据您的需求和时间安排定制课程内容。'
              : 'Private tuition offers one-on-one professional instruction tailored to your needs and schedule.'}
          </Text>
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('private.selectCategory')}</Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id || cat.key}
                style={[
                  styles.categoryChip,
                  selectedCategory?.id === cat.id && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory?.id === cat.id && styles.categoryChipTextActive,
                  ]}
                >
                  {getCategoryName(cat)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('private.preferredDate')}</Text>
          <TextInput
            style={styles.input}
            value={selectedDate}
            onChangeText={setSelectedDate}
            placeholder={locale === 'zh' ? 'YYYY-MM-DD' : 'YYYY-MM-DD'}
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('private.preferredTime')}</Text>
          <TextInput
            style={styles.input}
            value={selectedTime}
            onChangeText={setSelectedTime}
            placeholder={locale === 'zh' ? 'HH:MM (例如: 14:00)' : 'HH:MM (e.g., 14:00)'}
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        {/* Duration Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('private.duration')}</Text>
          <View style={styles.durationRow}>
            {DURATION_OPTIONS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.durationChip, duration === d && styles.durationChipActive]}
                onPress={() => setDuration(d)}
              >
                <Text
                  style={[
                    styles.durationChipText,
                    duration === d && styles.durationChipTextActive,
                  ]}
                >
                  {d} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('private.notes')}</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('private.notesPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <Button
          title={loading ? t('common.loading') : t('private.submit')}
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          size="lg"
          style={styles.submitButton}
        />

        {/* Success Message */}
        {submitted && (
          <View style={styles.successCard}>
            <Text style={styles.successText}>✓ {t('private.success')}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    padding: spacing.sm,
  },
  backText: {
    fontSize: fontSize.xl,
    color: colors.text,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: { 
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  descriptionCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  descriptionText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: fontSize.md * 1.5,
  },
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  categoryChipTextActive: {
    color: colors.white,
    fontWeight: '600',
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
  notesInput: {
    minHeight: 100,
  },
  durationRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  durationChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceAlt,
  },
  durationChipActive: {
    backgroundColor: colors.accent,
  },
  durationChipText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  durationChipTextActive: {
    color: colors.white,
  },
  submitButton: {
    marginTop: spacing.lg,
  },
  successCard: {
    backgroundColor: colors.success + '20',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  successText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.success,
  },
});
