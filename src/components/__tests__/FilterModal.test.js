import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FilterModal } from '../FilterModal';

jest.mock('../../context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key) => {
      const map = {
        'classes.audience': 'Audience',
        'classes.allAudience': 'All',
        'classes.adult': 'Adult',
        'classes.children': 'Children',
        'classes.timeOfDay': 'Time of Day',
        'classes.morning': 'Morning (before 12pm)',
        'classes.afternoon': 'Afternoon (12–5pm)',
        'classes.evening': 'Evening (5pm+)',
        'classes.applyFilters': 'Apply',
        'classes.resetFilters': 'Reset',
      };
      return map[key] || key;
    },
    locale: 'en',
  }),
}));

const defaultFilters = { audience: null, minTime: null, maxTime: null };

describe('FilterModal', () => {
  const onClose = jest.fn();
  const onApply = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders audience and time sections when visible', () => {
    const { getByText } = render(
      <FilterModal
        visible={true}
        onClose={onClose}
        filters={defaultFilters}
        onApply={onApply}
      />
    );

    expect(getByText('Audience')).toBeTruthy();
    expect(getByText('Time of Day')).toBeTruthy();
  });

  it('renders audience chips: All, Adult, Children', () => {
    const { getByTestId } = render(
      <FilterModal
        visible={true}
        onClose={onClose}
        filters={defaultFilters}
        onApply={onApply}
      />
    );

    expect(getByTestId('audience-all')).toBeTruthy();
    expect(getByTestId('audience-adult')).toBeTruthy();
    expect(getByTestId('audience-children')).toBeTruthy();
  });

  it('renders time preset chips', () => {
    const { getByTestId } = render(
      <FilterModal
        visible={true}
        onClose={onClose}
        filters={defaultFilters}
        onApply={onApply}
      />
    );

    expect(getByTestId('time-all')).toBeTruthy();
    expect(getByTestId('time-morning')).toBeTruthy();
    expect(getByTestId('time-afternoon')).toBeTruthy();
    expect(getByTestId('time-evening')).toBeTruthy();
  });

  it('calls onApply with selected audience when Apply is pressed', () => {
    const { getByTestId } = render(
      <FilterModal
        visible={true}
        onClose={onClose}
        filters={defaultFilters}
        onApply={onApply}
      />
    );

    fireEvent.press(getByTestId('audience-adult'));
    fireEvent.press(getByTestId('filter-apply'));

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ audience: 'adult' })
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onApply with time preset when Apply is pressed', () => {
    const { getByTestId } = render(
      <FilterModal
        visible={true}
        onClose={onClose}
        filters={defaultFilters}
        onApply={onApply}
      />
    );

    fireEvent.press(getByTestId('time-morning'));
    fireEvent.press(getByTestId('filter-apply'));

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ minTime: '00:00', maxTime: '12:00' })
    );
  });

  it('resets all filters when Reset is pressed', () => {
    const { getByTestId } = render(
      <FilterModal
        visible={true}
        onClose={onClose}
        filters={{ audience: 'adult', minTime: '00:00', maxTime: '12:00' }}
        onApply={onApply}
      />
    );

    fireEvent.press(getByTestId('filter-reset'));

    expect(onApply).toHaveBeenCalledWith({
      audience: null,
      minTime: null,
      maxTime: null,
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('closes when overlay is pressed', () => {
    const { getByTestId } = render(
      <FilterModal
        visible={true}
        onClose={onClose}
        filters={defaultFilters}
        onApply={onApply}
      />
    );

    fireEvent.press(getByTestId('filter-overlay'));
    expect(onClose).toHaveBeenCalled();
  });
});
