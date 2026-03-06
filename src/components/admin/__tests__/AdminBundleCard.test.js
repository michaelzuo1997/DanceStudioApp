import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AdminBundleCard } from '../AdminBundleCard';

jest.mock('../../../context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key) => key,
    locale: 'en',
  }),
}));

jest.mock('../../../lib/admin/bundleService', () => ({
  deactivateBundle: jest.fn().mockResolvedValue({ data: {}, error: null }),
  activateBundle: jest.fn().mockResolvedValue({ data: {}, error: null }),
}));

const { deactivateBundle, activateBundle } = require('../../../lib/admin/bundleService');

const baseBundle = {
  id: 'b1',
  class_count: 10,
  expiry_weeks: 12,
  total_price: 200,
  is_active: true,
  audience: 'adult',
  category_id: 'cat-1',
  class_categories: { key: 'ballet', name_en: 'Ballet', name_zh: '芭蕾' },
};

describe('AdminBundleCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders bundle class count and expiry', () => {
    const { getByText } = render(
      <AdminBundleCard bundle={baseBundle} locale="en" onEdit={jest.fn()} onRefresh={jest.fn()} />
    );
    expect(getByText(/10/)).toBeTruthy();
    expect(getByText(/12/)).toBeTruthy();
  });

  it('renders category name', () => {
    const { getByText } = render(
      <AdminBundleCard bundle={baseBundle} locale="en" onEdit={jest.fn()} onRefresh={jest.fn()} />
    );
    expect(getByText('Ballet')).toBeTruthy();
  });

  it('renders active badge when bundle is active', () => {
    const { getByText } = render(
      <AdminBundleCard bundle={baseBundle} locale="en" onEdit={jest.fn()} onRefresh={jest.fn()} />
    );
    expect(getByText('admin.active')).toBeTruthy();
  });

  it('renders total price', () => {
    const { getByText } = render(
      <AdminBundleCard bundle={baseBundle} locale="en" onEdit={jest.fn()} onRefresh={jest.fn()} />
    );
    expect(getByText('A$200.00')).toBeTruthy();
  });

  it('renders per-class price', () => {
    const { getByText } = render(
      <AdminBundleCard bundle={baseBundle} locale="en" onEdit={jest.fn()} onRefresh={jest.fn()} />
    );
    expect(getByText(/A\$20\.00/)).toBeTruthy();
  });

  it('calls onEdit when edit button pressed', () => {
    const onEdit = jest.fn();
    const { getByText } = render(
      <AdminBundleCard bundle={baseBundle} locale="en" onEdit={onEdit} onRefresh={jest.fn()} />
    );
    fireEvent.press(getByText('admin.editBundle'));
    expect(onEdit).toHaveBeenCalled();
  });

  it('calls deactivateBundle and onRefresh when toggling active bundle', async () => {
    const onRefresh = jest.fn();
    const { getByText } = render(
      <AdminBundleCard bundle={baseBundle} locale="en" onEdit={jest.fn()} onRefresh={onRefresh} />
    );
    fireEvent.press(getByText('admin.deactivate'));
    await waitFor(() => {
      expect(deactivateBundle).toHaveBeenCalledWith('b1');
      expect(onRefresh).toHaveBeenCalled();
    });
  });

  it('calls activateBundle when toggling inactive bundle', async () => {
    const inactive = { ...baseBundle, is_active: false };
    const onRefresh = jest.fn();
    const { getByText } = render(
      <AdminBundleCard bundle={inactive} locale="en" onEdit={jest.fn()} onRefresh={onRefresh} />
    );
    fireEvent.press(getByText('admin.activate'));
    await waitFor(() => {
      expect(activateBundle).toHaveBeenCalledWith('b1');
    });
  });
});
