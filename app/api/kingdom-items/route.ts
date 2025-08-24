import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

// GET: Return kingdom tile items for the user
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseServer
      .from('kingdom_items')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[Kingdom Items API] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ items: [] });
    }

    return NextResponse.json({
      items: data.items_data || []
    });
  } catch (error) {
    console.error('[Kingdom Items API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Save kingdom tile items for the user
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 400 });
    }

    const { items } = await request.json();
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid items data' }, { status: 400 });
    }

    const itemsData = {
      user_id: userId,
      items_data: items,
      updated_at: new Date().toISOString()
    };

    // Upsert the items data
    const { error } = await supabaseServer
      .from('kingdom_items')
      .upsert(itemsData, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('[Kingdom Items API] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Kingdom Items API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
