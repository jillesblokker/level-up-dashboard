import { NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function GET(request: Request) {
  try {
    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('user_id', userId);
        
      if (error) {
        throw error;
      }
      
      return (data || []).map(row => ({
        ...row,
        id: row.item_id,
        equipped: row.equipped,
        stats: row.stats || {},
      }));
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
          .update({ quantity: existing.quantity + item.quantity })
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
            name: item.name,
            type: item.type,
            category: item.category,
            description: item.description,
            emoji: item.emoji,
            image: item.image,
            stats: item.stats,
            quantity: item.quantity,
            equipped: item.equipped || false,
            is_default: false,
          })
          .select()
          .single();
          
        if (error) throw error;
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