import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import AdminUserList from '../index';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

jest.mock('../../../../src/context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key) => key,
    locale: 'en',
  }),
}));

jest.mock('../../../../src/lib/admin/userManagementService', () => ({
  fetchUsers: jest.fn().mockResolvedValue({
    data: [
      {
        id: 'u1',
        name: 'alice',
        full_name: 'Alice Smith',
        role: 'user',
        is_active: true,
        created_at: '2026-01-01T00:00:00Z',
      },
    ],
    error: null,
    count: 1,
  }),
}));

describe('AdminUserList', () => {
  it('renders search input and role filter chips', async () => {
    const { getByTestId, getByText } = render(<AdminUserList />);
    await waitFor(() => {
      expect(getByTestId('input-user-search')).toBeTruthy();
      expect(getByText('admin.users.allRoles')).toBeTruthy();
    });
  });

  it('renders user cards after loading', async () => {
    const { getByText } = render(<AdminUserList />);
    await waitFor(() => {
      expect(getByText('Alice Smith')).toBeTruthy();
    });
  });

  it('renders all role filter options', async () => {
    const { getAllByText, getByText } = render(<AdminUserList />);
    await waitFor(() => {
      // roleUser appears in both the filter chip and the user card badge
      expect(getAllByText('admin.users.roleUser').length).toBeGreaterThanOrEqual(1);
      expect(getByText('admin.users.roleAdmin')).toBeTruthy();
    });
  });
});
