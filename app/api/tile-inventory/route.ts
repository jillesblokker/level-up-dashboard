import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function GET(req: NextRequest) {
  try {
    const result = await authenticatedSupabaseQuery(req, async (supabase, userId) => {
      const { data, error } = await supabase
        .from('tile_inventory')
        .select('*')
        .eq('user_id', userId);
        
      if (error) {
        throw error;
      }
      
      return (data || []).map(row => ({
        ...row,
        id: row.tile_id,
        cost: row.cost,
        connections: row.connections || [],
        rotation: row.rotation,
        last_updated: row.last_updated,
        version: row.version,
        quantity: row.quantity,
        type: row.tile_type,
      }));
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tile } = body;

    if (!tile || !tile.id) {
      return NextResponse.json({ error: 'Missing required tile data' }, { status: 400 });
    }

    const result = await authenticatedSupabaseQuery(req, async (supabase, userId) => {
      // Check if tile exists
      const { data: existing, error: fetchError } = await supabase
        .from('tile_inventory')
        .select('*')
        .eq('user_id', userId)
        .eq('tile_id', tile.id)
        .single();
        
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
      
      if (existing) {
        // Update quantity
        const { data, error } = await supabase
          .from('tile_inventory')
          .update({ quantity: existing.quantity + (tile.quantity || 1) })
          .eq('user_id', userId)
          .eq('tile_id', tile.id)
          .select()
          .single();
          
        if (error) throw error;
        return data;
      } else {
        // Insert new tile
        const { data, error } = await supabase
          .from('tile_inventory')
          .insert({
            user_id: userId,
            tile_id: tile.id,
            tile_type: tile.type,
            name: tile.name,
            quantity: tile.quantity || 1,
            cost: tile.cost || 0,
            connections: tile.connections || [],
            rotation: tile.rotation || 0,
            last_updated: new Date().toISOString(),
            version: tile.version || 1,
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

    return NextResponse.json({ success: true, data: result.data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tileId = searchParams.get('tileId');
    const quantity = parseInt(searchParams.get('quantity') || '1');

    if (!tileId) {
      return NextResponse.json({ error: 'Missing tileId parameter' }, { status: 400 });
    }

    const result = await authenticatedSupabaseQuery(req, async (supabase, userId) => {
      // Check current quantity
      const { data: existing, error: fetchError } = await supabase
        .from('tile_inventory')
        .select('quantity')
        .eq('user_id', userId)
        .eq('tile_id', tileId)
        .single();
        
      if (fetchError) {
        throw fetchError;
      }
      
      if (existing.quantity <= quantity) {
        // Remove completely
        const { error } = await supabase
          .from('tile_inventory')
          .delete()
          .eq('user_id', userId)
          .eq('tile_id', tileId);
          
        if (error) throw error;
        return { removed: true };
      } else {
        // Reduce quantity
        const { data, error } = await supabase
          .from('tile_inventory')
          .update({ quantity: existing.quantity - quantity })
          .eq('user_id', userId)
          .eq('tile_id', tileId)
          .select()
          .single();
          
        if (error) throw error;
        return data;
      }
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
} 