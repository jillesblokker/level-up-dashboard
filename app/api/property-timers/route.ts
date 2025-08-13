import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function GET(request: NextRequest) {
  try {
    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      const { data, error } = await supabase
        .from('property_timers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Property Timers API] Select error:', error);
        throw error;
      }

      return data || [];
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true, 
      data: result.data 
    });

  } catch (error) {
    console.error('[Property Timers API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tileId, x, y, tileType, endTime, isReady } = body;

    if (!tileId || x === undefined || y === undefined || !tileType || !endTime) {
      return NextResponse.json({ 
        error: 'Missing required fields: tileId, x, y, tileType, endTime' 
      }, { status: 400 });
    }

    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      // Check if timer exists for this position
      const { data: existing, error: fetchError } = await supabase
        .from('property_timers')
        .select('*')
        .eq('user_id', userId)
        .eq('x', x)
        .eq('y', y)
        .single();
        
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
      
      if (existing) {
        // Update existing timer
        const { data, error } = await supabase
          .from('property_timers')
          .update({ 
            tile_id: tileId,
            tile_type: tileType,
            end_time: endTime,
            is_ready: isReady || false,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('x', x)
          .eq('y', y)
          .select()
          .single();
          
        if (error) throw error;
        return data;
      } else {
        // Insert new timer
        const { data, error } = await supabase
          .from('property_timers')
          .insert({
            user_id: userId,
            tile_id: tileId,
            x,
            y,
            tile_type: tileType,
            end_time: endTime,
            is_ready: isReady || false
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

    return NextResponse.json({ 
      success: true, 
      data: result.data 
    });

  } catch (error) {
    console.error('[Property Timers API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { x, y, isReady, endTime } = body;

    if (x === undefined || y === undefined || isReady === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields: x, y, isReady' 
      }, { status: 400 });
    }

    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      const updateData: any = { 
        is_ready: isReady,
        updated_at: new Date().toISOString()
      };

      if (endTime) {
        updateData.end_time = endTime;
      }

      const { data, error } = await supabase
        .from('property_timers')
        .update(updateData)
        .eq('user_id', userId)
        .eq('x', x)
        .eq('y', y)
        .select()
        .single();

      if (error) {
        console.error('[Property Timers API] Update error:', error);
        throw error;
      }

      return data;
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true, 
      data: result.data 
    });

  } catch (error) {
    console.error('[Property Timers API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const x = searchParams.get('x');
    const y = searchParams.get('y');

    if (!x || !y) {
      return NextResponse.json({ 
        error: 'Missing required query parameters: x, y' 
      }, { status: 400 });
    }

    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      const { error } = await supabase
        .from('property_timers')
        .delete()
        .eq('user_id', userId)
        .eq('x', parseInt(x))
        .eq('y', parseInt(y));

      if (error) {
        console.error('[Property Timers API] Delete error:', error);
        throw error;
      }

      return { success: true };
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Timer deleted successfully' 
    });

  } catch (error) {
    console.error('[Property Timers API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
