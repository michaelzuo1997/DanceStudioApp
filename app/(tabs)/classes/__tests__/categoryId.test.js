/**
 * CategoryDetailScreen Tests
 *
 * Tests the [categoryId] screen with DayOfWeekSelector,
 * audience filter (with "All" option), and no duplicate section.
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

// ── Module mocks wired via moduleNameMapper in package.json ─────────────────
import { supabase } from '../../../../src/lib/supabase';

// ── Mock expo-router to provide searchParams ────────────────────────────────
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({ categoryId: 'ballet' }),
}));

// ── Mock CartContext ────────────────────────────────────────────────────────
jest.mock('../../../../src/context/CartContext', () => ({
  useCart: () => ({
    items: [],
    addItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    total: 0,
  }),
}));

// ── Mock child components ───────────────────────────────────────────────────
jest.mock('../../../../src/components/CampusSelector', () => ({
  CampusSelector: () => {
    const { Text } = require('react-native');
    return <Text testID="campus-selector">CampusSelector</Text>;
  },
}));

jest.mock('../../../../src/components/DayOfWeekSelector', () => ({
  DayOfWeekSelector: ({ selectedDay, onSelectDay }) => {
    const { Text, TouchableOpacity } = require('react-native');
    return (
      <TouchableOpacity testID="day-selector" onPress={() => onSelectDay(1)}>
        <Text>{selectedDay === null ? 'All Days' : `Day ${selectedDay}`}</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock('../../../../src/components/Button', () => ({
  Button: ({ title, onPress, disabled }) => {
    const { Text, TouchableOpacity } = require('react-native');
    return (
      <TouchableOpacity testID={`button-${title}`} onPress={onPress} disabled={disabled}>
        <Text>{title}</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock('../../../../src/components/InstructorModal', () => ({
  InstructorModal: () => null,
}));

jest.mock('../../../../src/components/StudioModal', () => ({
  StudioModal: () => null,
}));

// ── Component under test ────────────────────────────────────────────────────
import CategoryDetailScreen from '../[categoryId]';

// ── Query builder helper ────────────────────────────────────────────────────

function buildChain(resolvedData) {
  const resolved = { data: resolvedData, error: null };
  function makeNode() {
    return {
      select: jest.fn(() => makeNode()),
      eq: jest.fn(() => makeNode()),
      gte: jest.fn(() => makeNode()),
      in: jest.fn(() => makeNode()),
      or: jest.fn(() => makeNode()),
      order: jest.fn(() => makeNode()),
      limit: jest.fn(() => makeNode()),
      maybeSingle: jest.fn(() => makeNode()),
      then: jest.fn((resolve, reject) => Promise.resolve(resolved).then(resolve, reject)),
    };
  }
  return makeNode();
}

// ── Sample data ─────────────────────────────────────────────────────────────

const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 3);
const futureDateStr = futureDate.toISOString().split('T')[0];

const sampleTimetable = [
  {
    id: 'tt-1',
    class_date: futureDateStr,
    start_time: '10:00',
    duration_minutes: 60,
    price_per_class: 25,
    day_of_week: 1,
    audience: 'adult',
    max_capacity: 20,
    current_enrollment: 5,
    is_active: true,
    instructors: { id: 'i-1', name: 'Alice', photo_url: null, bio: null, experience: null, awards: null, contact_email: null, contact_phone: null },
    studios: { id: 's-1', name: 'Studio A', address: '123 St', notes: null },
    class_categories: { name_en: 'Ballet', name_zh: '芭蕾' },
  },
  {
    id: 'tt-2',
    class_date: futureDateStr,
    start_time: '14:00',
    duration_minutes: 90,
    price_per_class: 30,
    day_of_week: 3,
    audience: null, // null audience — should show under "All"
    max_capacity: 15,
    current_enrollment: 2,
    is_active: true,
    instructors: { id: 'i-2', name: 'Bob', photo_url: null, bio: null, experience: null, awards: null, contact_email: null, contact_phone: null },
    studios: { id: 's-2', name: 'Studio B', address: '456 Ave', notes: null },
    class_categories: { name_en: 'Ballet', name_zh: '芭蕾' },
  },
];

const sampleCategory = {
  id: 'cat-1',
  key: 'ballet',
  name_en: 'Ballet',
  name_zh: '芭蕾',
  icon: '🩰',
};

function setupMocks({ category = sampleCategory, timetable = sampleTimetable, enrollments = [] } = {}) {
  supabase.from.mockImplementation((table) => {
    switch (table) {
      case 'class_categories':
        return buildChain(category);
      case 'class_timetable':
        return buildChain(timetable);
      case 'enrollments':
        return buildChain(enrollments);
      default:
        return buildChain([]);
    }
  });
}

// ── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  setupMocks();
});

describe('CategoryDetailScreen – layout', () => {
  it('renders the DayOfWeekSelector component', async () => {
    const { getByTestId } = render(<CategoryDetailScreen />);
    await act(async () => {});

    expect(getByTestId('day-selector')).toBeTruthy();
  });

  it('renders CampusSelector component', async () => {
    const { getByTestId } = render(<CategoryDetailScreen />);
    await act(async () => {});

    expect(getByTestId('campus-selector')).toBeTruthy();
  });

  it('renders audience "All" toggle option', async () => {
    const { getAllByText, getByText } = render(<CategoryDetailScreen />);
    await act(async () => {});

    // "All" appears in audience toggle and duration filter
    expect(getAllByText('All').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Adult')).toBeTruthy();
    expect(getByText('Children')).toBeTruthy();
  });
});

describe('CategoryDetailScreen – no duplicate section', () => {
  it('renders only one timetable section (no duplicate "Upcoming Classes")', async () => {
    setupMocks();
    const { queryAllByText } = render(<CategoryDetailScreen />);
    await act(async () => {});

    // "Upcoming" section should NOT exist (it was removed)
    const upcomingHeadings = queryAllByText('classes.upcoming');
    expect(upcomingHeadings.length).toBe(0);
  });
});

describe('CategoryDetailScreen – null audience handling', () => {
  it('shows all classes (including null audience) when audience is "All"', async () => {
    setupMocks();
    const { getByText } = render(<CategoryDetailScreen />);
    await act(async () => {});

    // Both classes should be visible — tt-1 (audience: adult) and tt-2 (audience: null)
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('Bob')).toBeTruthy();
  });
});

describe('CategoryDetailScreen – data fetching', () => {
  it('queries class_categories table', async () => {
    setupMocks();
    render(<CategoryDetailScreen />);
    await act(async () => {});

    expect(supabase.from).toHaveBeenCalledWith('class_categories');
  });

  it('queries class_timetable table', async () => {
    setupMocks();
    render(<CategoryDetailScreen />);
    await act(async () => {});

    expect(supabase.from).toHaveBeenCalledWith('class_timetable');
  });
});
