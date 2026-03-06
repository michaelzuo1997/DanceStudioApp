import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import WageCalculatorScreen from '../index';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

jest.mock('../../../../src/context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key) => key,
    locale: 'en',
  }),
}));

jest.mock('../../../../src/context/CampusContext', () => ({
  useCampus: () => ({
    campuses: [
      { id: 'c1', name: 'Campus A' },
    ],
  }),
}));

jest.mock('../../../../src/lib/admin/wageService', () => ({
  calculateInstructorWages: jest.fn(),
  fetchWageStaff: jest.fn(),
  generateWageCSV: jest.fn().mockReturnValue('csv-content'),
  exportWageCSV: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('../../../../src/components/admin/WageEntryCard', () => {
  const { View, Text } = require('react-native');
  return function MockWageEntryCard({ name, testID }) {
    return (
      <View testID={testID}>
        <Text>{name}</Text>
      </View>
    );
  };
});

const { calculateInstructorWages, fetchWageStaff } = require('../../../../src/lib/admin/wageService');

describe('WageCalculatorScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    calculateInstructorWages.mockResolvedValue({
      data: [
        {
          instructorId: 'inst-1',
          instructorName: 'Alice',
          userId: 'u-1',
          hourlyRate: 50,
          totalMinutes: 120,
          totalHours: 2,
          totalPay: 100,
        },
      ],
      error: null,
    });
    fetchWageStaff.mockResolvedValue({
      data: [
        { id: 'a1', user_id: 'u-a', name: 'Admin A', full_name: 'Admin A', role: 'admin', hourly_rate: 35 },
      ],
      error: null,
    });
  });

  it('renders the title and date inputs', () => {
    const { getByText, getByTestId } = render(<WageCalculatorScreen />);
    expect(getByText('admin.wages.title')).toBeTruthy();
    expect(getByTestId('input-date-from')).toBeTruthy();
    expect(getByTestId('input-date-to')).toBeTruthy();
    expect(getByTestId('btn-calculate')).toBeTruthy();
  });

  it('shows instructor results after calculate', async () => {
    const { getByTestId, findByTestId } = render(<WageCalculatorScreen />);

    fireEvent.changeText(getByTestId('input-date-from'), '2026-03-01');
    fireEvent.changeText(getByTestId('input-date-to'), '2026-03-31');
    fireEvent.press(getByTestId('btn-calculate'));

    const card = await findByTestId('wage-instructor-inst-1');
    expect(card).toBeTruthy();
  });

  it('shows export button after calculation', async () => {
    const { getByTestId, findByTestId } = render(<WageCalculatorScreen />);

    fireEvent.changeText(getByTestId('input-date-from'), '2026-03-01');
    fireEvent.changeText(getByTestId('input-date-to'), '2026-03-31');
    fireEvent.press(getByTestId('btn-calculate'));

    const exportBtn = await findByTestId('btn-export');
    expect(exportBtn).toBeTruthy();
  });
});
