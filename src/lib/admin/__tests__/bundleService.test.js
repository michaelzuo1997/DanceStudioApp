import { supabase } from '../../supabase';
import {
  fetchBundles,
  fetchBundleById,
  createBundle,
  updateBundle,
  deactivateBundle,
  activateBundle,
} from '../bundleService';

describe('bundleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchBundles', () => {
    it('returns data from class_bundles with joins', async () => {
      const mockData = [{ id: 'b1', class_count: 10 }];
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: mockData, error: null, count: 1 })),
      };
      supabase.from.mockReturnValue(chain);

      const result = await fetchBundles();
      expect(supabase.from).toHaveBeenCalledWith('class_bundles');
      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();
    });

    it('applies categoryId filter when provided', async () => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: [], error: null, count: 0 })),
      };
      supabase.from.mockReturnValue(chain);

      await fetchBundles({ categoryId: 'cat-1' });
      expect(chain.eq).toHaveBeenCalledWith('category_id', 'cat-1');
    });

    it('applies audience filter when provided', async () => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: [], error: null, count: 0 })),
      };
      supabase.from.mockReturnValue(chain);

      await fetchBundles({ audience: 'adult' });
      expect(chain.eq).toHaveBeenCalledWith('audience', 'adult');
    });

    it('returns empty array when data is null', async () => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: null, error: null, count: 0 })),
      };
      supabase.from.mockReturnValue(chain);

      const result = await fetchBundles();
      expect(result.data).toEqual([]);
    });
  });

  describe('fetchBundleById', () => {
    it('fetches a single bundle by ID', async () => {
      const mockBundle = { id: 'b1', class_count: 10 };
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: mockBundle, error: null })),
      };
      supabase.from.mockReturnValue(chain);

      const result = await fetchBundleById('b1');
      expect(chain.eq).toHaveBeenCalledWith('id', 'b1');
      expect(result.data).toEqual(mockBundle);
    });
  });

  describe('createBundle', () => {
    it('inserts a new bundle with mapped fields', async () => {
      const mockCreated = { id: 'new-1' };
      const chain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: mockCreated, error: null })),
      };
      supabase.from.mockReturnValue(chain);

      const result = await createBundle({
        categoryId: 'cat-1',
        audience: 'adult',
        classCount: 10,
        expiryWeeks: 12,
        totalPrice: 200,
      });

      expect(supabase.from).toHaveBeenCalledWith('class_bundles');
      expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({
        category_id: 'cat-1',
        audience: 'adult',
        class_count: 10,
        expiry_weeks: 12,
        total_price: 200,
      }));
      expect(result.data).toEqual(mockCreated);
    });
  });

  describe('deactivateBundle', () => {
    it('sets is_active to false', async () => {
      const chain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: { id: 'b1', is_active: false }, error: null })),
      };
      supabase.from.mockReturnValue(chain);

      const result = await deactivateBundle('b1');
      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ is_active: false }));
      expect(result.data.is_active).toBe(false);
    });
  });

  describe('activateBundle', () => {
    it('sets is_active to true', async () => {
      const chain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: { id: 'b1', is_active: true }, error: null })),
      };
      supabase.from.mockReturnValue(chain);

      const result = await activateBundle('b1');
      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ is_active: true }));
      expect(result.data.is_active).toBe(true);
    });
  });
});
