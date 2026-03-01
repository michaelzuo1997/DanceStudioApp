// Manual mock for @react-native-async-storage/async-storage
// Provides an in-memory store for tests so real device storage is not touched

const store = {};

const AsyncStorage = {
  getItem: jest.fn(async (key) => store[key] ?? null),
  setItem: jest.fn(async (key, value) => {
    store[key] = value;
  }),
  removeItem: jest.fn(async (key) => {
    delete store[key];
  }),
  clear: jest.fn(async () => {
    Object.keys(store).forEach((key) => delete store[key]);
  }),
  getAllKeys: jest.fn(async () => Object.keys(store)),
  multiGet: jest.fn(async (keys) => keys.map((k) => [k, store[k] ?? null])),
  multiSet: jest.fn(async (pairs) => {
    pairs.forEach(([k, v]) => {
      store[k] = v;
    });
  }),
  multiRemove: jest.fn(async (keys) => {
    keys.forEach((k) => delete store[k]);
  }),
  __INTERNAL_MOCK_STORAGE__: store,
};

export default AsyncStorage;
