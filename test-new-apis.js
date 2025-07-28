// Test script to verify all new APIs are working
// Run this in browser console after signing in

async function testNewAPIs() {
  console.log('🧪 Testing new APIs...');
  
  const newAPIs = [
    { name: 'Character Perks', url: '/api/character-perks' },
    { name: 'Character Strengths', url: '/api/character-strengths' },
    { name: 'Character Titles', url: '/api/character-titles' },
    { name: 'Experience Transactions', url: '/api/experience-transactions' },
    { name: 'Gold Transactions', url: '/api/gold-transactions' },
    { name: 'Daily Tasks', url: '/api/daily-tasks' },
    { name: 'Notifications', url: '/api/notifications' },
    { name: 'Kingdom Events', url: '/api/kingdom-events' },
    { name: 'Monster Spawns', url: '/api/monster-spawns' }
  ];
  
  const results = [];
  
  for (const api of newAPIs) {
    try {
      const response = await fetch(api.url, {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      results.push({
        name: api.name,
        status: response.status,
        success: response.ok,
        data: data
      });
      
      console.log(`✅ ${api.name}: ${response.status} - ${response.ok ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      results.push({
        name: api.name,
        status: 'ERROR',
        success: false,
        error: error.message
      });
      
      console.log(`❌ ${api.name}: ERROR - ${error.message}`);
    }
  }
  
  console.log('📊 Test Results:', results);
  console.log('🏁 New API testing complete!');
  
  return results;
}

// Run the test
testNewAPIs(); 