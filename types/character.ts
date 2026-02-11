export interface CharacterStats {
  level: number;
  experience: number;
  experienceToNextLevel: number;
  gold: number;
  ascension_level?: number;
  titles: {
    equipped: string;
    unlocked: number;
    total: number;
  };
  perks: {
    active: number;
    total: number;
  };
}

export interface ExperienceGain {
  amount: number;
  source: string;
}

export interface Perk {
  id: string
  name: string
  description: string
  category: string
  effect: string
  level: number
  maxLevel: number
  unlocked: boolean
  equipped: boolean
  active: boolean
  upgradeCost: number // Gold cost to upgrade
  activationCost: number // Gold cost to activate
  requiredLevel: number // Level required to unlock this perk
  lastActivated?: string // ISO string of last activation time
  expiresAt?: string // ISO string of when perk expires
}

// Experience required for each level (increases by 15% each level)
export const calculateExperienceForLevel = (level: number): number => {
  // Base experience is 100 for level 1
  const baseExperience = 100;
  // Calculate experience needed for this specific level with 15% increase per level
  return Math.round(baseExperience * Math.pow(1.15, level - 1));
};

// Calculate total experience needed to reach a specific level
export const calculateTotalExperienceForLevel = (level: number): number => {
  let totalExp = 0;
  for (let i = 1; i <= level; i++) {
    totalExp += calculateExperienceForLevel(i);
  }
  return totalExp;
};

// Calculate level from total experience
export const calculateLevelFromExperience = (experience: number): number => {
  if (experience < 100) return 1;

  let level = 1;
  let totalExpNeeded = 0;

  while (true) {
    totalExpNeeded += calculateExperienceForLevel(level);
    if (experience < totalExpNeeded) {
      return level;
    }
    level++;
  }
};

// Calculate progress to next level (0-100 for percentage display)
export const calculateLevelProgress = (experience: number): number => {
  const currentLevel = calculateLevelFromExperience(experience);

  // If experience is 0, return 0 progress
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
};

// Calculate experience needed for next level
export const calculateExperienceToNextLevel = (experience: number): number => {
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
};

// Get experience breakdown for debugging
export const getExperienceBreakdown = (experience: number) => {
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
}; 