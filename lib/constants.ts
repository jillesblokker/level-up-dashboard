/**
 * Application Constants
 * 
 * Centralized constants to avoid magic strings and numbers throughout the codebase.
 */

// =============================================================================
// Quest Categories
// =============================================================================

export const QUEST_CATEGORIES = {
    MIGHT: 'might',
    KNOWLEDGE: 'knowledge',
    HONOR: 'honor',
    CASTLE: 'castle',
    CRAFT: 'craft',
    VITALITY: 'vitality',
} as const;

export type QuestCategory = typeof QUEST_CATEGORIES[keyof typeof QUEST_CATEGORIES];

export const QUEST_CATEGORY_LABELS: Record<QuestCategory, string> = {
    [QUEST_CATEGORIES.MIGHT]: 'Might',
    [QUEST_CATEGORIES.KNOWLEDGE]: 'Knowledge',
    [QUEST_CATEGORIES.HONOR]: 'Honor',
    [QUEST_CATEGORIES.CASTLE]: 'Castle',
    [QUEST_CATEGORIES.CRAFT]: 'Craft',
    [QUEST_CATEGORIES.VITALITY]: 'Vitality',
};

export const QUEST_CATEGORY_ICONS: Record<QuestCategory, string> = {
    [QUEST_CATEGORIES.MIGHT]: '⚔️',
    [QUEST_CATEGORIES.KNOWLEDGE]: '📚',
    [QUEST_CATEGORIES.HONOR]: '🛡️',
    [QUEST_CATEGORIES.CASTLE]: '🏰',
    [QUEST_CATEGORIES.CRAFT]: '🔧',
    [QUEST_CATEGORIES.VITALITY]: '❤️',
};

export const QUEST_CATEGORY_COLORS: Record<QuestCategory, { primary: string; secondary: string }> = {
    [QUEST_CATEGORIES.MIGHT]: { primary: 'red', secondary: '#fca5a5' },
    [QUEST_CATEGORIES.KNOWLEDGE]: { primary: 'blue', secondary: '#93c5fd' },
    [QUEST_CATEGORIES.HONOR]: { primary: 'green', secondary: '#86efac' },
    [QUEST_CATEGORIES.CASTLE]: { primary: 'purple', secondary: '#c4b5fd' },
    [QUEST_CATEGORIES.CRAFT]: { primary: 'orange', secondary: '#fdba74' },
    [QUEST_CATEGORIES.VITALITY]: { primary: 'pink', secondary: '#f9a8d4' },
};

// =============================================================================
// Difficulty Levels
// =============================================================================

export const DIFFICULTY_LEVELS = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard',
    EPIC: 'epic',
    LEGENDARY: 'legendary',
} as const;

export type DifficultyLevel = typeof DIFFICULTY_LEVELS[keyof typeof DIFFICULTY_LEVELS];

export const DIFFICULTY_MULTIPLIERS: Record<DifficultyLevel, number> = {
    [DIFFICULTY_LEVELS.EASY]: 0.5,
    [DIFFICULTY_LEVELS.MEDIUM]: 1.0,
    [DIFFICULTY_LEVELS.HARD]: 1.5,
    [DIFFICULTY_LEVELS.EPIC]: 2.0,
    [DIFFICULTY_LEVELS.LEGENDARY]: 3.0,
};

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
    [DIFFICULTY_LEVELS.EASY]: 'Easy',
    [DIFFICULTY_LEVELS.MEDIUM]: 'Medium',
    [DIFFICULTY_LEVELS.HARD]: 'Hard',
    [DIFFICULTY_LEVELS.EPIC]: 'Epic',
    [DIFFICULTY_LEVELS.LEGENDARY]: 'Legendary',
};

export const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
    [DIFFICULTY_LEVELS.EASY]: 'text-green-500',
    [DIFFICULTY_LEVELS.MEDIUM]: 'text-blue-500',
    [DIFFICULTY_LEVELS.HARD]: 'text-orange-500',
    [DIFFICULTY_LEVELS.EPIC]: 'text-purple-500',
    [DIFFICULTY_LEVELS.LEGENDARY]: 'text-amber-500',
};

// =============================================================================
// Experience & Leveling
// =============================================================================

export const XP_CONFIG = {
    BASE_XP_PER_LEVEL: 100,
    LEVEL_SCALING_FACTOR: 1.5,
    MAX_LEVEL: 100,

    // Base rewards
    QUEST_BASE_XP: 50,
    CHALLENGE_BASE_XP: 75,
    MILESTONE_BASE_XP: 200,

    // Streak bonuses (per streak level)
    STREAK_BONUS_PERCENT: 10, // 10% per streak day
    MAX_STREAK_BONUS_PERCENT: 100, // Cap at 100% bonus
};

/**
 * Calculate XP required for a given level
 */
export function getXpForLevel(level: number): number {
    return Math.floor(
        XP_CONFIG.BASE_XP_PER_LEVEL * Math.pow(XP_CONFIG.LEVEL_SCALING_FACTOR, level - 1)
    );
}

/**
 * Calculate level from total XP
 */
export function getLevelFromXp(totalXp: number): number {
    let level = 1;
    while (getXpForLevel(level + 1) <= totalXp && level < XP_CONFIG.MAX_LEVEL) {
        level++;
    }
    return level;
}

// =============================================================================
// Gold & Economy
// =============================================================================

export const GOLD_CONFIG = {
    // Base rewards
    QUEST_BASE_GOLD: 25,
    CHALLENGE_BASE_GOLD: 50,
    MILESTONE_BASE_GOLD: 100,

    // Costs
    TILE_BASIC_COST: 50,
    TILE_RARE_COST: 150,
    TILE_EPIC_COST: 500,
};

// =============================================================================
// Rarity
// =============================================================================

export const RARITY_LEVELS = {
    COMMON: 'common',
    UNCOMMON: 'uncommon',
    RARE: 'rare',
    EPIC: 'epic',
    LEGENDARY: 'legendary',
} as const;

export type RarityLevel = typeof RARITY_LEVELS[keyof typeof RARITY_LEVELS];

export const RARITY_COLORS: Record<RarityLevel, { bg: string; text: string; border: string }> = {
    [RARITY_LEVELS.COMMON]: {
        bg: 'bg-gray-700',
        text: 'text-gray-300',
        border: 'border-gray-600'
    },
    [RARITY_LEVELS.UNCOMMON]: {
        bg: 'bg-green-900/50',
        text: 'text-green-400',
        border: 'border-green-700'
    },
    [RARITY_LEVELS.RARE]: {
        bg: 'bg-blue-900/50',
        text: 'text-blue-400',
        border: 'border-blue-700'
    },
    [RARITY_LEVELS.EPIC]: {
        bg: 'bg-purple-900/50',
        text: 'text-purple-400',
        border: 'border-purple-700'
    },
    [RARITY_LEVELS.LEGENDARY]: {
        bg: 'bg-amber-900/50',
        text: 'text-amber-400',
        border: 'border-amber-700'
    },
};

// =============================================================================
// Time Periods
// =============================================================================

export const TIME_PERIODS = {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    ONCE: 'once',
} as const;

export type TimePeriod = typeof TIME_PERIODS[keyof typeof TIME_PERIODS];

export const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
    [TIME_PERIODS.DAILY]: 'Daily',
    [TIME_PERIODS.WEEKLY]: 'Weekly',
    [TIME_PERIODS.MONTHLY]: 'Monthly',
    [TIME_PERIODS.ONCE]: 'One-time',
};

// =============================================================================
// UI Constants
// =============================================================================

export const UI_CONFIG = {
    // Animation durations (ms)
    ANIMATION_FAST: 150,
    ANIMATION_NORMAL: 300,
    ANIMATION_SLOW: 500,

    // Debounce delays (ms)
    DEBOUNCE_SHORT: 150,
    DEBOUNCE_NORMAL: 300,
    DEBOUNCE_LONG: 500,

    // Toast durations (ms)
    TOAST_SHORT: 3000,
    TOAST_NORMAL: 5000,
    TOAST_LONG: 8000,

    // Pagination
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,

    // Touch targets (px)
    MIN_TOUCH_TARGET: 44,

    // Breakpoints (px) - matching Tailwind
    BREAKPOINT_SM: 640,
    BREAKPOINT_MD: 768,
    BREAKPOINT_LG: 1024,
    BREAKPOINT_XL: 1280,
    BREAKPOINT_2XL: 1536,
};

// =============================================================================
// Local Storage Keys
// =============================================================================

export const STORAGE_KEYS = {
    // User preferences
    USER_PREFERENCES: 'level-up-preferences',
    ONBOARDING_COMPLETE: 'level-up-onboarding-complete',
    THEME: 'level-up-theme',

    // Quest data
    QUESTS_CACHE: 'level-up-quests-cache',
    CHALLENGES_CACHE: 'level-up-challenges-cache',
    MILESTONES_CACHE: 'level-up-milestones-cache',

    // Kingdom data
    REALM_TILES: 'level-up-realm-tiles',
    TILE_INVENTORY: 'level-up-tile-inventory',

    // Sync
    LAST_SYNC: 'level-up-last-sync',
    PENDING_OPERATIONS: 'level-up-pending-operations',

    // Analytics
    SESSION_ID: 'level-up-session-id',
};

// =============================================================================
// API Endpoints (for client-side use)
// =============================================================================

export const API_ENDPOINTS = {
    // Character
    CHARACTER_STATS: '/api/character-stats',
    CHARACTER_TITLES: '/api/character-titles',

    // Quests
    QUESTS: '/api/quests',
    QUESTS_COMPLETE: '/api/quests-complete',

    // Challenges
    CHALLENGES: '/api/challenges',

    // Milestones
    MILESTONES: '/api/milestones',

    // Kingdom
    KINGDOM: '/api/kingdom',
    REALM_DATA: '/api/realm-data',

    // Social
    FRIENDS: '/api/friends',
    ALLIANCES: '/api/alliances',
    LEADERBOARD: '/api/leaderboard',

    // Achievements
    ACHIEVEMENTS: '/api/achievements',

    // Creatures
    CREATURES: '/api/creatures',
    CREATURES_DISCOVER: '/api/creatures/discover',
};

// =============================================================================
// Routes (for navigation)
// =============================================================================

export const ROUTES = {
    HOME: '/',
    KINGDOM: '/kingdom',
    QUESTS: '/quests',
    CHALLENGES: '/quests?tab=challenges',
    MILESTONES: '/quests?tab=milestones',
    PROFILE: '/profile',
    SETTINGS: '/settings',
    SOCIAL: '/social',
    ACHIEVEMENTS: '/achievements',
    INVENTORY: '/inventory',
    CREATURES: '/creatures',
    DESIGN_SYSTEM: '/design-system',

    // Auth
    SIGN_IN: '/sign-in',
    SIGN_UP: '/sign-up',
};
