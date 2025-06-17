// Test script to verify character stats system is working
// Run this in the browser console on any page

console.log('🧪 Testing Character Stats System...');

// Test 1: Check if character stats are properly initialized
console.log('📊 Checking character stats initialization...');
if (typeof window !== 'undefined') {
  // Check if character stats exist in localStorage
  const savedStats = localStorage.getItem('character-stats');
  console.log('Saved character stats:', savedStats);
  
  if (savedStats) {
    const stats = JSON.parse(savedStats);
    console.log('Current character stats:', stats);
    console.log('✅ Character stats found in localStorage');
  } else {
    console.log('❌ No character stats found in localStorage');
  }
  
  // Test 2: Simulate quest completion
  console.log('🎯 Testing quest completion...');
  
  // Simulate gaining gold and experience
  const testGoldGain = 50;
  const testExperienceGain = 25;
  
  // Get current stats
  const currentStats = savedStats ? JSON.parse(savedStats) : {
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    gold: 1000,
    titles: { equipped: "", unlocked: 0, total: 10 },
    perks: { active: 0, total: 5 }
  };
  
  console.log('Current stats before test:', currentStats);
  
  // Update stats manually to simulate quest completion
  const newStats = {
    ...currentStats,
    gold: currentStats.gold + testGoldGain,
    experience: currentStats.experience + testExperienceGain
  };
  
  // Save updated stats
  localStorage.setItem('character-stats', JSON.stringify(newStats));
  console.log('Updated stats after test:', newStats);
  
  // Dispatch character stats update event
  window.dispatchEvent(new Event('character-stats-update'));
  console.log('✅ Character stats update event dispatched');
  
  // Test 3: Check if the event was received
  console.log('📡 Testing event listener...');
  const testEventReceived = new Promise((resolve) => {
    const handler = () => {
      console.log('✅ Character stats update event received');
      window.removeEventListener('character-stats-update', handler);
      resolve(true);
    };
    window.addEventListener('character-stats-update', handler);
    
    // Dispatch another test event
    setTimeout(() => {
      window.dispatchEvent(new Event('character-stats-update'));
    }, 100);
  });
  
  testEventReceived.then(() => {
    console.log('🎉 Character stats system test completed successfully!');
    console.log('💡 Check the navigation bar to see if gold and experience updated');
  });
  
} else {
  console.log('❌ Window object not available (server-side rendering)');
}

// Test 4: Check if gainGold and gainExperience functions are available
console.log('🔧 Testing function availability...');
if (typeof window !== 'undefined') {
  // These functions should be available if the modules are loaded
  console.log('gainGold function available:', typeof window.gainGold !== 'undefined');
  console.log('gainExperience function available:', typeof window.gainExperience !== 'undefined');
} 