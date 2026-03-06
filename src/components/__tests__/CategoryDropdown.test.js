import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CategoryDropdown } from '../CategoryDropdown';

jest.mock('../../context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key) => {
      const map = { 'classes.allCategories': 'All Categories' };
      return map[key] || key;
    },
    locale: 'en',
  }),
}));

const sampleCategories = [
  { id: 'cat-1', name_en: 'Ballet', name_zh: '芭蕾', icon: '🩰' },
  { id: 'cat-2', name_en: 'Hip Hop', name_zh: '街舞', icon: '🎤' },
];

describe('CategoryDropdown', () => {
  const onSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders "All Categories" when no category is selected', () => {
    const { getByText } = render(
      <CategoryDropdown
        categories={sampleCategories}
        selectedCategoryId={null}
        onSelect={onSelect}
      />
    );

    expect(getByText('All Categories')).toBeTruthy();
  });

  it('renders selected category name', () => {
    const { getByText } = render(
      <CategoryDropdown
        categories={sampleCategories}
        selectedCategoryId="cat-1"
        onSelect={onSelect}
      />
    );

    expect(getByText('Ballet')).toBeTruthy();
  });

  it('opens modal when trigger is pressed', () => {
    const { getByTestId, getByText } = render(
      <CategoryDropdown
        categories={sampleCategories}
        selectedCategoryId={null}
        onSelect={onSelect}
      />
    );

    fireEvent.press(getByTestId('category-dropdown-trigger'));

    // Modal should show all category options
    expect(getByText('Ballet')).toBeTruthy();
    expect(getByText('Hip Hop')).toBeTruthy();
  });

  it('calls onSelect with category id when an option is pressed', () => {
    const { getByTestId } = render(
      <CategoryDropdown
        categories={sampleCategories}
        selectedCategoryId={null}
        onSelect={onSelect}
      />
    );

    // Open modal
    fireEvent.press(getByTestId('category-dropdown-trigger'));

    // Select a category
    fireEvent.press(getByTestId('category-option-cat-1'));
    expect(onSelect).toHaveBeenCalledWith('cat-1');
  });

  it('calls onSelect with null when "All Categories" is pressed', () => {
    const { getByTestId } = render(
      <CategoryDropdown
        categories={sampleCategories}
        selectedCategoryId="cat-1"
        onSelect={onSelect}
      />
    );

    fireEvent.press(getByTestId('category-dropdown-trigger'));
    fireEvent.press(getByTestId('category-option-all'));
    expect(onSelect).toHaveBeenCalledWith(null);
  });
});
