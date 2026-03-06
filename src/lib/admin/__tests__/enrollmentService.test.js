import { supabase } from '../../supabase';
import {
  fetchEnrollmentsForClass,
  adminEnrollUser,
  adminUnenrollUser,
  adminBulkUnenroll,
} from '../enrollmentService';

describe('enrollmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchEnrollmentsForClass', () => {
    it('queries enrollments filtered by class_id and active status', async () => {
      const mockData = [{ id: 'e1', user_id: 'u1' }];
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: mockData, error: null })),
      };
      supabase.from.mockReturnValue(chain);

      const result = await fetchEnrollmentsForClass('tt-1');
      expect(supabase.from).toHaveBeenCalledWith('enrollments');
      expect(chain.eq).toHaveBeenCalledWith('class_id', 'tt-1');
      expect(chain.eq).toHaveBeenCalledWith('status', 'active');
      expect(result.data).toEqual(mockData);
    });

    it('returns empty array when data is null', async () => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: null, error: null })),
      };
      supabase.from.mockReturnValue(chain);

      const result = await fetchEnrollmentsForClass('tt-1');
      expect(result.data).toEqual([]);
    });
  });

  describe('adminEnrollUser', () => {
    it('inserts enrollment with admin metadata', async () => {
      const chain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: { id: 'e-new' }, error: null })),
      };
      supabase.from.mockReturnValue(chain);

      const result = await adminEnrollUser('tt-1', 'user-1', { paymentType: 'cash' });
      expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({
        class_id: 'tt-1',
        user_id: 'user-1',
        status: 'active',
        payment_type: 'cash',
        enrolled_by: 'admin',
      }));
      expect(result.data.id).toBe('e-new');
    });

    it('defaults paymentType to cash', async () => {
      const chain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: {}, error: null })),
      };
      supabase.from.mockReturnValue(chain);

      await adminEnrollUser('tt-1', 'user-1');
      expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({
        payment_type: 'cash',
      }));
    });
  });

  describe('adminUnenrollUser', () => {
    it('updates enrollment status to cancelled', async () => {
      const chain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: { status: 'cancelled' }, error: null })),
      };
      supabase.from.mockReturnValue(chain);

      const result = await adminUnenrollUser('e-1');
      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({
        status: 'cancelled',
      }));
      expect(result.data.status).toBe('cancelled');
    });

    it('includes cancel_reason when provided', async () => {
      const chain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: {}, error: null })),
      };
      supabase.from.mockReturnValue(chain);

      await adminUnenrollUser('e-1', { reason: 'class cancelled' });
      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({
        cancel_reason: 'class cancelled',
      }));
    });
  });

  describe('adminBulkUnenroll', () => {
    it('cancels all active enrollments for a class', async () => {
      const mockData = [{ id: 'e1' }, { id: 'e2' }];
      const chain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: mockData, error: null })),
      };
      supabase.from.mockReturnValue(chain);

      const result = await adminBulkUnenroll('tt-1', 'class removed');
      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({
        status: 'cancelled',
        cancel_reason: 'class removed',
      }));
      expect(chain.eq).toHaveBeenCalledWith('class_id', 'tt-1');
      expect(chain.eq).toHaveBeenCalledWith('status', 'active');
      expect(result.data).toHaveLength(2);
    });
  });
});
