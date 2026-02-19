import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';
import { useLanguage } from '../../../src/context/LanguageContext';
import { supabase } from '../../../src/lib/supabase';
import { CategoryCard } from '../../../src/components/CategoryCard';
import { colors, spacing, fontSize, borderRadius } from '../../../src/constants/theme';

// Default categories (will be replaced by database data when available)
const DEFAULT_CATEGORIES = [
  { id: '1', key: 'chinese_classical', name_en: 'Chinese Classical', name_zh: '中国舞', icon: '💃' },
  { id: '2', key: 'ballet', name_en: 'Ballet', name_zh: '芭蕾', icon: '🩰' },
  { id: '3', key: 'hip_hop', name_en: 'Hip Hop', name_zh: '街舞', icon: '🎤' },
  { id: '4', key: 'kpop_youth', name_en: 'Youth K-pop', name_zh: '青少年 K-pop', icon: '🎵' },
  { id: '5', key: 'korean_dance', name_en: 'Korean Dance', name_zh: '韩舞', icon: '🌟' },
  { id: '6', key: 'miscellaneous', name_en: 'Miscellaneous', name_zh: '其他', icon: '✨' },
];

export default function ClassesScreen() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [classCounts, setClassCounts] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    // Try to fetch categories from database
    const { data: categoriesData } = await supabase
      .from('class_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (categoriesData && categoriesData.length > 0) {
      setCategories(categoriesData);
    }

    // Fetch class counts per category (include class_type for fallback when category_id is null)
    const { data: classesData } = await supabase
      .from('CLASSES')
      .select('category_id, class_type, id')
      .gte('start_time', new Date().toISOString());

    if (classesData) {
      const counts = {};
      const cats = categoriesData?.length ? categoriesData : DEFAULT_CATEGORIES;
      const keyToId = {};
      cats.forEach((cat) => { keyToId[cat.key] = cat.id; });
      classesData.forEach((c) => {
        const catId = c.category_id || (c.class_type && keyToId[c.class_type]);
        if (catId) {
          counts[catId] = (counts[catId] || 0) + 1;
        }
      });
      setClassCounts(counts);
    }
  }, []);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleCategoryPress = (category) => {
    router.push(`/(tabs)/classes/${category.key || category.id}`);
  };

  const handleBundlesPress = () => {
    router.push('/(tabs)/classes/bundles');
  };

  const handlePrivatePress = () => {
    router.push('/(tabs)/classes/private');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('screens.classes')}</Text>
        </View>

        {/* Category Cards Grid */}
        <View style={styles.section}>
          <View style={styles.grid}>
            {categories.map((category) => (
              <View key={category.id || category.key} style={styles.gridItem}>
                <CategoryCard
                  category={category}
                  classCount={classCounts[category.id]}
                  onPress={() => handleCategoryPress(category)}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Buy Bundles Card */}
        <TouchableOpacity 
          style={styles.actionCard} 
          onPress={handleBundlesPress}
          activeOpacity={0.85}
        >
          <View style={styles.actionCardContent}>
            <Text style={styles.actionCardIcon}>🎫</Text>
            <View style={styles.actionCardText}>
              <Text style={styles.actionCardTitle}>{t('bundles.title')}</Text>
              <Text style={styles.actionCardSubtitle}>{locale === 'zh' ? '次卡' : 'Class Pass'}</Text>
            </View>
            <Text style={styles.actionCardArrow}>→</Text>
          </View>
        </TouchableOpacity>

        {/* Private Tuition Card */}
        <TouchableOpacity 
          style={styles.actionCard} 
          onPress={handlePrivatePress}
          activeOpacity={0.85}
        >
          <View style={styles.actionCardContent}>
            <Text style={styles.actionCardIcon}>👤</Text>
            <View style={styles.actionCardText}>
              <Text style={styles.actionCardTitle}>{t('private.title')}</Text>
              <Text style={styles.actionCardSubtitle}>
                {locale === 'zh' ? '一对一私教课程' : 'One-on-one private lessons'}
              </Text>
            </View>
            <Text style={styles.actionCardArrow}>→</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  content: { 
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  section: {
    marginBottom: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  gridItem: {
    width: `47%`,
  },
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    ...colors.shadows.soft,
    overflow: 'hidden',
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  actionCardIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  actionCardText: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  actionCardSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  actionCardArrow: {
    fontSize: fontSize.xl,
    color: colors.accent,
    fontWeight: '600',
  },
});
