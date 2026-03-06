// Mock for CampusContext used in component tests

import React from 'react';

export const mockCampusValue = {
  campuses: [
    { id: 'campus-1', key: 'hornsby', name_en: 'Hornsby', name_zh: '霍恩斯比', is_active: true, sort_order: 1 },
    { id: 'campus-2', key: 'macquarie_park', name_en: 'Macquarie Park', name_zh: '麦格理公园', is_active: true, sort_order: 2 },
    { id: 'campus-3', key: 'carlingford', name_en: 'Carlingford', name_zh: '卡林福德', is_active: true, sort_order: 3 },
  ],
  selectedCampus: null,
  setSelectedCampus: jest.fn(),
  loading: false,
  refreshCampuses: jest.fn(),
};

const CampusContext = React.createContext(mockCampusValue);

export function CampusProvider({ children, value }) {
  return (
    <CampusContext.Provider value={value || mockCampusValue}>
      {children}
    </CampusContext.Provider>
  );
}

export function useCampus() {
  return React.useContext(CampusContext);
}
