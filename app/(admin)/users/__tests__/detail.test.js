import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import UserDetailScreen from '../detail';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ id: 'u1' }),
}));

jest.mock('../../../../src/context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key) => key,
    locale: 'en',
  }),
}));

jest.mock('../../../../src/hooks/useRequireRole', () => ({
  useRequireRole: () => ({
    authorized: true,
    loading: false,
    role: 'admin',
  }),
}));

jest.mock('../../../../src/lib/admin/userManagementService', () => ({
  fetchUserById: jest.fn().mockResolvedValue({
    data: {
      id: 'u1',
      user_id: 'auth-1',
      name: 'bob',
      full_name: 'Bob Jones',
      role: 'user',
      is_active: true,
      created_at: '2026-01-15T00:00:00Z',
    },
    error: null,
  }),
  fetchUserStats: jest.fn().mockResolvedValue({
    data: { enrollmentCount: 5, activeBundles: 2, balance: 100 },
    error: null,
  }),
  updateUserRole: jest.fn().mockResolvedValue({ data: {}, error: null }),
  deactivateUser: jest.fn().mockResolvedValue({ data: {}, error: null }),
  reactivateUser: jest.fn().mockResolvedValue({ data: {}, error: null }),
}));

describe('UserDetailScreen', () => {
  it('renders user name and avatar', async () => {
    const { getByText } = render(<UserDetailScreen />);
    await waitFor(() => {
      expect(getByText('Bob Jones')).toBeTruthy();
      expect(getByText('B')).toBeTruthy();
    });
  });

  it('renders stats cards', async () => {
    const { getByText } = render(<UserDetailScreen />);
    await waitFor(() => {
      expect(getByText('5')).toBeTruthy();
      expect(getByText('2')).toBeTruthy();
      expect(getByText('A$100.00')).toBeTruthy();
    });
  });

  it('renders role chips with owner disabled for admin caller', async () => {
    const { getByTestId } = render(<UserDetailScreen />);
    await waitFor(() => {
      expect(getByTestId('role-chip-user')).toBeTruthy();
      expect(getByTestId('role-chip-owner')).toBeTruthy();
      // owner chip should be disabled since caller is admin
      expect(getByTestId('role-chip-owner').props.accessibilityState?.disabled ?? getByTestId('role-chip-owner').props.disabled).toBeTruthy();
    });
  });
});
