import { logger } from "@/lib/logger";
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, grid, itemId, x, y, tileName } = await request.json();

    if (!grid || !Array.isArray(grid) || grid.length === 0) {
      return NextResponse.json({ error: 'Invalid grid data' }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    // 1. If action is 'place', we must verify and decrement inventory first
    if (action === 'place') {
      if (!itemId) return NextResponse.json({ error: 'itemId required for place' }, { status: 400 });
      
      const { data: invItem, error: fetchErr } = await supabaseServer
        .from('inventory_items')
        .select('quantity, id')
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .single();

      if (fetchErr || !invItem || invItem.quantity < 1) {
        return NextResponse.json({ error: 'Not enough items in inventory' }, { status: 400 });
      }

      // Decrement inventory
      const newQty = invItem.quantity - 1;
      if (newQty <= 0) {
        // Technically we can leave it at 0, but standard inventory managers usually keep 0 or delete. 
        // We'll update it to 0 so it stays in the list but unplaceable.
        await supabaseServer.from('inventory_items').update({ quantity: 0 }).eq('id', invItem.id);
      } else {
        await supabaseServer.from('inventory_items').update({ quantity: newQty }).eq('id', invItem.id);
      }
      
      // Log placement
      supabaseServer.from('kingdom_event_log').insert([{
        user_id: userId,
        event_type: 'tile_placed',
        related_id: itemId,
        amount: null,
        context: { kind: 'tile-placed', tileId: itemId, tileName, x, y },
        created_at: new Date().toISOString(),
      }]).then(); // fire-and-forget
    }

    // 2. If action is 'stash', we must increment inventory
    if (action === 'stash') {
      if (!itemId) return NextResponse.json({ error: 'itemId required for stash' }, { status: 400 });

      const { data: invItem } = await supabaseServer
        .from('inventory_items')
        .select('quantity, id')
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .single();

      if (invItem) {
        await supabaseServer.from('inventory_items').update({ quantity: (invItem.quantity || 0) + 1 }).eq('id', invItem.id);
      } else {
        // Try to insert if it's completely missing
        await supabaseServer.from('inventory_items').insert({
          user_id: userId,
          item_id: itemId,
          name: tileName || 'Restored Item',
          type: 'item',
          category: 'building',
          quantity: 1
        });
      }
      
      // Log stash
      supabaseServer.from('kingdom_event_log').insert([{
        user_id: userId,
        event_type: 'tile_stashed',
        related_id: itemId,
        amount: null,
        context: { kind: 'tile-stashed', tileId: itemId, tileName, x, y },
        created_at: new Date().toISOString(),
      }]).then(); // fire-and-forget
    }
    
    // For 'move', we just log it
    if (action === 'move') {
      supabaseServer.from('kingdom_event_log').insert([{
        user_id: userId,
        event_type: 'tile_moved',
        related_id: itemId || 'unknown',
        context: { kind: 'tile-moved', tileName, newX: x, newY: y },
        created_at: new Date().toISOString(),
      }]).then();
    }

    // 3. Save the new grid array to database
    // Upsert the grid data
    const { error: saveError } = await supabaseServer
      .from('kingdom_grid')
      .upsert({
        user_id: userId,
        grid_data: grid,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (saveError) {
      logger.error('[Kingdom Grid Action] Error saving grid:', saveError);
      return NextResponse.json({ error: saveError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('[Kingdom Grid Action] Internal error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
