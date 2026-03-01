// Mock for LanguageContext used in component tests

import React from 'react';

const translations = {
  'cart.empty': 'Your cart is empty.',
  'cart.allEnrolled': 'All enrolled!',
  'cart.total': 'Total',
  'cart.remove': 'Remove',
  'cart.browseClasses': 'Browse classes',
  'cart.checkoutSuccess': 'Checkout successful! Your classes have been enrolled.',
  'cart.signInRequired': 'Sign in to checkout.',
  'common.checkout': 'Checkout',
  'balance.processing': 'Processing...',
};

export const mockLanguageValue = {
  locale: 'en',
  setLocale: jest.fn(),
  ready: true,
  t: jest.fn((key) => translations[key] || key),
};

const LanguageContext = React.createContext(mockLanguageValue);

export function LanguageProvider({ children, value }) {
  return (
    <LanguageContext.Provider value={value || mockLanguageValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return React.useContext(LanguageContext);
}
