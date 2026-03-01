// Mock for expo-localization used in tests

export const getLocales = jest.fn(() => [{ languageCode: 'en', regionCode: 'AU' }]);
export const locale = 'en-AU';
export const timezone = 'Australia/Sydney';
