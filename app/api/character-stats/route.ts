import { NextResponse, NextRequest } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';
import { apiLogger } from '@/lib/logger';
import { calculateLevelFromExperience } from '@/lib/level-utils';

// GET: Return character stats for the user
export async function GET(request: Request) {
  try {
    const result = await authenticatedSupabaseQuery(request as NextRequest, async (supabase, userId) => {
      const { data, error } = await supabase
        .from('character_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        apiLogger.error('Character stats fetch error:', error);
        throw error;
      }

      if (!data) {
        return { stats: null };
      }

      let streakData = null;
      try {
        const { data: fetchedStreakData, error: streakError } = await supabase
          .from('streaks')
          .select('current_streak, last_completed_at')
          .eq('user_id', userId)
          .order('last_completed_at', { ascending: false, nullsFirst: false })
          .limit(1)
          .maybeSingle();

        if (!streakError && fetchedStreakData) {
          streakData = fetchedStreakData;
        }
      } catch (streakErr) {
        apiLogger.warn('Streak fetch failed:', streakErr);
      }

      const statsJson = data.stats_data || {};
      const currentLevel = data.level ?? statsJson.level ?? 1;
      const baseXP = 100;
      const experienceToNextLevel = Math.floor(baseXP * Math.pow(1.5, currentLevel - 1));

      return {
        level: data.level ?? statsJson.level ?? 1,
        experience: data.experience ?? statsJson.experience ?? 0,
        experienceToNextLevel,
        gold: data.gold ?? statsJson.gold ?? 0,
        health: data.health ?? statsJson.health ?? 100,
        maxHealth: data.max_health ?? statsJson.max_health ?? 100,
        buildTokens: data.build_tokens ?? statsJson.build_tokens ?? 0,
        kingdomExpansions: data.kingdom_expansions ?? statsJson.kingdom_expansions ?? 0,
        streakDays: streakData?.current_streak ?? 0,
        stats: {
          ...statsJson,
          gold: data.gold ?? statsJson.gold ?? 0,
          experience: data.experience ?? statsJson.experience ?? 0,
          level: data.level ?? statsJson.level ?? 1,
          health: data.health ?? statsJson.health ?? 100,
          max_health: data.max_health ?? statsJson.max_health ?? 100,
          build_tokens: data.build_tokens ?? statsJson.build_tokens ?? 0,
          kingdom_expansions: data.kingdom_expansions ?? statsJson.kingdom_expansions ?? 0,
          updated_at: data.updated_at ?? statsJson.updated_at,
          active_partner_id: data.active_partner_id ?? statsJson.active_partner_id,
          sanctuary_mode: data.sanctuary_mode ?? statsJson.sanctuary_mode ?? false,
          display_name: data.display_name ?? statsJson.display_name ?? 'Adventurer',
          title: data.title ?? statsJson.title ?? 'Novice'
        }
      };
    });

    return NextResponse.json(result);
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Failed to fetch stats' }, { status: 500 });
  }
}

// POST: Save character stats for the user
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { stats, deltas } = body;
    if (!stats || typeof stats !== 'object') {
      apiLogger.warn('Invalid stats data received');
      return NextResponse.json({ error: 'Invalid stats data' }, { status: 400 });
    }

    const result = await authenticatedSupabaseQuery(request as NextRequest, async (supabase, userId) => {
      apiLogger.debug('Received stats update for user:', userId);

      const statsJson = {
        ...stats,
        updated_at: new Date().toISOString()
      };

      const { data: existingData, error: fetchError } = await supabase
        .from('character_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        apiLogger.error('Error fetching existing stats:', fetchError);
      }

      const existingJson = existingData?.stats_data || {};
      const existingXP = existingData?.experience ?? existingJson.experience ?? 0;
      const existingGold = existingData?.gold ?? existingJson.gold ?? 0;
      const existingExpansions = existingData?.kingdom_expansions ?? existingJson.kingdom_expansions ?? 0;

      const ensureNumber = (val: unknown, fallback: number): number => {
        const num = Number(val);
        return isNaN(num) ? fallback : num;
      };

      let serverGold = 0;
      let serverXP = 0;
      let serverBuildTokens = 0;

      if (Array.isArray(deltas) && deltas.length > 0) {
        let goldDelta = 0;
        let xpDelta = 0;
        let tokensDelta = 0;

        for (const d of deltas) {
          if (d && typeof d === 'object') {
            if (d.stat === 'gold') goldDelta += (Number(d.delta) || 0);
            if (d.stat === 'experience') xpDelta += (Number(d.delta) || 0);
            if (d.stat === 'build_tokens') tokensDelta += (Number(d.delta) || 0);
          }
        }

        serverGold = Math.max(0, ensureNumber(existingGold, 0) + goldDelta);
        serverXP = Math.max(0, ensureNumber(existingXP, 0) + xpDelta);
        serverBuildTokens = Math.max(0, ensureNumber(existingData?.build_tokens, 0) + tokensDelta);
      } else {
        serverGold = Math.max(ensureNumber(stats.gold, 0), ensureNumber(existingGold, 0));
        serverXP = Math.max(ensureNumber(stats.experience, 0), ensureNumber(existingXP, 0));
        serverBuildTokens = ensureNumber(stats.build_tokens ?? existingData?.build_tokens, 0);
      }

      const serverLevel = calculateLevelFromExperience(serverXP);

      const mergedStats: Record<string, unknown> = {
        user_id: userId,
        gold: serverGold,
        experience: serverXP,
        level: serverLevel,
        health: ensureNumber(stats.health ?? existingData?.health, 100),
        max_health: ensureNumber(stats.max_health ?? existingData?.max_health, 100),
        build_tokens: serverBuildTokens,
        updated_at: new Date().toISOString(),
        stats_data: {
          ...existingJson,
          ...statsJson,
          gold: serverGold,
          experience: serverXP,
          level: serverLevel,
          build_tokens: serverBuildTokens,
          kingdom_expansions: Math.max(ensureNumber(stats.kingdom_expansions, 0), ensureNumber(existingExpansions, 0)),
          display_name: stats.display_name || existingData?.display_name || 'Adventurer',
          character_name: stats.display_name || existingData?.character_name || 'Adventurer',
          title: stats.title || existingData?.title || 'Novice',
          ember_essence: Math.max(ensureNumber(stats.ember_essence, 0), ensureNumber(existingJson.ember_essence, 0)),
          frost_essence: Math.max(ensureNumber(stats.frost_essence, 0), ensureNumber(existingJson.frost_essence, 0)),
          tide_essence: Math.max(ensureNumber(stats.tide_essence, 0), ensureNumber(existingJson.tide_essence, 0)),
          verdant_essence: Math.max(ensureNumber(stats.verdant_essence, 0), ensureNumber(existingJson.verdant_essence, 0)),
        }
      };

      const { error } = await supabase
        .from('character_stats')
        .upsert(mergedStats, {
          onConflict: 'user_id'
        });

      if (error) {
        apiLogger.error('Supabase upsert error:', error);
        throw error;
      }

      return { success: true, stats: mergedStats };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    apiLogger.error('Unexpected POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}