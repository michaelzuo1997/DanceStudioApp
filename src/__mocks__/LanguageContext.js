// Mock for LanguageContext used in component tests

import React from 'react';

const translations = {
  'cart.empty': 'Your cart is empty.',
  'cart.allEnrolled': 'All enrolled!',
  'cart.total': 'Total',
  'cart.remove': 'Remove',
  'cart.browseClasses': 'Browse classes',
  'cart.checkoutSuccess': 'Checkout successful! Your classes have been enrolled.',
  'cart.signInRequired': 'Sign in to checkout.',
  'common.checkout': 'Checkout',
  'balance.processing': 'Processing...',
  'home.welcomeBack': 'Welcome back',
  'home.notices': 'Notices',
  'home.myClasses': 'My Classes',
  'home.seeFullCalendar': 'See full calendar',
  'home.noUpcoming': 'No upcoming classes',
  'home.browseClasses': 'Browse classes',
  'home.upcomingThisWeek': 'Upcoming This Week',
  'home.myBundles': 'My Bundles',
  'classes.cancelClass': 'Cancel',
  'classes.cancelConfirm': 'Cancel this class?',
  'classes.cancelSuccess': 'Cancelled.',
  'classes.cancelFailed': 'Cancel failed',
  'campus.all': 'All Campuses',
  'noticeboard.readMore': 'Read More',
  'common.error': 'Error',
  'common.success': 'Success',
  'common.confirm': 'Confirm',
  'common.back': 'Back',
  'common.loading': 'Loading...',
  'classes.filters': 'Filters',
  'classes.allCategories': 'All Categories',
  'classes.audience': 'Audience',
  'classes.allAudience': 'All',
  'classes.timeOfDay': 'Time of Day',
  'classes.morning': 'Morning (before 12pm)',
  'classes.afternoon': 'Afternoon (12–5pm)',
  'classes.evening': 'Evening (5pm+)',
  'classes.applyFilters': 'Apply',
  'classes.resetFilters': 'Reset',
  'classes.adult': 'Adult',
  'classes.children': 'Children',
  'classes.enrolled': 'Enrolled',
  'classes.inCart': 'In Cart',
  'classes.noClasses': 'No upcoming classes found.',
  'classes.addToCart': 'Add to Cart',
  'classes.bookClass': 'Book Class',
  'screens.classes': 'Classes',
  'screens.bundles': 'Buy Bundles',
  'screens.privateTuition': 'Private Tuition',
  'cart.addToCart': 'Add to Cart',
  'screens.shop': 'Shop',
  'shop.merchandise': 'Merchandise',
  'shop.outOfStock': 'Out of Stock',
  'shop.inStock': 'In Stock',
  'shop.addToCart': 'Add to Cart',
  'shop.viewCart': 'View Cart',
  'shop.quantity': 'Qty',
  'shop.checkout': 'Checkout',
  'shop.checkoutSuccess': 'Purchase successful!',
  'shop.checkoutFailed': 'Purchase failed',
  'shop.emptyShop': 'No products available.',
  'cart.signInRequired': 'Sign in to checkout.',
  'noticeboard.swipeMore': 'Swipe for more',
  'noticeboard.close': 'Close',
  'admin.noticeForm.image': 'Image',
  'admin.noticeForm.pickImage': 'Pick Image',
  'admin.noticeForm.removeImage': 'Remove Image',
  'admin.noticeForm.uploading': 'Uploading...',
};

export const mockLanguageValue = {
  locale: 'en',
  setLocale: jest.fn(),
  ready: true,
  t: jest.fn((key) => translations[key] || key),
};

const LanguageContext = React.createContext(mockLanguageValue);

export function LanguageProvider({ children, value }) {
  return (
    <LanguageContext.Provider value={value || mockLanguageValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return React.useContext(LanguageContext);
}
