import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function GET(request: NextRequest) {
  try {
    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      const { data, error } = await supabase
        .from('kingdom_grid')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[Kingdom Grid API] Select error:', error);
        throw error;
      }

      // Return empty grid if none exists
      return data || { grid: [], version: 1 };
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true, 
      data: result.data 
    });

  } catch (error) {
    console.error('[Kingdom Grid API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { grid, version } = body;

    if (!grid) {
      return NextResponse.json({ 
        error: 'Missing required field: grid' 
      }, { status: 400 });
    }

    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      // Check if grid exists
      const { data: existing, error: fetchError } = await supabase
        .from('kingdom_grid')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
      
      if (existing) {
        // Update existing grid
        const { data, error } = await supabase
          .from('kingdom_grid')
          .update({ 
            grid, 
            version: (version || existing.version || 1) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .select()
          .single();
          
        if (error) throw error;
        return data;
      } else {
        // Insert new grid
        const { data, error } = await supabase
          .from('kingdom_grid')
          .insert({
            user_id: userId,
            grid,
            version: version || 1
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
    console.error('[Kingdom Grid API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 