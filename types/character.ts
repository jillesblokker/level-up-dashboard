export interface CharacterStats {
  level: number;
  experience: number;
  experienceToNextLevel: number;
  gold: number;
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

// Experience required for each level (increases by 10% each level)
export const calculateExperienceForLevel = (level: number): number => {
  // Base experience is 100
  const baseExperience = 100;
  // Calculate total experience needed with 10% increase per level
  return Math.round(baseExperience * Math.pow(1.1, level - 1));
};

// Calculate level from total experience
export const calculateLevelFromExperience = (experience: number): number => {
  if (experience < 100) return 1;
  
  // Find the level where total experience is less than next level requirement
  let level = 1;
  let totalExpNeeded = 0;
  
  while (true) {
    const nextLevelExp = calculateExperienceForLevel(level);
    totalExpNeeded += nextLevelExp;
    
    if (experience < totalExpNeeded) {
      return level;
    }
    level++;
  }
};

// Calculate progress to next level (0-1)
export const calculateLevelProgress = (experience: number): number => {
  const currentLevel = calculateLevelFromExperience(experience);
  
  // If experience is 0, return 0 progress
  if (experience === 0) return 0;
  
  let expForPreviousLevels = 0;
  
  // Calculate experience needed for previous levels
  for (let i = 1; i < currentLevel; i++) {
    expForPreviousLevels += calculateExperienceForLevel(i);
  }
  
  // Calculate experience needed for current level
  const expForCurrentLevel = calculateExperienceForLevel(currentLevel);
  
  // Calculate progress within current level
  const progressInCurrentLevel = experience - expForPreviousLevels;
  
  // Return progress as a percentage (0-1)
  return Math.max(0, Math.min(1, progressInCurrentLevel / expForCurrentLevel));
};

// Calculate experience needed for next level
export const calculateExperienceToNextLevel = (experience: number): number => {
  const currentLevel = calculateLevelFromExperience(experience);
  let expForPreviousLevels = 0;
  
  // Calculate experience needed for previous levels
  for (let i = 1; i < currentLevel; i++) {
    expForPreviousLevels += calculateExperienceForLevel(i);
  }
  
  // Calculate experience needed for current level
  const expForCurrentLevel = calculateExperienceForLevel(currentLevel);
  
  // Return remaining experience needed
  return expForCurrentLevel - (experience - expForPreviousLevels);
}; 