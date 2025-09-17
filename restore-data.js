// Script to restore September 16th quest completion data
// This will call the restoration API endpoint

const RESTORE_API_URL = 'https://lvlup.jillesblokker.com/api/restore-september-16-data';

async function restoreData() {
  try {
    console.log('🚀 Starting restoration of September 16th quest completion data...');
    
    const response = await fetch(RESTORE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    console.log('✅ Restoration completed successfully!');
    console.log('📊 Results:', {
      restored: result.restored,
      totalXP: result.totalXP,
      totalGold: result.totalGold,
      quests: result.restoredQuests
    });
    
    console.log('🎯 Your Kingdom Stats for September 16th should now show all completed quests!');
    
  } catch (error) {
    console.error('❌ Restoration failed:', error.message);
  }
}

// Run the restoration
restoreData();
