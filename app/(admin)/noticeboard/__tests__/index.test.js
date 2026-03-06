import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import AdminNoticeList from '../index';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

jest.mock('../../../../src/context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key) => key,
    locale: 'en',
  }),
}));

jest.mock('../../../../src/lib/admin/noticeboardService', () => ({
  fetchNotices: jest.fn().mockResolvedValue({
    data: [
      {
        id: 'n1',
        title_en: 'Test Notice',
        title_zh: '测试',
        body_en: 'Body',
        body_zh: '正文',
        is_active: true,
        priority: 0,
        campuses: null,
        expires_at: null,
      },
    ],
    error: null,
    count: 1,
  }),
  deactivateNotice: jest.fn().mockResolvedValue({ data: {}, error: null }),
  activateNotice: jest.fn().mockResolvedValue({ data: {}, error: null }),
}));

describe('AdminNoticeList', () => {
  it('renders notice list with filter bar', async () => {
    const { getByText, getAllByText } = render(<AdminNoticeList />);
    await waitFor(() => {
      expect(getByText('admin.allStatuses')).toBeTruthy();
      expect(getAllByText('admin.active').length).toBeGreaterThanOrEqual(1);
      expect(getByText('admin.inactive')).toBeTruthy();
    });
  });

  it('renders FAB for adding notices', async () => {
    const { getByTestId } = render(<AdminNoticeList />);
    await waitFor(() => {
      expect(getByTestId('fab-add-notice')).toBeTruthy();
    });
  });

  it('renders notice card with title', async () => {
    const { getByText } = render(<AdminNoticeList />);
    await waitFor(() => {
      expect(getByText('Test Notice')).toBeTruthy();
    });
  });
});
