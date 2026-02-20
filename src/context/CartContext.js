import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext(null);

const CART_KEY = 'dance-studio-cart';

async function loadCart() {
  try {
    const s = await AsyncStorage.getItem(CART_KEY);
    if (!s) return [];
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveCart(items) {
  await AsyncStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Load cart from storage on mount (Client-side only)
  useEffect(() => {
    loadCart().then((stored) => {
      setItems(stored);
      setLoaded(true);
    });
  }, []);

  const addItem = useCallback((item) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev;
      const next = [...prev, item];
      saveCart(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((classId) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== classId);
      saveCart(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    saveCart([]);
  }, []);

  const total = useMemo(
    () => items.reduce((sum, i) => sum + (Number(i.price) || 0), 0),
    [items]
  );

  const value = useMemo(
    () => ({ items, addItem, removeItem, clear, total }),
    [items, addItem, removeItem, clear, total]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
