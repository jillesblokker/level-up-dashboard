import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../lib/supabase/server-client';

// GET: Fetch the user's grid from realm_map
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data, error } = await supabaseServer
      .from('realm_map')
      .select('grid')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') { // PGRST116: No rows found
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ grid: data?.grid ?? null });
  } catch (error) {
    console.error('[REALM][GET] Internal server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Upsert the user's grid in realm_map
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { grid } = await request.json();
    if (!grid) {
      return NextResponse.json({ error: 'Grid is required' }, { status: 400 });
    }
    const { error } = await supabaseServer
      .from('realm_map')
      .upsert([
        { user_id: userId, grid, updated_at: new Date().toISOString() }
      ], { onConflict: 'user_id' });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[REALM][POST] Internal server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 