import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';
import { authenticatedSupabaseQuery, authenticatedFriendQuery } from '@/lib/supabase/jwt-verification';

// GET: Return the kingdom grid for the user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const visitUserId = searchParams.get('userId');

    const result = await (visitUserId
      ? authenticatedFriendQuery(request, visitUserId, async (supabase, userId) => {
        const { data, error } = await supabase
          .from('kingdom_grid')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        return { grid: data?.grid_data || null };
      })
      : authenticatedSupabaseQuery(request, async (supabase, userId) => {
        const { data, error } = await supabase
          .from('kingdom_grid')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        return { grid: data?.grid_data || null };
      })
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.error?.includes('Forbidden') ? 403 : 401 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Kingdom Grid GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Save the kingdom grid for the user
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { grid } = await request.json();
    if (!grid || !Array.isArray(grid)) {
      return NextResponse.json({ error: 'Invalid grid data' }, { status: 400 });
    }

    // Upsert the grid data
    const { error } = await supabaseServer
      .from('kingdom_grid')
      .upsert({
        user_id: userId,
        grid_data: grid,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}