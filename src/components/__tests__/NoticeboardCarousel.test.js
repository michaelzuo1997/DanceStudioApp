import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NoticeboardCarousel } from '../NoticeboardCarousel';

const mockNotices = [
  { id: 'n1', title_en: 'Notice 1', title_zh: '通知1', body_en: 'Body 1', body_zh: '内容1', image_url: null },
  { id: 'n2', title_en: 'Notice 2', title_zh: '通知2', body_en: 'Body 2', body_zh: '内容2', image_url: 'https://example.com/img.jpg' },
  { id: 'n3', title_en: 'Notice 3', title_zh: '通知3', body_en: 'Body 3', body_zh: '内容3', image_url: null },
];

describe('NoticeboardCarousel', () => {
  it('returns null for empty notices array', () => {
    const { toJSON } = render(<NoticeboardCarousel notices={[]} onPressNotice={jest.fn()} />);
    expect(toJSON()).toBeNull();
  });

  it('returns null for null notices', () => {
    const { toJSON } = render(<NoticeboardCarousel notices={null} onPressNotice={jest.fn()} />);
    expect(toJSON()).toBeNull();
  });

  it('renders carousel container', () => {
    const { getByTestId } = render(
      <NoticeboardCarousel notices={mockNotices} onPressNotice={jest.fn()} />
    );
    expect(getByTestId('noticeboard-carousel')).toBeTruthy();
  });

  it('renders pagination dots when multiple notices', () => {
    const { getByTestId } = render(
      <NoticeboardCarousel notices={mockNotices} onPressNotice={jest.fn()} />
    );
    expect(getByTestId('carousel-dots')).toBeTruthy();
  });

  it('does not render dots for single notice', () => {
    const { queryByTestId } = render(
      <NoticeboardCarousel notices={[mockNotices[0]]} onPressNotice={jest.fn()} />
    );
    expect(queryByTestId('carousel-dots')).toBeNull();
  });

  it('calls onPressNotice when card is pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <NoticeboardCarousel notices={mockNotices} onPressNotice={onPress} />
    );
    fireEvent.press(getByTestId('noticeboard-card-n1'));
    expect(onPress).toHaveBeenCalledWith(mockNotices[0]);
  });
});
