import '@testing-library/jest-dom';
import 'jest-environment-jsdom';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    };
  },
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock Clerk authentication
jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    isSignedIn: true,
    user: {
      id: 'user-123',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      firstName: 'Test',
      lastName: 'User',
    },
  }),
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'user-123',
    sessionId: 'session-123',
    getToken: jest.fn().mockResolvedValue('mock-token'),
  }),
  ClerkProvider: ({ children }) => children,
  SignedIn: ({ children }) => children,
  SignedOut: ({ children }) => children,
}));

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
      insert: jest.fn(() => ({
        data: null,
        error: null,
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: null,
          error: null,
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: null,
          error: null,
        })),
      })),
      upsert: jest.fn(() => ({
        data: null,
        error: null,
      })),
    })),
    auth: {
      getUser: jest.fn(() => ({
        data: { user: { id: 'user-123' } },
        error: null,
      })),
    },
  },
}));

jest.mock('@/lib/supabase/server-client', () => ({
  supabaseServer: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
      insert: jest.fn(() => ({
        data: null,
        error: null,
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: null,
          error: null,
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: null,
          error: null,
        })),
      })),
      upsert: jest.fn(() => ({
        data: null,
        error: null,
      })),
      rpc: jest.fn(() => ({
        data: null,
        error: null,
      })),
    })),
    auth: {
      getUser: jest.fn(() => ({
        data: { user: { id: 'user-123' } },
        error: null,
      })),
    },
  },
}));



// Mock toast notifications
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    getEntriesByType: jest.fn(() => []),
    mark: jest.fn(),
    measure: jest.fn(),
  },
  writable: true,
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
);

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: componentWillReceiveProps') ||
        args[0].includes('Warning: componentWillUpdate'))
    ) {
      return;
    }
    originalConsoleWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test utilities
global.testUtils = {
  mockLocalStorage: localStorageMock,
  mockSessionStorage: sessionStorageMock,
  mockFetch: global.fetch,
  mockPerformance: window.performance,
  mockIntersectionObserver: global.IntersectionObserver,
  mockResizeObserver: global.ResizeObserver,
  mockMatchMedia: window.matchMedia,
};

// Setup test environment
beforeEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset localStorage and sessionStorage
  localStorageMock.getItem.mockReset();
  localStorageMock.setItem.mockReset();
  localStorageMock.removeItem.mockReset();
  localStorageMock.clear.mockReset();
  
  sessionStorageMock.getItem.mockReset();
  sessionStorageMock.setItem.mockReset();
  sessionStorageMock.removeItem.mockReset();
  sessionStorageMock.clear.mockReset();
  
  // Reset fetch mock
  global.fetch.mockClear();
  
  // Reset performance mock
  window.performance.now.mockClear();
  window.performance.getEntriesByType.mockClear();
  window.performance.mark.mockClear();
  window.performance.measure.mockClear();
});

// Global test timeout
jest.setTimeout(10000);

// Suppress specific warnings in tests
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
        args[0].includes('Warning: componentWillReceiveProps') ||
        args[0].includes('Warning: componentWillUpdate'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
}); 