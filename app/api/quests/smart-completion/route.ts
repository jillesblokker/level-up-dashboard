import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

// Smart Quest Completion API - Uses the intelligent database function
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      console.error('[Smart Quest Completion] Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('[Smart Quest Completion] Request body:', body);
    
    const { questId, completed, xpReward, goldReward } = body;
    
    if (!questId || typeof completed !== 'boolean') {
      console.error('[Smart Quest Completion] Invalid request data:', { questId, completed });
      return NextResponse.json({ error: 'Missing questId or completed' }, { status: 400 });
    }

    console.log('[Smart Quest Completion] Processing quest:', { userId, questId, completed, xpReward, goldReward });
    console.log('[Smart Quest Completion] Quest ID type:', typeof questId, 'Length:', questId?.length, 'Format:', questId);
    console.log('[Smart Quest Completion] User ID type:', typeof userId, 'Length:', userId?.length, 'Format:', userId);
    
    // 🔍 VALIDATION LOGGING - Check if user ID is Clerk format
    const isClerkUserId = userId?.startsWith('user_');
    const isUUIDFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId || '');
    console.log('[Smart Quest Completion] 🔍 User ID Analysis:', {
      isClerkUserId,
      isUUIDFormat,
      userIdFormat: isClerkUserId ? 'CLERK_TEXT' : isUUIDFormat ? 'UUID' : 'UNKNOWN'
    });
    
    // 🔍 VALIDATION LOGGING - Check if quest ID is UUID format
    const isQuestUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(questId || '');
    console.log('[Smart Quest Completion] 🔍 Quest ID Analysis:', {
      isQuestUUID,
      questIdFormat: isQuestUUID ? 'UUID' : 'TEXT'
    });

    // Use the smart database function with correct schema handling
    const rpcParams = {
      p_user_id: userId,        // user_id is TEXT in quest_completion table
      p_quest_id: questId,      // quest_id will be converted to UUID in function
      p_completed: completed,
      p_xp_reward: xpReward || 50,
      p_gold_reward: goldReward || 25
    };
    
    console.log('[Smart Quest Completion] RPC params:', rpcParams);
    
    const { data, error } = await supabaseServer.rpc('smart_quest_completion', rpcParams);
    
    if (error) {
      console.error('[Smart Quest Completion] Database function error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('[Smart Quest Completion] Smart function result:', data);
    
    // Check if the function returned an error
    if (data && data.success === false) {
      console.error('[Smart Quest Completion] Function returned error:', data);
      return NextResponse.json({ 
        error: data.message || 'Smart quest completion failed',
        details: data.error || 'Unknown function error'
      }, { status: 500 });
    }
    
    // Return the smart function result
    return NextResponse.json({
      success: true,
      data: data,
      message: 'Quest completion processed intelligently'
    });

  } catch (error) {
    console.error('[Smart Quest Completion] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Get quest completion status using the clean view
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      console.error('[Smart Quest Completion] Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const questId = searchParams.get('questId');

    if (questId) {
      // Get specific quest completion
      const { data, error } = await supabaseServer
        .from('clean_quest_completions')
        .select('*')
        .eq('user_id', userId)
        .eq('quest_id', questId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('[Smart Quest Completion] Fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        completed: !!data,
        completion: data || null
      });
    } else {
      // Get all quest completions for user
      const { data, error } = await supabaseServer
        .from('clean_quest_completions')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('[Smart Quest Completion] Fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        completions: data || [],
        count: data?.length || 0
      });
    }

  } catch (error) {
    console.error('[Smart Quest Completion] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
