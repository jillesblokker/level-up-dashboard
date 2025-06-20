// Supabase services with localStorage fallback
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { RetryManager } from './retry-utils'

// Types for our game data
interface CharacterStats {
  user_id: string;
  gold: number;
  experience: number;
  level: number;
  health: number;
  max_health: number;
  character_name: string;
  updated_at?: string;
}

interface InventoryItem {
  user_id: string;
  item_id: string;
  name: string;
  description?: string;
  type: string;
  category?: string;
  quantity: number;
  emoji?: string;
  image?: string;
  stats?: any;
  equipped: boolean;
  is_default: boolean;
}

interface QuestStats {
  user_id: string;
  quest_id: string;
  quest_name: string;
  category: string;
  completed: boolean;
  progress: number;
  completed_at?: string | null;
}

interface CheckedQuest {
  user_id: string;
  quest_id: string;
  checked_at: string;
}

interface GameSettings {
  user_id: string;
  setting_key: string;
  setting_value: any;
}

// Supabase client with better error handling
const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not found. Sync will be disabled.')
}

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Utility to get user ID from Supabase session
async function getUserId(supabaseClient: SupabaseClient | null): Promise<string | null> {
  if (typeof window === 'undefined' || !supabaseClient) return null;
  const { data: { session } } = await supabaseClient.auth.getSession();
  // For Clerk, the user ID is in the 'sub' field of the JWT
  return session?.user?.id || (session as any)?.sub || null;
}

// Utility to check if we're online
function isOnline(): boolean {
  return typeof window !== 'undefined' && navigator.onLine
}

// Utility to check if Supabase is available
async function isSupabaseAvailable(): Promise<boolean> {
  if (!supabase || !isOnline()) return false;
  const userId = await getUserId(supabase);
  return userId !== null;
}

// Utility to handle Supabase errors and fallback to localStorage with retry
async function withFallback<T>(
  supabaseOperation: () => Promise<T>,
  localStorageKey: string,
  localStorageOperation: () => T
): Promise<T> {
  if (!(await isSupabaseAvailable())) {
    return localStorageOperation();
  }

  const retryManager = RetryManager.getInstance()

  try {
    const result = await supabaseOperation();
    // Also update localStorage as backup
    if (typeof window !== 'undefined' && result) {
      localStorage.setItem(localStorageKey, JSON.stringify(result));
    }
    return result;
  } catch (error) {
    console.warn(`Supabase operation for ${localStorageKey} failed, falling back to localStorage:`, error);
    return localStorageOperation();
  }
}

// Character Stats Services
export const CharacterStatsService = {
  async getStats(): Promise<CharacterStats | null> {
    return withFallback(
      async () => {
        const userId = await getUserId(supabase);
        if (!userId || !supabase) throw new Error('No user ID or Supabase client');

        const { data, error } = await supabase
          .from('character_stats')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') { // Ignore 'exact one row not found'
            throw error;
        }
        return data;
      },
      'character-stats',
      () => {
        const stored = localStorage.getItem('character-stats');
        return stored ? JSON.parse(stored) : null;
      }
    );
  },

  async updateStats(stats: Partial<Omit<CharacterStats, 'user_id'>>): Promise<CharacterStats> {
    return withFallback(
      async () => {
        const userId = await getUserId(supabase);
        if (!userId || !supabase) throw new Error('No user ID or Supabase client');

        const { data, error } = await supabase
          .from('character_stats')
          .upsert({ user_id: userId, ...stats })
          .select()
          .single();

        if (error) {
            console.error("Error updating stats in Supabase:", error);
            throw error;
        }
        return data;
      },
      'character-stats',
      () => {
        const current = JSON.parse(localStorage.getItem('character-stats') || '{}');
        const updated = { ...current, ...stats };
        localStorage.setItem('character-stats', JSON.stringify(updated));
        return updated;
      }
    );
  }
}

// Inventory Services
export const InventoryService = {
  async getInventory(): Promise<InventoryItem[]> {
    return withFallback(
      async () => {
        const userId = await getUserId(supabase);
        if (!userId || !supabase) throw new Error('No user ID or Supabase client');

        const { data, error } = await supabase
          .from('inventory_items')
          .select('*')
          .eq('user_id', userId);

        if (error) throw error;
        return data || [];
      },
      'character-inventory',
      () => JSON.parse(localStorage.getItem('character-inventory') || '[]')
    );
  },

  async addToInventory(item: Omit<InventoryItem, 'user_id'>): Promise<void> {
    await withFallback(
      async () => {
        const userId = await getUserId(supabase);
        if (!userId || !supabase) throw new Error('No user ID or Supabase client');

        const { error } = await supabase
          .from('inventory_items')
          .upsert({ user_id: userId, ...item });

        if (error) throw error;
      },
      'character-inventory',
      () => {
        const current = JSON.parse(localStorage.getItem('character-inventory') || '[]') as InventoryItem[];
        const existingIndex = current.findIndex((i: InventoryItem) => i.item_id === item.item_id);
        if (existingIndex !== -1 && current[existingIndex]) {
          current[existingIndex].quantity += item.quantity;
        } else {
          current.push({ user_id: 'local', ...item });
        }
        localStorage.setItem('character-inventory', JSON.stringify(current));
      }
    );
  },
}

// Quest Services
export const QuestService = {
    async getCheckedQuests(): Promise<string[]> {
        return withFallback(
            async () => {
                const userId = await getUserId(supabase);
                if (!userId || !supabase) return [];
                const { data, error } = await supabase
                    .from('checked_quests')
                    .select('quest_id')
                    .eq('user_id', userId);
                if (error) throw error;
                return data?.map(q => q.quest_id) || [];
            },
            'checked-quests',
            () => JSON.parse(localStorage.getItem('checked-quests') || '[]')
        );
    },

    async updateQuestStats(questStats: Omit<QuestStats, 'user_id'>): Promise<void> {
        await withFallback(
            async () => {
                const userId = await getUserId(supabase);
                if (!userId || !supabase) throw new Error('No user ID');
                await supabase.from('quest_stats').upsert({ user_id: userId, ...questStats });
            },
            'quest-stats',
            () => { /* Local storage update logic here if needed */ }
        );
    },

    async updateCheckedQuests(questId: string, isCompleted: boolean): Promise<void> {
        await withFallback(
            async () => {
                const userId = await getUserId(supabase);
                if (!userId || !supabase) throw new Error('No user ID');

                if (isCompleted) {
                    await supabase.from('checked_quests').upsert({ user_id: userId, quest_id: questId });
                } else {
                    await supabase.from('checked_quests').delete().match({ user_id: userId, quest_id: questId });
                }
            },
            'checked-quests',
             () => {
                const checked = JSON.parse(localStorage.getItem('checked-quests') || '[]') as string[];
                const newChecked = isCompleted
                    ? [...checked, questId]
                    : checked.filter(id => id !== questId);
                localStorage.setItem('checked-quests', JSON.stringify(Array.from(new Set(newChecked))));
            }
        );
    }
};

// Generic Sync Service
export const SyncService = {
  async syncAllData(): Promise<void> {
    const isReady = await isSupabaseAvailable();
    if (!isReady || !supabase) {
      console.warn('Supabase not available, skipping sync.');
      return;
    }
    // Implement sync logic for all data types if needed
  },

  setupSubscriptions(callbacks: {
    onQuestChange?: (payload: any) => void;
    onGridChange?: (payload: any) => void;
    onCharacterStatsChange?: (payload: any) => void;
    onInventoryChange?: (payload: any) => void;
    onAchievementChange?: (payload: any) => void;
  }) {
    if (!supabase) return null;

    const channels: any[] = [];

    if (callbacks.onCharacterStatsChange) {
        const statsChannel = supabase.channel('character_stats_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'character_stats' }, callbacks.onCharacterStatsChange)
            .subscribe();
        channels.push(statsChannel);
    }

    // Add other subscriptions as needed...

    return () => {
      channels.forEach(channel => {
        if (supabase) {
          supabase.removeChannel(channel)
        }
      });
    };
  }
};