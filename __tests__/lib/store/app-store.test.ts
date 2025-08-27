import { renderHook, act } from '@testing-library/react';
import { useAppStore, useUser, useQuests, useInventory, useUI, useAppActions } from '@/lib/store/app-store';

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

describe('App Store', () => {
  beforeEach(() => {
    // Clear store state before each test
    act(() => {
      useAppStore.getState().resetApp();
    });
    
    // Clear localStorage mocks
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('has correct initial state', () => {
      const { result } = renderHook(() => useAppStore());
      
      expect(result.current.user).toEqual({
        id: null,
        email: null,
        isLoaded: false,
        preferences: {},
      });
      
      expect(result.current.quests).toEqual({
        quests: [],
        completedQuests: new Set<string>(),
        loading: false,
        error: null,
        lastResetDate: null,
      });
      
      expect(result.current.inventory).toEqual({
        items: {},
        loading: false,
        error: null,
      });
      
      expect(result.current.ui).toEqual({
        sidebarOpen: false,
        theme: 'system',
        notifications: [],
        modals: {},
      });
    });
  });

  describe('User Actions', () => {
    it('sets user data correctly', () => {
      const { result } = renderHook(() => useAppActions());
      
      act(() => {
        result.current.setUser({
          id: 'user-123',
          email: 'test@example.com',
          isLoaded: true,
        });
      });
      
      const userState = useAppStore.getState().user;
      expect(userState.id).toBe('user-123');
      expect(userState.email).toBe('test@example.com');
      expect(userState.isLoaded).toBe(true);
    });

    it('updates user preferences', () => {
      const { result } = renderHook(() => useAppActions());
      
      act(() => {
        result.current.setUser({
          preferences: {
            theme: 'dark',
            notifications: true,
          },
        });
      });
      
      const userState = useAppStore.getState().user;
      expect(userState.preferences).toEqual({
        theme: 'dark',
        notifications: true,
      });
    });

    it('merges user data without overwriting existing fields', () => {
      const { result } = renderHook(() => useAppActions());
      
      // Set initial user data
      act(() => {
        result.current.setUser({
          id: 'user-123',
          email: 'test@example.com',
          preferences: { theme: 'light' },
        });
      });
      
      // Update only preferences
      act(() => {
        result.current.setUser({
          preferences: { notifications: true },
        });
      });
      
      const userState = useAppStore.getState().user;
      expect(userState.id).toBe('user-123');
      expect(userState.email).toBe('test@example.com');
      expect(userState.preferences).toEqual({
        theme: 'light',
        notifications: true,
      });
    });
  });

  describe('Quest Actions', () => {
    it('sets quests correctly', () => {
      const { result } = renderHook(() => useAppActions());
      const mockQuests = [
        { id: 'quest-1', title: 'Test Quest 1', completed: false },
        { id: 'quest-2', title: 'Test Quest 2', completed: true },
      ];
      
      act(() => {
        result.current.setQuests(mockQuests);
      });
      
      const questState = useAppStore.getState().quests;
      expect(questState.quests).toEqual(mockQuests);
      expect(questState.completedQuests).toEqual(new Set(['quest-2']));
    });

    it('toggles quest completion correctly', () => {
      const { result } = renderHook(() => useAppActions());
      
      // Set initial quests
      act(() => {
        result.current.setQuests([
          { id: 'quest-1', title: 'Test Quest', completed: false },
        ]);
      });
      
      // Toggle completion
      act(() => {
        result.current.toggleQuestCompletion('quest-1');
      });
      
      const questState = useAppStore.getState().quests;
      expect(questState.quests[0].completed).toBe(true);
      expect(questState.completedQuests.has('quest-1')).toBe(true);
      
      // Toggle back
      act(() => {
        result.current.toggleQuestCompletion('quest-1');
      });
      
      const updatedQuestState = useAppStore.getState().quests;
      expect(updatedQuestState.quests[0].completed).toBe(false);
      expect(updatedQuestState.completedQuests.has('quest-1')).toBe(false);
    });

    it('handles quest completion for non-existent quest', () => {
      const { result } = renderHook(() => useAppActions());
      
      act(() => {
        result.current.toggleQuestCompletion('non-existent-quest');
      });
      
      const questState = useAppStore.getState().quests;
      expect(questState.quests).toEqual([]);
      expect(questState.completedQuests.size).toBe(0);
    });
  });

  describe('Inventory Actions', () => {
    it('sets inventory correctly', () => {
      const { result } = renderHook(() => useAppActions());
      const mockInventory = {
        sword: { type: 'weapon', quantity: 1 },
        potion: { type: 'consumable', quantity: 5 },
      };
      
      act(() => {
        result.current.setInventory(mockInventory);
      });
      
      const inventoryState = useAppStore.getState().inventory;
      expect(inventoryState.items).toEqual(mockInventory);
    });

    it('overwrites existing inventory', () => {
      const { result } = renderHook(() => useAppActions());
      
      // Set initial inventory
      act(() => {
        result.current.setInventory({ sword: { type: 'weapon', quantity: 1 } });
      });
      
      // Set new inventory
      act(() => {
        result.current.setInventory({ potion: { type: 'consumable', quantity: 3 } });
      });
      
      const inventoryState = useAppStore.getState().inventory;
      expect(inventoryState.items).toEqual({ potion: { type: 'consumable', quantity: 3 } });
      expect(inventoryState.items.sword).toBeUndefined();
    });
  });

  describe('UI Actions', () => {
    it('sets UI state correctly', () => {
      const { result } = renderHook(() => useAppActions());
      
      act(() => {
        result.current.setUI({
          sidebarOpen: true,
          theme: 'dark',
        });
      });
      
      const uiState = useAppStore.getState().ui;
      expect(uiState.sidebarOpen).toBe(true);
      expect(uiState.theme).toBe('dark');
    });

    it('merges UI state without overwriting existing fields', () => {
      const { result } = renderHook(() => useAppActions());
      
      // Set initial UI state
      act(() => {
        result.current.setUI({
          sidebarOpen: true,
          theme: 'light',
        });
      });
      
      // Update only theme
      act(() => {
        result.current.setUI({
          theme: 'dark',
        });
      });
      
      const uiState = useAppStore.getState().ui;
      expect(uiState.sidebarOpen).toBe(true);
      expect(uiState.theme).toBe('dark');
    });
  });

  describe('Reset App Action', () => {
    it('resets app state to initial values', () => {
      const { result } = renderHook(() => useAppActions());
      
      // Set some state
      act(() => {
        result.current.setUser({ id: 'user-123', email: 'test@example.com' });
        result.current.setQuests([{ id: 'quest-1', title: 'Test', completed: false }]);
        result.current.setUI({ sidebarOpen: true, theme: 'dark' });
      });
      
      // Reset app
      act(() => {
        result.current.resetApp();
      });
      
      const state = useAppStore.getState();
      expect(state.user.id).toBe(null);
      expect(state.user.email).toBe(null);
      expect(state.user.isLoaded).toBe(false);
      expect(state.quests.quests).toEqual([]);
      expect(state.ui.sidebarOpen).toBe(false);
      expect(state.ui.theme).toBe('system');
    });
  });

  describe('Selector Hooks', () => {
    it('useUser returns user state', () => {
      const { result } = renderHook(() => useUser());
      
      expect(result.current).toEqual({
        id: null,
        email: null,
        isLoaded: false,
        preferences: {},
      });
    });

    it('useQuests returns quests state', () => {
      const { result } = renderHook(() => useQuests());
      
      expect(result.current).toEqual({
        quests: [],
        completedQuests: new Set<string>(),
        loading: false,
        error: null,
        lastResetDate: null,
      });
    });

    it('useInventory returns inventory state', () => {
      const { result } = renderHook(() => useInventory());
      
      expect(result.current).toEqual({
        items: {},
        loading: false,
        error: null,
      });
    });

    it('useUI returns UI state', () => {
      const { result } = renderHook(() => useUI());
      
      expect(result.current).toEqual({
        sidebarOpen: false,
        theme: 'system',
        notifications: [],
        modals: {},
      });
    });

    it('useAppActions returns all actions', () => {
      const { result } = renderHook(() => useAppActions());
      
      expect(result.current).toHaveProperty('setUser');
      expect(result.current).toHaveProperty('setQuests');
      expect(result.current).toHaveProperty('toggleQuestCompletion');
      expect(result.current).toHaveProperty('setInventory');
      expect(result.current).toHaveProperty('setUI');
      expect(result.current).toHaveProperty('resetApp');
    });
  });

  describe('State Persistence', () => {
    it('persists state to localStorage', () => {
      const { result } = renderHook(() => useAppActions());
      
      act(() => {
        result.current.setUI({
          sidebarOpen: true,
          theme: 'dark',
        });
        result.current.setUser({
          preferences: { language: 'en' },
        });
      });
      
      // Check that localStorage was called
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('only persists non-sensitive data', () => {
      const { result } = renderHook(() => useAppActions());
      
      act(() => {
        result.current.setUser({
          id: 'user-123',
          email: 'test@example.com',
          preferences: { theme: 'dark' },
        });
      });
      
      // Check that sensitive data is not persisted
      const setItemCalls = localStorageMock.setItem.mock.calls;
      const persistedData = setItemCalls.find(([key]) => key === 'app-storage');
      
      if (persistedData) {
        const parsedData = JSON.parse(persistedData[1]);
        expect(parsedData.user.id).toBeUndefined();
        expect(parsedData.user.email).toBeUndefined();
        expect(parsedData.user.preferences.theme).toBe('dark');
      }
    });
  });

  describe('State Updates', () => {
    it('triggers re-renders when state changes', () => {
      const { result } = renderHook(() => useUser());
      const { result: actions } = renderHook(() => useAppActions());
      
      // Initial state
      expect(result.current.id).toBe(null);
      
      // Update state
      act(() => {
        actions.current.setUser({ id: 'user-123' });
      });
      
      // State should be updated
      expect(result.current.id).toBe('user-123');
    });

    it('maintains referential equality for unchanged objects', () => {
      const { result } = renderHook(() => useUI());
      const initialUI = result.current;
      
      // Update unrelated field
      const { result: actions } = renderHook(() => useAppActions());
      act(() => {
        actions.current.setUI({ sidebarOpen: true });
      });
      
      // Unchanged fields should maintain reference
      expect(result.current.theme).toBe(initialUI.theme);
      expect(result.current.notifications).toBe(initialUI.notifications);
      expect(result.current.modals).toBe(initialUI.modals);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty arrays and objects', () => {
      const { result } = renderHook(() => useAppActions());
      
      act(() => {
        result.current.setQuests([]);
        result.current.setInventory({});
      });
      
      const state = useAppStore.getState();
      expect(state.quests.quests).toEqual([]);
      expect(state.inventory.items).toEqual({});
    });

    it('handles null and undefined values gracefully', () => {
      const { result } = renderHook(() => useAppActions());
      
      act(() => {
        result.current.setUser({ preferences: null as any });
        result.current.setUI({ notifications: undefined as any });
      });
      
      const state = useAppStore.getState();
      expect(state.user.preferences).toBeNull();
      expect(state.ui.notifications).toBeUndefined();
    });
  });
});
