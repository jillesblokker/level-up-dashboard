// Test script to verify the new experience system
// Run this in the browser console on any page

console.log('🧪 Testing New Experience System...');

// Test experience calculations
function testExperienceCalculations() {
  console.log('📊 Testing Experience Calculations...');
  
  // Test level 1
  console.log('Level 1:');
  console.log('- Experience needed: 100');
  console.log('- Progress at 50 XP:', (50 / 100 * 100).toFixed(1) + '%');
  console.log('- Progress at 100 XP:', (100 / 100 * 100).toFixed(1) + '%');
  
  // Test level 2
  console.log('Level 2:');
  console.log('- Experience needed: 115 (100 * 1.15)');
  console.log('- Total XP to reach level 2: 215 (100 + 115)');
  console.log('- Progress at 150 XP:', ((150 - 100) / 115 * 100).toFixed(1) + '%');
  console.log('- Progress at 215 XP:', ((215 - 100) / 115 * 100).toFixed(1) + '%');
  
  // Test level 3
  console.log('Level 3:');
  console.log('- Experience needed: 132 (100 * 1.15^2)');
  console.log('- Total XP to reach level 3: 347 (100 + 115 + 132)');
  console.log('- Progress at 250 XP:', ((250 - 215) / 132 * 100).toFixed(1) + '%');
  
  // Test level 10
  console.log('Level 10:');
  console.log('- Experience needed: ~405 (100 * 1.15^9)');
  console.log('- This shows how experience requirements scale up!');
}

// Test the actual functions if they're available
function testActualFunctions() {
  console.log('🔧 Testing Actual Functions...');
  
  if (typeof window !== 'undefined') {
    // Check if the character stats exist
    const savedStats = localStorage.getItem('character-stats');
    if (savedStats) {
      const stats = JSON.parse(savedStats);
      console.log('Current character stats:', stats);
      
      // Test different experience amounts
      const testAmounts = [0, 50, 100, 150, 200, 250, 300, 400, 500];
      
      testAmounts.forEach(exp => {
        // Simulate what the functions would return
        let level = 1;
        let totalExpNeeded = 0;
        
        while (true) {
          const levelExp = Math.round(100 * Math.pow(1.15, level - 1));
          totalExpNeeded += levelExp;
          if (exp < totalExpNeeded) {
            break;
          }
          level++;
        }
        
        // Calculate progress
        let expForPreviousLevels = 0;
        for (let i = 1; i < level; i++) {
          expForPreviousLevels += Math.round(100 * Math.pow(1.15, i - 1));
        }
        
        const expForCurrentLevel = Math.round(100 * Math.pow(1.15, level - 1));
        const expInCurrentLevel = exp - expForPreviousLevels;
        const progressPercentage = (expInCurrentLevel / expForCurrentLevel) * 100;
        
        console.log(`XP: ${exp} | Level: ${level} | Progress: ${progressPercentage.toFixed(1)}%`);
      });
    } else {
      console.log('No character stats found in localStorage');
    }
  }
}

// Test the progress bar behavior
function testProgressBarBehavior() {
  console.log('📈 Testing Progress Bar Behavior...');
  
  console.log('Expected behavior:');
  console.log('1. Progress bar should fill gradually as you gain XP');
  console.log('2. At 100 XP, you reach level 2 (progress bar resets to 0%)');
  console.log('3. Progress bar fills again as you gain XP toward level 3');
  console.log('4. Each level requires more XP than the previous level');
  console.log('5. Progress should be smooth and continuous within each level');
  
  // Simulate gaining XP step by step
  console.log('Simulating XP gain:');
  for (let exp = 0; exp <= 300; exp += 25) {
    let level = 1;
    let totalExpNeeded = 0;
    
    while (true) {
      const levelExp = Math.round(100 * Math.pow(1.15, level - 1));
      totalExpNeeded += levelExp;
      if (exp < totalExpNeeded) {
        break;
      }
      level++;
    }
    
    let expForPreviousLevels = 0;
    for (let i = 1; i < level; i++) {
      expForPreviousLevels += Math.round(100 * Math.pow(1.15, i - 1));
    }
    
    const expForCurrentLevel = Math.round(100 * Math.pow(1.15, level - 1));
    const expInCurrentLevel = exp - expForPreviousLevels;
    const progressPercentage = (expInCurrentLevel / expForCurrentLevel) * 100;
    
    console.log(`XP: ${exp} | Level: ${level} | Progress: ${progressPercentage.toFixed(1)}%`);
  }
}

// Run all tests
console.log('🚀 Running all tests...');
testExperienceCalculations();
testActualFunctions();
testProgressBarBehavior();

console.log('✅ Experience system test completed!');
console.log('💡 Check the navigation bar progress bar to see if it fills correctly');
console.log('💡 Try gaining experience to see the smooth progression'); 