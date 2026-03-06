import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AdminNoticeCard } from '../AdminNoticeCard';

jest.mock('../../../context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key) => key,
    locale: 'en',
  }),
}));

jest.mock('../../../lib/admin/noticeboardService', () => ({
  deactivateNotice: jest.fn().mockResolvedValue({ data: {}, error: null }),
  activateNotice: jest.fn().mockResolvedValue({ data: {}, error: null }),
}));

const { deactivateNotice, activateNotice } = require('../../../lib/admin/noticeboardService');

const baseNotice = {
  id: 'n1',
  title_en: 'Test Notice',
  title_zh: '测试公告',
  body_en: 'Some body text',
  body_zh: '一些正文',
  is_active: true,
  priority: 0,
  campus_id: null,
  campuses: null,
  expires_at: '2026-12-31T00:00:00Z',
};

describe('AdminNoticeCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders notice title', () => {
    const { getByText } = render(
      <AdminNoticeCard notice={baseNotice} locale="en" onEdit={jest.fn()} onRefresh={jest.fn()} />
    );
    expect(getByText('Test Notice')).toBeTruthy();
  });

  it('renders active badge when notice is active', () => {
    const { getByText } = render(
      <AdminNoticeCard notice={baseNotice} locale="en" onEdit={jest.fn()} onRefresh={jest.fn()} />
    );
    expect(getByText('admin.active')).toBeTruthy();
  });

  it('renders inactive badge when notice is inactive', () => {
    const inactive = { ...baseNotice, is_active: false };
    const { getByText } = render(
      <AdminNoticeCard notice={inactive} locale="en" onEdit={jest.fn()} onRefresh={jest.fn()} />
    );
    expect(getByText('admin.inactive')).toBeTruthy();
  });

  it('calls onEdit when edit button pressed', () => {
    const onEdit = jest.fn();
    const { getByText } = render(
      <AdminNoticeCard notice={baseNotice} locale="en" onEdit={onEdit} onRefresh={jest.fn()} />
    );
    fireEvent.press(getByText('admin.editNotice'));
    expect(onEdit).toHaveBeenCalled();
  });

  it('calls deactivateNotice and onRefresh when toggling active notice', async () => {
    const onRefresh = jest.fn();
    const { getByText } = render(
      <AdminNoticeCard notice={baseNotice} locale="en" onEdit={jest.fn()} onRefresh={onRefresh} />
    );
    fireEvent.press(getByText('admin.deactivate'));
    await waitFor(() => {
      expect(deactivateNotice).toHaveBeenCalledWith('n1');
      expect(onRefresh).toHaveBeenCalled();
    });
  });

  it('calls activateNotice when toggling inactive notice', async () => {
    const inactive = { ...baseNotice, is_active: false };
    const onRefresh = jest.fn();
    const { getByText } = render(
      <AdminNoticeCard notice={inactive} locale="en" onEdit={jest.fn()} onRefresh={onRefresh} />
    );
    fireEvent.press(getByText('admin.activate'));
    await waitFor(() => {
      expect(activateNotice).toHaveBeenCalledWith('n1');
    });
  });

  it('renders body text when present', () => {
    const { getByText } = render(
      <AdminNoticeCard notice={baseNotice} locale="en" onEdit={jest.fn()} onRefresh={jest.fn()} />
    );
    expect(getByText('Some body text')).toBeTruthy();
  });

  it('renders expiry date', () => {
    const { getByText } = render(
      <AdminNoticeCard notice={baseNotice} locale="en" onEdit={jest.fn()} onRefresh={jest.fn()} />
    );
    expect(getByText('Expires: 2026-12-31')).toBeTruthy();
  });
});
