import { supabase } from '../../supabase';
import {
  fetchUsers,
  fetchUserById,
  updateUserRole,
  deactivateUser,
  reactivateUser,
  fetchUserStats,
} from '../userManagementService';

describe('userManagementService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchUsers', () => {
    it('fetches users with default pagination', async () => {
      const mockUsers = [{ id: 'u1', name: 'Alice' }];
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: mockUsers, error: null, count: 1 })),
      };
      supabase.from.mockReturnValue(chain);

      const result = await fetchUsers();
      expect(supabase.from).toHaveBeenCalledWith('Users Info');
      expect(result.data).toEqual(mockUsers);
      expect(result.count).toBe(1);
    });

    it('applies search query filter', async () => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: [], error: null, count: 0 })),
      };
      supabase.from.mockReturnValue(chain);

      await fetchUsers({ query: 'Alice' });
      expect(chain.or).toHaveBeenCalledWith(expect.stringContaining('Alice'));
    });

    it('skips query filter when too short', async () => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: [], error: null, count: 0 })),
      };
      supabase.from.mockReturnValue(chain);

      await fetchUsers({ query: 'A' });
      expect(chain.or).not.toHaveBeenCalled();
    });

    it('applies role filter', async () => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: [], error: null, count: 0 })),
      };
      supabase.from.mockReturnValue(chain);

      await fetchUsers({ role: 'admin' });
      expect(chain.eq).toHaveBeenCalledWith('role', 'admin');
    });

    it('returns empty array when data is null', async () => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: null, error: null, count: null })),
      };
      supabase.from.mockReturnValue(chain);

      const result = await fetchUsers();
      expect(result.data).toEqual([]);
      expect(result.count).toBe(0);
    });
  });

  describe('fetchUserById', () => {
    it('fetches a single user by id', async () => {
      const mockUser = { id: 'u1', name: 'Bob', role: 'user' };
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: mockUser, error: null })),
      };
      supabase.from.mockReturnValue(chain);

      const result = await fetchUserById('u1');
      expect(chain.eq).toHaveBeenCalledWith('id', 'u1');
      expect(result.data).toEqual(mockUser);
    });
  });

  describe('updateUserRole', () => {
    it('blocks non-owner from granting owner role', async () => {
      const result = await updateUserRole('u1', 'owner', 'admin');
      expect(result.error.message).toMatch(/owner/i);
      expect(result.data).toBeNull();
    });

    it('allows owner to grant owner role', async () => {
      const chain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: { id: 'u1', role: 'owner' }, error: null })),
      };
      supabase.from.mockReturnValue(chain);

      const result = await updateUserRole('u1', 'owner', 'owner');
      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ role: 'owner' }));
      expect(result.data.role).toBe('owner');
    });

    it('allows admin to change role to admin', async () => {
      const chain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: { id: 'u1', role: 'admin' }, error: null })),
      };
      supabase.from.mockReturnValue(chain);

      const result = await updateUserRole('u1', 'admin', 'admin');
      expect(result.error).toBeNull();
      expect(result.data.role).toBe('admin');
    });
  });

  describe('deactivateUser', () => {
    it('sets is_active to false', async () => {
      const chain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: { id: 'u1', is_active: false }, error: null })),
      };
      supabase.from.mockReturnValue(chain);

      const result = await deactivateUser('u1');
      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ is_active: false }));
      expect(result.data.is_active).toBe(false);
    });
  });

  describe('reactivateUser', () => {
    it('sets is_active to true', async () => {
      const chain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: { id: 'u1', is_active: true }, error: null })),
      };
      supabase.from.mockReturnValue(chain);

      const result = await reactivateUser('u1');
      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ is_active: true }));
      expect(result.data.is_active).toBe(true);
    });
  });

  describe('fetchUserStats', () => {
    it('aggregates enrollment count, active bundles, and balance', async () => {
      supabase.from.mockImplementation((table) => {
        if (table === 'enrollments') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            then: jest.fn((resolve) => resolve({ count: 3, error: null })),
          };
        }
        if (table === 'user_bundles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            then: jest.fn((resolve) => resolve({ count: 2, error: null })),
          };
        }
        if (table === 'Users Info') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockReturnThis(),
            then: jest.fn((resolve) => resolve({ data: { current_balance: 150 }, error: null })),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          then: jest.fn((resolve) => resolve({ data: null, error: null })),
        };
      });

      const result = await fetchUserStats('auth-user-1');
      expect(result.data.enrollmentCount).toBe(3);
      expect(result.data.activeBundles).toBe(2);
      expect(result.data.balance).toBe(150);
      expect(result.error).toBeNull();
    });
  });
});
