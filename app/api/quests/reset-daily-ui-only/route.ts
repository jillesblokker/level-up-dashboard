import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  console.log('[UI-Only Daily Reset] 🚀 API ROUTE CALLED - Starting POST request');
  try {
    const { userId } = await getAuth(req);
    console.log('[UI-Only Daily Reset] 🚀 User ID from auth:', userId);
    if (!userId) {
      console.log('[UI-Only Daily Reset] 🚀 No user ID found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[UI-Only Daily Reset] Starting UI-ONLY daily reset for user:', userId);
    
    // Get TODAY's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    console.log('[UI-Only Daily Reset] 🔍 Today\'s date:', today);
    
    // UI-ONLY RESET: No database operations!
    // The quest completion logic will naturally show quests as incomplete
    // if there's no completed=true record for today
    
    console.log('[UI-Only Daily Reset] ✅ UI-ONLY reset completed - no database changes made');
    console.log('[UI-Only Daily Reset] 💡 Quest display will automatically show quests as incomplete');
    console.log('[UI-Only Daily Reset] 💡 Historical data preserved - all completion records remain intact');
    
    return NextResponse.json({ 
      success: true, 
      message: 'UI-ONLY daily reset completed - quests will show as incomplete for new day',
      questsReset: 0, // No database changes
      challengesReset: 0, // No database changes
      totalCompletedQuests: 0, // No database changes
      historicalDataPreserved: true,
      uiOnlyReset: true,
      timestamp: new Date().toISOString(),
      debugInfo: {
        resetType: 'UI-ONLY',
        databaseChanges: 0,
        apiVersion: '6.0-ui-only-daily-reset'
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('[UI-Only Daily Reset] Internal server error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
  }
}
