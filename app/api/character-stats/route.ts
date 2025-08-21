import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function GET(request: NextRequest) {
  try {
    // Add timeout handling
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 8000); // 8 second timeout
    });

    const queryPromise = authenticatedSupabaseQuery(request, async (supabase, userId) => {
      const { data, error } = await supabase
        .from('character_stats')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      return { data, error };
    });

    // Race between timeout and query
    const result = await Promise.race([queryPromise, timeoutPromise]) as any;

    if (result.error) {
      console.error('[Character Stats API] Error fetching stats:', result.error);
      return NextResponse.json({ error: 'Failed to fetch character stats' }, { status: 500 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('[Character Stats API] Unexpected error:', error);
    
    // Handle timeout specifically
    if (error instanceof Error && error.message === 'Request timeout') {
      return NextResponse.json(
        { error: 'Request timeout - please try again' }, 
        { status: 408 }
      );
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gold, experience, level, health, max_health, build_tokens, kingdom_expansions } = body;

    const { data, error } = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      // Build update payload dynamically to avoid overwriting with defaults
      const updateData: any = {
        user_id: userId,
        updated_at: new Date().toISOString()
      };
      if (gold !== undefined) updateData.gold = gold;
      if (experience !== undefined) updateData.experience = experience;
      if (level !== undefined) updateData.level = level;
      if (health !== undefined) updateData.health = health;
      if (max_health !== undefined) updateData.max_health = max_health;
      if (build_tokens !== undefined) updateData.build_tokens = build_tokens;
      if (kingdom_expansions !== undefined) updateData.kingdom_expansions = kingdom_expansions;

      const { data, error } = await supabase
        .from('character_stats')
        .upsert(updateData, { onConflict: 'user_id' })
        .select()
        .single();
      
      return { data, error };
    });

    if (error) {
      console.error('[Character Stats API] Error updating stats:', error);
      return NextResponse.json({ error: 'Failed to update character stats' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[Character Stats API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 