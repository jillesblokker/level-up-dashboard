import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';
import { logger } from '@/lib/logger';

// Game data API route - persists and fetches game data (e.g. realmMap)
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ realmMap: null }, { status: 200 });
    }

    const { data, error } = await supabaseServer
      .from('user_preferences')
      .select('preference_value')
      .eq('user_id', userId)
      .eq('preference_key', 'game_data_realm_map')
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      logger.warn('[Game Data API] Failed to fetch game data preference:', error);
    }

    return NextResponse.json({
      success: true,
      realmMap: data?.preference_value || null,
    });
  } catch (error: any) {
    logger.error('[Game Data API] GET Error:', error);
    return NextResponse.json({ success: false, realmMap: null, error: error?.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const realmMap = body?.realmMap;

    if (!realmMap) {
      return NextResponse.json({ error: 'Missing realmMap in payload' }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from('user_preferences')
      .upsert({
        user_id: userId,
        preference_key: 'game_data_realm_map',
        preference_value: realmMap,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,preference_key',
      });

    if (error) {
      logger.error('[Game Data API] Upsert error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Game data synchronized successfully',
    });
  } catch (error: any) {
    logger.error('[Game Data API] POST Error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Internal server error' }, { status: 500 });
  }
}