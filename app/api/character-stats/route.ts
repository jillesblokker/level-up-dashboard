import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      const { data, error } = await supabase
        .from('character_stats')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      return { data, error };
    });

    if (error) {
      console.error('[Character Stats API] Error fetching stats:', error);
      return NextResponse.json({ error: 'Failed to fetch character stats' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[Character Stats API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gold, experience, level, health, max_health } = body;

    const { data, error } = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      const { data, error } = await supabase
        .from('character_stats')
        .upsert({
          user_id: userId,
          gold: gold || 0,
          experience: experience || 0,
          level: level || 1,
          health: health || 100,
          max_health: max_health || 100,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id' // Use the column name instead of constraint name
        })
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