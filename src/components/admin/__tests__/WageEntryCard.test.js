import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import WageEntryCard from '../WageEntryCard';

jest.mock('../../../context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key) => key,
    locale: 'en',
  }),
}));

describe('WageEntryCard', () => {
  const baseProps = {
    name: 'Alice',
    role: 'Instructor',
    hours: 10,
    rate: 50,
    total: 500,
    testID: 'wage-card',
  };

  it('renders name, hours, rate, and total', () => {
    const { getByText, getByTestId } = render(<WageEntryCard {...baseProps} />);

    expect(getByTestId('wage-card')).toBeTruthy();
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('Instructor')).toBeTruthy();
    expect(getByText('10')).toBeTruthy();
    expect(getByText('= A$500.00')).toBeTruthy();
  });

  it('shows "no rate set" warning when noRate is true', () => {
    const { getByTestId } = render(
      <WageEntryCard {...baseProps} noRate={true} />
    );

    expect(getByTestId('no-rate-warning')).toBeTruthy();
  });

  it('renders editable hours input when editable is true', () => {
    const onHoursChange = jest.fn();
    const { getByTestId } = render(
      <WageEntryCard {...baseProps} editable={true} onHoursChange={onHoursChange} />
    );

    const input = getByTestId('input-hours');
    fireEvent.changeText(input, '12');
    expect(onHoursChange).toHaveBeenCalledWith('12');
  });

  it('renders admin badge style for admin role', () => {
    const { getByText } = render(
      <WageEntryCard {...baseProps} role="Admin" />
    );
    expect(getByText('Admin')).toBeTruthy();
  });
});
