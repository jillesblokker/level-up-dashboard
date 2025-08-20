import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../../lib/supabase/server-client';

export async function GET(request: Request) {
  try {
    const { userId } = getAuth(request as any);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseServer;

    // 1. Check what tables exist and their row counts
    const tablesToCheck = [
      'challenges',
      'quests', 
      'quest_completion',
      'character_stats'
    ];

    const tableInfo: Record<string, { exists: boolean; count: number; error: string | null }> = {};
    for (const tableName of tablesToCheck) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        tableInfo[tableName] = {
          exists: true,
          count: count || 0,
          error: error?.message || null
        };
      } catch (err) {
        tableInfo[tableName] = {
          exists: false,
          count: 0,
          error: String(err)
        };
      }
    }

    // 2. Get all quest completions
    const { data: completions, error: completionsError } = await supabase
      .from('quest_completion')
      .select('*')
      .eq('user_id', userId);

    // 3. Try to get challenges from different possible table names
    let challenges = null;
    let challengesTableName = null;
    
    // Try 'challenges' first
    let { data: challengesData, error: challengesError } = await supabase
      .from('challenges')
      .select('id, name, title');
    
    if (challengesData && challengesData.length > 0) {
      challenges = challengesData;
      challengesTableName = 'challenges';
    } else {
      // Try 'quests' table
      const { data: questsData, error: questsError } = await supabase
        .from('quests')
        .select('id, name, title');
      
      if (questsData && questsData.length > 0) {
        challenges = questsData;
        challengesTableName = 'quests';
      }
    }

    // 4. Show detailed analysis
    const analysis = completions?.map(completion => {
      const matchingChallengeById = challenges?.find(c => c.id === completion.quest_id);
      const matchingChallengeByName = challenges?.find(c => c.name === completion.quest_id);
      
              return {
          completion_id: completion.id,
          quest_id: completion.quest_id,
          completed: completion.completed,
          completed_at: completion.completed_at,
          matches_by_id: !!matchingChallengeById,
          matches_by_name: !!matchingChallengeByName,
          challenge_id: matchingChallengeById?.id || 'NO MATCH',
          challenge_name: matchingChallengeByName?.name || 'NO MATCH',
          is_completed: completion.completed === true && completion.completed_at !== null,
          // Check for XP and gold fields
          xp_earned: completion.xp_earned,
          gold_earned: completion.gold_earned,
          has_xp: !!completion.xp_earned,
          has_gold: !!completion.gold_earned
        };
    }) || [];

    return NextResponse.json({
      userId,
      table_info: tableInfo,
      challenges_table_name: challengesTableName,
      completions_count: completions?.length || 0,
      challenges_count: challenges?.length || 0,
      analysis,
      sample_completions: completions?.slice(0, 3) || [],
      sample_challenges: challenges?.slice(0, 3) || []
    });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
