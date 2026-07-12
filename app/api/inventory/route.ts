import { logger } from "@/lib/logger";
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';
import { comprehensiveItems } from '@/app/lib/comprehensive-items';

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

    let query = supabaseServer
      .from('inventory_items')
      .select('*')
      .eq('user_id', userId);

    if (type) query = query.eq('type', type);
    if (category) query = query.eq('category', category);
    if (itemId) query = query.eq('item_id', itemId);
    if (equipped === 'true') query = query.eq('equipped', true);
    if (equipped === 'false') query = query.eq('equipped', false);

    const { data, error } = await query;
    if (error) {
      logger.error('[Inventory API] GET DB Error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Format items for the frontend
    const formattedData = (data || []).map((row: any) => {
      const sourceOfTruth = comprehensiveItems.find((i: any) => i.id === row.item_id);
      
      const dbStats = row.stats || {};
      const baseStats = sourceOfTruth ? (sourceOfTruth.stats || {}) : {};
      const mergedStats = { ...baseStats, ...dbStats };

      let itemName = row.name || (sourceOfTruth ? sourceOfTruth.name : row.item_id);
      const upgradeLvl = dbStats.upgradeLevel || 0;
      if (upgradeLvl > 0 && !itemName.includes('+')) {
        itemName = `${itemName} +${upgradeLvl}`;
      }

      return {
        ...row,
        dbId: row.id, // Primary database row UUID
        id: row.item_id, // Frontend expects standard compendium item_id
        name: itemName,
        description: sourceOfTruth ? sourceOfTruth.description : row.description,
        type: sourceOfTruth ? sourceOfTruth.type : row.type,
        category: sourceOfTruth ? sourceOfTruth.category : row.category,
        image: sourceOfTruth ? sourceOfTruth.image : row.image,
        emoji: sourceOfTruth ? sourceOfTruth.emoji : row.emoji,
        rarity: sourceOfTruth ? sourceOfTruth.rarity : row.rarity,
        stats: mergedStats,
      };
    });

    if (itemId && formattedData.length > 0) {
      return NextResponse.json({ success: true, data: formattedData[0] });
    }

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error) {
    logger.error('[Inventory API] GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    // 1. Check if item exists to handle quantity increment
    const { data: existing, error: fetchError } = await supabaseServer
      .from('inventory_items')
      .select('*')
      .eq('user_id', userId)
      .eq('item_id', item.id)
      .maybeSingle();

    if (fetchError) {
      logger.error('[Inventory API] POST Fetch Error:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (existing) {
      // 2a. Update quantity
      const { data, error: updateError } = await supabaseServer
        .from('inventory_items')
        .update({ 
          quantity: existing.quantity + (item.quantity || 1),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('item_id', item.id)
        .select()
        .single();

      if (updateError) {
        logger.error('[Inventory API] POST Update Error:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, data });
    } else {
      // 2b. Insert new item
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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        logger.error('[Inventory API] POST Insert Error:', insertError);
        // Specifically check for constraint violations to give better feedback
        if (insertError.code === '23514') {
          return NextResponse.json({ 
            error: `Invalid item type: ${item.type}. Please check database constraints.`,
            details: insertError.message 
          }, { status: 500 });
        }
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, data });
    }
  } catch (error: any) {
    logger.error('[Inventory API] POST Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
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

    if (action === 'equip') {
      // Find the item to get its category
      const { data: item, error: fetchError } = await supabaseServer
        .from('inventory_items')
        .select('*')
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

      const sourceOfTruth = comprehensiveItems.find((i: any) => i.id === itemId);
      const trueCategory = sourceOfTruth ? sourceOfTruth.category : item.category;

      // Unequip existing item of same category
      if (trueCategory) {
        await supabaseServer
          .from('inventory_items')
          .update({ equipped: false })
          .eq('user_id', userId)
          .eq('category', trueCategory)
          .eq('equipped', true);
      }

      // Equip the new item
      const { data, error } = await supabaseServer
        .from('inventory_items')
        .update({ 
          equipped: true, 
          category: trueCategory,
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);

    } else if (action === 'unequip') {
      const { data, error } = await supabaseServer
        .from('inventory_items')
        .update({ equipped: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    logger.error('[Inventory API] PATCH Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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

    if (clearAll) {
      const { error } = await supabaseServer
        .from('inventory_items')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Inventory cleared' });
    }

    if (!itemId) return NextResponse.json({ error: 'itemId is required' }, { status: 400 });

    const { data: existing, error: fetchError } = await supabaseServer
      .from('inventory_items')
      .select('*')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    const removeQuantity = quantity || 1;

    if (existing.quantity > removeQuantity) {
      const { data, error } = await supabaseServer
        .from('inventory_items')
        .update({ 
          quantity: existing.quantity - removeQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    } else {
      const { error } = await supabaseServer
        .from('inventory_items')
        .delete()
        .eq('user_id', userId)
        .eq('item_id', itemId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Item removed' });
    }
  } catch (error: any) {
    logger.error('[Inventory API] DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}