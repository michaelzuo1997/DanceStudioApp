import React from 'react';

export const mockCartValue = {
  items: [],
  addItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  total: 0,
};

const CartContext = React.createContext(mockCartValue);

export function CartProvider({ children, value }) {
  return (
    <CartContext.Provider value={value || mockCartValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return React.useContext(CartContext);
}
