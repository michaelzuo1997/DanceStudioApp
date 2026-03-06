import React from 'react';
import { render, act, fireEvent, waitFor } from '@testing-library/react-native';
import { Text, Pressable } from 'react-native';
import { ShopCartProvider, useShopCart } from '../ShopCartContext';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

function TestConsumer() {
  const { items, addItem, removeItem, updateQuantity, clear, total, itemCount } = useShopCart();
  return (
    <>
      <Text testID="item-count">{itemCount}</Text>
      <Text testID="total">{total}</Text>
      <Text testID="items">{JSON.stringify(items)}</Text>
      <Pressable testID="add" onPress={() => addItem({ id: 'item-1', name_en: 'Shirt', price: 25, stock: 10 })} />
      <Pressable testID="add-oos" onPress={() => addItem({ id: 'item-2', name_en: 'Hat', price: 15, stock: 0 })} />
      <Pressable testID="remove" onPress={() => removeItem('item-1')} />
      <Pressable testID="update-qty" onPress={() => updateQuantity('item-1', 3)} />
      <Pressable testID="clear" onPress={() => clear()} />
    </>
  );
}

describe('ShopCartContext', () => {
  it('starts with empty cart', async () => {
    const { getByTestId } = render(
      <ShopCartProvider><TestConsumer /></ShopCartProvider>
    );
    expect(getByTestId('item-count')).toHaveTextContent('0');
    expect(getByTestId('total')).toHaveTextContent('0');
  });

  it('addItem adds to cart', async () => {
    const { getByTestId } = render(
      <ShopCartProvider><TestConsumer /></ShopCartProvider>
    );
    // Wait for initial loadCart to resolve
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    await act(async () => {
      fireEvent.press(getByTestId('add'));
    });
    expect(getByTestId('item-count')).toHaveTextContent('1');
  });

  it('does not add out-of-stock items', async () => {
    const { getByTestId } = render(
      <ShopCartProvider><TestConsumer /></ShopCartProvider>
    );
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    await act(async () => {
      fireEvent.press(getByTestId('add-oos'));
    });
    expect(getByTestId('item-count')).toHaveTextContent('0');
  });

  it('removeItem removes from cart', async () => {
    const { getByTestId } = render(
      <ShopCartProvider><TestConsumer /></ShopCartProvider>
    );
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    await act(async () => {
      fireEvent.press(getByTestId('add'));
    });
    await act(async () => {
      fireEvent.press(getByTestId('remove'));
    });
    expect(getByTestId('item-count')).toHaveTextContent('0');
  });

  it('updateQuantity updates item quantity', async () => {
    const { getByTestId } = render(
      <ShopCartProvider><TestConsumer /></ShopCartProvider>
    );
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    await act(async () => {
      fireEvent.press(getByTestId('add'));
    });
    expect(getByTestId('item-count')).toHaveTextContent('1');
    await act(async () => {
      fireEvent.press(getByTestId('update-qty'));
    });
    expect(getByTestId('item-count')).toHaveTextContent('3');
    expect(getByTestId('total')).toHaveTextContent('75');
  });

  it('clear empties the cart', async () => {
    const { getByTestId } = render(
      <ShopCartProvider><TestConsumer /></ShopCartProvider>
    );
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    await act(async () => {
      fireEvent.press(getByTestId('add'));
    });
    await act(async () => {
      fireEvent.press(getByTestId('clear'));
    });
    expect(getByTestId('item-count')).toHaveTextContent('0');
  });

  it('throws when used outside provider', () => {
    expect(() => render(<TestConsumer />)).toThrow('useShopCart must be used within ShopCartProvider');
  });
});
