import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

// GET: Return character stats for the user
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseServer
      .from('character_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[Character Stats] Fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ stats: null });
    }

    // Return the individual columns as stats object
    // We check both the dedicated column and the stats_data JSONB column
    // This provides a fallback if a column is missing in the schema but exists in the JSON blob
    const statsJson = data.stats_data || {};

    return NextResponse.json({
      stats: {
        gold: data.gold ?? statsJson.gold ?? 0,
        experience: data.experience ?? statsJson.experience ?? 0,
        level: data.level ?? statsJson.level ?? 1,
        health: data.health ?? statsJson.health ?? 100,
        max_health: data.max_health ?? statsJson.max_health ?? 100,
        build_tokens: data.build_tokens ?? statsJson.build_tokens ?? 0,
        kingdom_expansions: data.kingdom_expansions ?? statsJson.kingdom_expansions ?? 0
      }
    });
  } catch (error) {
    console.error('[Character Stats] Unexpected GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Save character stats for the user
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('[Character Stats] Received update for user:', userId);

    const { stats } = body;
    if (!stats || typeof stats !== 'object') {
      console.warn('[Character Stats] Invalid stats data:', stats);
      return NextResponse.json({ error: 'Invalid stats data' }, { status: 400 });
    }

    // Prepare the JSON blob for stats_data
    // This ensures we save all fields even if columns are missing
    const statsJson = {
      ...stats,
      updated_at: new Date().toISOString()
    };

    // Extract individual fields from stats object - match your actual table schema
    // We use a partial object to avoid sending undefined values for columns that might not exist
    const statsData: any = {
      user_id: userId,
      gold: stats.gold || 0,
      experience: stats.experience || 0,
      level: stats.level || 1,
      health: stats.health || 100,
      max_health: stats.max_health || 100,
      build_tokens: stats.build_tokens || 0,
      character_name: 'Adventurer',
      updated_at: new Date().toISOString(),
      stats_data: statsJson // Save everything to the JSONB column as well
    };

    // NOTE: We do NOT try to save kingdom_expansions to a dedicated column here
    // because we found it might be missing in the schema. 
    // It is saved in stats_data instead.

    console.log('[Character Stats] Saving stats...');

    try {
      // Fetch existing stats to prevent regression
      const { data: existingData, error: fetchError } = await supabaseServer
        .from('character_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to handle no rows gracefully

      // Handle fetch errors (but not "no rows" which is expected for new users)
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('[Character Stats] Error fetching existing stats:', fetchError);
        // Continue anyway, treat as new user
      }

      console.log('[Character Stats] Existing data:', {
        hasData: !!existingData,
        level: existingData?.level,
        experience: existingData?.experience,
        statsDataType: typeof existingData?.stats_data
      });

      const existingJson = existingData?.stats_data || {};

      // Safe extraction with defaults
      const existingLevel = existingData?.level ?? existingJson.level ?? 1;
      const existingXP = existingData?.experience ?? existingJson.experience ?? 0;
      const existingExpansions = existingData?.kingdom_expansions ?? existingJson.kingdom_expansions ?? 0;

      console.log('[Character Stats] Extracted existing values:', {
        existingLevel,
        existingXP,
        existingExpansions,
        incomingLevel: stats.level,
        incomingXP: stats.experience
      });

      // Helper to ensure value is a valid number
      const ensureNumber = (val: any, fallback: number = 0) => {
        const num = Number(val);
        return isNaN(num) ? fallback : num;
      };

      // Merge logic: Keep the highest value for progressive stats (Level, XP, Expansions)
      // For volatile stats (Gold, Health), use the new value
      const mergedStats = {
        user_id: userId,
        gold: ensureNumber(stats.gold ?? existingData?.gold, 0),
        experience: Math.max(ensureNumber(stats.experience, 0), ensureNumber(existingXP, 0)),
        level: Math.max(ensureNumber(stats.level, 1), ensureNumber(existingLevel, 1)),
        health: ensureNumber(stats.health ?? existingData?.health, 100),
        max_health: ensureNumber(stats.max_health ?? existingData?.max_health, 100),
        build_tokens: ensureNumber(stats.build_tokens ?? existingData?.build_tokens, 0),
        kingdom_expansions: Math.max(ensureNumber(stats.kingdom_expansions, 0), ensureNumber(existingExpansions, 0)),
        character_name: existingData?.character_name || 'Adventurer',
        updated_at: new Date().toISOString(),
        stats_data: {
          ...existingJson,
          ...statsJson,
          // Ensure progressive stats in JSON are also protected
          experience: Math.max(ensureNumber(stats.experience, 0), ensureNumber(existingXP, 0)),
          level: Math.max(ensureNumber(stats.level, 1), ensureNumber(existingLevel, 1)),
          kingdom_expansions: Math.max(ensureNumber(stats.kingdom_expansions, 0), ensureNumber(existingExpansions, 0)),
        }
      };

      console.log('[Character Stats] Saving stats (merged):', {
        newLevel: mergedStats.level,
        oldLevel: existingLevel,
        newXP: mergedStats.experience,
        oldXP: existingXP
      });

      // Upsert the stats data
      const { error } = await supabaseServer
        .from('character_stats')
        .upsert(mergedStats, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('[Character Stats] Supabase upsert error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } catch (mergeError) {
      console.error('[Character Stats] Error in merge logic:', mergeError);
      return NextResponse.json({
        error: 'Error processing stats merge',
        details: mergeError instanceof Error ? mergeError.message : String(mergeError)
      }, { status: 500 });
    }

    console.log('[Character Stats] Saved successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Character Stats] Unexpected POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}