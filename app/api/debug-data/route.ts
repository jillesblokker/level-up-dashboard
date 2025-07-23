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

    return NextResponse.json({
      userId,
      userIdType: typeof userId,
      favorites: {
        data: favoritesData,
        error: favoritesError?.message,
        count: favoritesData?.length || 0
      },
      kingdomGrid: {
        data: gridData,
        error: gridError?.message,
        count: gridData?.length || 0
      }
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 });
  }
} 