import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { ClassCartSheet } from './ClassCartSheet';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';

export function ClassCartFloatingButton() {
  const { items } = useCart();
  const [sheetVisible, setSheetVisible] = useState(false);

  if (items.length === 0) return null;

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]}
        onPress={() => setSheetVisible(true)}
        testID="class-cart-fab"
      >
        <Ionicons name="cart" size={24} color={colors.white} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {items.length > 9 ? '9+' : items.length}
          </Text>
        </View>
      </Pressable>

      <ClassCartSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...colors.shadows.lg,
    zIndex: 100,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
});
