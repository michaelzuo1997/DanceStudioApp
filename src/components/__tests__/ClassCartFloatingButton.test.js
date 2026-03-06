import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ClassCartFloatingButton } from '../ClassCartFloatingButton';

// We need to mock CartContext with items
const mockCartValue = {
  items: [],
  addItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  total: 0,
};

jest.mock('../../context/CartContext', () => ({
  useCart: () => mockCartValue,
}));

// Mock supabase for ClassCartSheet
jest.mock('../../lib/supabase', () => ({
  supabase: { rpc: jest.fn() },
}));

describe('ClassCartFloatingButton', () => {
  beforeEach(() => {
    mockCartValue.items = [];
  });

  it('returns null when cart is empty', () => {
    const { toJSON } = render(<ClassCartFloatingButton />);
    expect(toJSON()).toBeNull();
  });

  it('renders FAB when cart has items', () => {
    mockCartValue.items = [{ id: '1', name: 'Class', price: 20 }];
    const { getByTestId } = render(<ClassCartFloatingButton />);
    expect(getByTestId('class-cart-fab')).toBeTruthy();
  });

  it('shows badge with item count', () => {
    mockCartValue.items = [
      { id: '1', name: 'Class A', price: 20 },
      { id: '2', name: 'Class B', price: 25 },
    ];
    const { getByText } = render(<ClassCartFloatingButton />);
    expect(getByText('2')).toBeTruthy();
  });
});
