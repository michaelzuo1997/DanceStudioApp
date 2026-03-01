/**
 * Cart / Checkout Screen Component Tests
 *
 * Tests the CartScreen component using @testing-library/react-native.
 * All external dependencies (Supabase, contexts, router) are mocked.
 *
 * Strategy:
 *  - CartContext (useCart) is mocked via jest.mock so we can fully control
 *    items, total, removeItem, and clear per test.
 *  - AuthContext and LanguageContext are resolved via moduleNameMapper mocks.
 *  - Supabase RPC responses are configured per test.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';

// ── Module mocks wired via moduleNameMapper in package.json ──────────────────
import { supabase } from '../../../src/lib/supabase';
import { router } from 'expo-router';
import { mockAuthValue as defaultAuthValue } from '../../../src/context/AuthContext';

import { AuthProvider } from '../../../src/context/AuthContext';
import { LanguageProvider } from '../../../src/context/LanguageContext';

// ── CartContext is mocked below so we control the value per test ─────────────
jest.mock('../../../src/context/CartContext');
import { useCart } from '../../../src/context/CartContext';

// ── Component under test ──────────────────────────────────────────────────────
import CartScreen from '../cart';

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const CLASS_A = {
  id: 'cls-1',
  timetable_id: 'tt-1',
  name: 'Ballet Basics',
  price: 25,
  class_date: '2026-03-10',
  start_time: '10:00',
};

const CLASS_B = {
  id: 'cls-2',
  timetable_id: 'tt-2',
  name: 'Hip Hop Fundamentals',
  price: 30,
  class_date: '2026-03-12',
  start_time: '14:00',
};

// ---------------------------------------------------------------------------
// Default mock cart state builders
// ---------------------------------------------------------------------------

function buildCartState(overrides = {}) {
  return {
    items: [],
    total: 0,
    addItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    ...overrides,
  };
}

// Default: two items in cart
function twoItemCart(overrides = {}) {
  return buildCartState({
    items: [CLASS_A, CLASS_B],
    total: CLASS_A.price + CLASS_B.price,
    ...overrides,
  });
}

// Default: single item in cart
function oneItemCart(overrides = {}) {
  return buildCartState({
    items: [CLASS_A],
    total: CLASS_A.price,
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Wrapper factory
// ---------------------------------------------------------------------------

function buildWrapper(authValue) {
  const auth = authValue !== undefined ? authValue : defaultAuthValue;
  return function Wrapper({ children }) {
    return (
      <AuthProvider value={auth}>
        <LanguageProvider>{children}</LanguageProvider>
      </AuthProvider>
    );
  };
}

function renderCart(authValue) {
  const Wrapper = buildWrapper(authValue);
  return render(<CartScreen />, { wrapper: Wrapper });
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();

  // Default cart is empty; individual tests override via useCart.mockReturnValue
  useCart.mockReturnValue(buildCartState());

  // Default: Supabase rpc succeeds
  supabase.rpc.mockResolvedValue({ data: { ok: true }, error: null });

  // Suppress native Alert dialogs
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

// ---------------------------------------------------------------------------
// Empty cart state
// ---------------------------------------------------------------------------

describe('CartScreen – empty cart', () => {
  it('shows the empty cart message when cart has no items', () => {
    useCart.mockReturnValue(buildCartState({ items: [], total: 0 }));
    const { getByText } = renderCart();
    expect(getByText('Your cart is empty.')).toBeTruthy();
  });

  it('shows Browse classes link when cart is empty', () => {
    useCart.mockReturnValue(buildCartState({ items: [], total: 0 }));
    const { getByText } = renderCart();
    expect(getByText('Browse classes')).toBeTruthy();
  });

  it('does not show the Checkout button when cart is empty', () => {
    useCart.mockReturnValue(buildCartState({ items: [], total: 0 }));
    const { queryByText } = renderCart();
    expect(queryByText('Checkout')).toBeNull();
  });

  it('navigates to the classes tab when Browse classes is pressed', () => {
    useCart.mockReturnValue(buildCartState({ items: [], total: 0 }));
    const { getByText } = renderCart();
    fireEvent.press(getByText('Browse classes'));
    expect(router.push).toHaveBeenCalledWith('/(tabs)/classes');
  });
});

// ---------------------------------------------------------------------------
// Cart items rendering
// ---------------------------------------------------------------------------

describe('CartScreen – rendering cart items', () => {
  it('renders each cart item name', () => {
    useCart.mockReturnValue(twoItemCart());
    const { getByText } = renderCart();
    expect(getByText('Ballet Basics')).toBeTruthy();
    expect(getByText('Hip Hop Fundamentals')).toBeTruthy();
  });

  it('renders a Remove button for each cart item', () => {
    useCart.mockReturnValue(twoItemCart());
    const { getAllByText } = renderCart();
    expect(getAllByText('Remove')).toHaveLength(2);
  });

  it('renders the formatted price in item meta text', () => {
    useCart.mockReturnValue(oneItemCart());
    const { getAllByText } = renderCart();
    // Item meta shows "• A$25.00"; total also shows A$25.00 – at least one match
    expect(getAllByText(/A\$25\.00/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders the Total label', () => {
    useCart.mockReturnValue(twoItemCart());
    const { getByText } = renderCart();
    expect(getByText('Total')).toBeTruthy();
  });

  it('renders the correct total value (sum of all item prices)', () => {
    useCart.mockReturnValue(twoItemCart());
    const { getByText } = renderCart();
    // 25 + 30 = 55
    expect(getByText('A$55.00')).toBeTruthy();
  });

  it('renders the Checkout button when the cart has items', () => {
    useCart.mockReturnValue(oneItemCart());
    const { getByText } = renderCart();
    expect(getByText('Checkout')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Remove item
// ---------------------------------------------------------------------------

describe('CartScreen – removing items', () => {
  it('calls removeItem with the correct id when Remove is pressed', () => {
    const removeItem = jest.fn();
    useCart.mockReturnValue(twoItemCart({ removeItem }));
    const { getAllByText } = renderCart();

    // Press the first Remove button → should remove CLASS_A
    const [firstRemove] = getAllByText('Remove');
    fireEvent.press(firstRemove);

    expect(removeItem).toHaveBeenCalledWith(CLASS_A.id);
  });

  it('calls removeItem with the second item id when second Remove is pressed', () => {
    const removeItem = jest.fn();
    useCart.mockReturnValue(twoItemCart({ removeItem }));
    const { getAllByText } = renderCart();

    const [, secondRemove] = getAllByText('Remove');
    fireEvent.press(secondRemove);

    expect(removeItem).toHaveBeenCalledWith(CLASS_B.id);
  });

  it('shows the empty state after the last item is removed (re-render with empty cart)', () => {
    // Simulate: start with one item, then removeItem updates state to empty
    const removeItem = jest.fn();
    useCart.mockReturnValue(oneItemCart({ removeItem }));
    const { rerender, getByText, queryByText } = renderCart();

    expect(getByText('Ballet Basics')).toBeTruthy();

    // After removeItem is called the context updates – simulate with re-render
    useCart.mockReturnValue(buildCartState({ items: [], total: 0, removeItem }));
    rerender(<CartScreen />);

    expect(queryByText('Ballet Basics')).toBeNull();
    expect(getByText('Your cart is empty.')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Checkout – authentication guard
// ---------------------------------------------------------------------------

describe('CartScreen – authentication', () => {
  it('shows an Alert prompting sign-in when user is null', () => {
    useCart.mockReturnValue(oneItemCart());
    const unauthValue = { ...defaultAuthValue, user: null };
    const { getByText } = renderCart(unauthValue);

    fireEvent.press(getByText('Checkout'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Sign In Required',
      'Please sign in to checkout.',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Sign In' }),
      ])
    );
  });

  it('does not call supabase.rpc when user is not signed in', () => {
    useCart.mockReturnValue(oneItemCart());
    const unauthValue = { ...defaultAuthValue, user: null };
    const { getByText } = renderCart(unauthValue);

    fireEvent.press(getByText('Checkout'));

    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('navigates to sign-in screen when Sign In alert action is pressed', () => {
    useCart.mockReturnValue(oneItemCart());
    const unauthValue = { ...defaultAuthValue, user: null };
    const { getByText } = renderCart(unauthValue);

    fireEvent.press(getByText('Checkout'));

    const alertCall = Alert.alert.mock.calls[0];
    const signInAction = alertCall[2].find((a) => a.text === 'Sign In');

    act(() => {
      signInAction.onPress();
    });

    expect(router.push).toHaveBeenCalledWith('/(auth)/sign-in');
  });
});

// ---------------------------------------------------------------------------
// Checkout – successful booking
// ---------------------------------------------------------------------------

describe('CartScreen – successful checkout', () => {
  it('calls supabase.rpc book_class once per cart item', async () => {
    useCart.mockReturnValue(twoItemCart());
    const { getByText } = renderCart();

    await act(async () => {
      fireEvent.press(getByText('Checkout'));
    });

    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledTimes(2);
    });

    expect(supabase.rpc).toHaveBeenCalledWith('book_class', {
      p_timetable_id: CLASS_A.timetable_id,
    });
    expect(supabase.rpc).toHaveBeenCalledWith('book_class', {
      p_timetable_id: CLASS_B.timetable_id,
    });
  });

  it('falls back to item.id as timetable_id when timetable_id is absent', async () => {
    const noTimetableId = { id: 'cls-9', name: 'Free Style', price: 10 };
    useCart.mockReturnValue(buildCartState({ items: [noTimetableId], total: 10 }));
    const { getByText } = renderCart();

    await act(async () => {
      fireEvent.press(getByText('Checkout'));
    });

    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith('book_class', {
        p_timetable_id: 'cls-9',
      });
    });
  });

  it('calls clear() on the cart context after a successful checkout', async () => {
    const clear = jest.fn();
    useCart.mockReturnValue(oneItemCart({ clear }));
    const { getByText } = renderCart();

    await act(async () => {
      fireEvent.press(getByText('Checkout'));
    });

    await waitFor(() => {
      expect(clear).toHaveBeenCalledTimes(1);
    });
  });

  it('shows the checkout success message in the cart view (clear is async – items still visible)', async () => {
    // When clear() is mocked as a no-op, items remain in view and the
    // success message is displayed inside the total card area.
    const clear = jest.fn();
    useCart.mockReturnValue(oneItemCart({ clear }));
    const { getByText } = renderCart();

    await act(async () => {
      fireEvent.press(getByText('Checkout'));
    });

    await waitFor(() => {
      expect(
        getByText('Checkout successful! Your classes have been enrolled.')
      ).toBeTruthy();
    });
  });

  it('sets status to success which drives "All enrolled!" text (verified via t() calls)', async () => {
    // The component renders t('cart.allEnrolled') when status==='success' && items.length===0.
    // After checkout the component calls setStatus('success') then calls clear().
    // The LanguageContext mock's t() function is the observable we can assert on.
    //
    // We verify handleCheckout reaches the success path by checking:
    //   1. clear() is called
    //   2. refreshUserInfo is called
    //   3. The success message is shown (status='success' while items remain via mock)
    // These three assertions together confirm the success path was taken.
    const clear = jest.fn();
    const refreshUserInfo = jest.fn().mockResolvedValue(undefined);
    useCart.mockReturnValue(oneItemCart({ clear }));
    const { getByText } = renderCart({ ...defaultAuthValue, refreshUserInfo });

    await act(async () => {
      fireEvent.press(getByText('Checkout'));
    });

    await waitFor(() => {
      // Success message is rendered (items still in view since clear is a no-op mock)
      expect(
        getByText('Checkout successful! Your classes have been enrolled.')
      ).toBeTruthy();
      expect(clear).toHaveBeenCalled();
      expect(refreshUserInfo).toHaveBeenCalled();
    });
  });

  it('calls refreshUserInfo after a successful checkout', async () => {
    const refreshUserInfo = jest.fn().mockResolvedValue(undefined);
    const authWithRefresh = { ...defaultAuthValue, refreshUserInfo };
    useCart.mockReturnValue(oneItemCart());
    const { getByText } = renderCart(authWithRefresh);

    await act(async () => {
      fireEvent.press(getByText('Checkout'));
    });

    await waitFor(() => {
      expect(refreshUserInfo).toHaveBeenCalledTimes(1);
    });
  });
});

// ---------------------------------------------------------------------------
// Checkout – partial and full failure
// ---------------------------------------------------------------------------

describe('CartScreen – checkout failures', () => {
  it('shows an error message when booking fails with a Supabase error', async () => {
    supabase.rpc.mockResolvedValue({
      data: null,
      error: { message: 'Insufficient balance' },
    });

    useCart.mockReturnValue(oneItemCart());
    const { getByText } = renderCart();

    await act(async () => {
      fireEvent.press(getByText('Checkout'));
    });

    await waitFor(() => {
      expect(getByText(/0 booked, 1 failed/)).toBeTruthy();
    });
  });

  it('includes the RPC error message in the displayed error', async () => {
    supabase.rpc.mockResolvedValue({
      data: null,
      error: { message: 'Insufficient balance' },
    });

    useCart.mockReturnValue(oneItemCart());
    const { getByText } = renderCart();

    await act(async () => {
      fireEvent.press(getByText('Checkout'));
    });

    await waitFor(() => {
      expect(getByText(/Insufficient balance/)).toBeTruthy();
    });
  });

  it('shows error when the RPC returns data.ok === false', async () => {
    supabase.rpc.mockResolvedValue({
      data: { ok: false, error: 'Class is full' },
      error: null,
    });

    useCart.mockReturnValue(oneItemCart());
    const { getByText } = renderCart();

    await act(async () => {
      fireEvent.press(getByText('Checkout'));
    });

    await waitFor(() => {
      expect(getByText(/Class is full/)).toBeTruthy();
    });
  });

  it('does not call clear() when booking fails', async () => {
    supabase.rpc.mockResolvedValue({
      data: null,
      error: { message: 'Server error' },
    });

    const clear = jest.fn();
    useCart.mockReturnValue(oneItemCart({ clear }));
    const { getByText } = renderCart();

    await act(async () => {
      fireEvent.press(getByText('Checkout'));
    });

    await waitFor(() => {
      expect(getByText(/0 booked, 1 failed/)).toBeTruthy();
    });

    expect(clear).not.toHaveBeenCalled();
  });

  it('reports correct booked/failed counts on partial failure', async () => {
    // CLASS_A succeeds, CLASS_B fails
    supabase.rpc
      .mockResolvedValueOnce({ data: { ok: true }, error: null })
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'Class is full' },
      });

    useCart.mockReturnValue(twoItemCart());
    const { getByText } = renderCart();

    await act(async () => {
      fireEvent.press(getByText('Checkout'));
    });

    await waitFor(() => {
      expect(getByText(/1 booked, 1 failed/)).toBeTruthy();
    });
  });

  it('handles an item with no id/timetable_id gracefully (marks as failed, no rpc call)', async () => {
    const badItem = { id: undefined, name: 'Bad Item', price: 10 };
    useCart.mockReturnValue(buildCartState({ items: [badItem], total: 10 }));
    const { getByText } = renderCart();

    await act(async () => {
      fireEvent.press(getByText('Checkout'));
    });

    await waitFor(() => {
      expect(getByText(/0 booked, 1 failed/)).toBeTruthy();
    });

    // No RPC call should be made when timetable_id is missing
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('does not call refreshUserInfo when there are failures', async () => {
    supabase.rpc.mockResolvedValue({
      data: null,
      error: { message: 'Server error' },
    });

    const refreshUserInfo = jest.fn().mockResolvedValue(undefined);
    const authWithRefresh = { ...defaultAuthValue, refreshUserInfo };
    useCart.mockReturnValue(oneItemCart());
    const { getByText } = renderCart(authWithRefresh);

    await act(async () => {
      fireEvent.press(getByText('Checkout'));
    });

    await waitFor(() => {
      expect(getByText(/0 booked, 1 failed/)).toBeTruthy();
    });

    expect(refreshUserInfo).not.toHaveBeenCalled();
  });
});
