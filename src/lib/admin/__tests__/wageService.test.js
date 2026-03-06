import { supabase } from '../../supabase';
import {
  calculateInstructorWages,
  fetchWageStaff,
  generateWageCSV,
  exportWageCSV,
} from '../wageService';

// Mock expo-file-system and expo-sharing (virtual: true since they may not be installed)
jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/documents/',
  EncodingType: { UTF8: 'utf8' },
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
}), { virtual: true });

jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn().mockResolvedValue(undefined),
}), { virtual: true });

describe('wageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateInstructorWages', () => {
    it('returns error when dateFrom is missing', async () => {
      const result = await calculateInstructorWages({ dateTo: '2026-03-31' });
      expect(result.error.message).toMatch(/date range/i);
      expect(result.data).toEqual([]);
    });

    it('returns error when dateTo is missing', async () => {
      const result = await calculateInstructorWages({ dateFrom: '2026-03-01' });
      expect(result.error.message).toMatch(/date range/i);
      expect(result.data).toEqual([]);
    });

    it('returns grouped instructor wages with hours and pay', async () => {
      const mockClasses = [
        {
          instructor_id: 'inst-1',
          duration_minutes: 60,
          instructors: { id: 'inst-1', name: 'Alice', user_id: 'u-1' },
        },
        {
          instructor_id: 'inst-1',
          duration_minutes: 90,
          instructors: { id: 'inst-1', name: 'Alice', user_id: 'u-1' },
        },
        {
          instructor_id: 'inst-2',
          duration_minutes: 60,
          instructors: { id: 'inst-2', name: 'Bob', user_id: 'u-2' },
        },
      ];

      const mockUsersInfo = [
        { user_id: 'u-1', hourly_rate: 50 },
        { user_id: 'u-2', hourly_rate: 40 },
      ];

      // First call: class_timetable
      const classChain = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: mockClasses, error: null })),
      };

      // Second call: Users Info
      const usersChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: mockUsersInfo, error: null })),
      };

      supabase.from
        .mockReturnValueOnce(classChain)
        .mockReturnValueOnce(usersChain);

      const result = await calculateInstructorWages({
        dateFrom: '2026-03-01',
        dateTo: '2026-03-31',
      });

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);

      const alice = result.data.find((d) => d.instructorName === 'Alice');
      expect(alice.totalMinutes).toBe(150);
      expect(alice.totalHours).toBe(2.5);
      expect(alice.hourlyRate).toBe(50);
      expect(alice.totalPay).toBe(125);

      const bob = result.data.find((d) => d.instructorName === 'Bob');
      expect(bob.totalMinutes).toBe(60);
      expect(bob.totalHours).toBe(1);
      expect(bob.hourlyRate).toBe(40);
      expect(bob.totalPay).toBe(40);
    });

    it('returns null pay when hourly_rate is not set', async () => {
      const mockClasses = [
        {
          instructor_id: 'inst-1',
          duration_minutes: 60,
          instructors: { id: 'inst-1', name: 'Alice', user_id: 'u-1' },
        },
      ];

      const classChain = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: mockClasses, error: null })),
      };

      const usersChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: [], error: null })),
      };

      supabase.from
        .mockReturnValueOnce(classChain)
        .mockReturnValueOnce(usersChain);

      const result = await calculateInstructorWages({
        dateFrom: '2026-03-01',
        dateTo: '2026-03-31',
      });

      expect(result.data[0].hourlyRate).toBeNull();
      expect(result.data[0].totalPay).toBeNull();
    });

    it('applies campusId filter when provided', async () => {
      const classChain = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: [], error: null })),
      };

      supabase.from.mockReturnValue(classChain);

      await calculateInstructorWages({
        dateFrom: '2026-03-01',
        dateTo: '2026-03-31',
        campusId: 'campus-1',
      });

      expect(classChain.eq).toHaveBeenCalledWith('campus_id', 'campus-1');
    });

    it('filters out entries without instructor', async () => {
      const mockClasses = [
        {
          instructor_id: null,
          duration_minutes: 60,
          instructors: null,
        },
        {
          instructor_id: 'inst-1',
          duration_minutes: 45,
          instructors: { id: 'inst-1', name: 'Alice', user_id: 'u-1' },
        },
      ];

      const classChain = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: mockClasses, error: null })),
      };

      const usersChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: [{ user_id: 'u-1', hourly_rate: 30 }], error: null })),
      };

      supabase.from
        .mockReturnValueOnce(classChain)
        .mockReturnValueOnce(usersChain);

      const result = await calculateInstructorWages({
        dateFrom: '2026-03-01',
        dateTo: '2026-03-31',
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].instructorName).toBe('Alice');
    });
  });

  describe('fetchWageStaff', () => {
    it('fetches admin/owner users with hourly_rate set', async () => {
      const mockStaff = [
        { id: '1', user_id: 'u-1', name: 'Admin A', full_name: 'Admin A', role: 'admin', hourly_rate: 35 },
      ];

      const chain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: mockStaff, error: null })),
      };
      supabase.from.mockReturnValue(chain);

      const result = await fetchWageStaff();
      expect(supabase.from).toHaveBeenCalledWith('Users Info');
      expect(chain.in).toHaveBeenCalledWith('role', ['admin', 'owner']);
      expect(result.data).toEqual(mockStaff);
    });
  });

  describe('generateWageCSV', () => {
    it('generates CSV with header, rows, and grand total', () => {
      const entries = [
        { name: 'Alice', role: 'Instructor', hours: 10, rate: 50, total: 500 },
        { name: 'Bob', role: 'Admin', hours: 8, rate: 35, total: 280 },
      ];

      const csv = generateWageCSV(entries);
      const lines = csv.split('\n');

      expect(lines[0]).toBe('Name,Role,Hours,Hourly Rate (A$),Total (A$)');
      expect(lines[1]).toBe('Alice,Instructor,10,50,500');
      expect(lines[2]).toBe('Bob,Admin,8,35,280');
      expect(lines[3]).toBe('Grand Total,,,,780.00');
    });

    it('escapes CSV values with commas', () => {
      const entries = [
        { name: 'Smith, John', role: 'Instructor', hours: 5, rate: 40, total: 200 },
      ];

      const csv = generateWageCSV(entries);
      expect(csv).toContain('"Smith, John"');
    });
  });

  describe('exportWageCSV', () => {
    it('writes file and shares successfully', async () => {
      const FileSystem = require('expo-file-system');
      const Sharing = require('expo-sharing');

      const result = await exportWageCSV('csv-content', 'wages.csv');

      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        '/mock/documents/wages.csv',
        'csv-content',
        { encoding: 'utf8' }
      );
      expect(Sharing.shareAsync).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });
});
