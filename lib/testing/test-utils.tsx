import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

// Mock data for testing
export const mockQuests = [
  {
    id: 'quest-1',
    title: 'Morning Exercise',
    description: 'Complete 20 push-ups',
    category: 'might',
    difficulty: 'easy',
    xp: 50,
    gold: 25,
    completed: false,
    tags: ['exercise', 'morning'],
    isRepeatable: true,
    cooldownHours: 24,
  },
  {
    id: 'quest-2',
    title: 'Read a Book',
    description: 'Read for 30 minutes',
    category: 'knowledge',
    difficulty: 'medium',
    xp: 75,
    gold: 35,
    completed: true,
    tags: ['reading', 'learning'],
    isRepeatable: true,
    cooldownHours: 12,
  },
  {
    id: 'quest-3',
    title: 'Meditation',
    description: 'Meditate for 15 minutes',
    category: 'spiritual',
    difficulty: 'hard',
    xp: 100,
    gold: 50,
    completed: false,
    tags: ['meditation', 'mindfulness'],
    isRepeatable: true,
    cooldownHours: 6,
  },
];

export const mockChallenges = [
  {
    id: 'challenge-1',
    name: '30-Day Fitness Challenge',
    description: 'Complete daily fitness tasks for 30 days',
    category: 'strength',
    difficulty: 'hard',
    xp: 500,
    gold: 250,
    target: 30,
    unit: 'days',
    frequency: 'daily',
  },
  {
    id: 'challenge-2',
    name: 'Weekly Reading Goal',
    description: 'Read 3 books this week',
    category: 'knowledge',
    difficulty: 'medium',
    xp: 200,
    gold: 100,
    target: 3,
    unit: 'books',
    frequency: 'weekly',
  },
];

export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  preferences: {
    theme: 'dark',
    notifications: true,
    language: 'en',
  },
};

export const mockCharacterStats = {
  userId: 'user-123',
  level: 15,
  experience: 2500,
  gold: 1250,
  health: 100,
  mana: 80,
  strength: 25,
  agility: 20,
  intelligence: 30,
  vitality: 22,
};

export const mockInventory = {
  'sword': {
    type: 'sword',
    quantity: 1,
    cost: 100,
    rarity: 'rare',
    equipped: true,
    slot: 'weapon',
  },
  'shield': {
    type: 'shield',
    quantity: 1,
    cost: 75,
    rarity: 'uncommon',
    equipped: true,
    slot: 'offhand',
  },
  'potion': {
    type: 'potion',
    quantity: 5,
    cost: 25,
    rarity: 'common',
    equipped: false,
  },
};

// Mock API responses
export const mockApiResponses = {
  quests: {
    success: true,
    data: mockQuests,
    message: 'Quests retrieved successfully',
  },
  challenges: {
    success: true,
    data: mockChallenges,
    message: 'Challenges retrieved successfully',
  },
  user: {
    success: true,
    data: mockUser,
    message: 'User data retrieved successfully',
  },
  characterStats: {
    success: true,
    data: mockCharacterStats,
    message: 'Character stats retrieved successfully',
  },
  inventory: {
    success: true,
    data: mockInventory,
    message: 'Inventory retrieved successfully',
  },
};

// Mock error responses
export const mockErrorResponses = {
  unauthorized: {
    error: 'Unauthorized',
    details: 'User is not authenticated',
    code: 'UNAUTHORIZED',
    timestamp: new Date().toISOString(),
  },
  notFound: {
    error: 'Not Found',
    details: 'The requested resource was not found',
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
  },
  validationError: {
    error: 'Validation Error',
    details: 'Invalid input data provided',
    code: 'VALIDATION_ERROR',
    timestamp: new Date().toISOString(),
  },
  serverError: {
    error: 'Internal Server Error',
    details: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
  },
};

// Mock functions
export const mockFunctions = {
  fetch: jest.fn(),
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  sessionStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  console: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
};

// Setup mock environment
export const setupMockEnvironment = () => {
  // Mock fetch
  global.fetch = mockFunctions.fetch as jest.MockedFunction<typeof fetch>;

  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: mockFunctions.localStorage,
    writable: true,
  });

  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: mockFunctions.sessionStorage,
    writable: true,
  });

  // Mock console methods
  Object.defineProperty(console, 'log', {
    value: mockFunctions.console.log,
    writable: true,
  });
  Object.defineProperty(console, 'warn', {
    value: mockFunctions.console.warn,
    writable: true,
  });
  Object.defineProperty(console, 'error', {
    value: mockFunctions.console.error,
    writable: true,
  });
  Object.defineProperty(console, 'info', {
    value: mockFunctions.console.info,
    writable: true,
  });

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
};

// Reset all mocks
export const resetMocks = () => {
  jest.clearAllMocks();
  mockFunctions.localStorage.getItem.mockReset();
  mockFunctions.localStorage.setItem.mockReset();
  mockFunctions.localStorage.removeItem.mockReset();
  mockFunctions.localStorage.clear.mockReset();
  mockFunctions.sessionStorage.getItem.mockReset();
  mockFunctions.sessionStorage.setItem.mockReset();
  mockFunctions.sessionStorage.removeItem.mockReset();
  mockFunctions.sessionStorage.clear.mockReset();
  mockFunctions.console.log.mockReset();
  mockFunctions.console.warn.mockReset();
  mockFunctions.console.error.mockReset();
  mockFunctions.console.info.mockReset();
};

// Custom render function without providers (simplified)
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, options);

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Test data generators
export const generateMockQuest = (overrides: Partial<typeof mockQuests[0]> = {}) => ({
  id: `quest-${Math.random().toString(36).substr(2, 9)}`,
  title: 'Test Quest',
  description: 'A test quest for testing purposes',
  category: 'might' as const,
  difficulty: 'easy' as const,
  xp: 50,
  gold: 25,
  completed: false,
  tags: ['test'],
  isRepeatable: true,
  cooldownHours: 24,
  ...overrides,
});

export const generateMockUser = (overrides: Partial<typeof mockUser> = {}) => ({
  id: `user-${Math.random().toString(36).substr(2, 9)}`,
  email: 'test@example.com',
  preferences: {},
  ...overrides,
});

export const generateMockCharacterStats = (overrides: Partial<typeof mockCharacterStats> = {}) => ({
  userId: `user-${Math.random().toString(36).substr(2, 9)}`,
  level: 1,
  experience: 0,
  gold: 0,
  health: 100,
  mana: 100,
  strength: 10,
  agility: 10,
  intelligence: 10,
  vitality: 10,
  ...overrides,
});

// Test helpers
export const waitForElementToBeRemoved = (element: Element | null) => {
  return new Promise<void>((resolve) => {
    if (!element) {
      resolve();
      return;
    }

    const observer = new MutationObserver(() => {
      if (!document.contains(element)) {
        observer.disconnect();
        resolve();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
};

export const mockApiCall = (url: string, response: any, delay = 100) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(response);
    }, delay);
  });
};

export const createMockApiResponse = (data: any, success = true, message = '') => ({
  success,
  data,
  message,
  timestamp: new Date().toISOString(),
});

export const createMockApiError = (error: string, details = '', code = 'ERROR') => ({
  success: false,
  error,
  details,
  code,
  timestamp: new Date().toISOString(),
});

// Test constants
export const TEST_CONSTANTS = {
  TIMEOUTS: {
    SHORT: 1000,
    MEDIUM: 3000,
    LONG: 5000,
  },
  DELAYS: {
    MINIMAL: 100,
    SHORT: 500,
    MEDIUM: 1000,
  },
  RETRY_ATTEMPTS: 3,
  CACHE_TIME: 5 * 60 * 1000, // 5 minutes
  STALE_TIME: 1 * 60 * 1000, // 1 minute
};

// Test utilities for specific components
export const questTestUtils = {
  createCompletedQuest: (overrides = {}) => generateMockQuest({ completed: true, ...overrides }),
  createActiveQuest: (overrides = {}) => generateMockQuest({ completed: false, ...overrides }),
  createQuestWithRewards: (xp: number, gold: number, overrides = {}) =>
    generateMockQuest({ xp, gold, ...overrides }),
};

export const userTestUtils = {
  createAuthenticatedUser: (overrides = {}) => generateMockUser({ ...overrides }),
  createUserWithPreferences: (preferences: Record<string, any>, overrides = {}) =>
    generateMockUser({ preferences: preferences as any, ...overrides }),
};

export const characterTestUtils = {
  createLowLevelCharacter: (overrides = {}) => generateMockCharacterStats({ level: 1, ...overrides }),
  createHighLevelCharacter: (overrides = {}) => generateMockCharacterStats({ level: 50, ...overrides }),
  createCharacterWithStats: (stats: Partial<typeof mockCharacterStats>, overrides = {}) =>
    generateMockCharacterStats({ ...stats, ...overrides }),
};
