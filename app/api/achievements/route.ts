import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const supabase = createClient(
  supabaseUrl!,
  supabaseKey!
);

export async function GET(request: Request) {
  const logs: any[] = [];
  try {
    const { userId } = await auth();
    logs.push({ step: 'auth', userId });
    logs.push({ env: { supabaseUrl, supabaseKeyPresent: !!supabaseKey } });
    if (!userId) {
      logs.push({ error: 'Unauthorized' });
      return NextResponse.json({ error: 'Unauthorized', logs }, { status: 401 });
    }
    // Fetch all discovered creatures for the user from Supabase
    const { data, error } = await supabase
      .from('DiscoveredCreatures')
      .select('creature_id, discovered_at')
      .eq('user_id', userId)
      .order('discovered_at', { ascending: false });
    logs.push({ step: 'query', data, error });
    if (error) {
      logs.push({ error: error.message });
      return NextResponse.json({ error: error.message, logs }, { status: 500 });
    }
    const achievements = (data || []).map(row => ({
      achievementId: row.creature_id,
      unlocked: true,
      unlockedAt: row.discovered_at,
    }));
    logs.push({ step: 'success', achievementsCount: achievements.length });
    return NextResponse.json(achievements);
  } catch (error) {
    logs.push({ error: (error as Error).message });
    return NextResponse.json({ error: 'Internal server error', logs }, { status: 500 });
  }
} 