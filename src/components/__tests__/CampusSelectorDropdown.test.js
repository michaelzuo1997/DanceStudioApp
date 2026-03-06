import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CampusSelectorDropdown } from '../CampusSelectorDropdown';
import { mockCampusValue } from '../../__mocks__/CampusContext';

// Reset mock before each test
beforeEach(() => {
  jest.clearAllMocks();
  mockCampusValue.selectedCampus = null;
  mockCampusValue.loading = false;
  mockCampusValue.campuses = [
    { id: 'campus-1', key: 'hornsby', name_en: 'Hornsby', name_zh: '霍恩斯比', is_active: true, sort_order: 1 },
    { id: 'campus-2', key: 'macquarie_park', name_en: 'Macquarie Park', name_zh: '麦格理公园', is_active: true, sort_order: 2 },
    { id: 'campus-3', key: 'carlingford', name_en: 'Carlingford', name_zh: '卡林福德', is_active: true, sort_order: 3 },
  ];
});

describe('CampusSelectorDropdown', () => {
  it('renders trigger with "All Campuses" when none selected', () => {
    const { getByTestId } = render(<CampusSelectorDropdown />);
    const trigger = getByTestId('campus-dropdown-trigger');
    expect(trigger).toBeTruthy();
    // The trigger should show the "All Campuses" text
    expect(trigger).toHaveTextContent(/All Campuses/);
  });

  it('shows loading state when loading', () => {
    mockCampusValue.loading = true;
    const { getByText } = render(<CampusSelectorDropdown />);
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('shows selected campus name', () => {
    mockCampusValue.selectedCampus = 'campus-1';
    const { getByTestId } = render(<CampusSelectorDropdown />);
    expect(getByTestId('campus-dropdown-trigger')).toHaveTextContent(/Hornsby/);
  });

  it('opens modal on trigger press', () => {
    const { getByTestId, queryByTestId } = render(<CampusSelectorDropdown />);
    fireEvent.press(getByTestId('campus-dropdown-trigger'));
    // Should now show the "All" option in the modal
    expect(queryByTestId('campus-option-all')).toBeTruthy();
  });

  it('calls setSelectedCampus with campus id on selection', () => {
    const { getByTestId } = render(<CampusSelectorDropdown />);
    fireEvent.press(getByTestId('campus-dropdown-trigger'));
    fireEvent.press(getByTestId('campus-option-campus-2'));
    expect(mockCampusValue.setSelectedCampus).toHaveBeenCalledWith('campus-2');
  });

  it('calls setSelectedCampus with null when "All" is selected', () => {
    mockCampusValue.selectedCampus = 'campus-1';
    const { getByTestId } = render(<CampusSelectorDropdown />);
    fireEvent.press(getByTestId('campus-dropdown-trigger'));
    fireEvent.press(getByTestId('campus-option-all'));
    expect(mockCampusValue.setSelectedCampus).toHaveBeenCalledWith(null);
  });

  it('lists all campus options plus "All" option', () => {
    const { getByTestId } = render(<CampusSelectorDropdown />);
    fireEvent.press(getByTestId('campus-dropdown-trigger'));
    expect(getByTestId('campus-option-all')).toBeTruthy();
    expect(getByTestId('campus-option-campus-1')).toBeTruthy();
    expect(getByTestId('campus-option-campus-2')).toBeTruthy();
    expect(getByTestId('campus-option-campus-3')).toBeTruthy();
  });
});
