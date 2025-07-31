// Data recovery utility
// This helps restore lost game data

export interface GameData {
  characterStats?: any;
  questProgress?: any;
  challengeProgress?: any;
  milestoneProgress?: any;
  kingdomGrid?: any;
  onboardingState?: any;
}

/**
 * Attempts to recover game data from various sources
 */
export function attemptDataRecovery(): GameData | null {
  const recoveredData: GameData = {};
  
  try {
    // Check if we have any backup data
    const backupData = localStorage.getItem('game-data-backup');
    if (backupData) {
      const parsed = JSON.parse(backupData);
      console.log('[Data Recovery] Found backup data:', parsed);
      return parsed;
    }
    
    // Check for individual data pieces
    const characterStats = localStorage.getItem('character-stats');
    if (characterStats) {
      recoveredData.characterStats = JSON.parse(characterStats);
    }
    
    const onboardingState = localStorage.getItem('onboarding-state');
    if (onboardingState) {
      recoveredData.onboardingState = JSON.parse(onboardingState);
    }
    
    // Check for kingdom grid data
    const kingdomGrid = localStorage.getItem('kingdom-grid');
    if (kingdomGrid) {
      recoveredData.kingdomGrid = JSON.parse(kingdomGrid);
    }
    
    // Check for quest progress
    const questProgress = localStorage.getItem('quest-progress');
    if (questProgress) {
      recoveredData.questProgress = JSON.parse(questProgress);
    }
    
    // Check for challenge progress
    const challengeProgress = localStorage.getItem('challenge-progress');
    if (challengeProgress) {
      recoveredData.challengeProgress = JSON.parse(challengeProgress);
    }
    
    // Check for milestone progress
    const milestoneProgress = localStorage.getItem('milestone-progress');
    if (milestoneProgress) {
      recoveredData.milestoneProgress = JSON.parse(milestoneProgress);
    }
    
    // If we found any data, return it
    if (Object.keys(recoveredData).length > 0) {
      console.log('[Data Recovery] Recovered data:', recoveredData);
      return recoveredData;
    }
    
  } catch (error) {
    console.error('[Data Recovery] Error during recovery:', error);
  }
  
  return null;
}

/**
 * Creates a backup of current game data
 */
export function createDataBackup(): void {
  try {
    const backupData: GameData = {};
    
    // Backup character stats
    const characterStats = localStorage.getItem('character-stats');
    if (characterStats) {
      backupData.characterStats = JSON.parse(characterStats);
    }
    
    // Backup onboarding state
    const onboardingState = localStorage.getItem('onboarding-state');
    if (onboardingState) {
      backupData.onboardingState = JSON.parse(onboardingState);
    }
    
    // Backup kingdom grid
    const kingdomGrid = localStorage.getItem('kingdom-grid');
    if (kingdomGrid) {
      backupData.kingdomGrid = JSON.parse(kingdomGrid);
    }
    
    // Backup quest progress
    const questProgress = localStorage.getItem('quest-progress');
    if (questProgress) {
      backupData.questProgress = JSON.parse(questProgress);
    }
    
    // Backup challenge progress
    const challengeProgress = localStorage.getItem('challenge-progress');
    if (challengeProgress) {
      backupData.challengeProgress = JSON.parse(challengeProgress);
    }
    
    // Backup milestone progress
    const milestoneProgress = localStorage.getItem('milestone-progress');
    if (milestoneProgress) {
      backupData.milestoneProgress = JSON.parse(milestoneProgress);
    }
    
    // Save backup
    localStorage.setItem('game-data-backup', JSON.stringify(backupData));
    console.log('[Data Recovery] Backup created:', backupData);
    
  } catch (error) {
    console.error('[Data Recovery] Error creating backup:', error);
  }
}

/**
 * Restores game data from backup
 */
export function restoreDataFromBackup(): boolean {
  try {
    const recoveredData = attemptDataRecovery();
    if (!recoveredData) {
      return false;
    }
    
    // Restore character stats
    if (recoveredData.characterStats) {
      localStorage.setItem('character-stats', JSON.stringify(recoveredData.characterStats));
    }
    
    // Restore onboarding state
    if (recoveredData.onboardingState) {
      localStorage.setItem('onboarding-state', JSON.stringify(recoveredData.onboardingState));
    }
    
    // Restore kingdom grid
    if (recoveredData.kingdomGrid) {
      localStorage.setItem('kingdom-grid', JSON.stringify(recoveredData.kingdomGrid));
    }
    
    // Restore quest progress
    if (recoveredData.questProgress) {
      localStorage.setItem('quest-progress', JSON.stringify(recoveredData.questProgress));
    }
    
    // Restore challenge progress
    if (recoveredData.challengeProgress) {
      localStorage.setItem('challenge-progress', JSON.stringify(recoveredData.challengeProgress));
    }
    
    // Restore milestone progress
    if (recoveredData.milestoneProgress) {
      localStorage.setItem('milestone-progress', JSON.stringify(recoveredData.milestoneProgress));
    }
    
    console.log('[Data Recovery] Data restored successfully');
    return true;
    
  } catch (error) {
    console.error('[Data Recovery] Error restoring data:', error);
    return false;
  }
} 