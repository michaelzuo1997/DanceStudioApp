import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CampusSelector } from '../CampusSelector';
import { CampusProvider, mockCampusValue } from '../../context/CampusContext';

jest.mock('../../context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key) => {
      const map = { 'campus.all': 'All Campuses' };
      return map[key] || key;
    },
    locale: 'en',
  }),
}));

function renderWithProvider(campusOverrides = {}) {
  const value = { ...mockCampusValue, ...campusOverrides };
  return render(
    <CampusProvider value={value}>
      <CampusSelector />
    </CampusProvider>
  );
}

describe('CampusSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders "All Campuses" chip and campus chips', () => {
    const { getByText } = renderWithProvider();

    expect(getByText('All Campuses')).toBeTruthy();
    expect(getByText('Hornsby')).toBeTruthy();
    expect(getByText('Macquarie Park')).toBeTruthy();
  });

  it('calls setSelectedCampus(null) when "All" is pressed', () => {
    const setSelectedCampus = jest.fn();
    const { getByText } = renderWithProvider({ setSelectedCampus });

    fireEvent.press(getByText('All Campuses'));
    expect(setSelectedCampus).toHaveBeenCalledWith(null);
  });

  it('calls setSelectedCampus with campus id when a campus chip is pressed', () => {
    const setSelectedCampus = jest.fn();
    const { getByText } = renderWithProvider({ setSelectedCampus });

    fireEvent.press(getByText('Hornsby'));
    expect(setSelectedCampus).toHaveBeenCalledWith('campus-1');
  });

  it('renders fallback "All Campuses" chip when campuses array is empty', () => {
    const { getByText } = renderWithProvider({ campuses: [] });
    expect(getByText('All Campuses')).toBeTruthy();
  });

  it('renders loading placeholder when loading is true', () => {
    const { getByText } = renderWithProvider({ loading: true });
    expect(getByText('common.loading')).toBeTruthy();
  });
});
