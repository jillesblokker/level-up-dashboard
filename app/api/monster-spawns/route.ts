import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: monsters, error } = await supabaseServer
      .from('monster_spawns')
      .select('*')
      .eq('user_id', userId)
      .eq('defeated', false);

    if (error) {
      console.error('[monster-spawns] Error fetching monsters:', error);
      return NextResponse.json({ error: 'Failed to fetch monsters' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: monsters || []
    });
  } catch (err) {
    console.error('[monster-spawns] Error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}