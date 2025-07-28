// Test script to debug level calculation issue
console.log('=== Level Calculation Debug ===');

// Simulate the correct level calculation from @/types/character
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

// Test different experience values
const testValues = [0, 50, 100, 150, 200, 250, 300, 400, 500, 1000];

console.log('Testing level calculations:');
testValues.forEach(exp => {
  const level = calculateLevelFromExperience(exp);
  console.log(`Experience: ${exp} -> Level: ${level}`);
});

// Test the specific issue - what happens when we add experience?
console.log('\n=== Testing Experience Addition ===');
let currentExp = 500;
let currentLevel = calculateLevelFromExperience(currentExp);
console.log(`Starting: ${currentExp} XP -> Level ${currentLevel}`);

// Add 50 XP (typical quest reward)
const newExp = currentExp + 50;
const newLevel = calculateLevelFromExperience(newExp);
console.log(`After +50 XP: ${newExp} XP -> Level ${newLevel}`);

if (newLevel < currentLevel) {
  console.log('❌ PROBLEM: Level went backwards!');
} else if (newLevel > currentLevel) {
  console.log('✅ SUCCESS: Level increased!');
} else {
  console.log('⚠️  No level change');
}

// Test the experience calculation for each level
console.log('\n=== Experience Requirements ===');
for (let level = 1; level <= 10; level++) {
  const expNeeded = Math.round(100 * Math.pow(1.15, level - 1));
  console.log(`Level ${level}: ${expNeeded} XP needed`);
} 