import { NextResponse } from 'next/server';
import { authenticatedSupabaseQuery, authenticatedFriendQuery } from '@/lib/supabase/jwt-verification';

// Helper for initial grid seeding if needed
// (We just return empty specific tiles and let frontend handle default generation, 
//  OR we optionally seed the base grid here. Seeding here is safer for consistency.)
const INITIAL_ROWS = 7;
const GRID_COLS = 13;
// 0=empty, 1=mountain, 2=grass, ... (Legacy numeric map)
const INITIAL_SEED_GRID: number[][] = [
  [1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 2, 5, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 1],
  [1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 2, 7, 1],
  [1, 2, 2, 2, 4, 4, 3, 6, 3, 3, 3, 2, 1],
  [1, 2, 7, 2, 4, 4, 3, 2, 3, 3, 3, 2, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
];

// GET: Return all tiles for the user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const visitUserId = searchParams.get('userId');

    const result = await (visitUserId
      ? authenticatedFriendQuery(request, visitUserId, async (supabase, userId) => {
        const { data, error } = await supabase
          .from('realm_tiles')
          .select('*')
          .eq('user_id', userId);

        if (error) throw error;
        return { tiles: data || [] };
      })
      : authenticatedSupabaseQuery(request, async (supabase, userId) => {
        let { data, error } = await supabase
          .from('realm_tiles')
          .select('*')
          .eq('user_id', userId);

        if (error) throw error;

        // If no tiles exist, seed the initial grid?
        // To ensure persistence works from moment 0, we can seed.
        if (!data || data.length === 0) {
          const seedRows: any[] = [];

          INITIAL_SEED_GRID.forEach((row, y) => {
            row.forEach((type, x) => {
              // Only save non-empty tiles to save space? 
              // Actually, saving all base tiles ensures the map looks correct.
              if (type !== 0) { // 0 is empty/void, typically implies unplaced? 
                // Actually, bottom row is 0 but it's part of the grid.
                // Let's save everything from the seed.
                seedRows.push({
                  user_id: userId,
                  x,
                  y,
                  tile_type: type
                });
              }
            });
          });

          if (seedRows.length > 0) {
            const { error: insertError } = await supabase
              .from('realm_tiles')
              .insert(seedRows);

            if (insertError) {
              console.error('Failed to seed initial grid:', insertError);
              // Don't fail the request, just return empty and let frontend fallback
            } else {
              // Re-fetch
              const { data: seededData } = await supabase
                .from('realm_tiles')
                .select('*')
                .eq('user_id', userId);
              data = seededData;
            }
          }
        }

        return { tiles: data || [] };
      })
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error('[Realm Tiles GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Upsert a single tile OR a batch of tiles
export async function POST(request: Request) {
  try {
    const body = await request.json();

    return await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      let tilesToUpsert = [];

      if (Array.isArray(body)) {
        // Batch mode
        tilesToUpsert = body.map(tile => ({
          user_id: userId,
          x: tile.x,
          y: tile.y,
          tile_type: tile.tile_type,
          event_type: tile.event_type || null,
          meta: tile.meta || {},
          updated_at: new Date().toISOString()
        }));

        if (tilesToUpsert.length === 0) return { success: true };

      } else {
        // Single mode
        const { x, y, tile_type, event_type, meta } = body;
        if (typeof x !== 'number' || typeof y !== 'number' || typeof tile_type !== 'number') {
          throw new Error('Missing or invalid tile data');
        }
        tilesToUpsert = [{
          user_id: userId,
          x,
          y,
          tile_type,
          event_type: event_type || null,
          meta: meta || {},
          updated_at: new Date().toISOString()
        }];
      }

      const { data, error } = await supabase
        .from('realm_tiles')
        .upsert(tilesToUpsert, {
          onConflict: 'user_id,x,y'
        })
        .select();

      if (error) throw error;

      return { success: true, tiles: data };
    });

  } catch (error: any) {
    console.error('[Realm Tiles POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
