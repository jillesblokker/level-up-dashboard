import { NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';
import { supabaseServer } from '@/lib/supabase/server-client';

export async function GET(request: Request) {
  try {
    // Add timeout handling
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 3000); // 3 second timeout
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
      
      const mappedData = (data || []).map((row: any) => ({
        ...row,
        id: row.item_id,
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
      // Check if item exists
      const { data: existing, error: fetchError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('user_id', userId)
        .eq('item_id', item.id)
        .single();
        
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