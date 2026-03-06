/**
 * ClassesScreen Tests
 *
 * Tests the redesigned Classes tab with CategoryDropdown,
 * DayOfWeekSelector, FilterModal, class list, and action cards.
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

// ── Module mocks wired via moduleNameMapper in package.json ─────────────────
import { supabase } from '../../../../src/lib/supabase';
import { router } from 'expo-router';

// ── Mock child components ───────────────────────────────────────────────────
jest.mock('../../../../src/components/CampusSelector', () => ({
  CampusSelector: () => {
    const { Text } = require('react-native');
    return <Text testID="campus-selector">CampusSelector</Text>;
  },
}));

jest.mock('../../../../src/components/CategoryDropdown', () => ({
  CategoryDropdown: ({ categories, selectedCategoryId, onSelect }) => {
    const { Text, TouchableOpacity } = require('react-native');
    return (
      <TouchableOpacity testID="category-dropdown" onPress={() => onSelect('cat-1')}>
        <Text>{selectedCategoryId ? 'Selected' : 'All Categories'}</Text>
      </TouchableOpacity>
    );
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

jest.mock('../../../../src/components/FilterModal', () => ({
  FilterModal: ({ visible }) => {
    if (!visible) return null;
    const { Text } = require('react-native');
    return <Text testID="filter-modal">FilterModal</Text>;
  },
}));

// ── Component under test ────────────────────────────────────────────────────
import ClassesScreen from '../index';

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

const sampleCategories = [
  { id: 'cat-1', key: 'ballet', name_en: 'Ballet', name_zh: '芭蕾', sort_order: 1 },
  { id: 'cat-2', key: 'hip_hop', name_en: 'Hip Hop', name_zh: '街舞', sort_order: 2 },
];

const sampleClasses = [
  {
    id: 'tt-1',
    class_date: futureDateStr,
    start_time: '10:00',
    duration_minutes: 60,
    price_per_class: 25,
    campus_id: 'campus-1',
    day_of_week: 1,
    audience: 'adult',
    class_categories: { id: 'cat-1', key: 'ballet', name_en: 'Ballet', name_zh: '芭蕾' },
    instructors: { id: 'inst-1', name: 'Alice' },
    studios: { id: 'st-1', name: 'Studio A' },
  },
  {
    id: 'tt-2',
    class_date: futureDateStr,
    start_time: '14:00',
    duration_minutes: 90,
    price_per_class: 30,
    campus_id: 'campus-1',
    day_of_week: 3,
    audience: 'children',
    class_categories: { id: 'cat-2', key: 'hip_hop', name_en: 'Hip Hop', name_zh: '街舞' },
    instructors: { id: 'inst-2', name: 'Bob' },
    studios: { id: 'st-2', name: 'Studio B' },
  },
];

function setupMocks({ categories = [], classes = [], enrollments = [] } = {}) {
  supabase.from.mockImplementation((table) => {
    switch (table) {
      case 'class_categories':
        return buildChain(categories);
      case 'class_timetable':
        return buildChain(classes);
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

describe('ClassesScreen – layout', () => {
  it('renders "Classes" title', async () => {
    setupMocks();
    const { getByText } = render(<ClassesScreen />);
    await act(async () => {});

    expect(getByText('Classes')).toBeTruthy();
  });

  it('renders CampusSelector component', async () => {
    setupMocks();
    const { getByTestId } = render(<ClassesScreen />);
    await act(async () => {});

    expect(getByTestId('campus-selector')).toBeTruthy();
  });

  it('renders CategoryDropdown component', async () => {
    setupMocks();
    const { getByTestId } = render(<ClassesScreen />);
    await act(async () => {});

    expect(getByTestId('category-dropdown')).toBeTruthy();
  });

  it('renders DayOfWeekSelector component', async () => {
    setupMocks();
    const { getByTestId } = render(<ClassesScreen />);
    await act(async () => {});

    expect(getByTestId('day-selector')).toBeTruthy();
  });

  it('renders filter button', async () => {
    setupMocks();
    const { getByTestId } = render(<ClassesScreen />);
    await act(async () => {});

    expect(getByTestId('filter-button')).toBeTruthy();
  });
});

describe('ClassesScreen – class list', () => {
  it('renders class cards when data is fetched', async () => {
    setupMocks({ categories: sampleCategories, classes: sampleClasses });
    const { getByText } = render(<ClassesScreen />);
    await act(async () => {});

    expect(getByText('Ballet')).toBeTruthy();
    expect(getByText('Hip Hop')).toBeTruthy();
  });

  it('renders instructor names in class cards', async () => {
    setupMocks({ categories: sampleCategories, classes: sampleClasses });
    const { getByText } = render(<ClassesScreen />);
    await act(async () => {});

    expect(getByText(/Alice/)).toBeTruthy();
    expect(getByText(/Bob/)).toBeTruthy();
  });

  it('shows empty state when no classes match', async () => {
    setupMocks({ categories: sampleCategories, classes: [] });
    const { getByText } = render(<ClassesScreen />);
    await act(async () => {});

    expect(getByText('No upcoming classes found.')).toBeTruthy();
  });
});

describe('ClassesScreen – action cards', () => {
  it('renders Buy Bundles action card', async () => {
    setupMocks();
    const { getByText } = render(<ClassesScreen />);
    await act(async () => {});

    expect(getByText('Buy Bundles')).toBeTruthy();
  });

  it('renders Private Tuition action card', async () => {
    setupMocks();
    const { getByText } = render(<ClassesScreen />);
    await act(async () => {});

    expect(getByText('Private Tuition')).toBeTruthy();
  });

  it('navigates to bundles when Buy Bundles is pressed', async () => {
    setupMocks();
    const { getByText } = render(<ClassesScreen />);
    await act(async () => {});

    fireEvent.press(getByText('Buy Bundles'));
    expect(router.push).toHaveBeenCalledWith('/(tabs)/classes/bundles');
  });

  it('navigates to private tuition when Private Tuition is pressed', async () => {
    setupMocks();
    const { getByText } = render(<ClassesScreen />);
    await act(async () => {});

    fireEvent.press(getByText('Private Tuition'));
    expect(router.push).toHaveBeenCalledWith('/(tabs)/classes/private');
  });
});

describe('ClassesScreen – filter interaction', () => {
  it('opens FilterModal when filter button is pressed', async () => {
    setupMocks();
    const { getByTestId, queryByTestId } = render(<ClassesScreen />);
    await act(async () => {});

    // Filter modal should not be visible initially
    expect(queryByTestId('filter-modal')).toBeNull();

    // Press filter button
    fireEvent.press(getByTestId('filter-button'));

    // Filter modal should now be visible
    expect(getByTestId('filter-modal')).toBeTruthy();
  });
});

describe('ClassesScreen – data fetching', () => {
  it('queries class_categories table', async () => {
    setupMocks();
    render(<ClassesScreen />);
    await act(async () => {});

    expect(supabase.from).toHaveBeenCalledWith('class_categories');
  });

  it('queries class_timetable table', async () => {
    setupMocks();
    render(<ClassesScreen />);
    await act(async () => {});

    expect(supabase.from).toHaveBeenCalledWith('class_timetable');
  });

  it('queries enrollments table', async () => {
    setupMocks();
    render(<ClassesScreen />);
    await act(async () => {});

    expect(supabase.from).toHaveBeenCalledWith('enrollments');
  });
});
