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

    console.log(`[Kingdom Items API] Fetching items for user: ${userId}`);

    const { data, error } = await supabaseServer
      .from('kingdom_items')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('[Kingdom Items API] Supabase error:', error);
      
      // Check if it's a table doesn't exist error
      if (error.code === '42P01') {
        return NextResponse.json({ 
          error: 'Table kingdom_items does not exist. Please run the database migration first.',
          details: error.message,
          code: error.code
        }, { status: 500 });
      }
      
      // Check if it's a no rows returned error
      if (error.code === 'PGRST116') {
        return NextResponse.json({ items: [] });
      }
      
      return NextResponse.json({ 
        error: error.message,
        code: error.code
      }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ items: [] });
    }

    console.log(`[Kingdom Items API] Successfully fetched items for user: ${userId}`);
    return NextResponse.json({
      items: data.items_data || []
    });
  } catch (error) {
    console.error('[Kingdom Items API] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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

    console.log(`[Kingdom Items API] Saving items for user: ${userId}`);

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
      console.error('[Kingdom Items API] Supabase upsert error:', error);
      
      // Check if it's a table doesn't exist error
      if (error.code === '42P01') {
        return NextResponse.json({ 
          error: 'Table kingdom_items does not exist. Please run the database migration first.',
          details: error.message,
          code: error.code
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        error: error.message,
        code: error.code
      }, { status: 500 });
    }

    console.log(`[Kingdom Items API] Successfully saved items for user: ${userId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Kingdom Items API] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
