import { logger } from "@/lib/logger";
import { NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const itemId = searchParams.get('itemId');
    const equipped = searchParams.get('equipped');

    // Add timeout handling
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 10000); // 10 second timeout
    });

    const queryPromise = (async () => {
      let query = supabaseServer
        .from('inventory_items')
        .select('*')
        .eq('user_id', userId);

      // Apply filters based on query parameters
      if (type) {
        query = query.eq('type', type);
      }
      if (category) {
        query = query.eq('category', category);
      }
      if (itemId) {
        query = query.eq('item_id', itemId);
        const { data, error } = await query.maybeSingle();
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        return data ? {
          ...data,
          id: data.item_id,
          equipped: data.equipped,
          stats: data.stats || {},
        } : null;
      }
      if (equipped === 'true') {
        query = query.eq('equipped', true);
      } else if (equipped === 'false') {
        query = query.eq('equipped', false);
      }

      const { data, error } = await query;
      if (error) {
        throw error;
      }

      const formatItemName = (name: string, id: string) => {
        if (name.includes(' ') && /^[A-Z]/.test(name)) return name;
        const source = (id && !id.startsWith('kingdom-tile-')) ? id : name;
        return source
          .replace(/^(material|item|artifact|scroll|potion)-/i, '')
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      };

      const resolveItemImage = (row: any) => {
        if (row.image &&
          row.image.startsWith('/images/') &&
          !row.image.includes('placeholder') &&
          !row.image.includes('mystery-item')) {
          return row.image;
        }

        const type = row.type || 'item';
        const rawId = (row.item_id && !row.item_id.startsWith('kingdom-tile-')) ? row.item_id : row.name;
        const id = rawId.toLowerCase().trim().replace(/\s+/g, '-');

        if (id.startsWith('material-')) return `/images/items/materials/${id}.webp`;
        if (id.startsWith('fish-')) return `/images/items/food/${id}.webp`;
        if (id.startsWith('potion-')) return `/images/items/potion/${id}.webp`;
        if (id.startsWith('sword-')) return `/images/items/sword/${id}.webp`;
        if (id.startsWith('armor-')) return `/images/items/armor/${id}.webp`;
        if (id.startsWith('shield-')) return `/images/items/shield/${id}.webp`;
        if (id.startsWith('scroll-')) return `/images/items/scroll/${id}.webp`;

        let folder = type;
        switch (type) {
          case 'weapon': folder = 'sword'; break;
          case 'resource': folder = 'materials'; break;
          case 'mount': folder = 'horse'; break;
          case 'food': folder = 'food'; break;
          case 'artifact':
            if (id.includes('ring')) folder = 'artifact/ring';
            else if (id.includes('crown')) folder = 'artifact/crown';
            else folder = 'artifact';
            break;
        }

        return `/images/items/${folder}/${id}.webp`;
      };

      return (data || []).map((row: any) => ({
        ...row,
        id: row.item_id,
        name: formatItemName(row.name, row.item_id),
        image: resolveItemImage(row),
        equipped: row.equipped,
        stats: row.stats || {},
      }));
    })();

    // Race between timeout and query
    const result = await Promise.race([queryPromise, timeoutPromise]) as any;

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('[Inventory API] GET Error:', error);

    // Handle timeout specifically
    if (error instanceof Error && error.message === 'Request timeout') {
      return NextResponse.json(
        { error: 'Request timeout - please try again' },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { item } = body;

    if (!item || !item.id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    // Set RLS context (optional but good practice)
    try {
      await supabaseServer.rpc('public.set_user_context', { user_id: userId });
    } catch (e) {
      // Ignore RPC error if it doesn't exist
    }

    // Check if item exists
    const { data: existing, error: fetchError } = await supabaseServer
      .from('inventory_items')
      .select('*')
      .eq('user_id', userId)
      .eq('item_id', item.id)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      logger.error('Error fetching inventory item:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (existing) {
      // Update quantity
      const { data, error: updateError } = await supabaseServer
        .from('inventory_items')
        .update({ quantity: existing.quantity + (item.quantity || 1) })
        .eq('user_id', userId)
        .eq('item_id', item.id)
        .select()
        .single();

      if (updateError) {
        logger.error('Error updating inventory item:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, data });
    } else {
      // Insert new item
      const { data, error: insertError } = await supabaseServer
        .from('inventory_items')
        .insert({
          user_id: userId,
          item_id: item.id,
          name: item.name || 'Unknown Item',
          type: item.type || 'item',
          category: item.category || item.type || 'misc',
          description: item.description || `Found: ${item.name}`,
          emoji: item.emoji || '📦',
          image: item.image || '',
          stats: item.stats || {},
          quantity: item.quantity || 1,
          equipped: item.equipped || false,
          is_default: false,
        })
        .select()
        .single();

      if (insertError) {
        logger.error('Error inserting inventory item:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, data });
    }

  } catch (error: any) {
    logger.error('[Inventory API] POST Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, itemId } = body;

    if (!action || !itemId) {
      return NextResponse.json({ error: 'Action and itemId are required' }, { status: 400 });
    }

    try {
      await supabaseServer.rpc('public.set_user_context', { user_id: userId });
    } catch (e) {
      // Ignore RPC error if it doesn't exist
    }

    if (action === 'equip') {
      // Find the item to get its category
      const { data: item, error: fetchError } = await supabaseServer
        .from('inventory_items')
        .select('*')
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(`Database error fetching item: ${fetchError.message}`);
      }

      if (!item) {
        throw new Error('Item not found');
      }

      // Unequip any existing item of the same category
      if (item.category) {
        await supabaseServer
          .from('inventory_items')
          .update({ equipped: false })
          .eq('user_id', userId)
          .eq('category', item.category)
          .eq('equipped', true);
      }

      // Equip the new item
      const { data, error } = await supabaseServer
        .from('inventory_items')
        .update({ equipped: true })
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .select()
        .single();

      if (error) throw new Error(`Database error equipping item: ${error.message}`);
      return NextResponse.json(data);

    } else if (action === 'unequip') {
      const { data, error } = await supabaseServer
        .from('inventory_items')
        .update({ equipped: false })
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .select()
        .single();

      if (error) throw new Error(`Database error unequipping item: ${error.message}`);
      return NextResponse.json(data);
    }

    throw new Error('Invalid action');
  } catch (error: any) {
    logger.error('[Inventory API] PATCH Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, quantity, clearAll } = body;

    try {
      await supabaseServer.rpc('public.set_user_context', { user_id: userId });
    } catch (e) {
      // Ignore RPC error if it doesn't exist
    }

    if (clearAll) {
      // Clear all inventory
      const { error } = await supabaseServer
        .from('inventory_items')
        .delete()
        .eq('user_id', userId);

      if (error) throw new Error(`Database error clearing inventory: ${error.message}`);
      return NextResponse.json({ message: 'Inventory cleared' });
    }

    if (!itemId) {
      return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
    }

    // Get current item
    const { data: existing, error: fetchError } = await supabaseServer
      .from('inventory_items')
      .select('*')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw new Error(`Database error fetching item: ${fetchError.message}`);
    }

    if (!existing) {
      throw new Error('Item not found');
    }

    const removeQuantity = quantity || 1;

    if (existing.quantity > removeQuantity) {
      // Update quantity
      const { data, error } = await supabaseServer
        .from('inventory_items')
        .update({ quantity: existing.quantity - removeQuantity })
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .select()
        .single();

      if (error) throw new Error(`Database error updating quantity: ${error.message}`);
      return NextResponse.json(data);
    } else {
      // Delete item completely
      const { error } = await supabaseServer
        .from('inventory_items')
        .delete()
        .eq('user_id', userId)
        .eq('item_id', itemId);

      if (error) throw new Error(`Database error deleting item: ${error.message}`);
      return NextResponse.json({ message: 'Item removed' });
    }
  } catch (error: any) {
    logger.error('[Inventory API] DELETE Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 