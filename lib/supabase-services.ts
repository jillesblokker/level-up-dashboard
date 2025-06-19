// Supabase services with localStorage fallback
import { createClient } from '@supabase/supabase-js'
import { RetryManager } from './retry-utils'

// Types for our game data
interface CharacterStats {
  gold: number
  experience: number
  level: number
  health: number
  max_health: number
  character_name: string
}

interface InventoryItem {
  id: string
  name: string
  description?: string
  type: string
  category?: string
  quantity: number
  emoji?: string
  image?: string
  stats?: any
  equipped: boolean
  is_default: boolean
}

interface QuestStats {
  quest_id: string
  quest_name: string
  category: string
  completed: boolean
  progress: number
  max_progress: number
}

interface CheckedQuest {
  quest_id: string
  checked_at: string
}

interface GameSettings {
  setting_key: string
  setting_value: any
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

// Utility to get user ID from Clerk
function getUserId(): string | null {
  if (typeof window === 'undefined') return null
  // This will be replaced with actual Clerk user ID
  return localStorage.getItem('clerk-user-id')
}

// Utility to check if we're online
function isOnline(): boolean {
  return typeof window !== 'undefined' && navigator.onLine
}

// Utility to check if Supabase is available
function isSupabaseAvailable(): boolean {
  return supabase !== null && isOnline() && getUserId() !== null
}

// Utility to handle Supabase errors and fallback to localStorage with retry
async function withFallback<T>(
  supabaseOperation: () => Promise<T>,
  localStorageKey: string,
  localStorageOperation: () => T
): Promise<T> {
  if (!isSupabaseAvailable()) {
    return localStorageOperation()
  }

  const retryManager = RetryManager.getInstance()

  try {
    const result = await retryManager.retryDatabase(supabaseOperation)
    // Also update localStorage as backup
    if (typeof window !== 'undefined') {
      localStorage.setItem(localStorageKey, JSON.stringify(result))
    }
    return result
  } catch (error) {
    console.warn('Supabase operation failed after retries, falling back to localStorage:', error)
    return localStorageOperation()
  }
}

// Character Stats Services
export const CharacterStatsService = {
  async getStats(): Promise<CharacterStats | null> {
    return withFallback(
      async () => {
        const userId = getUserId()
        if (!userId || !supabase) throw new Error('No user ID or Supabase client')

        const { data, error } = await supabase
          .from('character_stats')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (error) throw error
        return data
      },
      'character-stats',
      () => {
        const stored = localStorage.getItem('character-stats')
        return stored ? JSON.parse(stored) : null
      }
    )
  },

  async updateStats(stats: Partial<CharacterStats>): Promise<CharacterStats> {
    return withFallback(
      async () => {
        const userId = getUserId()
        if (!userId || !supabase) throw new Error('No user ID or Supabase client')

        const { data, error } = await supabase
          .from('character_stats')
          .upsert({
            user_id: userId,
            ...stats,
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (error) throw error
        return data
      },
      'character-stats',
      () => {
        const current = JSON.parse(localStorage.getItem('character-stats') || '{}')
        const updated = { ...current, ...stats }
        localStorage.setItem('character-stats', JSON.stringify(updated))
        return updated
      }
    )
  }
}

// Inventory Services
export const InventoryService = {
  async getInventory(): Promise<InventoryItem[]> {
    return withFallback(
      async () => {
        const userId = getUserId()
        if (!userId) throw new Error('No user ID')

        const { data, error } = await supabase
          .from('inventory_items')
          .select('*')
          .eq('user_id', userId)

        if (error) throw error
        return data || []
      },
      'character-inventory',
      () => {
        const stored = localStorage.getItem('character-inventory')
        return stored ? JSON.parse(stored) : []
      }
    )
  },

  async addToInventory(item: InventoryItem): Promise<void> {
    return withFallback(
      async () => {
        const userId = getUserId()
        if (!userId) throw new Error('No user ID')

        const { error } = await supabase
          .from('inventory_items')
          .upsert({
            user_id: userId,
            item_id: item.id,
            ...item,
            updated_at: new Date().toISOString()
          })

        if (error) throw error
      },
      'character-inventory',
      () => {
        const current = JSON.parse(localStorage.getItem('character-inventory') || '[]')
        const existing = current.find((i: InventoryItem) => i.id === item.id)
        if (existing) {
          existing.quantity += item.quantity
        } else {
          current.push(item)
        }
        localStorage.setItem('character-inventory', JSON.stringify(current))
      }
    )
  },

  async getKingdomInventory(): Promise<InventoryItem[]> {
    return withFallback(
      async () => {
        const userId = getUserId()
        if (!userId) throw new Error('No user ID')

        const { data, error } = await supabase
          .from('inventory_items')
          .select('*')
          .eq('user_id', userId)
          .eq('type', 'kingdom')

        if (error) throw error
        return data || []
      },
      'kingdom-inventory',
      () => {
        const stored = localStorage.getItem('kingdom-inventory')
        return stored ? JSON.parse(stored) : []
      }
    )
  },

  async getEquippedItems(): Promise<InventoryItem[]> {
    return withFallback(
      async () => {
        const userId = getUserId()
        if (!userId) throw new Error('No user ID')

        const { data, error } = await supabase
          .from('inventory_items')
          .select('*')
          .eq('user_id', userId)
          .eq('equipped', true)

        if (error) throw error
        return data || []
      },
      'kingdom-equipped-items',
      () => {
        const stored = localStorage.getItem('kingdom-equipped-items')
        return stored ? JSON.parse(stored) : []
      }
    )
  }
}

// Quest Services
export const QuestService = {
  async getCheckedQuests(): Promise<string[]> {
    return withFallback(
      async () => {
        const userId = getUserId()
        if (!userId) throw new Error('No user ID')

        const { data, error } = await supabase
          .from('checked_quests')
          .select('quest_id')
          .eq('user_id', userId)

        if (error) throw error
        return data?.map(item => item.quest_id) || []
      },
      'checked-quests',
      () => {
        const stored = localStorage.getItem('checked-quests')
        return stored ? JSON.parse(stored) : []
      }
    )
  },

  async checkQuest(questId: string): Promise<void> {
    return withFallback(
      async () => {
        const userId = getUserId()
        if (!userId) throw new Error('No user ID')

        const { error } = await supabase
          .from('checked_quests')
          .upsert({
            user_id: userId,
            quest_id: questId,
            checked_at: new Date().toISOString()
          })

        if (error) throw error
      },
      'checked-quests',
      () => {
        const current = JSON.parse(localStorage.getItem('checked-quests') || '[]')
        if (!current.includes(questId)) {
          current.push(questId)
          localStorage.setItem('checked-quests', JSON.stringify(current))
        }
      }
    )
  },

  async uncheckQuest(questId: string): Promise<void> {
    return withFallback(
      async () => {
        const userId = getUserId()
        if (!userId) throw new Error('No user ID')

        const { error } = await supabase
          .from('checked_quests')
          .delete()
          .eq('user_id', userId)
          .eq('quest_id', questId)

        if (error) throw error
      },
      'checked-quests',
      () => {
        const current = JSON.parse(localStorage.getItem('checked-quests') || '[]')
        const filtered = current.filter((id: string) => id !== questId)
        localStorage.setItem('checked-quests', JSON.stringify(filtered))
      }
    )
  },

  async getQuestStats(): Promise<QuestStats[]> {
    return withFallback(
      async () => {
        const userId = getUserId()
        if (!userId) throw new Error('No user ID')

        const { data, error } = await supabase
          .from('quest_stats')
          .select('*')
          .eq('user_id', userId)

        if (error) throw error
        return data || []
      },
      'quest-stats',
      () => {
        const stored = localStorage.getItem('quest-stats')
        return stored ? JSON.parse(stored) : []
      }
    )
  },

  async updateQuestStats(questId: string, updates: Partial<QuestStats>): Promise<void> {
    return withFallback(
      async () => {
        const userId = getUserId()
        if (!userId) throw new Error('No user ID')

        const { error } = await supabase
          .from('quest_stats')
          .upsert({
            user_id: userId,
            quest_id: questId,
            ...updates,
            updated_at: new Date().toISOString()
          })

        if (error) throw error
      },
      'quest-stats',
      () => {
        const current = JSON.parse(localStorage.getItem('quest-stats') || '[]')
        const existingIndex = current.findIndex((q: QuestStats) => q.quest_id === questId)
        if (existingIndex >= 0) {
          current[existingIndex] = { ...current[existingIndex], ...updates }
        } else {
          current.push({ quest_id: questId, ...updates })
        }
        localStorage.setItem('quest-stats', JSON.stringify(current))
      }
    )
  }
}

// Daily Quests Services
export const DailyQuestsService = {
  async getDailyQuests(): Promise<any[]> {
    return withFallback(
      async () => {
        const userId = getUserId()
        if (!userId) throw new Error('No user ID')

        const { data, error } = await supabase
          .from('game_settings')
          .select('setting_value')
          .eq('user_id', userId)
          .eq('setting_key', 'daily-quests')
          .single()

        if (error) throw error
        return data?.setting_value || []
      },
      'daily-quests',
      () => {
        const stored = localStorage.getItem('daily-quests')
        return stored ? JSON.parse(stored) : []
      }
    )
  },

  async saveDailyQuests(quests: any[]): Promise<void> {
    return withFallback(
      async () => {
        const userId = getUserId()
        if (!userId) throw new Error('No user ID')

        const { error } = await supabase
          .from('game_settings')
          .upsert({
            user_id: userId,
            setting_key: 'daily-quests',
            setting_value: quests,
            updated_at: new Date().toISOString()
          })

        if (error) throw error
      },
      'daily-quests',
      () => {
        localStorage.setItem('daily-quests', JSON.stringify(quests))
      }
    )
  }
}

// Game Settings Services
export const GameSettingsService = {
  async getSetting(key: string): Promise<any> {
    return withFallback(
      async () => {
        const userId = getUserId()
        if (!userId) throw new Error('No user ID')

        const { data, error } = await supabase
          .from('game_settings')
          .select('setting_value')
          .eq('user_id', userId)
          .eq('setting_key', key)
          .single()

        if (error) throw error
        return data?.setting_value
      },
      `setting-${key}`,
      () => {
        const stored = localStorage.getItem(`setting-${key}`)
        return stored ? JSON.parse(stored) : null
      }
    )
  },

  async setSetting(key: string, value: any): Promise<void> {
    return withFallback(
      async () => {
        const userId = getUserId()
        if (!userId) throw new Error('No user ID')

        const { error } = await supabase
          .from('game_settings')
          .upsert({
            user_id: userId,
            setting_key: key,
            setting_value: value,
            updated_at: new Date().toISOString()
          })

        if (error) throw error
      },
      `setting-${key}`,
      () => {
        localStorage.setItem(`setting-${key}`, JSON.stringify(value))
      }
    )
  }
}

// Sync service to handle data synchronization
export const SyncService = {
  async syncAllData(): Promise<void> {
    if (!isOnline() || !getUserId()) return

    try {
      // Sync character stats
      const localStats = localStorage.getItem('character-stats')
      if (localStats) {
        await CharacterStatsService.updateStats(JSON.parse(localStats))
      }

      // Sync inventory
      const localInventory = localStorage.getItem('character-inventory')
      if (localInventory) {
        const items = JSON.parse(localInventory)
        for (const item of items) {
          await InventoryService.addToInventory(item)
        }
      }

      // Sync checked quests
      const localCheckedQuests = localStorage.getItem('checked-quests')
      if (localCheckedQuests) {
        const questIds = JSON.parse(localCheckedQuests)
        for (const questId of questIds) {
          await QuestService.checkQuest(questId)
        }
      }

      // Sync daily quests
      const localDailyQuests = localStorage.getItem('daily-quests')
      if (localDailyQuests) {
        await DailyQuestsService.saveDailyQuests(JSON.parse(localDailyQuests))
      }

      console.log('Data sync completed successfully')
    } catch (error) {
      console.error('Data sync failed:', error)
    }
  }
}
