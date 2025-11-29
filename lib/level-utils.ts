/**
 * Centralized level calculation utilities
 * This ensures consistency between client and server
 */

// Base experience for level 1
const BASE_EXPERIENCE = 100;

// Experience multiplier per level (15% increase)
const LEVEL_MULTIPLIER = 1.15;

// Maximum level to prevent infinite loops
const MAX_LEVEL = 1000;

/**
 * Calculate experience required for a specific level
 * @param level - The level to calculate experience for
 * @returns Experience required for that level
 */
export function calculateExperienceForLevel(level: number): number {
    return Math.round(BASE_EXPERIENCE * Math.pow(LEVEL_MULTIPLIER, level - 1));
}

/**
 * Calculate total experience needed to reach a specific level
 * @param level - The target level
 * @returns Total cumulative experience needed
 */
export function calculateTotalExperienceForLevel(level: number): number {
    let totalExp = 0;
    for (let i = 1; i <= level; i++) {
        totalExp += calculateExperienceForLevel(i);
    }
    return totalExp;
}

/**
 * Calculate current level from total experience
 * This is the canonical implementation used everywhere
 * @param experience - Total experience points
 * @returns Current level
 */
export function calculateLevelFromExperience(experience: number): number {
    if (experience < BASE_EXPERIENCE) return 1;

    let level = 1;
    let totalExpNeeded = 0;

    while (level < MAX_LEVEL) {
        totalExpNeeded += calculateExperienceForLevel(level);
        if (experience < totalExpNeeded) {
            return level;
        }
        level++;
    }

    return MAX_LEVEL;
}

/**
 * Calculate progress to next level (0-100 for percentage display)
 * @param experience - Total experience points
 * @returns Progress percentage (0-100)
 */
export function calculateLevelProgress(experience: number): number {
    const currentLevel = calculateLevelFromExperience(experience);

    if (experience === 0) return 0;

    // Calculate total experience needed for previous levels
    let expForPreviousLevels = 0;
    for (let i = 1; i < currentLevel; i++) {
        expForPreviousLevels += calculateExperienceForLevel(i);
    }

    // Calculate experience needed for current level
    const expForCurrentLevel = calculateExperienceForLevel(currentLevel);

    // Calculate experience gained in current level
    const expInCurrentLevel = experience - expForPreviousLevels;

    // Calculate progress as percentage (0-100)
    const progressPercentage = (expInCurrentLevel / expForCurrentLevel) * 100;

    return Math.max(0, Math.min(100, progressPercentage));
}

/**
 * Calculate experience needed for next level
 * @param experience - Total experience points
 * @returns Experience points needed to reach next level
 */
export function calculateExperienceToNextLevel(experience: number): number {
    const currentLevel = calculateLevelFromExperience(experience);

    // Calculate total experience needed for previous levels
    let expForPreviousLevels = 0;
    for (let i = 1; i < currentLevel; i++) {
        expForPreviousLevels += calculateExperienceForLevel(i);
    }

    // Calculate experience needed for current level
    const expForCurrentLevel = calculateExperienceForLevel(currentLevel);

    // Calculate experience gained in current level
    const expInCurrentLevel = experience - expForPreviousLevels;

    // Return remaining experience needed for current level
    return Math.max(0, expForCurrentLevel - expInCurrentLevel);
}

/**
 * Get detailed experience breakdown for debugging
 * @param experience - Total experience points
 * @returns Detailed breakdown object
 */
export function getExperienceBreakdown(experience: number) {
    const currentLevel = calculateLevelFromExperience(experience);
    let expForPreviousLevels = 0;

    for (let i = 1; i < currentLevel; i++) {
        expForPreviousLevels += calculateExperienceForLevel(i);
    }

    const expForCurrentLevel = calculateExperienceForLevel(currentLevel);
    const expInCurrentLevel = experience - expForPreviousLevels;
    const progressPercentage = calculateLevelProgress(experience);

    return {
        currentLevel,
        totalExperience: experience,
        experienceForCurrentLevel: expForCurrentLevel,
        experienceInCurrentLevel: expInCurrentLevel,
        experienceForPreviousLevels: expForPreviousLevels,
        progressPercentage,
        experienceToNextLevel: calculateExperienceToNextLevel(experience)
    };
}
