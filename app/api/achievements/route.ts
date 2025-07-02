import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: Request) {
  const logs: any[] = [];
  try {
    const { userId } = await auth();
    logs.push({ step: 'auth', userId });
    logs.push({ env: { supabaseUrl: process.env['NEXT_PUBLIC_SUPABASE_URL'], supabaseKeyPresent: !!process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] } });
    if (!userId) {
      logs.push({ error: 'Unauthorized' });
      console.log('[API/ACHIEVEMENTS] Unauthorized', logs);
      return NextResponse.json({ error: 'Unauthorized', logs }, { status: 401 });
    }
    // Fetch all achievements for the user from Supabase
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });
    logs.push({ step: 'query', data, error });
    console.log('[API/ACHIEVEMENTS] data:', data, 'error:', error, 'logs:', logs);
    if (error) {
      logs.push({ error: error.message });
      return NextResponse.json({ error: error.message, logs }, { status: 500 });
    }
    const achievements = (data || []).map(row => ({
      achievementId: row.achievement_id,
      unlockedAt: row.unlocked_at,
      achievementName: row.achievement_name,
      description: row.description,
    }));
    logs.push({ step: 'success', achievementsCount: achievements.length });
    return NextResponse.json(achievements);
  } catch (error) {
    logs.push({ error: (error as Error).message });
    return NextResponse.json({ error: 'Internal server error', logs }, { status: 500 });
  }
} 