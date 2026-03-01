/**
 * CartContext Unit Tests
 *
 * Tests the CartProvider and useCart hook in isolation.
 * AsyncStorage is mocked so no real device storage is touched.
 *
 * TDD phases documented inline:
 *   RED  - test written before/without implementation knowledge
 *   GREEN - test passes with real implementation
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';

// The AsyncStorage mock path is resolved by the moduleNameMapper in package.json
import AsyncStorage from '@react-native-async-storage/async-storage';

import { CartProvider, useCart } from '../CartContext';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Renders useCart inside a CartProvider and waits for the initial load. */
async function renderCartHook() {
  const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;
  const result = renderHook(() => useCart(), { wrapper });

  // Wait for the async loadCart() on mount to complete so `items` is settled.
  await waitFor(() => {
    // `loaded` is internal; we just wait until async effects flush.
  });

  return result;
}

const ITEM_A = { id: 'cls-1', name: 'Ballet Basics', price: 25, timetable_id: 'tt-1' };
const ITEM_B = { id: 'cls-2', name: 'Hip Hop Fundamentals', price: 30, timetable_id: 'tt-2' };
const ITEM_C = { id: 'cls-3', name: 'Chinese Classical', price: 0, timetable_id: 'tt-3' };

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  // Reset the in-memory store between tests
  const store = AsyncStorage.__INTERNAL_MOCK_STORAGE__;
  Object.keys(store).forEach((k) => delete store[k]);
});

// ---------------------------------------------------------------------------
// useCart outside provider
// ---------------------------------------------------------------------------

describe('useCart outside CartProvider', () => {
  it('throws a descriptive error when used outside CartProvider', () => {
    // RED: useCart should throw when no provider wraps it
    expect(() => renderHook(() => useCart())).toThrow(
      'useCart must be used within CartProvider'
    );
  });
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('CartProvider – initial state', () => {
  it('starts with an empty items array', async () => {
    const { result } = await renderCartHook();
    expect(result.current.items).toEqual([]);
  });

  it('starts with a total of 0', async () => {
    const { result } = await renderCartHook();
    expect(result.current.total).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// addItem
// ---------------------------------------------------------------------------

describe('addItem', () => {
  it('adds an item to the cart', async () => {
    const { result } = await renderCartHook();

    act(() => {
      result.current.addItem(ITEM_A);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toEqual(ITEM_A);
  });

  it('can add multiple distinct items', async () => {
    const { result } = await renderCartHook();

    act(() => {
      result.current.addItem(ITEM_A);
      result.current.addItem(ITEM_B);
    });

    expect(result.current.items).toHaveLength(2);
  });

  it('prevents duplicate items (same id)', async () => {
    const { result } = await renderCartHook();

    act(() => {
      result.current.addItem(ITEM_A);
      result.current.addItem(ITEM_A); // duplicate
    });

    expect(result.current.items).toHaveLength(1);
  });

  it('prevents duplicate even when item object reference differs', async () => {
    const { result } = await renderCartHook();
    const duplicate = { ...ITEM_A, name: 'Different name but same id' };

    act(() => {
      result.current.addItem(ITEM_A);
      result.current.addItem(duplicate);
    });

    expect(result.current.items).toHaveLength(1);
    // Original should be kept
    expect(result.current.items[0].name).toBe(ITEM_A.name);
  });

  it('persists the new cart to AsyncStorage', async () => {
    const { result } = await renderCartHook();

    act(() => {
      result.current.addItem(ITEM_A);
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'dance-studio-cart',
      JSON.stringify([ITEM_A])
    );
  });

  it('does not call setItem when a duplicate is added', async () => {
    const { result } = await renderCartHook();

    act(() => {
      result.current.addItem(ITEM_A);
    });

    const callCount = AsyncStorage.setItem.mock.calls.length;

    act(() => {
      result.current.addItem(ITEM_A); // duplicate — should be a no-op
    });

    expect(AsyncStorage.setItem.mock.calls.length).toBe(callCount);
  });

  it('handles items with price 0 without errors', async () => {
    const { result } = await renderCartHook();

    act(() => {
      result.current.addItem(ITEM_C);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.total).toBe(0);
  });

  it('handles items with undefined price gracefully (treats as 0)', async () => {
    const { result } = await renderCartHook();
    const itemNoPice = { id: 'cls-x', name: 'Free Class' };

    act(() => {
      result.current.addItem(itemNoPice);
    });

    expect(result.current.total).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// removeItem
// ---------------------------------------------------------------------------

describe('removeItem', () => {
  it('removes an item by id', async () => {
    const { result } = await renderCartHook();

    act(() => {
      result.current.addItem(ITEM_A);
      result.current.addItem(ITEM_B);
    });

    act(() => {
      result.current.removeItem(ITEM_A.id);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).toBe(ITEM_B.id);
  });

  it('does nothing when id is not in cart', async () => {
    const { result } = await renderCartHook();

    act(() => {
      result.current.addItem(ITEM_A);
    });

    act(() => {
      result.current.removeItem('non-existent-id');
    });

    expect(result.current.items).toHaveLength(1);
  });

  it('persists updated cart to AsyncStorage after removal', async () => {
    const { result } = await renderCartHook();

    act(() => {
      result.current.addItem(ITEM_A);
      result.current.addItem(ITEM_B);
    });

    jest.clearAllMocks();

    act(() => {
      result.current.removeItem(ITEM_A.id);
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'dance-studio-cart',
      JSON.stringify([ITEM_B])
    );
  });

  it('empties the cart when the last item is removed', async () => {
    const { result } = await renderCartHook();

    act(() => {
      result.current.addItem(ITEM_A);
    });

    act(() => {
      result.current.removeItem(ITEM_A.id);
    });

    expect(result.current.items).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// clear
// ---------------------------------------------------------------------------

describe('clear', () => {
  it('removes all items from the cart', async () => {
    const { result } = await renderCartHook();

    act(() => {
      result.current.addItem(ITEM_A);
      result.current.addItem(ITEM_B);
    });

    act(() => {
      result.current.clear();
    });

    expect(result.current.items).toHaveLength(0);
  });

  it('resets total to 0', async () => {
    const { result } = await renderCartHook();

    act(() => {
      result.current.addItem(ITEM_A);
      result.current.addItem(ITEM_B);
    });

    act(() => {
      result.current.clear();
    });

    expect(result.current.total).toBe(0);
  });

  it('persists empty cart to AsyncStorage', async () => {
    const { result } = await renderCartHook();

    act(() => {
      result.current.addItem(ITEM_A);
    });

    jest.clearAllMocks();

    act(() => {
      result.current.clear();
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'dance-studio-cart',
      JSON.stringify([])
    );
  });

  it('is a no-op when cart is already empty', async () => {
    const { result } = await renderCartHook();

    act(() => {
      result.current.clear();
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// total (computed)
// ---------------------------------------------------------------------------

describe('total', () => {
  it('sums prices of all items', async () => {
    const { result } = await renderCartHook();

    act(() => {
      result.current.addItem(ITEM_A); // 25
      result.current.addItem(ITEM_B); // 30
    });

    expect(result.current.total).toBe(55);
  });

  it('handles string prices by coercing to number', async () => {
    const { result } = await renderCartHook();
    const itemStringPrice = { id: 'cls-s', name: 'String Price', price: '19.99' };

    act(() => {
      result.current.addItem(itemStringPrice);
    });

    expect(result.current.total).toBeCloseTo(19.99);
  });

  it('updates when items are removed', async () => {
    const { result } = await renderCartHook();

    act(() => {
      result.current.addItem(ITEM_A); // 25
      result.current.addItem(ITEM_B); // 30
    });

    act(() => {
      result.current.removeItem(ITEM_B.id); // remove 30
    });

    expect(result.current.total).toBe(25);
  });

  it('handles large carts efficiently (100 items)', async () => {
    const { result } = await renderCartHook();

    const manyItems = Array.from({ length: 100 }, (_, i) => ({
      id: `cls-${i}`,
      name: `Class ${i}`,
      price: 10,
    }));

    act(() => {
      manyItems.forEach((item) => result.current.addItem(item));
    });

    expect(result.current.total).toBe(1000);
    expect(result.current.items).toHaveLength(100);
  });
});

// ---------------------------------------------------------------------------
// AsyncStorage persistence – load on mount
// ---------------------------------------------------------------------------

describe('AsyncStorage persistence', () => {
  it('loads persisted cart from AsyncStorage on mount', async () => {
    const persisted = [ITEM_A, ITEM_B];
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(persisted));

    const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(2);
    });

    expect(result.current.items[0].id).toBe(ITEM_A.id);
    expect(result.current.items[1].id).toBe(ITEM_B.id);
  });

  it('reads from the correct AsyncStorage key', async () => {
    const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;
    renderHook(() => useCart(), { wrapper });

    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('dance-studio-cart');
    });
  });

  it('starts with empty cart when AsyncStorage returns null', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);

    const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => {
      expect(result.current.items).toEqual([]);
    });
  });

  it('starts with empty cart when AsyncStorage contains invalid JSON', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('not-valid-json{{');

    const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => {
      expect(result.current.items).toEqual([]);
    });
  });

  it('starts with empty cart when AsyncStorage contains non-array JSON', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({ id: 'oops' }));

    const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => {
      expect(result.current.items).toEqual([]);
    });
  });

  it('recovers gracefully when AsyncStorage.getItem throws', async () => {
    AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage unavailable'));

    const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => {
      expect(result.current.items).toEqual([]);
    });
  });
});
