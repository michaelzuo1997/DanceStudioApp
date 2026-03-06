import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import AdminClassList from '../index';

// expo-router mock is handled by moduleNameMapper (src/__mocks__/expo-router.js)
// LanguageContext and CampusContext mocks also resolved by moduleNameMapper

const mockFetchClasses = jest.fn();

jest.mock('../../../../src/lib/admin/classService', () => ({
  fetchClasses: (...args) => mockFetchClasses(...args),
}));

jest.mock('../../../../src/components/admin/AdminClassCard', () => {
  const { Text } = require('react-native');
  return {
    AdminClassCard: ({ classItem }) => <Text testID="admin-class-card">{classItem.id}</Text>,
  };
});

const CLASS_DATA = [
  {
    id: 'c1',
    day_of_week: 1,
    start_time: '10:00:00',
    duration_minutes: 60,
    price_per_class: 20,
    is_active: true,
    audience: 'adult',
    class_categories: { key: 'ballet', name_en: 'Ballet', name_zh: '芭蕾' },
    campuses: { key: 'syd', name_en: 'Sydney', name_zh: '悉尼' },
  },
];

describe('AdminClassList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchClasses.mockResolvedValue({ data: CLASS_DATA, error: null });
  });

  it('renders class list after loading', async () => {
    const { getByTestId } = render(<AdminClassList />);
    await waitFor(() => {
      expect(getByTestId('admin-class-card')).toBeTruthy();
    });
  });

  it('renders filter chips', async () => {
    const { getByText } = render(<AdminClassList />);
    await waitFor(() => {
      expect(getByText('admin.allStatuses')).toBeTruthy();
      expect(getByText('admin.active')).toBeTruthy();
      expect(getByText('admin.inactive')).toBeTruthy();
    });
  });

  it('renders FAB button', async () => {
    const { getByTestId } = render(<AdminClassList />);
    await waitFor(() => {
      expect(getByTestId('fab-add-class')).toBeTruthy();
    });
  });

  it('navigates to create screen on FAB press', async () => {
    const { getByTestId } = render(<AdminClassList />);
    await waitFor(() => {
      expect(getByTestId('fab-add-class')).toBeTruthy();
    });
    fireEvent.press(getByTestId('fab-add-class'));
    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/(admin)/classes/edit' })
    );
  });

  it('shows empty message when no classes', async () => {
    mockFetchClasses.mockResolvedValue({ data: [], error: null });
    const { getByText } = render(<AdminClassList />);
    await waitFor(() => {
      expect(getByText('admin.noClasses')).toBeTruthy();
    });
  });
});
