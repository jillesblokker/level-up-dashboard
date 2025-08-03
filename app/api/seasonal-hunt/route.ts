import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!
);

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Load all items for the user
    const { data: items, error } = await supabaseAdmin
      .from('seasonal_hunt')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: items || [] });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, itemId, eventKey } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action required' }, { status: 400 });
    }

    if (action === 'initialize') {
      if (!eventKey) {
        return NextResponse.json({ error: 'Event key required' }, { status: 400 });
      }

      // Create 10 items for the user
      const items = [];
      for (let i = 1; i <= 10; i++) {
        items.push({
          user_id: userId,
          item_id: i,
          event_key: eventKey,
          found: false,
          position: { x: 100 + (i * 50), y: 100 + (i * 30) }
        });
      }

      const { data, error } = await supabaseAdmin
        .from('seasonal_hunt')
        .insert(items)
        .select();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, items: data });

    } else if (action === 'find') {
      if (!itemId) {
        return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
      }

      // Mark item as found
      const { data, error } = await supabaseAdmin
        .from('seasonal_hunt')
        .update({ 
          found: true, 
          found_at: new Date().toISOString() 
        })
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, item: data });

    } else if (action === 'reset') {
      // Delete all items for the user
      const { error } = await supabaseAdmin
        .from('seasonal_hunt')
        .delete()
        .eq('user_id', userId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
} 