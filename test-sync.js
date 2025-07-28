// Test script to verify character stats synchronization
console.log('=== Character Stats Synchronization Test ===');

// Simulate the character stats manager
function getCharacterStats() {
  try {
    const stored = localStorage.getItem('character-stats');
    if (stored) {
      const stats = JSON.parse(stored);
      return {
        gold: stats.gold || 0,
        experience: stats.experience || 0,
        level: stats.level || 1,
        health: stats.health || 100,
        max_health: stats.max_health || 100,
        build_tokens: stats.buildTokens || 0,
        kingdom_expansions: parseInt(localStorage.getItem('kingdom-grid-expansions') || '0', 10)
      };
    }
  } catch (error) {
    console.warn('Error getting stats:', error);
  }

  return {
    gold: 0,
    experience: 0,
    level: 1,
    health: 100,
    max_health: 100,
    build_tokens: 0,
    kingdom_expansions: 0
  };
}

// Simulate level calculation
function calculateLevelFromExperience(experience) {
  let level = 1;
  let totalExpNeeded = 0;
  
  while (true) {
    const levelExp = Math.round(100 * Math.pow(1.15, level - 1));
    totalExpNeeded += levelExp;
    if (experience < totalExpNeeded) {
      break;
    }
    level++;
  }
  
  return level;
}

// Test the synchronization
console.log('1. Testing character stats manager...');
const stats = getCharacterStats();
console.log('Raw stats from manager:', stats);

console.log('2. Testing level calculation...');
const calculatedLevel = calculateLevelFromExperience(stats.experience);
console.log('Experience:', stats.experience);
console.log('Calculated level:', calculatedLevel);
console.log('Stored level:', stats.level);

console.log('3. Testing synchronization...');
if (calculatedLevel === stats.level) {
  console.log('✅ Level calculation is synchronized!');
} else {
  console.log('❌ Level calculation mismatch!');
  console.log('Expected level:', calculatedLevel);
  console.log('Actual level:', stats.level);
}

console.log('4. Testing gold synchronization...');
console.log('Gold from manager:', stats.gold); 