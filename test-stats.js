// Test script to check character stats
console.log('=== Character Stats Test ===');

// Simulate browser environment
if (typeof window === 'undefined') {
  global.window = {};
  global.localStorage = {
    getItem: (key) => {
      console.log(`Getting ${key} from localStorage`);
      return null;
    },
    setItem: (key, value) => {
      console.log(`Setting ${key} in localStorage:`, value);
    }
  };
}

// Test the character stats manager
const { getCharacterStats } = require('./lib/character-stats-manager.ts');

try {
  const stats = getCharacterStats();
  console.log('Current character stats:', stats);
} catch (error) {
  console.error('Error getting character stats:', error);
} 