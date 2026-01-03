import { NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';
import { supabaseServer } from '@/lib/supabase/server-client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Add timeout handling
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 10000); // 10 second timeout
    });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const itemId = searchParams.get('itemId');
    const equipped = searchParams.get('equipped');

    const queryPromise = authenticatedSupabaseQuery(request, async (supabase, userId) => {
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
        const { data, error } = await query.single();
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
        // If name already looks formatted (has spaces, capitals), return it
        if (name.includes(' ') && /^[A-Z]/.test(name)) return name;

        // Use name if id is a generated kingdom-tile-id
        const source = (id && !id.startsWith('kingdom-tile-')) ? id : name;

        return source
          .replace(/^(material|item|artifact|scroll|potion)-/i, '') // Remove prefixes
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      };

      const resolveItemImage = (row: any) => {
        // trust the DB image ONLY if it's not a placeholder
        if (row.image &&
          row.image.startsWith('/images/') &&
          !row.image.includes('placeholder') &&
          !row.image.includes('mystery-item')) {
          return row.image;
        }

        // Construct path based on type/category
        const type = row.type || 'item';
        // Use name if id is generated kingdom-tile-id
        const rawId = (row.item_id && !row.item_id.startsWith('kingdom-tile-')) ? row.item_id : row.name;

        // Normalize ID for file path matching (lowercase, hyphens instead of spaces)
        // This handles cases where name might be 'Fish Silver' -> 'fish-silver'
        const id = rawId.toLowerCase().trim().replace(/\s+/g, '-');

        // Specific mappings based on directory structure
        if (id.startsWith('material-')) return `/images/items/materials/${id}.png`;
        if (id.startsWith('fish-')) return `/images/items/food/${id}.png`;
        if (id.startsWith('potion-')) return `/images/items/potion/${id}.png`;
        if (id.startsWith('sword-')) return `/images/items/sword/${id}.png`;
        if (id.startsWith('armor-')) return `/images/items/armor/${id}.png`;
        if (id.startsWith('shield-')) return `/images/items/shield/${id}.png`;
        if (id.startsWith('scroll-')) return `/images/items/scroll/${id}.png`;

        // Map types to physical folders
        let folder = type;
        switch (type) {
          case 'weapon': folder = 'sword'; break; // Default weapon folder
          case 'resource': folder = 'materials'; break;
          case 'mount': folder = 'horse'; break;
          case 'food': folder = 'food'; break;
          case 'artifact':
            if (id.includes('ring')) folder = 'artifact/ring';
            else if (id.includes('crown')) folder = 'artifact/crown';
            else folder = 'artifact';
            break;
        }

        return `/images/items/${folder}/${id}.png`;
      };

      const mappedData = (data || []).map((row: any) => ({
        ...row,
        id: row.item_id,
        name: formatItemName(row.name, row.item_id),
        image: resolveItemImage(row),
        equipped: row.equipped,
        stats: row.stats || {},
      }));

      return mappedData;
    });

    // Race between timeout and query
    const result = await Promise.race([queryPromise, timeoutPromise]) as any;

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('[Inventory API] Error:', error);

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
    const body = await request.json();
    const { item } = body;

    if (!item) {
      return NextResponse.json({ error: 'Item is required' }, { status: 400 });
    }

    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      console.log('[API Inventory] Processing POST for:', item.id, 'User:', userId);
      // Check if item exists
      const { data: existing, error: fetchError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('user_id', userId)
        .eq('item_id', item.id)
        .single();

      if (existing) {
        console.log('[API Inventory] Item exists. Old Qty:', existing.quantity, 'Adding:', item.quantity);
      } else {
        console.log('[API Inventory] Item/User not found. Fetch err:', fetchError?.code);
      }

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existing) {
        // Update quantity
        const { data, error } = await supabase
          .from('inventory_items')
          .update({ quantity: existing.quantity + (item.quantity || 1) })
          .eq('user_id', userId)
          .eq('item_id', item.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new item
        const { data, error } = await supabase
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

        if (error) {
          console.error('[Inventory API] Insert error:', error);
          throw error;
        }
        return data;
      }
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Inventory API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { action, itemId } = body;

    if (!action || !itemId) {
      return NextResponse.json({ error: 'Action and itemId are required' }, { status: 400 });
    }

    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      if (action === 'equip') {
        // Find the item to get its category
        const { data: item, error: fetchError } = await supabase
          .from('inventory_items')
          .select('*')
          .eq('user_id', userId)
          .eq('item_id', itemId)
          .single();

        if (fetchError || !item) {
          throw new Error('Item not found');
        }

        // Unequip any existing item of the same category
        if (item.category) {
          await supabase
            .from('inventory_items')
            .update({ equipped: false })
            .eq('user_id', userId)
            .eq('category', item.category)
            .eq('equipped', true);
        }

        // Equip the new item
        const { data, error } = await supabase
          .from('inventory_items')
          .update({ equipped: true })
          .eq('user_id', userId)
          .eq('item_id', itemId)
          .select()
          .single();

        if (error) throw error;
        return data;

      } else if (action === 'unequip') {
        const { data, error } = await supabase
          .from('inventory_items')
          .update({ equipped: false })
          .eq('user_id', userId)
          .eq('item_id', itemId)
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      throw new Error('Invalid action');
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Inventory API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { itemId, quantity, clearAll } = body;

    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      if (clearAll) {
        // Clear all inventory
        const { error } = await supabase
          .from('inventory_items')
          .delete()
          .eq('user_id', userId);

        if (error) throw error;
        return { message: 'Inventory cleared' };
      }

      if (!itemId) {
        throw new Error('itemId is required');
      }

      // Get current item
      const { data: existing, error: fetchError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .single();

      if (fetchError || !existing) {
        throw new Error('Item not found');
      }

      const removeQuantity = quantity || 1;

      if (existing.quantity > removeQuantity) {
        // Update quantity
        const { data, error } = await supabase
          .from('inventory_items')
          .update({ quantity: existing.quantity - removeQuantity })
          .eq('user_id', userId)
          .eq('item_id', itemId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Delete item completely
        const { error } = await supabase
          .from('inventory_items')
          .delete()
          .eq('user_id', userId)
          .eq('item_id', itemId);

        if (error) throw error;
        return { message: 'Item removed' };
      }
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Inventory API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 