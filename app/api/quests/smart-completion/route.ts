import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

// Smart Quest Completion API - Uses the intelligent database function
export async function POST(request: NextRequest) {
  console.log('[Smart Quest Completion] 🚀 API ROUTE CALLED - Starting POST request');
  try {
    const { userId } = await getAuth(request);
    console.log('[Smart Quest Completion] 🚀 User ID from auth:', userId);
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
    
    // 🔍 DEBUG: Log the action being performed
    if (completed) {
      console.log('[Smart Quest Completion] 🎯 ACTION: Marking quest as COMPLETED');
    } else {
      console.log('[Smart Quest Completion] 🧹 ACTION: Marking quest as INCOMPLETE (will delete record if exists)');
    }
    
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

    // TEMPORARY FIX: Implement quest completion logic directly instead of using broken database function
    console.log('[Smart Quest Completion] Using direct implementation (bypassing broken function)');
    
    // Validate that the quest exists in either quests OR challenges table
    const { data: questExists, error: questCheckError } = await supabaseServer
      .from('quests')
      .select('id')
      .eq('id', questId)
      .single();
    
    const { data: challengeExists, error: challengeCheckError } = await supabaseServer
      .from('challenges')
      .select('id')
      .eq('id', questId)
      .single();
    
    if (questCheckError && challengeCheckError) {
      console.error('[Smart Quest Completion] Quest not found in either table:', { questId });
      return NextResponse.json({ 
        error: 'Quest not found',
        message: 'The quest you are trying to complete no longer exists in the database',
        questId: questId
      }, { status: 404 });
    }
    
    // Check if completion record already exists
    const { data: existingRecord, error: fetchError } = await supabaseServer
      .from('quest_completion')
      .select('*')
      .eq('user_id', userId)
      .eq('quest_id', questId)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[Smart Quest Completion] Error fetching existing record:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    
    let result;
    
    if (completed) {
      // Mark as completed
      if (!existingRecord) {
        // Insert new completion record
        const { data: insertData, error: insertError } = await supabaseServer
          .from('quest_completion')
          .insert({
            user_id: userId,
            quest_id: questId,
            completed: true,
            xp_earned: xpReward || 50,
            gold_earned: goldReward || 25
          })
          .select()
          .single();
        
        if (insertError) {
          console.error('[Smart Quest Completion] Insert error:', insertError);
          return NextResponse.json({ error: insertError.message }, { status: 500 });
        }
        
        result = {
          success: true,
          action: 'inserted',
          message: 'Quest marked as completed',
          xp_earned: xpReward || 50,
          gold_earned: goldReward || 25
        };
      } else {
        // Update existing record
        const { data: updateData, error: updateError } = await supabaseServer
          .from('quest_completion')
          .update({
            completed: true,
            xp_earned: xpReward || 50,
            gold_earned: goldReward || 25
          })
          .eq('user_id', userId)
          .eq('quest_id', questId)
          .select()
          .single();
        
        if (updateError) {
          console.error('[Smart Quest Completion] Update error:', updateError);
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }
        
        result = {
          success: true,
          action: 'updated',
          message: 'Quest completion updated',
          xp_earned: xpReward || 50,
          gold_earned: goldReward || 25
        };
      }
    } else {
      // Mark as incomplete (delete the record)
      if (existingRecord) {
        const { error: deleteError } = await supabaseServer
          .from('quest_completion')
          .delete()
          .eq('user_id', userId)
          .eq('quest_id', questId);
        
        if (deleteError) {
          console.error('[Smart Quest Completion] Delete error:', deleteError);
          return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }
        
        result = {
          success: true,
          action: 'deleted',
          message: 'Quest marked as incomplete',
          deletedRecord: {
            quest_id: questId,
            user_id: userId
          }
        };
      } else {
        result = {
          success: true,
          action: 'no_change',
          message: 'Quest was already incomplete'
        };
      }
    }
    
    console.log('[Smart Quest Completion] Direct implementation result:', result);
    
    // Return the result
    return NextResponse.json({
      success: true,
      data: result,
      message: 'Quest completion processed directly'
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
export async function GET(request: NextRequest) {
  try {
    const { userId } = await getAuth(request);
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
