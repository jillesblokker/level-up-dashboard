
export const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard', 'epic', 'legendary'] as const;

export type DifficultyLevel = typeof DIFFICULTY_LEVELS[number];

// Rewards based on difficulty level
// Scaling logic based on existing patterns:
// Easy: 50 xp, 10 gold 
// Medium: 100 xp, 25 gold
// Hard: 200 xp, 50 gold
// Epic: 500 xp, 150 gold
// Legendary: 1000 xp, 500 gold

export const DIFFICULTY_REWARDS: Record<DifficultyLevel, { xp: number; gold: number }> = {
    easy: { xp: 50, gold: 10 },
    medium: { xp: 100, gold: 25 },
    hard: { xp: 200, gold: 50 },
    epic: { xp: 500, gold: 150 },
    legendary: { xp: 1000, gold: 500 },
};

export function calculateRewards(difficulty: string): { xp: number; gold: number } {
    // Normalize difficulty string
    const normalizedDifficulty = difficulty.toLowerCase();

    // Check if it's a valid difficulty level
    if (Object.keys(DIFFICULTY_REWARDS).includes(normalizedDifficulty)) {
        return DIFFICULTY_REWARDS[normalizedDifficulty as DifficultyLevel];
    }

    // Default to medium if invalid or missing
    return DIFFICULTY_REWARDS.medium;
}
