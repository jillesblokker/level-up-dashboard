// Test script to check localStorage format
console.log('=== localStorage Debug ===');

// Simulate the character stats manager storage format
function simulateStorage() {
  // Simulate current stats
  const currentStats = {
    gold: 1000,
    experience: 500,
    level: 5,
    health: 100,
    max_health: 100,
    buildTokens: 0
  };
  
  console.log('Current stats to be stored:', currentStats);
  
  // Simulate what gets stored in localStorage
  const localStorageStats = {
    gold: currentStats.gold,
    experience: currentStats.experience,
    level: currentStats.level,
    health: currentStats.health,
    max_health: currentStats.max_health,
    buildTokens: currentStats.buildTokens
  };
  
  console.log('What gets stored in localStorage:', localStorageStats);
  
  // Simulate adding 50 XP
  const newExperience = currentStats.experience + 50;
  const newLevel = calculateLevelFromExperience(newExperience);
  
  console.log('After adding 50 XP:');
  console.log('- New experience:', newExperience);
  console.log('- Calculated level:', newLevel);
  
  const newLocalStorageStats = {
    ...localStorageStats,
    experience: newExperience,
    level: newLevel
  };
  
  console.log('New localStorage stats:', newLocalStorageStats);
}

// Simulate the level calculation
function calculateLevelFromExperience(experience) {
  if (experience < 100) return 1;
  
  let level = 1;
  let totalExpNeeded = 0;
  
  while (true) {
    const levelExp = Math.round(100 * Math.pow(1.15, level - 1));
    totalExpNeeded += levelExp;
    if (experience < totalExpNeeded) {
      return level;
    }
    level++;
  }
}

simulateStorage(); 