import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const CampusContext = createContext(null);

const CAMPUS_KEY = 'selected-campus';

export function CampusProvider({ children }) {
  const [campuses, setCampuses] = useState([]);
  const [selectedCampus, setSelectedCampusState] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCampuses = useCallback(async () => {
    const { data } = await supabase
      .from('campuses')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    setCampuses(data ?? []);
  }, []);

  // Load saved campus selection + fetch campuses on mount
  useEffect(() => {
    const init = async () => {
      try {
        const [saved] = await Promise.all([
          AsyncStorage.getItem(CAMPUS_KEY),
          fetchCampuses(),
        ]);
        if (saved) {
          setSelectedCampusState(saved);
        }
      } catch {
        // Ignore storage errors
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchCampuses]);

  const setSelectedCampus = useCallback(async (campusId) => {
    setSelectedCampusState(campusId);
    try {
      if (campusId === null) {
        await AsyncStorage.removeItem(CAMPUS_KEY);
      } else {
        await AsyncStorage.setItem(CAMPUS_KEY, campusId);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const value = useMemo(
    () => ({ campuses, selectedCampus, setSelectedCampus, loading, refreshCampuses: fetchCampuses }),
    [campuses, selectedCampus, setSelectedCampus, loading, fetchCampuses]
  );

  return (
    <CampusContext.Provider value={value}>
      {children}
    </CampusContext.Provider>
  );
}

export function useCampus() {
  const ctx = useContext(CampusContext);
  if (!ctx) throw new Error('useCampus must be used within CampusProvider');
  return ctx;
}
