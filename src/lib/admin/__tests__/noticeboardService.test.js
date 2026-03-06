import { supabase } from '../../supabase';
import {
  fetchNotices,
  fetchNoticeById,
  createNotice,
  updateNotice,
  deactivateNotice,
  activateNotice,
} from '../noticeboardService';

describe('noticeboardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchNotices', () => {
    it('returns data from noticeboard with joins', async () => {
      const mockData = [{ id: 'n1', title_en: 'Test Notice' }];
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: mockData, error: null, count: 1 })),
      };
      supabase.from.mockReturnValue(chain);

      const result = await fetchNotices();
      expect(supabase.from).toHaveBeenCalledWith('noticeboard');
      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();
    });

    it('applies campusId filter when provided', async () => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: [], error: null, count: 0 })),
      };
      supabase.from.mockReturnValue(chain);

      await fetchNotices({ campusId: 'campus-1' });
      expect(chain.eq).toHaveBeenCalledWith('campus_id', 'campus-1');
    });

    it('applies isActive filter when boolean', async () => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: [], error: null, count: 0 })),
      };
      supabase.from.mockReturnValue(chain);

      await fetchNotices({ isActive: true });
      expect(chain.eq).toHaveBeenCalledWith('is_active', true);
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

      const result = await fetchNotices();
      expect(result.data).toEqual([]);
    });
  });

  describe('fetchNoticeById', () => {
    it('fetches a single notice by ID', async () => {
      const mockNotice = { id: 'n1', title_en: 'Test' };
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: mockNotice, error: null })),
      };
      supabase.from.mockReturnValue(chain);

      const result = await fetchNoticeById('n1');
      expect(chain.eq).toHaveBeenCalledWith('id', 'n1');
      expect(result.data).toEqual(mockNotice);
    });
  });

  describe('createNotice', () => {
    it('inserts a new notice with mapped fields', async () => {
      const mockCreated = { id: 'new-1' };
      const chain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: mockCreated, error: null })),
      };
      supabase.from.mockReturnValue(chain);

      const result = await createNotice({
        titleEn: 'Hello',
        titleZh: '你好',
        bodyEn: 'Body text',
        priority: 1,
      });

      expect(supabase.from).toHaveBeenCalledWith('noticeboard');
      expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({
        title_en: 'Hello',
        title_zh: '你好',
        body_en: 'Body text',
        priority: 1,
      }));
      expect(result.data).toEqual(mockCreated);
    });
  });

  describe('updateNotice', () => {
    it('updates notice fields with snake_case mapping', async () => {
      const chain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: { id: 'n1' }, error: null })),
      };
      supabase.from.mockReturnValue(chain);

      await updateNotice('n1', { titleEn: 'Updated', priority: 2 });
      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({
        title_en: 'Updated',
        priority: 2,
      }));
    });
  });

  describe('deactivateNotice', () => {
    it('sets is_active to false', async () => {
      const chain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: { id: 'n1', is_active: false }, error: null })),
      };
      supabase.from.mockReturnValue(chain);

      const result = await deactivateNotice('n1');
      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ is_active: false }));
      expect(result.data.is_active).toBe(false);
    });
  });

  describe('activateNotice', () => {
    it('sets is_active to true', async () => {
      const chain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: { id: 'n1', is_active: true }, error: null })),
      };
      supabase.from.mockReturnValue(chain);

      const result = await activateNotice('n1');
      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ is_active: true }));
      expect(result.data.is_active).toBe(true);
    });
  });
});
