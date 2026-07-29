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
  ember_essence?: number;
  frost_essence?: number;
  tide_essence?: number;
  verdant_essence?: number;
  focus_points?: number;
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

import {
  calculateExperienceForLevel,
  calculateTotalExperienceForLevel,
  calculateLevelFromExperience,
  calculateLevelProgress,
  calculateExperienceToNextLevel
} from '@/lib/level-utils';

export {
  calculateExperienceForLevel,
  calculateTotalExperienceForLevel,
  calculateLevelFromExperience,
  calculateLevelProgress,
  calculateExperienceToNextLevel
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