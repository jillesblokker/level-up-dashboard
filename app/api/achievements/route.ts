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
      return NextResponse.json({ error: 'Unauthorized', logs }, { status: 401 });
    }
    // Fetch all achievements for the user from Supabase
    const { data, error } = await supabase
      .from('achievements')
      .select('achievement_id, unlocked_at, achievement_name, progress, unlocked')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });
    logs.push({ step: 'query', data, error });
    if (error) {
      logs.push({ error: error.message });
      return NextResponse.json({ error: error.message, logs }, { status: 500 });
    }
    const achievements = (data || []).map(row => ({
      achievementId: row.achievement_id,
      unlocked: row.unlocked,
      unlockedAt: row.unlocked_at,
      achievementName: row.achievement_name,
      progress: row.progress,
    }));
    logs.push({ step: 'success', achievementsCount: achievements.length });
    return NextResponse.json(achievements);
  } catch (error) {
    logs.push({ error: (error as Error).message });
    return NextResponse.json({ error: 'Internal server error', logs }, { status: 500 });
  }
} 