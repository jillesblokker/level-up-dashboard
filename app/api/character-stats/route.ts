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

    // Upsert the stats data
    const { error } = await supabaseServer
      .from('character_stats')
      .upsert(statsData, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('[Character Stats] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
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