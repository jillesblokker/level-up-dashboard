// Test milestone completion system
// Run this in browser console to test milestone completion

async function testMilestoneCompletion() {
  console.log('🧪 Testing Milestone Completion System...');
  
  try {
    // 1. Get current milestones
    console.log('📋 Fetching milestones...');
    const milestonesResponse = await fetch('/api/milestones');
    const milestones = await milestonesResponse.json();
    console.log('Milestones:', milestones.length, 'items');
    
    if (milestones.length === 0) {
      console.log('❌ No milestones found');
      return;
    }
    
    // 2. Find a milestone to test with
    const testMilestone = milestones[0];
    console.log('🎯 Testing with milestone:', testMilestone.name);
    console.log('Current completion status:', testMilestone.completed);
    
    // 3. Toggle the milestone
    const newStatus = !testMilestone.completed;
    console.log('🔄 Toggling to:', newStatus);
    
    const toggleResponse = await fetch('/api/milestones', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('clerk-db-jwt') || ''}`,
      },
      body: JSON.stringify({
        milestoneId: testMilestone.id,
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
    const verifyResponse = await fetch('/api/milestones');
    const verifyMilestones = await verifyResponse.json();
    const updatedMilestone = verifyMilestones.find(m => m.id === testMilestone.id);
    
    console.log('Updated milestone status:', updatedMilestone?.completed);
    console.log('Expected status:', newStatus);
    
    if (updatedMilestone?.completed === newStatus) {
      console.log('✅ SUCCESS: Milestone completion is working!');
    } else {
      console.log('❌ FAILURE: Milestone completion not working');
    }
    
    // 5. Toggle back to original state
    console.log('🔄 Restoring original state...');
    const restoreResponse = await fetch('/api/milestones', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('clerk-db-jwt') || ''}`,
      },
      body: JSON.stringify({
        milestoneId: testMilestone.id,
        completed: testMilestone.completed
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
testMilestoneCompletion();
