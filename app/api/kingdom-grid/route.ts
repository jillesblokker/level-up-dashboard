import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../lib/supabase/server-client';

// GET: Return kingdom grid for the user
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseServer
      .from('kingdom_grid')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // PGRST116 = no rows returned
        return NextResponse.json({ grid: null });
      }
      console.error('[KINGDOM-GRID][GET] Supabase error:', error);
      // Return null grid instead of error for better UX
      return NextResponse.json({ grid: null });
    }

    return NextResponse.json({ grid: data?.grid || null });
  } catch (error) {
    console.error('[KINGDOM-GRID][GET] Internal server error:', error);
    // Return null grid instead of error for better UX
    return NextResponse.json({ grid: null });
  }
}

// POST: Save kingdom grid for the user
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { grid } = await request.json();
    if (!grid) {
      return NextResponse.json({ error: 'Grid is required' }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from('kingdom_grid')
      .upsert([
        { 
          user_id: userId, 
          grid, 
          updated_at: new Date().toISOString() 
        }
      ], { onConflict: 'user_id' });

    if (error) {
      console.error('[KINGDOM-GRID][POST] Supabase error:', error);
      // Try to create the table if it doesn't exist
      try {
        await supabaseServer.rpc('create_kingdom_grid_if_not_exists');
        // Retry the upsert
        const { error: retryError } = await supabaseServer
          .from('kingdom_grid')
          .upsert([
            { 
              user_id: userId, 
              grid, 
              updated_at: new Date().toISOString() 
            }
          ], { onConflict: 'user_id' });
        
        if (retryError) {
          console.error('[KINGDOM-GRID][POST] Retry failed:', retryError);
          return NextResponse.json({ success: false, error: 'Failed to save grid' }, { status: 500 });
        }
      } catch (createError) {
        console.error('[KINGDOM-GRID][POST] Failed to create table:', createError);
        return NextResponse.json({ success: false, error: 'Database not ready' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[KINGDOM-GRID][POST] Internal server error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
} 