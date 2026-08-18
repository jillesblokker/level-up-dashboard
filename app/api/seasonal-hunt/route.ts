import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';
import { logger } from "@/lib/logger";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const result = await authenticatedSupabaseQuery(req, async (supabase, userId) => {
      // Load all items for the user
      const { data: items, error } = await supabase
        .from('seasonal_hunt')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return items;
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ items: result.data || [] });

  } catch (err: any) {
    logger.error('[Seasonal Hunt API] GET Error:', err);
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, itemId, eventKey } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action required' }, { status: 400 });
    }

    const result = await authenticatedSupabaseQuery(req, async (supabase, userId) => {
      if (action === 'initialize') {
        if (!eventKey) {
          throw new Error('Event key required');
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

        const { data, error } = await supabase
          .from('seasonal_hunt')
          .insert(items)
          .select();

        if (error) throw error;
        return data;

      } else if (action === 'find') {
        if (!itemId) {
          throw new Error('Item ID required');
        }

        // Mark item as found
        const { data, error } = await supabase
          .from('seasonal_hunt')
          .update({ 
            found: true, 
            found_at: new Date().toISOString() 
          })
          .eq('user_id', userId)
          .eq('item_id', itemId)
          .select()
          .single();

        if (error) throw error;
        return data;

      } else if (action === 'reset') {
        // Delete all seasonal hunt items for this user so fresh ones can be hidden
        const { error } = await supabase
          .from('seasonal_hunt')
          .delete()
          .eq('user_id', userId);

        if (error) throw error;
        return { reset: true };
      }
      
      throw new Error('Invalid action');
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true, 
      item: result.data,
      items: Array.isArray(result.data) ? result.data : undefined
    });

  } catch (err: any) {
    logger.error('[Seasonal Hunt API] POST Error:', err);
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}