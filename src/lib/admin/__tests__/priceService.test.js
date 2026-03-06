import { supabase } from '../../supabase';
import { previewPriceChange, bulkUpdatePrice } from '../priceService';

describe('priceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('previewPriceChange', () => {
    it('returns error when no filters provided', async () => {
      const result = await previewPriceChange({});
      expect(result.error.message).toMatch(/filter/i);
      expect(result.data).toEqual([]);
      expect(result.count).toBe(0);
    });

    it('returns matching classes when categoryId filter provided', async () => {
      const mockData = [
        { id: '1', price_per_class: 20 },
        { id: '2', price_per_class: 25 },
      ];
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: mockData, error: null })),
      };
      supabase.from.mockReturnValue(chain);

      const result = await previewPriceChange({ categoryId: 'cat-1' });
      expect(supabase.from).toHaveBeenCalledWith('class_timetable');
      expect(chain.eq).toHaveBeenCalledWith('category_id', 'cat-1');
      expect(chain.eq).toHaveBeenCalledWith('is_active', true);
      expect(result.data).toEqual(mockData);
      expect(result.count).toBe(2);
    });

    it('applies all filters when provided', async () => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: [], error: null })),
      };
      supabase.from.mockReturnValue(chain);

      await previewPriceChange({
        categoryId: 'cat-1',
        campusId: 'camp-1',
        audience: 'adult',
        dateFrom: '2026-03-01',
        dateTo: '2026-03-31',
      });

      expect(chain.eq).toHaveBeenCalledWith('category_id', 'cat-1');
      expect(chain.eq).toHaveBeenCalledWith('campus_id', 'camp-1');
      expect(chain.eq).toHaveBeenCalledWith('audience', 'adult');
      expect(chain.gte).toHaveBeenCalledWith('class_date', '2026-03-01');
      expect(chain.lte).toHaveBeenCalledWith('class_date', '2026-03-31');
    });

    it('returns empty array when data is null', async () => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: null, error: null })),
      };
      supabase.from.mockReturnValue(chain);

      const result = await previewPriceChange({ campusId: 'c1' });
      expect(result.data).toEqual([]);
      expect(result.count).toBe(0);
    });
  });

  describe('bulkUpdatePrice', () => {
    it('returns error when no filters provided', async () => {
      const result = await bulkUpdatePrice({ newPrice: 30 });
      expect(result.error.message).toMatch(/filter/i);
      expect(result.count).toBe(0);
    });

    it('returns error when price is 0 or negative', async () => {
      const result = await bulkUpdatePrice({ categoryId: 'cat-1', newPrice: 0 });
      expect(result.error.message).toMatch(/greater than 0/i);

      const result2 = await bulkUpdatePrice({ categoryId: 'cat-1', newPrice: -5 });
      expect(result2.error.message).toMatch(/greater than 0/i);
    });

    it('updates matching classes with new price', async () => {
      const mockUpdated = [{ id: '1', price_per_class: 35 }, { id: '2', price_per_class: 35 }];
      const chain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: mockUpdated, error: null })),
      };
      supabase.from.mockReturnValue(chain);

      const result = await bulkUpdatePrice({ categoryId: 'cat-1', newPrice: 35 });
      expect(supabase.from).toHaveBeenCalledWith('class_timetable');
      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({
        price_per_class: 35,
      }));
      expect(result.count).toBe(2);
      expect(result.error).toBeNull();
    });

    it('returns 0 count when no classes match', async () => {
      const chain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: null, error: null })),
      };
      supabase.from.mockReturnValue(chain);

      const result = await bulkUpdatePrice({ campusId: 'c1', newPrice: 25 });
      expect(result.count).toBe(0);
    });
  });
});
