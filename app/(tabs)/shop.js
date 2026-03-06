import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useLanguage } from '../../src/context/LanguageContext';
import { useShopCart } from '../../src/context/ShopCartContext';
import { fetchMerchandise } from '../../src/lib/merchandiseService';
import { MerchandiseCard } from '../../src/components/MerchandiseCard';
import { ShopCartSheet } from '../../src/components/ShopCartSheet';
import { colors, spacing, fontSize, borderRadius, fontFamily } from '../../src/constants/theme';

const CATEGORIES = [
  { key: null, labelEn: 'All', labelZh: '全部' },
  { key: '商品', labelEn: 'Goods', labelZh: '商品' },
  { key: '学杂', labelEn: 'Supplies', labelZh: '学杂' },
  { key: '其他', labelEn: 'Other', labelZh: '其他' },
];

export default function ShopScreen() {
  const { t, locale } = useLanguage();
  const { items: cartItems, addItem, updateQuantity, total, itemCount } = useShopCart();
  const [merchandise, setMerchandise] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cartSheetVisible, setCartSheetVisible] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await fetchMerchandise({ category: selectedCategory });
    setMerchandise(data);
    setLoading(false);
  }, [selectedCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const data = await fetchMerchandise({ category: selectedCategory });
    setMerchandise(data);
    setRefreshing(false);
  }, [selectedCategory]);

  const getCartQuantity = (itemId) => {
    const found = cartItems.find((i) => i.id === itemId);
    return found ? (found.quantity || 1) : 0;
  };

  const handleAddToCart = (item) => {
    addItem({
      id: item.id,
      name_en: item.name_en,
      name_zh: item.name_zh,
      price: item.price,
      image_url: item.image_url,
      stock: item.stock,
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.cardContainer}>
      <MerchandiseCard
        item={item}
        cartQuantity={getCartQuantity(item.id)}
        onAddToCart={handleAddToCart}
        onUpdateQuantity={updateQuantity}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.title}>{t('screens.shop')}</Text>
      </View>

      {/* Category Filter Chips */}
      <View style={styles.chipRow}>
        {CATEGORIES.map((cat) => {
          const isActive = cat.key === selectedCategory;
          const label = locale === 'zh' ? cat.labelZh : cat.labelEn;
          return (
            <Pressable
              key={cat.key ?? 'all'}
              style={({ pressed }) => [styles.chip, isActive && styles.chipActive, pressed && { opacity: 0.85 }]}
              onPress={() => setSelectedCategory(cat.key)}
              testID={`shop-category-${cat.key ?? 'all'}`}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Product Grid */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
      ) : merchandise.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{t('shop.emptyShop')}</Text>
        </View>
      ) : (
        <FlatList
          data={merchandise}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Sticky Bottom Bar */}
      {itemCount > 0 && (
        <Pressable
          style={({ pressed }) => [styles.bottomBar, pressed && { opacity: 0.9 }]}
          onPress={() => setCartSheetVisible(true)}
          testID="shop-view-cart-bar"
        >
          <Text style={styles.bottomBarText}>
            {itemCount} {t('shop.quantity')} · A${total.toFixed(2)}
          </Text>
          <Text style={styles.bottomBarAction}>{t('shop.viewCart')}</Text>
        </Pressable>
      )}

      <ShopCartSheet
        visible={cartSheetVisible}
        onClose={() => setCartSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.xxl,
    fontFamily: fontFamily.headingBold,
    color: colors.text,
    letterSpacing: -0.5,
  },
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceAlt,
  },
  chipActive: {
    backgroundColor: colors.accent,
  },
  chipText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.white,
  },
  loader: {
    marginVertical: spacing.xxxl,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
    margin: spacing.lg,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.lg,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textSecondary,
  },
  grid: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  gridRow: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  cardContainer: {
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  bottomBarText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.white,
  },
  bottomBarAction: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.accentLight,
  },
});
