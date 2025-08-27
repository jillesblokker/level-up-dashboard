import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Types
export interface UserState {
  id: string | null;
  email: string | null;
  isLoaded: boolean;
  preferences: Record<string, any>;
}

export interface QuestState {
  quests: any[];
  completedQuests: Set<string>;
  loading: boolean;
  error: string | null;
  lastResetDate: string | null;
}

export interface InventoryState {
  items: Record<string, any>;
  loading: boolean;
  error: string | null;
}

export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  notifications: any[];
  modals: Record<string, boolean>;
}

export interface AppState {
  // State slices
  user: UserState;
  quests: QuestState;
  inventory: InventoryState;
  ui: UIState;
  
  // Actions
  setUser: (user: Partial<UserState>) => void;
  setQuests: (quests: any[]) => void;
  toggleQuestCompletion: (questId: string) => void;
  setInventory: (inventory: Record<string, any>) => void;
  setUI: (ui: Partial<UIState>) => void;
  resetApp: () => void;
}

// Initial state
const initialState = {
  user: {
    id: null,
    email: null,
    isLoaded: false,
    preferences: {},
  },
  quests: {
    quests: [],
    completedQuests: new Set<string>(),
    loading: false,
    error: null,
    lastResetDate: null,
  },
  inventory: {
    items: {},
    loading: false,
    error: null,
  },
  ui: {
    sidebarOpen: false,
    theme: 'system' as const,
    notifications: [],
    modals: {},
  },
};

// Create store
export const useAppStore = create<AppState>()(
  persist(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,

        // User actions
        setUser: (userData) =>
          set((state) => {
            Object.assign(state.user, userData);
          }),

        // Quest actions
        setQuests: (quests) =>
          set((state) => {
            state.quests.quests = quests;
            // Convert Set to array for persistence, then back to Set
            const completedQuestIds = quests.filter((q: any) => q.completed).map((q: any) => q.id);
            state.quests.completedQuests = new Set(completedQuestIds);
          }),

        toggleQuestCompletion: (questId) =>
          set((state) => {
            const quest = state.quests.quests.find((q: any) => q.id === questId);
            if (quest) {
              quest.completed = !quest.completed;
              if (quest.completed) {
                state.quests.completedQuests.add(questId);
              } else {
                state.quests.completedQuests.delete(questId);
              }
            }
          }),

        // Inventory actions
        setInventory: (inventory) =>
          set((state) => {
            state.inventory.items = inventory;
          }),

        // UI actions
        setUI: (uiData) =>
          set((state) => {
            Object.assign(state.ui, uiData);
          }),

        // Reset app state
        resetApp: () =>
          set(() => ({
            ...initialState,
            user: {
              ...initialState.user,
              isLoaded: false,
            },
          })),
      }))
    ),
    {
      name: 'app-storage',
      partialize: (state) => ({
        // Only persist non-sensitive data
        ui: {
          sidebarOpen: state.ui.sidebarOpen,
          theme: state.ui.theme,
        },
        user: {
          preferences: state.user.preferences,
        },
      }),
      // Note: Custom serialization for Set objects is handled in the state transformation
    }
  )
);

// Selectors for better performance
export const useUser = () => useAppStore((state) => state.user);
export const useQuests = () => useAppStore((state) => state.quests);
export const useInventory = () => useAppStore((state) => state.inventory);
export const useUI = () => useAppStore((state) => state.ui);

// Action hooks
export const useAppActions = () => useAppStore((state) => ({
  setUser: state.setUser,
  setQuests: state.setQuests,
  toggleQuestCompletion: state.toggleQuestCompletion,
  setInventory: state.setInventory,
  setUI: state.setUI,
  resetApp: state.resetApp,
}));

// Subscribe to specific state changes
export const subscribeToUserChanges = (callback: (user: UserState) => void) =>
  useAppStore.subscribe((state) => state.user, callback);

export const subscribeToQuestChanges = (callback: (quests: QuestState) => void) =>
  useAppStore.subscribe((state) => state.quests, callback);
