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

export interface PrestigeInfo {
  isPrestige: boolean;
  rank: number;
  roman: string;
  title: string;
  badgeLabel: string;
  crestBorderClass: string;
  glowEffectClass: string;
  multiplier: number;
  multiplierLabel: string;
  currentLevel: number;
  nextPrestigeLevel: number;
  progressToNextPrestige: number;
}

/**
 * Calculate Level 100 Prestige tier and visual Paragon crest properties
 * @param level - Player character level
 * @returns Prestige information object
 */
export function getPrestigeData(level: number): PrestigeInfo {
  const currentLevel = Math.max(1, level || 1);
  const rank = Math.floor(currentLevel / 100);
  const isPrestige = rank >= 1;

  const toRoman = (num: number): string => {
    const lookup: Record<string, number> = { X: 10, IX: 9, V: 5, IV: 4, I: 1 };
    let roman = '';
    for (const i in lookup) {
      while (num >= lookup[i]!) {
        roman += i;
        num -= lookup[i]!;
      }
    }
    return roman || 'I';
  };

  const roman = isPrestige ? toRoman(rank) : '';
  const nextPrestigeLevel = (rank + 1) * 100;
  const prevPrestigeLevel = rank * 100;
  const progressToNextPrestige = Math.min(100, Math.max(0, ((currentLevel - prevPrestigeLevel) / 100) * 100));

  let title = 'Sovereign Pioneer';
  let crestBorderClass = 'border-amber-400';
  let glowEffectClass = 'shadow-[0_0_12px_rgba(245,158,11,0.3)]';

  if (rank === 1) {
    title = 'Paragon Sovereign';
    crestBorderClass = 'border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.7)] ring-2 ring-amber-300/60';
    glowEffectClass = 'shadow-[0_0_25px_rgba(245,158,11,0.8)]';
  } else if (rank === 2) {
    title = 'Eternal Luminary';
    crestBorderClass = 'border-cyan-400 shadow-[0_0_22px_rgba(34,211,238,0.75)] ring-2 ring-cyan-300/60';
    glowEffectClass = 'shadow-[0_0_28px_rgba(34,211,238,0.85)]';
  } else if (rank >= 3) {
    title = 'Mythic Sovereign';
    crestBorderClass = 'border-purple-400 shadow-[0_0_25px_rgba(192,132,252,0.85)] ring-2 ring-purple-300/70';
    glowEffectClass = 'shadow-[0_0_32px_rgba(192,132,252,0.95)]';
  }

  const multiplier = 1 + rank * 0.10;
  const multiplierLabel = `+${rank * 10}% Gold & EXP`;

  return {
    isPrestige,
    rank,
    roman,
    title,
    badgeLabel: isPrestige ? `Prestige ${roman}` : `Level ${currentLevel}`,
    crestBorderClass,
    glowEffectClass,
    multiplier,
    multiplierLabel,
    currentLevel,
    nextPrestigeLevel,
    progressToNextPrestige
  };
}
