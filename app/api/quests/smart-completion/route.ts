import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';
import { calculateLevelFromExperience } from '@/lib/level-utils';

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

    // 🚀 SERVER-SIDE REWARD VERIFICATION
    console.log('[Smart Quest Completion] Verifying rewards server-side...');

    // 1. Fetch quest/challenge details (Source of Truth)
    const { data: questData, error: questError } = await supabaseServer
      .from('quests')
      .select('id, xp_reward, gold_reward, category')
      .eq('id', questId)
      .maybeSingle();

    const { data: challengeData, error: challengeError } = !questData ? await supabaseServer
      .from('challenges')
      .select('id, xp, gold, category')
      .eq('id', questId)
      .maybeSingle() : { data: null, error: null };

    if (!questData && !challengeData) {
      console.error('[Smart Quest Completion] Quest/Challenge not found:', { questId });
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }

    // Determine base rewards
    const targetData = questData || challengeData;
    let baseXP = questData ? questData.xp_reward : (challengeData?.xp || 50);
    let baseGold = questData ? questData.gold_reward : (challengeData?.gold || 25);
    const category = targetData?.category?.toLowerCase() || 'general';

    // 2. Fetch User's Daily Fate (Tarot) from DB
    const { data: prefData } = await supabaseServer
      .from('user_preferences')
      .select('preferences')
      .eq('user_id', userId)
      .maybeSingle();

    const preferences = prefData?.preferences || {};
    const dailyFate = preferences.daily_fate;
    const todayStr = new Date().toISOString().split('T')[0];

    let verifiedXP = baseXP;
    let verifiedGold = baseGold;

    // Apply Tarot multipliers if they drawn a card today
    if (dailyFate && dailyFate.date === todayStr && dailyFate.card) {
      const effect = dailyFate.card.effect;
      let applyBonus = false;

      if (effect.type === 'xp_boost' || effect.type === 'gold_boost' || effect.type === 'mixed') {
        applyBonus = true;
      } else if (effect.type === 'category_boost' && effect.category && category) {
        if (category.includes(effect.category.toLowerCase())) {
          applyBonus = true;
        }
      }

      if (applyBonus) {
        if (effect.xpMultiplier) verifiedXP = Math.floor(verifiedXP * effect.xpMultiplier);
        if (effect.goldMultiplier) verifiedGold = Math.floor(verifiedGold * effect.goldMultiplier);
      }
    }

    console.log('[Smart Quest Completion] Verified Rewards:', { baseXP, baseGold, verifiedXP, verifiedGold, category });

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
        const { error: insertError } = await supabaseServer
          .from('quest_completion')
          .insert({
            user_id: userId,
            quest_id: questId,
            completed: true,
            completed_at: new Date().toISOString(),
            xp_earned: verifiedXP,
            gold_earned: verifiedGold
          });

        if (insertError) {
          console.error('[Smart Quest Completion] Insert error:', insertError);
          return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        result = { success: true, action: 'inserted', xp_earned: verifiedXP, gold_earned: verifiedGold };
      } else {
        // Update existing record
        const { error: updateError } = await supabaseServer
          .from('quest_completion')
          .update({
            completed: true,
            completed_at: new Date().toISOString(),
            xp_earned: verifiedXP,
            gold_earned: verifiedGold
          })
          .eq('user_id', userId)
          .eq('quest_id', questId);

        if (updateError) {
          console.error('[Smart Quest Completion] Update error:', updateError);
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        result = { success: true, action: 'updated', xp_earned: verifiedXP, gold_earned: verifiedGold };
      }

      // 3. Update character stats (Verified amounts only)
      const { data: currentStats, error: statsFetchError } = await supabaseServer
        .from('character_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!statsFetchError && currentStats) {
        const newXp = (currentStats.experience || 0) + verifiedXP;
        const newGold = (currentStats.gold || 0) + verifiedGold;
        const newLevel = calculateLevelFromExperience(newXp);

        await supabaseServer
          .from('character_stats')
          .update({
            experience: newXp,
            gold: newGold,
            level: Math.max(newLevel, currentStats.level || 1),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      }
    } else {
      // Uncomplete: Revoke exactly what was earned if it was recent
      if (existingRecord) {
        const revokedXP = existingRecord.xp_earned || baseXP;
        const revokedGold = existingRecord.gold_earned || baseGold;

        await supabaseServer
          .from('quest_completion')
          .delete()
          .eq('user_id', userId)
          .eq('quest_id', questId);

        // Revoke stats
        const { data: currentStats } = await supabaseServer
          .from('character_stats')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (currentStats) {
          await supabaseServer
            .from('character_stats')
            .update({
              experience: Math.max(0, (currentStats.experience || 0) - revokedXP),
              gold: Math.max(0, (currentStats.gold || 0) - revokedGold),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
        }

        result = { success: true, action: 'deleted' };
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      verifiedRewards: completed ? { xp: verifiedXP, gold: verifiedGold } : null
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
