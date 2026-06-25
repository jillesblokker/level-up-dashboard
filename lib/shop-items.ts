/**
 * Shop Items — Centralized data module for all shop interfaces
 * 
 * Sources items from the canonical comprehensive-items.ts database
 * and provides categorized exports for each shop type.
 */

import {
  comprehensiveItems,
  type ComprehensiveItem,
} from '@/app/lib/comprehensive-items'

// Re-export the ComprehensiveItem type for shop use
export type ShopItem = ComprehensiveItem

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

// ==========================================
// RARITY STYLING
// ==========================================

export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#9CA3AF',
  uncommon: '#10B981',
  rare: '#3B82F6',
  epic: '#8B5CF6',
  legendary: '#F59E0B',
}

export const RARITY_BG_CLASSES: Record<Rarity, string> = {
  common: 'bg-gray-900/50 border-gray-700/30',
  uncommon: 'bg-emerald-950/30 border-emerald-800/30',
  rare: 'bg-blue-950/30 border-blue-800/30',
  epic: 'bg-purple-950/30 border-purple-800/30',
  legendary: 'bg-amber-950/30 border-amber-700/30',
}

export const RARITY_TEXT_CLASSES: Record<Rarity, string> = {
  common: 'text-gray-400',
  uncommon: 'text-emerald-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-amber-400',
}

export const RARITY_BADGE_CLASSES: Record<Rarity, string> = {
  common: 'bg-gray-900 border-gray-700 text-gray-400',
  uncommon: 'bg-emerald-950 border-emerald-800 text-emerald-400',
  rare: 'bg-blue-950 border-blue-800 text-blue-400',
  epic: 'bg-purple-950 border-purple-800 text-purple-400',
  legendary: 'bg-amber-950 border-amber-700 text-amber-400',
}

// ==========================================
// STAT BADGE STYLING
// ==========================================

export const STAT_BADGE_CLASSES: Record<string, string> = {
  attack: 'bg-red-950 border-red-900 text-red-400',
  defense: 'bg-blue-950 border-blue-900 text-blue-400',
  health: 'bg-green-950 border-green-900 text-green-400',
  mana: 'bg-purple-950 border-purple-900 text-purple-400',
  movement: 'bg-amber-950 border-amber-900 text-amber-400',
  stamina: 'bg-teal-950 border-teal-900 text-teal-400',
  experience: 'bg-yellow-950 border-yellow-900 text-yellow-400',
  gold: 'bg-amber-950 border-amber-800 text-amber-300',
}

export const STAT_LABELS: Record<string, string> = {
  attack: 'ATK',
  defense: 'DEF',
  health: 'HP',
  mana: 'MANA',
  movement: 'MOVE',
  stamina: 'STAM',
  experience: 'EXP',
  gold: 'GOLD',
}

// ==========================================
// CATEGORIZED SHOP ITEMS
// ==========================================

// Blacksmith items
export const BLACKSMITH_WEAPONS: ShopItem[] = comprehensiveItems.filter(
  i => i.type === 'weapon'
)
export const BLACKSMITH_SHIELDS: ShopItem[] = comprehensiveItems.filter(
  i => i.type === 'shield'
)
export const BLACKSMITH_ARMOR: ShopItem[] = comprehensiveItems.filter(
  i => i.type === 'armor'
)
export const BLACKSMITH_ALL: ShopItem[] = [
  ...BLACKSMITH_WEAPONS,
  ...BLACKSMITH_SHIELDS,
  ...BLACKSMITH_ARMOR,
]

// Stables items
export const STABLE_ITEMS: ShopItem[] = comprehensiveItems.filter(
  i => i.type === 'mount'
)

// Marketplace consumables
export const POTION_ITEMS: ShopItem[] = comprehensiveItems.filter(
  i => i.type === 'potion'
)
export const SCROLL_ITEMS: ShopItem[] = comprehensiveItems.filter(
  i => i.type === 'scroll'
)
export const FOOD_ITEMS: ShopItem[] = comprehensiveItems.filter(
  i => i.type === 'consumable' && i.id !== 'material-water'
)
export const ARTIFACT_ITEMS: ShopItem[] = comprehensiveItems.filter(
  i => i.type === 'artifact'
)

// Combined exports
export const MARKETPLACE_CONSUMABLES: ShopItem[] = [
  ...POTION_ITEMS,
  ...SCROLL_ITEMS,
  ...FOOD_ITEMS,
]
export const MARKETPLACE_ARTIFACTS: ShopItem[] = [...ARTIFACT_ITEMS]
