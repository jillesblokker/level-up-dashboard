import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check quest favorites
    const { data: favoritesData, error: favoritesError } = await supabaseServer
      .from('quest_favorites')
      .select('*')
      .eq('user_id', userId);

    // Check kingdom grid
    const { data: gridData, error: gridError } = await supabaseServer
      .from('kingdom_grid')
      .select('*')
      .eq('user_id', userId);

    // Test inserting a debug record
    const { data: insertData, error: insertError } = await supabaseServer
      .from('quest_favorites')
      .insert({
        user_id: userId,
        quest_id: 'debug-test-' + Date.now(),
        favorited_at: new Date().toISOString()
      })
      .select();

    // Clean up the test record
    if (insertData && insertData.length > 0) {
      await supabaseServer
        .from('quest_favorites')
        .delete()
        .eq('id', insertData[0].id);
    }

    return NextResponse.json({
      userId,
      userIdType: typeof userId,
      userIdLength: userId.length,
      isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId),
      favorites: {
        data: favoritesData,
        error: favoritesError?.message,
        count: favoritesData?.length || 0,
        insertTest: {
          success: !insertError,
          error: insertError?.message,
          data: insertData
        }
      },
      kingdomGrid: {
        data: gridData,
        error: gridError?.message,
        count: gridData?.length || 0
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ error: 'Debug failed', details: error }, { status: 500 });
  }
} 