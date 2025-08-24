import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

// GET: Return kingdom tile timers for the user
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[Kingdom Timers API] Fetching timers for user: ${userId}`);

    const { data, error } = await supabaseServer
      .from('kingdom_timers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('[Kingdom Timers API] Supabase error:', error);
      
      // Check if it's a table doesn't exist error
      if (error.code === '42P01') {
        return NextResponse.json({ 
          error: 'Table kingdom_timers does not exist. Please run the database migration first.',
          details: error.message,
          code: error.code
        }, { status: 500 });
      }
      
      // Check if it's a no rows returned error
      if (error.code === 'PGRST116') {
        return NextResponse.json({ timers: null });
      }
      
      return NextResponse.json({ 
        error: error.message,
        code: error.code
      }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ timers: null });
    }

    console.log(`[Kingdom Timers API] Successfully fetched timers for user: ${userId}`);
    return NextResponse.json({
      timers: data.timers_data || {}
    });
  } catch (error) {
    console.error('[Kingdom Timers API] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST: Save kingdom tile timers for the user
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 400 });
    }

    const { timers } = await request.json();
    if (!timers || typeof timers !== 'object') {
      return NextResponse.json({ error: 'Invalid timers data' }, { status: 400 });
    }

    console.log(`[Kingdom Timers API] Saving timers for user: ${userId}`);

    const timersData = {
      user_id: userId,
      timers_data: timers,
      updated_at: new Date().toISOString()
    };

    // Upsert the timers data
    const { error } = await supabaseServer
      .from('kingdom_timers')
      .upsert(timersData, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('[Kingdom Timers API] Supabase upsert error:', error);
      
      // Check if it's a table doesn't exist error
      if (error.code === '42P01') {
        return NextResponse.json({ 
          error: 'Table kingdom_timers does not exist. Please run the database migration first.',
          details: error.message,
          code: error.code
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        error: error.message,
        code: error.code
      }, { status: 500 });
    }

    console.log(`[Kingdom Timers API] Successfully saved timers for user: ${userId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Kingdom Timers API] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
