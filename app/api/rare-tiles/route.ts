import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

// Create a Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!
);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, tileId } = await request.json();

    if (action === 'unlock') {
      const { error } = await supabaseAdmin
        .from('rare_tiles')
        .upsert({
          user_id: userId,
          tile_id: tileId,
          unlocked: true,
          quantity: 1,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,tile_id' });

      if (error) {
        console.error('Error unlocking rare tile:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'clear') {
      const { error } = await supabaseAdmin
        .from('rare_tiles')
        .delete()
        .eq('user_id', userId)
        .eq('tile_id', tileId);

      if (error) {
        console.error('Error clearing rare tile:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('rare_tiles')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error loading rare tiles:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 