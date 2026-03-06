import React from 'react';
import { renderHook } from '@testing-library/react-native';
import { useRequireRole } from '../useRequireRole';

// Mock AuthContext
const mockUseAuth = jest.fn();
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('useRequireRole', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns loading true while auth is loading', () => {
    mockUseAuth.mockReturnValue({ userInfo: null, loading: true });

    const { result } = renderHook(() => useRequireRole(['admin', 'owner']));
    expect(result.current.loading).toBe(true);
    expect(result.current.authorized).toBe(false);
    expect(result.current.role).toBeNull();
  });

  it('returns authorized true for admin role', () => {
    mockUseAuth.mockReturnValue({
      userInfo: { role: 'admin' },
      loading: false,
    });

    const { result } = renderHook(() => useRequireRole(['admin', 'owner']));
    expect(result.current.loading).toBe(false);
    expect(result.current.authorized).toBe(true);
    expect(result.current.role).toBe('admin');
  });

  it('returns authorized true for owner role', () => {
    mockUseAuth.mockReturnValue({
      userInfo: { role: 'owner' },
      loading: false,
    });

    const { result } = renderHook(() => useRequireRole(['admin', 'owner']));
    expect(result.current.authorized).toBe(true);
    expect(result.current.role).toBe('owner');
  });

  it('returns authorized false for regular user', () => {
    mockUseAuth.mockReturnValue({
      userInfo: { role: 'user' },
      loading: false,
    });

    const { result } = renderHook(() => useRequireRole(['admin', 'owner']));
    expect(result.current.authorized).toBe(false);
    expect(result.current.role).toBe('user');
  });

  it('returns authorized false when userInfo is null', () => {
    mockUseAuth.mockReturnValue({
      userInfo: null,
      loading: false,
    });

    const { result } = renderHook(() => useRequireRole(['admin', 'owner']));
    expect(result.current.authorized).toBe(false);
    expect(result.current.role).toBeNull();
  });

  it('returns authorized false for instructor role when not allowed', () => {
    mockUseAuth.mockReturnValue({
      userInfo: { role: 'instructor' },
      loading: false,
    });

    const { result } = renderHook(() => useRequireRole(['admin', 'owner']));
    expect(result.current.authorized).toBe(false);
    expect(result.current.role).toBe('instructor');
  });
});
