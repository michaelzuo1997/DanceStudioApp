import React from 'react';
import { render } from '@testing-library/react-native';
import { PricePreviewCard } from '../PricePreviewCard';

jest.mock('../../../context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key) => key,
    locale: 'en',
  }),
}));

describe('PricePreviewCard', () => {
  it('renders empty state when no classes', () => {
    const { getByTestId, getByText } = render(<PricePreviewCard classes={[]} />);
    expect(getByTestId('price-preview-empty')).toBeTruthy();
    expect(getByText('admin.pricing.noMatches')).toBeTruthy();
  });

  it('renders class count when classes are provided', () => {
    const classes = [
      { price_per_class: 20 },
      { price_per_class: 30 },
      { price_per_class: 25 },
    ];
    const { getByTestId, getByText } = render(<PricePreviewCard classes={classes} />);
    expect(getByTestId('price-preview-card')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
  });

  it('renders with single class', () => {
    const classes = [{ price_per_class: 15 }];
    const { getByTestId, getByText } = render(<PricePreviewCard classes={classes} />);
    expect(getByTestId('price-preview-card')).toBeTruthy();
    expect(getByText('1')).toBeTruthy();
  });
});
