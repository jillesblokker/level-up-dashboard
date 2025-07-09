import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../pages/api/server-client';

// Initial grid data (7 rows x 12 columns)
const INITIAL_GRID: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,5,2,2,2,2,2,2,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,2,2,2,2,2,6,2,2,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1],
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
      return NextResponse.json({ error: 'Missing or invalid tile data' }, { status: 400 });
    }
    // Build the update object for the correct tile column
    const updateObj: any = {
      [`tile_${x}_type`]: tile_type,
      [`tile_${x}_updated_at`]: new Date().toISOString(),
      [`tile_${x}_event`]: event_type || null
    };
    // Upsert the row for (user_id, y)
    const { error } = await supabaseServer
      .from('realm_tiles')
      .upsert([
        { user_id: userId, y, ...updateObj }
      ], { onConflict: 'user_id,y' });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 