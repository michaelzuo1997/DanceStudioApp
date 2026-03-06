/**
 * HomeScreen Component Tests
 *
 * Tests the redesigned homepage with BalanceChip, CampusSelector,
 * NoticeboardCard, enrolled classes, UpcomingWeekView, and cancel flow.
 *
 * All external dependencies (Supabase, contexts, router) are mocked.
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Alert } from 'react-native';

// ── Supabase mock ─────────────────────────────────────────────────────────────
jest.mock('../../../src/lib/supabase', () => {
  const mockFromFn = jest.fn();
  const mockRpcFn = jest.fn();
  return {
    supabase: {
      from: mockFromFn,
      rpc: mockRpcFn,
      auth: {
        getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: jest.fn(() => ({
          data: { subscription: { unsubscribe: jest.fn() } },
        })),
      },
    },
  };
});

// ── Router mock ───────────────────────────────────────────────────────────────
import { router } from 'expo-router';

// ── Mock child components to isolate HomeScreen logic ────────────────────────
jest.mock('../../../src/components/CampusSelectorDropdown', () => ({
  CampusSelectorDropdown: () => {
    const { Text } = require('react-native');
    return <Text testID="campus-selector">CampusSelectorDropdown</Text>;
  },
}));

jest.mock('../../../src/components/NoticeboardCarousel', () => ({
  NoticeboardCarousel: ({ notices, onPressNotice }) => {
    const { Text, Pressable } = require('react-native');
    return notices.map((n) => (
      <Pressable key={n.id} onPress={() => onPressNotice(n)}>
        <Text testID="noticeboard-card">{n.title_en}</Text>
      </Pressable>
    ));
  },
}));

jest.mock('../../../src/components/NoticeboardExpandModal', () => ({
  NoticeboardExpandModal: () => null,
}));

jest.mock('../../../src/components/UpcomingWeekView', () => ({
  UpcomingWeekView: () => {
    const { Text } = require('react-native');
    return <Text testID="upcoming-week-view">UpcomingWeekView</Text>;
  },
}));

jest.mock('../../../src/components/InstructorModal', () => ({
  InstructorModal: () => null,
}));

jest.mock('../../../src/components/StudioModal', () => ({
  StudioModal: () => null,
}));

// ── Component under test ────────────────────────────────────────────────────
import HomeScreen from '../index';

// ── Access mock functions via require (safe after jest.mock hoisting) ────────
const { supabase } = require('../../../src/lib/supabase');

// ── Supabase query builder helper ───────────────────────────────────────────

function buildChain(resolvedData) {
  const resolved = { data: resolvedData, error: null };
  function makeNode() {
    const node = {
      select: jest.fn(() => makeNode()),
      eq: jest.fn(() => makeNode()),
      gt: jest.fn(() => makeNode()),
      in: jest.fn(() => makeNode()),
      lte: jest.fn(() => makeNode()),
      or: jest.fn(() => makeNode()),
      order: jest.fn(() => makeNode()),
      limit: jest.fn(() => makeNode()),
      then: jest.fn((resolve, reject) => Promise.resolve(resolved).then(resolve, reject)),
    };
    return node;
  }
  return makeNode();
}

// ── Sample data ─────────────────────────────────────────────────────────────

const sampleEnrollments = [
  { id: 'enr-1', timetable_id: 'tt-1' },
  { id: 'enr-2', timetable_id: 'tt-2' },
];

const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 3);
const futureDateStr = futureDate.toISOString().split('T')[0];

const futureDate2 = new Date();
futureDate2.setDate(futureDate2.getDate() + 5);
const futureDateStr2 = futureDate2.toISOString().split('T')[0];

const sampleTimetableRows = [
  {
    id: 'tt-1',
    class_date: futureDateStr,
    start_time: '10:00',
    duration_minutes: 60,
    price_per_class: 25,
    campus_id: 'campus-1',
    instructors: { id: 'inst-1', name: 'Alice' },
    studios: { id: 'st-1', name: 'Studio A', address: '123 Main St' },
    class_categories: { name_en: 'Ballet', name_zh: '芭蕾' },
  },
  {
    id: 'tt-2',
    class_date: futureDateStr2,
    start_time: '14:00',
    duration_minutes: 90,
    price_per_class: 30,
    campus_id: 'campus-2',
    instructors: { id: 'inst-2', name: 'Bob' },
    studios: { id: 'st-2', name: 'Studio B', address: '456 Oak Ave' },
    class_categories: { name_en: 'Hip Hop', name_zh: '嘻哈' },
  },
];

const sampleNotices = [
  {
    id: 'notice-1',
    title_en: 'Welcome to Austar!',
    title_zh: '欢迎来到澳星！',
    body_en: 'New term starts soon.',
    body_zh: '新学期即将开始。',
    is_active: true,
    starts_at: '2026-01-01T00:00:00Z',
    expires_at: null,
    campus_id: null,
    priority: 1,
  },
];

// ── Supabase mock config per table ──────────────────────────────────────────

function setupSupabaseMocks({
  enrollments = [],
  timetableRows = [],
  notices = [],
} = {}) {
  const enrollmentChain = buildChain(enrollments);
  const timetableChain = buildChain(timetableRows);
  const noticeChain = buildChain(notices);

  supabase.from.mockImplementation((table) => {
    switch (table) {
      case 'enrollments':
        return enrollmentChain;
      case 'class_timetable':
        return timetableChain;
      case 'noticeboard':
        return noticeChain;
      default:
        return buildChain([]);
    }
  });

  return { enrollmentChain, timetableChain, noticeChain };
}

// ── Setup / Teardown ────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  setupSupabaseMocks();
});

// ── Tests ───────────────────────────────────────────────────────────────────

describe('HomeScreen – layout structure', () => {
  it('renders the welcome greeting with display name', async () => {
    setupSupabaseMocks();
    const { getByText } = render(<HomeScreen />);
    await act(async () => {});

    expect(getByText('Welcome back')).toBeTruthy();
    expect(getByText('Test User')).toBeTruthy();
  });

  it('renders the calendar icon', async () => {
    setupSupabaseMocks();
    const { getByTestId } = render(<HomeScreen />);
    await act(async () => {});

    expect(getByTestId('calendar-chip')).toBeTruthy();
  });

  it('renders the CampusSelector component', async () => {
    setupSupabaseMocks();
    const { getByTestId } = render(<HomeScreen />);
    await act(async () => {});

    expect(getByTestId('campus-selector')).toBeTruthy();
  });

  it('renders the UpcomingWeekView component', async () => {
    setupSupabaseMocks();
    const { getByTestId } = render(<HomeScreen />);
    await act(async () => {});

    expect(getByTestId('upcoming-week-view')).toBeTruthy();
  });

  it('renders "My Classes" section heading', async () => {
    setupSupabaseMocks();
    const { getByText } = render(<HomeScreen />);
    await act(async () => {});

    expect(getByText('My Classes')).toBeTruthy();
  });

  it('renders "Upcoming This Week" section heading', async () => {
    setupSupabaseMocks();
    const { getByText } = render(<HomeScreen />);
    await act(async () => {});

    expect(getByText('Upcoming This Week')).toBeTruthy();
  });
});

describe('HomeScreen – empty state', () => {
  it('shows empty state when user has no enrolled classes', async () => {
    setupSupabaseMocks({ enrollments: [], timetableRows: [] });
    const { getByText } = render(<HomeScreen />);
    await act(async () => {});

    expect(getByText('No upcoming classes')).toBeTruthy();
  });

  it('shows "Browse classes" button in empty state', async () => {
    setupSupabaseMocks({ enrollments: [], timetableRows: [] });
    const { getByText } = render(<HomeScreen />);
    await act(async () => {});

    expect(getByText('Browse classes')).toBeTruthy();
  });

  it('navigates to classes tab when "Browse classes" is pressed', async () => {
    setupSupabaseMocks({ enrollments: [], timetableRows: [] });
    const { getByText } = render(<HomeScreen />);
    await act(async () => {});

    fireEvent.press(getByText('Browse classes'));
    expect(router.push).toHaveBeenCalledWith('/(tabs)/classes');
  });
});

describe('HomeScreen – enrolled classes', () => {
  it('renders enrolled class names', async () => {
    setupSupabaseMocks({
      enrollments: sampleEnrollments,
      timetableRows: sampleTimetableRows,
    });
    const { getByText } = render(<HomeScreen />);
    await act(async () => {});

    expect(getByText('Ballet')).toBeTruthy();
    expect(getByText('Hip Hop')).toBeTruthy();
  });

  it('renders instructor names for enrolled classes', async () => {
    setupSupabaseMocks({
      enrollments: sampleEnrollments,
      timetableRows: sampleTimetableRows,
    });
    const { getByText } = render(<HomeScreen />);
    await act(async () => {});

    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('Bob')).toBeTruthy();
  });

  it('renders studio names for enrolled classes', async () => {
    setupSupabaseMocks({
      enrollments: sampleEnrollments,
      timetableRows: sampleTimetableRows,
    });
    const { getByText } = render(<HomeScreen />);
    await act(async () => {});

    expect(getByText('Studio A')).toBeTruthy();
    expect(getByText('Studio B')).toBeTruthy();
  });

  it('renders a Cancel button for each enrolled class', async () => {
    setupSupabaseMocks({
      enrollments: sampleEnrollments,
      timetableRows: sampleTimetableRows,
    });
    const { getAllByText } = render(<HomeScreen />);
    await act(async () => {});

    expect(getAllByText('Cancel')).toHaveLength(2);
  });
});

describe('HomeScreen – cancel enrollment', () => {
  it('calls Alert.alert when Cancel is pressed (native)', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    setupSupabaseMocks({
      enrollments: sampleEnrollments,
      timetableRows: sampleTimetableRows,
    });
    const { getAllByText } = render(<HomeScreen />);
    await act(async () => {});

    fireEvent.press(getAllByText('Cancel')[0]);
    expect(Alert.alert).toHaveBeenCalledWith(
      'Cancel',
      'Cancel this class?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Back', style: 'cancel' }),
        expect.objectContaining({ text: 'Confirm', style: 'destructive' }),
      ])
    );
  });
});

describe('HomeScreen – noticeboard', () => {
  it('renders noticeboard section when notices exist', async () => {
    setupSupabaseMocks({ notices: sampleNotices });
    const { getByText } = render(<HomeScreen />);
    await act(async () => {});

    expect(getByText('Notices')).toBeTruthy();
  });

  it('renders notice cards', async () => {
    setupSupabaseMocks({ notices: sampleNotices });
    const { getByText } = render(<HomeScreen />);
    await act(async () => {});

    expect(getByText('Welcome to Austar!')).toBeTruthy();
  });

  it('hides noticeboard section when no notices', async () => {
    setupSupabaseMocks({ notices: [] });
    const { queryByText } = render(<HomeScreen />);
    await act(async () => {});

    expect(queryByText('Notices')).toBeNull();
  });
});

describe('HomeScreen – data fetching', () => {
  it('queries enrollments table for active user enrollments', async () => {
    setupSupabaseMocks();
    render(<HomeScreen />);
    await act(async () => {});

    expect(supabase.from).toHaveBeenCalledWith('enrollments');
  });

  it('queries noticeboard table', async () => {
    setupSupabaseMocks();
    render(<HomeScreen />);
    await act(async () => {});

    expect(supabase.from).toHaveBeenCalledWith('noticeboard');
  });

  it('does not query user_bundles table (bundles removed from home)', async () => {
    setupSupabaseMocks();
    render(<HomeScreen />);
    await act(async () => {});

    expect(supabase.from).not.toHaveBeenCalledWith('user_bundles');
  });
});
