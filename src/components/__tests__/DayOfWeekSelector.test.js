import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DayOfWeekSelector } from '../DayOfWeekSelector';

jest.mock('../../context/LanguageContext', () => ({
  useLanguage: () => ({ locale: 'en' }),
}));

describe('DayOfWeekSelector', () => {
  const onSelectDay = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders All + Mon through Sun chips', () => {
    const { getByText } = render(
      <DayOfWeekSelector selectedDay={null} onSelectDay={onSelectDay} />
    );

    expect(getByText('All')).toBeTruthy();
    expect(getByText('Mon')).toBeTruthy();
    expect(getByText('Tue')).toBeTruthy();
    expect(getByText('Wed')).toBeTruthy();
    expect(getByText('Thu')).toBeTruthy();
    expect(getByText('Fri')).toBeTruthy();
    expect(getByText('Sat')).toBeTruthy();
    expect(getByText('Sun')).toBeTruthy();
  });

  it('calls onSelectDay with null when All is pressed', () => {
    const { getByText } = render(
      <DayOfWeekSelector selectedDay={1} onSelectDay={onSelectDay} />
    );

    fireEvent.press(getByText('All'));
    expect(onSelectDay).toHaveBeenCalledWith(null);
  });

  it('calls onSelectDay with 1 when Mon is pressed', () => {
    const { getByText } = render(
      <DayOfWeekSelector selectedDay={null} onSelectDay={onSelectDay} />
    );

    fireEvent.press(getByText('Mon'));
    expect(onSelectDay).toHaveBeenCalledWith(1);
  });

  it('calls onSelectDay with 0 when Sun is pressed', () => {
    const { getByText } = render(
      <DayOfWeekSelector selectedDay={null} onSelectDay={onSelectDay} />
    );

    fireEvent.press(getByText('Sun'));
    expect(onSelectDay).toHaveBeenCalledWith(0);
  });

  it('renders with testID for each chip', () => {
    const { getByTestId } = render(
      <DayOfWeekSelector selectedDay={null} onSelectDay={onSelectDay} />
    );

    expect(getByTestId('day-chip-all')).toBeTruthy();
    expect(getByTestId('day-chip-1')).toBeTruthy();
    expect(getByTestId('day-chip-6')).toBeTruthy();
    expect(getByTestId('day-chip-0')).toBeTruthy();
  });
});
