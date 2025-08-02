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
    console.log('[API] POST /rare-tiles - userId:', userId);
    
    if (!userId) {
      console.log('[API] POST /rare-tiles - Unauthorized: no userId');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, tileId } = await request.json();
    console.log('[API] POST /rare-tiles - action:', action, 'tileId:', tileId);

    if (action === 'unlock') {
      // First check if the record exists
      const { data: existingData, error: selectError } = await supabaseAdmin
        .from('rare_tiles')
        .select('*')
        .eq('user_id', userId)
        .eq('tile_id', tileId)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('[API] Error checking existing rare tile:', selectError);
      }

      if (existingData) {
        console.log('[API] Updating existing rare tile record');
        // Update existing record
        const { error } = await supabaseAdmin
          .from('rare_tiles')
          .update({
            unlocked: true,
            quantity: 1,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('tile_id', tileId);

        if (error) {
          console.error('[API] Error updating rare tile:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      } else {
        console.log('[API] Inserting new rare tile record');
        // Insert new record without relying on auto-increment
        const { error } = await supabaseAdmin
          .from('rare_tiles')
          .insert({
            user_id: userId,
            tile_id: tileId,
            unlocked: true,
            quantity: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error('[API] Error inserting rare tile:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }

      console.log('[API] Successfully unlocked rare tile:', tileId);
      return NextResponse.json({ success: true });
    }

    if (action === 'clear') {
      console.log('[API] Clearing rare tile:', tileId);
      const { error } = await supabaseAdmin
        .from('rare_tiles')
        .delete()
        .eq('user_id', userId)
        .eq('tile_id', tileId);

      if (error) {
        console.error('[API] Error clearing rare tile:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log('[API] Successfully cleared rare tile:', tileId);
      return NextResponse.json({ success: true });
    }

    console.log('[API] Invalid action:', action);
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[API] POST /rare-tiles error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    console.log('[API] GET /rare-tiles - userId:', userId);
    
    if (!userId) {
      console.log('[API] GET /rare-tiles - Unauthorized: no userId');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[API] Loading rare tiles for user:', userId);
    const { data, error } = await supabaseAdmin
      .from('rare_tiles')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('[API] Error loading rare tiles:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[API] Successfully loaded rare tiles:', data);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('[API] GET /rare-tiles error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 