import { NextResponse, NextRequest } from 'next/server';
import { supabaseServer } from '../../../../lib/supabase/server-client';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  console.log('[Manual Uncheck] 🚀 API ROUTE CALLED - Starting POST request');
  try {
    const { userId } = await getAuth(req);
    console.log('[Manual Uncheck] 🚀 User ID from auth:', userId);
    if (!userId) {
      console.log('[Manual Uncheck] 🚀 No user ID found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { questId } = await req.json();
    if (!questId) {
      return NextResponse.json({ error: 'Missing questId' }, { status: 400 });
    }

    console.log('[Manual Uncheck] Starting manual uncheck for user:', userId, 'quest:', questId);
    
    // Get TODAY's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    console.log('[Manual Uncheck] 🔍 Today\'s date:', today);
    
    // Find TODAY'S completion record for this quest
    const { data: todayCompletion, error: fetchError } = await supabaseServer
      .from('quest_completion')
      .select('id, quest_id, completed, completed_at, xp_earned, gold_earned')
      .eq('user_id', userId)
      .eq('quest_id', questId)
      .gte('completed_at', `${today}T00:00:00.000Z`)
      .lt('completed_at', `${today}T23:59:59.999Z`)
      .single();

    if (fetchError) {
      console.error('[Manual Uncheck] Error fetching today\'s completion:', fetchError);
      return NextResponse.json({ error: 'No completion record found for today', details: fetchError }, { status: 404 });
    }
    
    if (!todayCompletion) {
      console.log('[Manual Uncheck] No completion record found for today');
      return NextResponse.json({ error: 'No completion record found for today' }, { status: 404 });
    }
    
    console.log('[Manual Uncheck] Found today\'s completion record:', {
      id: todayCompletion.id,
      quest_id: todayCompletion.quest_id,
      completed: todayCompletion.completed,
      completed_at: todayCompletion.completed_at
    });
    
    // Update ONLY today's completion record to completed=false
    const { data: updateResult, error: updateError } = await supabaseServer
      .from('quest_completion')
      .update({ completed: false })
      .eq('id', todayCompletion.id)
      .select();
    
    if (updateError) {
      console.error('[Manual Uncheck] Error updating completion record:', updateError);
      return NextResponse.json({ error: 'Failed to uncheck quest', details: updateError }, { status: 500 });
    }
    
    console.log('[Manual Uncheck] ✅ Successfully unchecked quest for today:', {
      quest_id: questId,
      completion_id: todayCompletion.id,
      completed: updateResult[0].completed,
      preserved_data: {
        completed_at: updateResult[0].completed_at,
        xp_earned: updateResult[0].xp_earned,
        gold_earned: updateResult[0].gold_earned
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Quest unchecked for today - historical data preserved',
      questId: questId,
      completionId: todayCompletion.id,
      completed: false,
      historicalDataPreserved: true,
      timestamp: new Date().toISOString(),
      debugInfo: {
        resetType: 'MANUAL_UNCHECK_TODAY_ONLY',
        apiVersion: '6.0-manual-uncheck-today'
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('[Manual Uncheck] Internal server error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
  }
}
