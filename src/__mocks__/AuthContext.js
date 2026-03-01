// Mock for AuthContext used in component tests
// Tests can override mockAuthValue to simulate different auth states

import React from 'react';

export const mockAuthValue = {
  user: { id: 'test-user-id', email: 'test@example.com' },
  session: { user: { id: 'test-user-id' } },
  loading: false,
  userInfo: { name: 'Test User', current_balance: 100 },
  signInWithEmail: jest.fn().mockResolvedValue({ error: null }),
  signUpWithEmail: jest.fn().mockResolvedValue({ data: {}, error: null }),
  resetPassword: jest.fn().mockResolvedValue({ error: null }),
  signOut: jest.fn().mockResolvedValue({ error: null }),
  refreshUserInfo: jest.fn().mockResolvedValue(undefined),
};

const AuthContext = React.createContext(mockAuthValue);

export function AuthProvider({ children, value }) {
  return (
    <AuthContext.Provider value={value || mockAuthValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return React.useContext(AuthContext);
}
