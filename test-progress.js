// Test script to verify experience and gold systems are working
// Run this in the browser console on the realm page

console.log('🧪 Testing Experience and Gold Systems...');

// Test 1: Check if kingdom events are properly initialized
console.log('📊 Checking kingdom events initialization...');
if (typeof window !== 'undefined') {
  // Test gold gain
  console.log('💰 Testing gold gain...');
  window.dispatchEvent(new CustomEvent('kingdom:goldGained', {
    detail: { amount: 50, source: 'test', timestamp: new Date() }
  }));
  
  // Test experience gain
  console.log('⭐ Testing experience gain...');
  window.dispatchEvent(new CustomEvent('kingdom:experienceGained', {
    detail: { amount: 25, source: 'test', timestamp: new Date() }
  }));
  
  // Test quest completion
  console.log('📜 Testing quest completion...');
  window.dispatchEvent(new CustomEvent('kingdom:questCompleted', {
    detail: { questName: 'Test Quest', source: 'test', timestamp: new Date() }
  }));
}

// Test 2: Check localStorage for tracking data
console.log('💾 Checking localStorage for tracking data...');
const timeSeriesData = localStorage.getItem('kingdom-time-series-data');
const characterStats = localStorage.getItem('character-stats');

console.log('Time series data:', timeSeriesData ? JSON.parse(timeSeriesData) : 'No data');
console.log('Character stats:', characterStats ? JSON.parse(characterStats) : 'No data');

// Test 3: Simulate actual function calls
console.log('🎯 Testing actual function calls...');

// Test gold gain function
if (typeof gainGold === 'function') {
  console.log('Testing gainGold function...');
  gainGold(100, 'test-script');
} else {
  console.log('gainGold function not available');
}

// Test experience gain function
if (typeof gainExperience === 'function') {
  console.log('Testing gainExperience function...');
  gainExperience(50, 'test-script', 'general');
} else {
  console.log('gainExperience function not available');
}

console.log('✅ Test completed! Check the kingdom page for updated progress.'); 