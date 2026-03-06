import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import AdminBundleList from '../index';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

jest.mock('../../../../src/context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key) => key,
    locale: 'en',
  }),
}));

jest.mock('../../../../src/lib/admin/bundleService', () => ({
  fetchBundles: jest.fn().mockResolvedValue({
    data: [
      {
        id: 'b1',
        class_count: 10,
        expiry_weeks: 12,
        total_price: 200,
        is_active: true,
        audience: 'adult',
        class_categories: { key: 'ballet', name_en: 'Ballet', name_zh: '芭蕾' },
      },
    ],
    error: null,
    count: 1,
  }),
  deactivateBundle: jest.fn().mockResolvedValue({ data: {}, error: null }),
  activateBundle: jest.fn().mockResolvedValue({ data: {}, error: null }),
}));

describe('AdminBundleList', () => {
  it('renders bundle list with filter bar', async () => {
    const { getByText, getAllByText } = render(<AdminBundleList />);
    await waitFor(() => {
      expect(getByText('admin.allStatuses')).toBeTruthy();
      expect(getAllByText('admin.active').length).toBeGreaterThanOrEqual(1);
      expect(getByText('admin.inactive')).toBeTruthy();
    });
  });

  it('renders FAB for adding bundles', async () => {
    const { getByTestId } = render(<AdminBundleList />);
    await waitFor(() => {
      expect(getByTestId('fab-add-bundle')).toBeTruthy();
    });
  });

  it('renders bundle card with class count', async () => {
    const { getByText } = render(<AdminBundleList />);
    await waitFor(() => {
      expect(getByText(/10/)).toBeTruthy();
    });
  });
});
