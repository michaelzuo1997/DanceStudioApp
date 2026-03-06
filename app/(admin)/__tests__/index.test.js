import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import AdminDashboard from '../index';

// Mock dependencies
jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

jest.mock('../../../src/context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key) => key,
    locale: 'en',
  }),
}));

jest.mock('../../../src/lib/supabase', () => {
  const makeChain = (result) => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    then: jest.fn((resolve) => resolve(result)),
  });

  return {
    supabase: {
      from: jest.fn((table) => {
        if (table === 'class_timetable') {
          return makeChain({ count: 5, error: null });
        }
        if (table === 'enrollments') {
          return makeChain({ count: 12, error: null });
        }
        if (table === 'noticeboard') {
          return makeChain({ count: 3, error: null });
        }
        if (table === 'class_bundles') {
          return makeChain({ count: 7, error: null });
        }
        if (table === 'Users Info') {
          return makeChain({ count: 42, error: null });
        }
        return makeChain({ count: 0, error: null });
      }),
    },
  };
});

describe('AdminDashboard', () => {
  it('renders dashboard title', async () => {
    const { getByText } = render(<AdminDashboard />);
    await waitFor(() => {
      expect(getByText('admin.dashboard')).toBeTruthy();
    });
  });

  it('renders class management navigation card', async () => {
    const { getByTestId } = render(<AdminDashboard />);
    await waitFor(() => {
      expect(getByTestId('nav-class-management')).toBeTruthy();
    });
  });

  it('renders stat labels', async () => {
    const { getByText } = render(<AdminDashboard />);
    await waitFor(() => {
      expect(getByText('admin.activeClasses')).toBeTruthy();
      expect(getByText('admin.totalEnrolled')).toBeTruthy();
      expect(getByText('admin.activeNotices')).toBeTruthy();
      expect(getByText('admin.activeBundles')).toBeTruthy();
      expect(getByText('admin.totalUsers')).toBeTruthy();
    });
  });

  it('renders noticeboard navigation card', async () => {
    const { getByTestId } = render(<AdminDashboard />);
    await waitFor(() => {
      expect(getByTestId('nav-noticeboard')).toBeTruthy();
    });
  });

  it('renders bundle management navigation card', async () => {
    const { getByTestId } = render(<AdminDashboard />);
    await waitFor(() => {
      expect(getByTestId('nav-bundle-management')).toBeTruthy();
    });
  });

  it('renders price management navigation card', async () => {
    const { getByTestId } = render(<AdminDashboard />);
    await waitFor(() => {
      expect(getByTestId('nav-price-management')).toBeTruthy();
    });
  });

  it('renders user management navigation card', async () => {
    const { getByTestId } = render(<AdminDashboard />);
    await waitFor(() => {
      expect(getByTestId('nav-user-management')).toBeTruthy();
    });
  });

  it('renders wage calculator navigation card', async () => {
    const { getByTestId } = render(<AdminDashboard />);
    await waitFor(() => {
      expect(getByTestId('nav-wage-calculator')).toBeTruthy();
    });
  });
});
