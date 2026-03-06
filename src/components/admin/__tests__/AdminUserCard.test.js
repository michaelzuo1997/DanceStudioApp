import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AdminUserCard } from '../AdminUserCard';

jest.mock('../../../context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key) => key,
    locale: 'en',
  }),
}));

const mockUser = {
  id: 'u1',
  name: 'alice',
  full_name: 'Alice Smith',
  role: 'user',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
};

describe('AdminUserCard', () => {
  it('renders user name and role badge', () => {
    const { getByText } = render(<AdminUserCard user={mockUser} onPress={() => {}} />);
    expect(getByText('Alice Smith')).toBeTruthy();
    expect(getByText('admin.users.roleUser')).toBeTruthy();
  });

  it('renders initial from full_name', () => {
    const { getByText } = render(<AdminUserCard user={mockUser} onPress={() => {}} />);
    expect(getByText('A')).toBeTruthy();
  });

  it('shows deactivated badge when is_active is false', () => {
    const inactive = { ...mockUser, is_active: false };
    const { getByText } = render(<AdminUserCard user={inactive} onPress={() => {}} />);
    expect(getByText('admin.users.statusDeactivated')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<AdminUserCard user={mockUser} onPress={onPress} />);
    fireEvent.press(getByTestId('user-card-u1'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('handles user with only name (no full_name)', () => {
    const nameOnly = { ...mockUser, full_name: null };
    const { getByText } = render(<AdminUserCard user={nameOnly} onPress={() => {}} />);
    expect(getByText('alice')).toBeTruthy();
  });
});
