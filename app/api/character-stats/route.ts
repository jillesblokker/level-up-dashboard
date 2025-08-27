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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ stats: null });
    }

    // Return the individual columns as stats object
    return NextResponse.json({ 
      stats: {
        gold: data.gold || 0,
        experience: data.experience || 0,
        level: data.level || 1,
        health: data.health || 100,
        max_health: data.max_health || 100,
        build_tokens: data.build_tokens || 0,
        kingdom_expansions: data.kingdom_expansions || 0
      }
    });
  } catch (error) {
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
    console.log('[Character Stats API] Received request body:', body);
    
    const { stats } = body;
    if (!stats || typeof stats !== 'object') {
      console.log('[Character Stats API] Invalid stats data:', stats);
      return NextResponse.json({ error: 'Invalid stats data' }, { status: 400 });
    }

    // Extract individual fields from stats object - match your actual table schema
    const statsData = {
      user_id: userId,
      gold: stats.gold || 0,
      experience: stats.experience || 0,
      level: stats.level || 1,
      health: stats.health || 100,
      max_health: stats.max_health || 100,
      build_tokens: stats.build_tokens || 0,
      character_name: 'Adventurer', // Add missing required field
      updated_at: new Date().toISOString()
    };

    console.log('[Character Stats API] Prepared stats data:', statsData);

    // Upsert the stats data
    const { error } = await supabaseServer
      .from('character_stats')
      .upsert(statsData, {
        onConflict: 'user_id'
      });

    console.log('[Character Stats API] Supabase upsert result:', { error });

    if (error) {
      console.error('[Character Stats API] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Character Stats API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 