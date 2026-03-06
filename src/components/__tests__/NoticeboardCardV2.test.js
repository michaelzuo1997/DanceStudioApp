import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NoticeboardCardV2 } from '../NoticeboardCardV2';

const mockNoticeWithImage = {
  id: 'notice-1',
  title_en: 'Chinese New Year',
  title_zh: '春节快乐',
  body_en: 'Happy CNY!',
  body_zh: '新年快乐！',
  image_url: 'https://example.com/poster.jpg',
  link_url: 'https://example.com',
};

const mockNoticeTextOnly = {
  id: 'notice-2',
  title_en: 'Studio Update',
  title_zh: '工作室更新',
  body_en: 'We have a new studio.',
  body_zh: '我们有一个新工作室。',
  image_url: null,
  link_url: null,
};

describe('NoticeboardCardV2', () => {
  it('returns null for null notice', () => {
    const { toJSON } = render(<NoticeboardCardV2 notice={null} />);
    expect(toJSON()).toBeNull();
  });

  it('renders image when image_url is present', () => {
    const { getByTestId } = render(
      <NoticeboardCardV2 notice={mockNoticeWithImage} onPress={jest.fn()} />
    );
    expect(getByTestId('noticeboard-image-notice-1')).toBeTruthy();
  });

  it('renders glass strip title for image cards', () => {
    const { getByText } = render(
      <NoticeboardCardV2 notice={mockNoticeWithImage} onPress={jest.fn()} />
    );
    expect(getByText('Chinese New Year')).toBeTruthy();
  });

  it('renders text-only card when no image_url', () => {
    const { getByText, queryByTestId } = render(
      <NoticeboardCardV2 notice={mockNoticeTextOnly} onPress={jest.fn()} />
    );
    expect(queryByTestId('noticeboard-image-notice-2')).toBeNull();
    expect(getByText('Studio Update')).toBeTruthy();
    expect(getByText('We have a new studio.')).toBeTruthy();
  });

  it('calls onPress with notice when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <NoticeboardCardV2 notice={mockNoticeWithImage} onPress={onPress} />
    );
    fireEvent.press(getByTestId('noticeboard-card-notice-1'));
    expect(onPress).toHaveBeenCalledWith(mockNoticeWithImage);
  });
});
