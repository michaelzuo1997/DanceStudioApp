import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ShopCartContext = createContext(null);

const SHOP_CART_KEY = 'dance-studio-shop-cart';

async function loadCart() {
  try {
    const s = await AsyncStorage.getItem(SHOP_CART_KEY);
    if (!s) return [];
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveCart(items) {
  await AsyncStorage.setItem(SHOP_CART_KEY, JSON.stringify(items));
}

export function ShopCartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadCart().then((stored) => {
      setItems(stored);
      setLoaded(true);
    });
  }, []);

  const addItem = useCallback((item) => {
    if (item.stock === 0) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) return prev;
      const next = [...prev, { ...item, quantity: 1 }];
      saveCart(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((id) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      saveCart(next);
      return next;
    });
  }, []);

  const updateQuantity = useCallback((id, qty) => {
    setItems((prev) => {
      if (qty <= 0) {
        const next = prev.filter((i) => i.id !== id);
        saveCart(next);
        return next;
      }
      const next = prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i));
      saveCart(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    saveCart([]);
  }, []);

  const total = useMemo(
    () => items.reduce((sum, i) => sum + (Number(i.price) || 0) * (i.quantity || 1), 0),
    [items]
  );

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + (i.quantity || 1), 0),
    [items]
  );

  const value = useMemo(
    () => ({ items, addItem, removeItem, updateQuantity, clear, total, itemCount }),
    [items, addItem, removeItem, updateQuantity, clear, total, itemCount]
  );

  return (
    <ShopCartContext.Provider value={value}>
      {children}
    </ShopCartContext.Provider>
  );
}

export function useShopCart() {
  const ctx = useContext(ShopCartContext);
  if (!ctx) throw new Error('useShopCart must be used within ShopCartProvider');
  return ctx;
}
