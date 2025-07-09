import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../pages/api/server-client';

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

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Delete all tiles for this user
    const { error: deleteError } = await supabaseServer
      .from('realm_tiles')
      .delete()
      .eq('user_id', userId);
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
    // Insert the initial grid
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
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 