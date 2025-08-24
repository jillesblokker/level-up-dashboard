import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

// GET: Return kingdom tile states for the user
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseServer
      .from('kingdom_tile_states')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[Kingdom Tile States API] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ states: {} });
    }

    return NextResponse.json({
      states: data.states_data || {}
    });
  } catch (error) {
    console.error('[Kingdom Tile States API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Save kingdom tile states for the user
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 400 });
    }

    const { states } = await request.json();
    if (!states || typeof states !== 'object') {
      return NextResponse.json({ error: 'Invalid states data' }, { status: 400 });
    }

    const statesData = {
      user_id: userId,
      states_data: states,
      updated_at: new Date().toISOString()
    };

    // Upsert the states data
    const { error } = await supabaseServer
      .from('kingdom_tile_states')
      .upsert(statesData, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('[Kingdom Tile States API] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Kingdom Tile States API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
