/**
 * Shiny Items System - Star Rating Utilities
 * 
 * Implements a Pokemon-style "shiny" rarity system for inventory items.
 * Items can have 0-3 stars, affecting their visual appearance and value.
 */

// Probability distribution for star ratings
export const STAR_PROBABILITIES: Record<number, number> = {
    0: 0.85,  // 85% - Normal
    1: 0.10,  // 10% - Uncommon
    2: 0.04,  // 4%  - Rare
    3: 0.01   // 1%  - Legendary
};

// Price multipliers based on star rating
export const STAR_MULTIPLIERS: Record<number, number> = {
    0: 1.0,   // Normal price
    1: 2.0,   // 2x price
    2: 5.0,   // 5x price
    3: 15.0   // 15x price
};

// Display names for each tier
export const STAR_TIER_NAMES: Record<number, string> = {
    0: 'Normal',
    1: 'Uncommon',
    2: 'Rare',
    3: 'Legendary'
};

// Colors for each tier (tailwind classes)
export const STAR_TIER_COLORS: Record<number, { text: string; bg: string; border: string; glow: string }> = {
    0: {
        text: 'text-gray-400',
        bg: 'bg-gray-800',
        border: 'border-gray-700',
        glow: ''
    },
    1: {
        text: 'text-yellow-400',
        bg: 'bg-yellow-900/20',
        border: 'border-yellow-700/50',
        glow: 'ring-1 ring-yellow-400/30'
    },
    2: {
        text: 'text-amber-400',
        bg: 'bg-amber-900/30',
        border: 'border-amber-600/50',
        glow: 'ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20'
    },
    3: {
        text: 'text-orange-300',
        bg: 'bg-gradient-to-br from-amber-900/40 to-orange-900/40',
        border: 'border-amber-500',
        glow: 'ring-2 ring-amber-400 shadow-xl shadow-amber-500/40'
    }
};

/**
 * Roll a random star rating based on probability distribution
 * @returns Star rating 0-3
 */
export function rollStarRating(): number {
    const roll = Math.random();
    let cumulative = 0;

    for (const [stars, probability] of Object.entries(STAR_PROBABILITIES)) {
        cumulative += probability;
        if (roll < cumulative) {
            return parseInt(stars);
        }
    }

    return 0; // Fallback to normal
}

/**
 * Calculate the actual value of an item based on its star rating
 * @param basePrice The base price of the item
 * @param starRating The star rating (0-3)
 * @returns The calculated value
 */
export function calculateItemValue(basePrice: number, starRating: number): number {
    const multiplier = STAR_MULTIPLIERS[starRating] ?? 1.0;
    return Math.floor(basePrice * multiplier);
}

/**
 * Get the star display string (emoji stars)
 * @param starRating The star rating (0-3)
 * @returns String of star emojis
 */
export function getStarDisplay(starRating: number): string {
    if (starRating <= 0) return '';
    return '⭐'.repeat(Math.min(starRating, 3));
}

/**
 * Get tier information for a star rating
 * @param starRating The star rating (0-3)
 * @returns Object with tier name, colors, and display
 */
export function getStarTierInfo(starRating: number) {
    const rating = Math.max(0, Math.min(3, starRating));
    return {
        name: STAR_TIER_NAMES[rating],
        stars: getStarDisplay(rating),
        multiplier: STAR_MULTIPLIERS[rating],
        colors: STAR_TIER_COLORS[rating],
        isRare: rating >= 2,
        isLegendary: rating === 3
    };
}

/**
 * Check if a star rating should trigger a celebration
 * @param starRating The star rating (0-3)
 * @returns Object with celebration details
 */
export function shouldCelebrate(starRating: number): {
    celebrate: boolean;
    level: 'none' | 'minor' | 'major' | 'legendary';
    message: string;
    sound: string | null;
    confetti: boolean;
} {
    if (starRating === 3) {
        return {
            celebrate: true,
            level: 'legendary',
            message: '🌟 LEGENDARY! You found an ultra-rare item!',
            sound: 'legendary-item',
            confetti: true
        };
    }

    if (starRating === 2) {
        return {
            celebrate: true,
            level: 'major',
            message: '✨ Rare find! This item has bonus stars!',
            sound: 'rare-item',
            confetti: false
        };
    }

    if (starRating === 1) {
        return {
            celebrate: true,
            level: 'minor',
            message: '⭐ Nice! You found an uncommon item!',
            sound: 'uncommon-item',
            confetti: false
        };
    }

    return {
        celebrate: false,
        level: 'none',
        message: '',
        sound: null,
        confetti: false
    };
}

/**
 * Format item name with rarity prefix
 * @param itemName Base item name
 * @param starRating Star rating (0-3)
 * @returns Formatted name with rarity prefix if applicable
 */
export function formatItemNameWithRarity(itemName: string, starRating: number): string {
    if (starRating <= 0) return itemName;

    const prefix = STAR_TIER_NAMES[starRating];
    return `${prefix} ${itemName}`;
}

// Type for items with star ratings
export interface StarRatedItem {
    id: string;
    type: string;
    name: string;
    baseValue: number;
    starRating: number;
    actualValue: number;
    tierInfo: ReturnType<typeof getStarTierInfo>;
}

/**
 * Enrich an inventory item with star rating calculations
 * @param item Basic item data
 * @returns Item enriched with star rating info
 */
export function enrichItemWithStarRating(item: {
    id: string;
    type: string;
    name: string;
    baseValue: number;
    star_rating?: number;
}): StarRatedItem {
    const starRating = item.star_rating ?? 0;

    return {
        id: item.id,
        type: item.type,
        name: item.name,
        baseValue: item.baseValue,
        starRating,
        actualValue: calculateItemValue(item.baseValue, starRating),
        tierInfo: getStarTierInfo(starRating)
    };
}
