/**
 * UNIFIED GAME STORE (Zustand)
 *
 * Central reactive state for the entire game.
 * Replaces scattered useState/useEffect patterns across components.
 *
 * Usage:
 *   import { useGameStore } from '@/stores/game-store'
 *   const gold = useGameStore(s => s.gold)
 *   const gainGold = useGameStore(s => s.gainGold)
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { CharacterStats } from '@/lib/character-stats-service'

// ---------------------------------------------------------------------------
// State Shape
// ---------------------------------------------------------------------------

interface GameState {
  // Character stats (mirroring CharacterStatsService)
  gold: number
  experience: number
  level: number
  health: number
  maxHealth: number
  buildTokens: number
  streakTokens: number
  kingdomExpansions: number
  displayName: string
  title: string
  ascensionLevel: number

  // UI state
  isLoading: boolean
  activeTab: string

  // Inventory counts (summary)
  inventoryCount: number

  // Hydration flag — true once initial load from service is done
  hydrated: boolean
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

interface GameActions {
  /** Hydrate store from CharacterStatsService (call once on mount) */
  hydrate: () => void

  /** Sync store from a CharacterStats object (from service events) */
  syncFromStats: (stats: CharacterStats) => void

  /** Convenience mutators that also write through to CharacterStatsService */
  gainGold: (amount: number, source?: string) => void
  spendGold: (amount: number, source?: string) => boolean
  gainExperience: (amount: number, source?: string) => void
  setHealth: (health: number) => void
  setBuildTokens: (tokens: number) => void
  setStreakTokens: (tokens: number) => void
  setKingdomExpansions: (count: number) => void
  setLevel: (level: number) => void

  // UI
  setActiveTab: (tab: string) => void
  setLoading: (loading: boolean) => void
  setInventoryCount: (count: number) => void
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export type GameStore = GameState & GameActions

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    gold: 0,
    experience: 0,
    level: 1,
    health: 100,
    maxHealth: 100,
    buildTokens: 0,
    streakTokens: 0,
    kingdomExpansions: 0,
    displayName: 'Adventurer',
    title: 'Novice',
    ascensionLevel: 0,
    isLoading: true,
    activeTab: 'thrivehaven',
    inventoryCount: 0,
    hydrated: false,

    // ------- Hydration -------
    hydrate: () => {
      try {
        // Lazy-import to avoid circular deps and keep this file lean
        const { getCharacterStats } = require('@/lib/character-stats-service')
        const stats: CharacterStats = getCharacterStats()
        set({
          gold: stats.gold,
          experience: stats.experience,
          level: stats.level,
          health: stats.health,
          maxHealth: stats.max_health,
          buildTokens: stats.build_tokens,
          streakTokens: stats.streak_tokens,
          kingdomExpansions: stats.kingdom_expansions,
          displayName: stats.display_name || 'Adventurer',
          title: stats.title || 'Novice',
          ascensionLevel: stats.ascension_level || 0,
          hydrated: true,
          isLoading: false,
        })
      } catch {
        set({ hydrated: true, isLoading: false })
      }
    },

    syncFromStats: (stats: CharacterStats) => {
      set({
        gold: stats.gold,
        experience: stats.experience,
        level: stats.level,
        health: stats.health,
        maxHealth: stats.max_health,
        buildTokens: stats.build_tokens,
        streakTokens: stats.streak_tokens,
        kingdomExpansions: stats.kingdom_expansions,
        displayName: stats.display_name || 'Adventurer',
        title: stats.title || 'Novice',
        ascensionLevel: stats.ascension_level || 0,
      })
    },

    // ------- Gold -------
    gainGold: (amount, source) => {
      const { updateCharacterStats } = require('@/lib/character-stats-service')
      const newGold = get().gold + amount
      set({ gold: newGold })
      updateCharacterStats({ gold: newGold }, source || 'zustand-gain-gold')
    },

    spendGold: (amount, source) => {
      const current = get().gold
      if (current < amount) return false
      const { updateCharacterStats } = require('@/lib/character-stats-service')
      const newGold = current - amount
      set({ gold: newGold })
      updateCharacterStats({ gold: newGold }, source || 'zustand-spend-gold')
      return true
    },

    // ------- Experience -------
    gainExperience: (amount, source) => {
      const { updateCharacterStats } = require('@/lib/character-stats-service')
      const newXP = get().experience + amount
      set({ experience: newXP })
      updateCharacterStats({ experience: newXP }, source || 'zustand-gain-xp')
    },

    // ------- Health -------
    setHealth: (health) => {
      const { updateCharacterStats } = require('@/lib/character-stats-service')
      set({ health })
      updateCharacterStats({ health }, 'zustand-set-health')
    },

    // ------- Tokens -------
    setBuildTokens: (tokens) => {
      const { updateCharacterStats } = require('@/lib/character-stats-service')
      set({ buildTokens: tokens })
      updateCharacterStats({ build_tokens: tokens }, 'zustand-set-tokens')
    },

    setStreakTokens: (tokens) => {
      const { updateCharacterStats } = require('@/lib/character-stats-service')
      set({ streakTokens: tokens })
      updateCharacterStats({ streak_tokens: tokens }, 'zustand-set-streak-tokens')
    },

    // ------- Kingdom -------
    setKingdomExpansions: (count) => {
      const { updateCharacterStats } = require('@/lib/character-stats-service')
      set({ kingdomExpansions: count })
      updateCharacterStats({ kingdom_expansions: count }, 'zustand-set-expansions')
    },

    setLevel: (level) => {
      const { updateCharacterStats } = require('@/lib/character-stats-service')
      set({ level })
      updateCharacterStats({ level }, 'zustand-set-level')
    },

    // ------- UI -------
    setActiveTab: (tab) => set({ activeTab: tab }),
    setLoading: (loading) => set({ isLoading: loading }),
    setInventoryCount: (count) => set({ inventoryCount: count }),
  }))
)
