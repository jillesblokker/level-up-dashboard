import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
);

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Fetch all discovered creatures for the user from Supabase
    const { data, error } = await supabase
      .from('DiscoveredCreatures')
      .select('creature_id, discovered_at')
      .eq('user_id', userId)
      .order('discovered_at', { ascending: false });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // Return as achievement-like objects
    const achievements = (data || []).map(row => ({
      achievementId: row.creature_id,
      unlocked: true,
      unlockedAt: row.discovered_at,
    }));
    return NextResponse.json(achievements);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 