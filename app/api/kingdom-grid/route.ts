import { logger } from "@/lib/logger";
import { NextResponse } from 'next/server';
import { verifyClerkJWT } from '@/lib/supabase/jwt-verification';
import { supabaseServer } from '@/lib/supabase/server-client';

// GET: Return the kingdom grid for the user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const visitUserId = searchParams.get('userId');
    const authResult = await verifyClerkJWT(request);

    const targetUserId = visitUserId || authResult.userId;
    if (!targetUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseServer
      .from('kingdom_grid')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      logger.error('[Kingdom Grid GET] DB error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ grid: data?.grid_data || null });
  } catch (error) {
    logger.error('[Kingdom Grid GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Save the kingdom grid for the user
export async function POST(request: Request) {
  try {
    const authResult = await verifyClerkJWT(request);
    const userId = authResult.userId;
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