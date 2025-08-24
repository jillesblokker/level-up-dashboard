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

    const { data, error } = await supabaseServer
      .from('kingdom_timers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[Kingdom Timers API] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ timers: null });
    }

    return NextResponse.json({
      timers: data.timers_data || {}
    });
  } catch (error) {
    console.error('[Kingdom Timers API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
      console.error('[Kingdom Timers API] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Kingdom Timers API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
