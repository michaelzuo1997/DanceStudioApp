import React from 'react';

export const mockShopCartValue = {
  items: [],
  addItem: jest.fn(),
  removeItem: jest.fn(),
  updateQuantity: jest.fn(),
  clear: jest.fn(),
  total: 0,
  itemCount: 0,
};

const ShopCartContext = React.createContext(mockShopCartValue);

export function ShopCartProvider({ children, value }) {
  return (
    <ShopCartContext.Provider value={value || mockShopCartValue}>
      {children}
    </ShopCartContext.Provider>
  );
}

export function useShopCart() {
  return React.useContext(ShopCartContext);
}
