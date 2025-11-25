// Test quest completion system
// Run this in browser console to test quest completion

async function testQuestCompletion() {
  console.log('🧪 Testing Quest Completion System...');
  
  try {
    // 1. Get current quests
    console.log('📋 Fetching quests...');
    const questsResponse = await fetch(`/api/quests?t=${Date.now()}&r=${Math.random()}`, {
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('clerk-db-jwt') || ''}`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    const quests = await questsResponse.json();
    console.log('Quests:', quests.length, 'items');
    
    if (quests.length === 0) {
      console.log('❌ No quests found');
      return;
    }
    
    // 2. Find a quest to test with
    const testQuest = quests[0];
    console.log('🎯 Testing with quest:', testQuest.name);
    console.log('Current completion status:', testQuest.completed);
    
    // 3. Toggle the quest
    const newStatus = !testQuest.completed;
    console.log('🔄 Toggling to:', newStatus);
    
    const toggleResponse = await fetch('/api/quests/completion', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('clerk-db-jwt') || ''}`,
      },
      body: JSON.stringify({
        questId: testQuest.id,
        completed: newStatus
      })
    });
    
    if (!toggleResponse.ok) {
      const errorText = await toggleResponse.text();
      console.log('❌ Toggle failed:', toggleResponse.status, errorText);
      return;
    }
    
    const toggleResult = await toggleResponse.json();
    console.log('✅ Toggle successful:', toggleResult);
    
    // 4. Verify the change
    console.log('🔍 Verifying change...');
    const verifyResponse = await fetch(`/api/quests?t=${Date.now()}&r=${Math.random()}`, {
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('clerk-db-jwt') || ''}`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    const verifyQuests = await verifyResponse.json();
    const updatedQuest = verifyQuests.find(q => q.id === testQuest.id);
    
    console.log('Updated quest status:', updatedQuest?.completed);
    console.log('Expected status:', newStatus);
    
    if (updatedQuest?.completed === newStatus) {
      console.log('✅ SUCCESS: Quest completion is working!');
    } else {
      console.log('❌ FAILURE: Quest completion not working');
    }
    
    // 5. Toggle back to original state
    console.log('🔄 Restoring original state...');
    const restoreResponse = await fetch('/api/quests/completion', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('clerk-db-jwt') || ''}`,
      },
      body: JSON.stringify({
        questId: testQuest.id,
        completed: testQuest.completed
      })
    });
    
    if (restoreResponse.ok) {
      console.log('✅ Restored to original state');
    } else {
      console.log('⚠️ Failed to restore original state');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testQuestCompletion();
