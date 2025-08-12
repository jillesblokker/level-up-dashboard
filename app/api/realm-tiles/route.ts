import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../lib/supabase/server-client';

// Tile type legend:
// 0 = empty
// 1 = mountain
// 2 = grass
// 3 = forest
// 4 = water
// 5 = city
// 6 = town
// 7 = mystery
// 8 = portal-entrance
// 9 = portal-exit
// 10 = snow
// 11 = cave
// 12 = dungeon
// 13 = castle
// 14 = ice
// 15 = lava
// 16 = volcano
// (add more as needed)
const INITIAL_GRID: number[][] = [
  [1,1,2,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,5,2,2,2,2,2,2,2,2,1],
  [1,2,3,3,3,3,3,3,3,3,3,2,1],
  [1,2,2,2,2,3,3,3,3,3,2,7,1],
  [1,2,2,2,4,4,3,6,3,3,3,2,1],
  [1,2,7,2,4,4,3,2,3,3,3,2,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,1],
];

// GET: Return all tiles for the user, ordered by y
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    let { data, error } = await supabaseServer
      .from('realm_tiles')
      .select('*')
      .eq('user_id', userId)
      .order('y', { ascending: true });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // If no tiles exist, seed the initial grid
    if (!data || data.length === 0) {
      const now = new Date().toISOString();
      const rows = INITIAL_GRID.map((row, y) => {
        const rowObj: any = { user_id: userId, y };
        row.forEach((type, x) => {
          rowObj[`tile_${x}_type`] = type;
          rowObj[`tile_${x}_updated_at`] = now;
          rowObj[`tile_${x}_event`] = null;
        });
        return rowObj;
      });
      const { error: insertError } = await supabaseServer
        .from('realm_tiles')
        .insert(rows);
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      // Re-query after seeding
      const result = await supabaseServer
        .from('realm_tiles')
        .select('*')
        .eq('user_id', userId)
        .order('y', { ascending: true });
      data = result.data;
    }
    return NextResponse.json({ tiles: data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Upsert a single tile (x, y, type, event) for the user
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { x, y, tile_type, event_type } = await request.json();
    if (typeof x !== 'number' || typeof y !== 'number' || typeof tile_type !== 'number') {
      return NextResponse.json({ error: 'Missing or invalid tile data', details: { x, y, tile_type } }, { status: 400 });
    }

    // Validate tile coordinates
    if (x < 0 || y < 0 || x > 100 || y > 100) {
      return NextResponse.json({ error: 'Invalid tile coordinates', details: { x, y } }, { status: 400 });
    }

    // Build the update object for the correct tile column
    const updateObj: any = {
      [`tile_${x}_type`]: tile_type,
      [`tile_${x}_updated_at`]: new Date().toISOString(),
      [`tile_${x}_event`]: event_type || null
    };

    // Add timeout to the database operation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timed out')), 15000); // 15 second timeout
    });

    // Perform the database operation with timeout
    const dbOperation = supabaseServer
      .from('realm_tiles')
      .upsert([
        { user_id: userId, y, ...updateObj }
      ], { onConflict: 'user_id,y' });

    const { error } = await Promise.race([dbOperation, timeoutPromise]) as any;

    if (error) {
      console.error('[REALM-TILES][POST] Supabase error:', error, { x, y, tile_type, event_type });
      
      // Handle specific database errors
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ 
          error: 'Tile already exists at this position', 
          details: 'A tile is already placed at these coordinates' 
        }, { status: 409 });
      }
      
      if (error.code === '23503') { // Foreign key constraint violation
        return NextResponse.json({ 
          error: 'Invalid user reference', 
          details: 'User not found in database' 
        }, { status: 400 });
      }
      
      if (error.code === '42P01') { // Undefined table
        return NextResponse.json({ 
          error: 'Database schema error', 
          details: 'Required table not found' 
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        error: 'Database operation failed', 
        details: error.message 
      }, { status: 500 });
    }

    console.log(`[REALM-TILES][POST] Successfully placed tile at (${x}, ${y}) for user ${userId}`);
    return NextResponse.json({ 
      success: true, 
      message: 'Tile placed successfully',
      data: { x, y, tile_type, event_type }
    });
    
  } catch (error) {
    console.error('[REALM-TILES][POST] Internal server error:', error);
    
    // Handle timeout errors specifically
    if (error instanceof Error && error.message.includes('timed out')) {
      return NextResponse.json({ 
        error: 'Request timeout', 
        details: 'The operation took too long to complete. Please try again.' 
      }, { status: 408 });
    }
    
    // Handle network-related errors
    if (error instanceof Error && (
      error.message.includes('fetch') || 
      error.message.includes('network') ||
      error.message.includes('connection')
    )) {
      return NextResponse.json({ 
        error: 'Network error', 
        details: 'Unable to connect to the database. Please check your connection and try again.' 
      }, { status: 503 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error occurred' 
    }, { status: 500 });
  }
} 