import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MerchandiseCard } from '../MerchandiseCard';

const mockItem = {
  id: 'merch-1',
  name_en: 'Dance Shoes',
  name_zh: '舞蹈鞋',
  price: 45.00,
  stock: 10,
  image_url: 'https://example.com/shoes.jpg',
};

const mockItemOOS = {
  id: 'merch-2',
  name_en: 'Limited Hat',
  name_zh: '限量帽子',
  price: 15.00,
  stock: 0,
  image_url: null,
};

describe('MerchandiseCard', () => {
  it('returns null for null item', () => {
    const { toJSON } = render(
      <MerchandiseCard item={null} cartQuantity={0} onAddToCart={jest.fn()} onUpdateQuantity={jest.fn()} />
    );
    expect(toJSON()).toBeNull();
  });

  it('renders item name and price', () => {
    const { getByText } = render(
      <MerchandiseCard item={mockItem} cartQuantity={0} onAddToCart={jest.fn()} onUpdateQuantity={jest.fn()} />
    );
    expect(getByText('Dance Shoes')).toBeTruthy();
    expect(getByText('A$45.00')).toBeTruthy();
  });

  it('shows "In Stock" badge when stock > 0', () => {
    const { getByText } = render(
      <MerchandiseCard item={mockItem} cartQuantity={0} onAddToCart={jest.fn()} onUpdateQuantity={jest.fn()} />
    );
    expect(getByText('In Stock')).toBeTruthy();
  });

  it('shows "Out of Stock" badge when stock is 0', () => {
    const { getByText } = render(
      <MerchandiseCard item={mockItemOOS} cartQuantity={0} onAddToCart={jest.fn()} onUpdateQuantity={jest.fn()} />
    );
    expect(getByText('Out of Stock')).toBeTruthy();
  });

  it('calls onAddToCart when add button pressed', () => {
    const onAdd = jest.fn();
    const { getByTestId } = render(
      <MerchandiseCard item={mockItem} cartQuantity={0} onAddToCart={onAdd} onUpdateQuantity={jest.fn()} />
    );
    fireEvent.press(getByTestId('merch-add-merch-1'));
    expect(onAdd).toHaveBeenCalledWith(mockItem);
  });

  it('shows quantity stepper when in cart', () => {
    const onUpdate = jest.fn();
    const { getByTestId, getByText } = render(
      <MerchandiseCard item={mockItem} cartQuantity={2} onAddToCart={jest.fn()} onUpdateQuantity={onUpdate} />
    );
    expect(getByText('2')).toBeTruthy();
    fireEvent.press(getByTestId('merch-plus-merch-1'));
    expect(onUpdate).toHaveBeenCalledWith('merch-1', 3);
  });

  it('decrements quantity via minus button', () => {
    const onUpdate = jest.fn();
    const { getByTestId } = render(
      <MerchandiseCard item={mockItem} cartQuantity={2} onAddToCart={jest.fn()} onUpdateQuantity={onUpdate} />
    );
    fireEvent.press(getByTestId('merch-minus-merch-1'));
    expect(onUpdate).toHaveBeenCalledWith('merch-1', 1);
  });
});
