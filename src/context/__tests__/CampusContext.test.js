import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock supabase using the exact path CampusContext.js imports from so Jest
// uses a single module instance for both the test and the component.
const mockFrom = jest.fn();
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  },
}));

const { CampusProvider, useCampus } = require('../CampusContext');

const CAMPUS_KEY = 'selected-campus';

const mockCampuses = [
  { id: 'c1', key: 'hornsby', name_en: 'Hornsby', name_zh: '霍恩斯比', is_active: true, sort_order: 1 },
  { id: 'c2', key: 'macquarie_park', name_en: 'Macquarie Park', name_zh: '麦格理公园', is_active: true, sort_order: 2 },
  { id: 'c3', key: 'carlingford', name_en: 'Carlingford', name_zh: '卡林福德', is_active: true, sort_order: 3 },
];

function buildChain(resolvedData) {
  const resolved = { data: resolvedData, error: null };
  // Each method in the chain returns a new object that also has the same
  // chainable methods plus a `then` so `await chain.select().eq().order()`
  // resolves to `resolved`. We attach `then` to every level so that
  // whichever method is last in the chain is still awaitable.
  function makeNode() {
    const node = {
      select: jest.fn(() => makeNode()),
      eq: jest.fn(() => makeNode()),
      order: jest.fn(() => makeNode()),
      // Real thenable: delegate to a real Promise so that both native
      // async/await and Babel's asyncToGenerator resolve correctly.
      then: jest.fn((resolve, reject) => Promise.resolve(resolved).then(resolve, reject)),
    };
    return node;
  }
  return makeNode();
}

function wrapper({ children }) {
  return <CampusProvider>{children}</CampusProvider>;
}

describe('CampusContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
    mockFrom.mockImplementation(() => buildChain(mockCampuses));
  });

  it('fetches campuses on mount', async () => {
    const { result } = renderHook(() => useCampus(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFrom).toHaveBeenCalledWith('campuses');
    expect(result.current.campuses).toEqual(mockCampuses);
  });

  it('defaults selectedCampus to null (all campuses)', async () => {
    const { result } = renderHook(() => useCampus(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.selectedCampus).toBeNull();
  });

  it('sets and persists selected campus', async () => {
    const { result } = renderHook(() => useCampus(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.setSelectedCampus('c1');
    });

    expect(result.current.selectedCampus).toBe('c1');
    const stored = await AsyncStorage.getItem(CAMPUS_KEY);
    expect(stored).toBe('c1');
  });

  it('clears selection when set to null', async () => {
    await AsyncStorage.setItem(CAMPUS_KEY, 'c2');
    const { result } = renderHook(() => useCampus(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.setSelectedCampus(null);
    });

    expect(result.current.selectedCampus).toBeNull();
    const stored = await AsyncStorage.getItem(CAMPUS_KEY);
    expect(stored).toBeNull();
  });

  it('restores saved campus from AsyncStorage', async () => {
    await AsyncStorage.setItem(CAMPUS_KEY, 'c3');
    const { result } = renderHook(() => useCampus(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.selectedCampus).toBe('c3');
  });

  it('handles empty campuses gracefully', async () => {
    mockFrom.mockImplementation(() => buildChain([]));

    const { result } = renderHook(() => useCampus(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.campuses).toEqual([]);
  });

  it('handles supabase returning null data', async () => {
    mockFrom.mockImplementation(() => buildChain(null));

    const { result } = renderHook(() => useCampus(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.campuses).toEqual([]);
  });

  it('throws when useCampus is used outside CampusProvider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useCampus());
    }).toThrow('useCampus must be used within CampusProvider');

    consoleSpy.mockRestore();
  });
});
