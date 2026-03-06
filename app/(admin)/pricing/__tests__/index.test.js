import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import BulkPricingScreen from '../index';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
}));

jest.mock('../../../../src/context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key) => key,
    locale: 'en',
  }),
}));

jest.mock('../../../../src/context/CampusContext', () => ({
  useCampus: () => ({
    campuses: [
      { id: 'camp1', key: 'syd', name_en: 'Sydney' },
    ],
  }),
}));

jest.mock('../../../../src/lib/supabase', () => {
  const chain = {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    then: jest.fn((resolve) => resolve({
      data: [{ id: 'cat1', key: 'ballet', name_en: 'Ballet', name_zh: '芭蕾' }],
      error: null,
    })),
  };
  return {
    supabase: { from: jest.fn(() => chain) },
  };
});

jest.mock('../../../../src/lib/admin/priceService', () => ({
  previewPriceChange: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
  bulkUpdatePrice: jest.fn().mockResolvedValue({ data: null, error: null, count: 0 }),
}));

describe('BulkPricingScreen', () => {
  it('renders title and preview button', async () => {
    const { getByText, getByTestId } = render(<BulkPricingScreen />);
    await waitFor(() => {
      expect(getByText('admin.pricing.title')).toBeTruthy();
      expect(getByTestId('btn-preview')).toBeTruthy();
    });
  });

  it('renders category chips after loading', async () => {
    const { getByText } = render(<BulkPricingScreen />);
    await waitFor(() => {
      expect(getByText('Ballet')).toBeTruthy();
    });
  });

  it('renders campus chips', async () => {
    const { getByText } = render(<BulkPricingScreen />);
    await waitFor(() => {
      expect(getByText('Sydney')).toBeTruthy();
    });
  });
});
