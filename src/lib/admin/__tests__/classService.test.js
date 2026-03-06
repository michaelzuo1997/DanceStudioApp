import { supabase } from '../../supabase';
import {
  fetchClasses,
  fetchClassById,
  createClass,
  updateClass,
  deactivateClass,
  activateClass,
  rescheduleClass,
  changeInstructor,
} from '../classService';

// The supabase mock is auto-resolved via moduleNameMapper

describe('classService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchClasses', () => {
    it('returns data from class_timetable with joins', async () => {
      const mockData = [{ id: '1', day_of_week: 1 }];
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: mockData, error: null, count: 1 })),
      };
      supabase.from.mockReturnValue(chain);

      const result = await fetchClasses();
      expect(supabase.from).toHaveBeenCalledWith('class_timetable');
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

      await fetchClasses({ campusId: 'campus-1' });
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

      await fetchClasses({ isActive: true });
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

      const result = await fetchClasses();
      expect(result.data).toEqual([]);
    });
  });

  describe('fetchClassById', () => {
    it('fetches a single class by ID', async () => {
      const mockClass = { id: 'c1', day_of_week: 2 };
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: mockClass, error: null })),
      };
      supabase.from.mockReturnValue(chain);

      const result = await fetchClassById('c1');
      expect(chain.eq).toHaveBeenCalledWith('id', 'c1');
      expect(result.data).toEqual(mockClass);
    });
  });

  describe('createClass', () => {
    it('inserts a new class with mapped fields', async () => {
      const mockCreated = { id: 'new-1' };
      const chain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: mockCreated, error: null })),
      };
      supabase.from.mockReturnValue(chain);

      const result = await createClass({
        categoryId: 'cat-1',
        campusId: 'camp-1',
        audience: 'adult',
        dayOfWeek: 3,
        startTime: '14:00',
        durationMinutes: 90,
        pricePerClass: 25,
      });

      expect(supabase.from).toHaveBeenCalledWith('class_timetable');
      expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({
        category_id: 'cat-1',
        campus_id: 'camp-1',
        audience: 'adult',
        day_of_week: 3,
        start_time: '14:00',
        duration_minutes: 90,
        price_per_class: 25,
      }));
      expect(result.data).toEqual(mockCreated);
    });
  });

  describe('updateClass', () => {
    it('updates class fields with snake_case mapping', async () => {
      const chain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: { id: 'c1' }, error: null })),
      };
      supabase.from.mockReturnValue(chain);

      await updateClass('c1', { pricePerClass: 30, isActive: false });
      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({
        price_per_class: 30,
        is_active: false,
      }));
    });
  });

  describe('deactivateClass', () => {
    it('sets is_active to false', async () => {
      const chain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: { id: 'c1', is_active: false }, error: null })),
      };
      supabase.from.mockReturnValue(chain);

      const result = await deactivateClass('c1');
      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ is_active: false }));
      expect(result.data.is_active).toBe(false);
    });
  });

  describe('activateClass', () => {
    it('sets is_active to true', async () => {
      const chain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: { id: 'c1', is_active: true }, error: null })),
      };
      supabase.from.mockReturnValue(chain);

      const result = await activateClass('c1');
      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ is_active: true }));
      expect(result.data.is_active).toBe(true);
    });
  });

  describe('rescheduleClass', () => {
    it('updates date/time fields', async () => {
      const chain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: {}, error: null })),
      };
      supabase.from.mockReturnValue(chain);

      await rescheduleClass('c1', { classDate: '2026-04-01', startTime: '15:00', dayOfWeek: 2 });
      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({
        class_date: '2026-04-01',
        start_time: '15:00',
        day_of_week: 2,
      }));
    });
  });

  describe('changeInstructor', () => {
    it('updates instructor_id', async () => {
      const chain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: {}, error: null })),
      };
      supabase.from.mockReturnValue(chain);

      await changeInstructor('c1', 'instr-99');
      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ instructor_id: 'instr-99' }));
    });
  });
});
