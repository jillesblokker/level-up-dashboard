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

    console.log(`[Kingdom Tile States API] Fetching states for user: ${userId}`);

    const { data, error } = await supabaseServer
      .from('kingdom_tile_states')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('[Kingdom Tile States API] Supabase error:', error);
      
      // Check if it's a table doesn't exist error
      if (error.code === '42P01') {
        return NextResponse.json({ 
          error: 'Table kingdom_tile_states does not exist. Please run the database migration first.',
          details: error.message,
          code: error.code
        }, { status: 500 });
      }
      
      // Check if it's a no rows returned error
      if (error.code === 'PGRST116') {
        return NextResponse.json({ states: {} });
      }
      
      return NextResponse.json({ 
        error: error.message,
        code: error.code
      }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ states: {} });
    }

    console.log(`[Kingdom Tile States API] Successfully fetched states for user: ${userId}`);
    return NextResponse.json({
      states: data.states_data || {}
    });
  } catch (error) {
    console.error('[Kingdom Tile States API] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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

    console.log(`[Kingdom Tile States API] Saving states for user: ${userId}`);

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
      console.error('[Kingdom Tile States API] Supabase upsert error:', error);
      
      // Check if it's a table doesn't exist error
      if (error.code === '42P01') {
        return NextResponse.json({ 
          error: 'Table kingdom_tile_states does not exist. Please run the database migration first.',
          details: error.message,
          code: error.code
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        error: error.message,
        code: error.code
      }, { status: 500 });
    }

    console.log(`[Kingdom Tile States API] Successfully saved states for user: ${userId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Kingdom Tile States API] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
