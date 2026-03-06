import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NoticeboardExpandModal } from '../NoticeboardExpandModal';

const mockNotice = {
  id: 'n1',
  title_en: 'Test Notice',
  title_zh: '测试通知',
  body_en: 'Test body content',
  body_zh: '测试正文内容',
  image_url: 'https://example.com/img.jpg',
  link_url: 'https://example.com',
};

const mockNotices = [
  mockNotice,
  { id: 'n2', title_en: 'Second', title_zh: '第二', body_en: 'Body 2', body_zh: '内容2', image_url: null, link_url: null },
];

describe('NoticeboardExpandModal', () => {
  it('renders nothing when not visible', () => {
    const { queryByTestId } = render(
      <NoticeboardExpandModal visible={false} notice={mockNotice} notices={mockNotices} onClose={jest.fn()} />
    );
    // Modal is not visible, close button should not be accessible
    expect(queryByTestId('expand-modal-close')).toBeNull();
  });

  it('renders close button when visible', () => {
    const { getByTestId } = render(
      <NoticeboardExpandModal visible={true} notice={mockNotice} notices={mockNotices} onClose={jest.fn()} />
    );
    expect(getByTestId('expand-modal-close')).toBeTruthy();
  });

  it('calls onClose when close button pressed', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <NoticeboardExpandModal visible={true} notice={mockNotice} notices={mockNotices} onClose={onClose} />
    );
    fireEvent.press(getByTestId('expand-modal-close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders notice title', () => {
    const { getByText } = render(
      <NoticeboardExpandModal visible={true} notice={mockNotice} notices={[mockNotice]} onClose={jest.fn()} />
    );
    expect(getByText('Test Notice')).toBeTruthy();
  });

  it('renders notice body', () => {
    const { getByText } = render(
      <NoticeboardExpandModal visible={true} notice={mockNotice} notices={[mockNotice]} onClose={jest.fn()} />
    );
    expect(getByText('Test body content')).toBeTruthy();
  });

  it('renders image when image_url is present', () => {
    const { getByTestId } = render(
      <NoticeboardExpandModal visible={true} notice={mockNotice} notices={[mockNotice]} onClose={jest.fn()} />
    );
    expect(getByTestId('expand-image-n1')).toBeTruthy();
  });

  it('shows counter when multiple notices', () => {
    const { getByText } = render(
      <NoticeboardExpandModal visible={true} notice={mockNotice} notices={mockNotices} onClose={jest.fn()} />
    );
    expect(getByText(/1 \/ 2/)).toBeTruthy();
  });
});
