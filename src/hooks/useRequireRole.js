import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Hook to check if current user has one of the required roles.
 * @param {string[]} allowedRoles - e.g. ['admin', 'owner']
 * @returns {{ authorized: boolean, loading: boolean, role: string|null }}
 */
export function useRequireRole(allowedRoles) {
  const { userInfo, loading: authLoading } = useAuth();

  const result = useMemo(() => {
    if (authLoading) {
      return { authorized: false, loading: true, role: null };
    }

    const role = userInfo?.role ?? null;
    const authorized = role !== null && allowedRoles.includes(role);

    return { authorized, loading: false, role };
  }, [authLoading, userInfo?.role, allowedRoles]);

  return result;
}
