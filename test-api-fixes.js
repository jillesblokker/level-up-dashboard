// Test script to verify API fixes work
// Run this in browser console to test the APIs

async function testAPIs() {
  console.log('🧪 Testing API fixes...');
  
  // Test quest favorites API
  try {
    const favoritesResponse = await fetch('/api/quests/favorites');
    const favoritesData = await favoritesResponse.json();
    console.log('✅ Quest favorites API:', favoritesResponse.status, favoritesData);
  } catch (error) {
    console.error('❌ Quest favorites API failed:', error);
  }
  
  // Test kingdom grid API
  try {
    const gridResponse = await fetch('/api/kingdom-grid');
    const gridData = await gridResponse.json();
    console.log('✅ Kingdom grid API:', gridResponse.status, gridData);
  } catch (error) {
    console.error('❌ Kingdom grid API failed:', error);
  }
  
  console.log('🏁 API testing complete!');
}

// Run the test
testAPIs(); 