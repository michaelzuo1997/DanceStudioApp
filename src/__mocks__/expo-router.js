// Mock for expo-router used in tests

export const router = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  navigate: jest.fn(),
};

export const useRouter = jest.fn(() => router);
export const usePathname = jest.fn(() => '/');
export const useSegments = jest.fn(() => []);
export const Link = ({ children }) => children;
export const Redirect = () => null;
export const Stack = { Screen: () => null };
export const Tabs = { Screen: () => null };
