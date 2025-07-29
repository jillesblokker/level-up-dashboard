import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

export const dynamic = 'force-dynamic';

// Create a new tile placement
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized - No valid session' }, { status: 401 });
    }

    // Ensure user exists in database

    const data = await request.json();
    
    const { tileType, posX, posY } = data;
    
    if (!tileType || typeof posX !== 'number' || typeof posY !== 'number') {
      return NextResponse.json({ 
        error: 'Invalid data', 
        details: 'Missing or invalid tileType, posX, or posY' 
      }, { status: 400 });
    }

    // First check if a tile already exists at this position

    // Try to create the tile placement
    try {
      // Attempt to insert the tile placement
      const { data: placement, error } = await supabaseServer
        .from('tile_placement') // your table name, adjust as needed
        .insert([
          {
            user_id: userId,
            tile_type: tileType,
            pos_x: posX,
            pos_y: posY,
            // ...other fields
          }
        ])
        .single();

      if (error) {
        // Handle unique constraint violation (duplicate tile)
        if (error.code === '23505') { // Postgres unique violation
          return NextResponse.json({
            error: 'Tile placement failed',
            details: 'A tile already exists at this position'
          }, { status: 409 });
        }
        // Handle other errors
        return NextResponse.json({
          error: 'Tile placement failed',
          details: error.message
        }, { status: 400 });
      }

      // Success
      return NextResponse.json(placement);
    } catch (error) {
      // Fallback for unexpected errors
      return NextResponse.json({
        error: 'Unexpected error',
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// Get tile placements for the current user
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Replace all Prisma logic with Supabase client logic

    const { data: placements, error } = await supabaseServer
      .from('tile_placement') // your table name, adjust as needed
      .select('*')
      .eq('user_id', userId) // filter by user_id
      .order('created_at', { ascending: false }); // order by created_at desc

    if (error) {
      // handle error (e.g., log or return error response)
      console.error('Error fetching tile placements:', error);
      // You might want to return or throw here
    }

    // placements will be an array of rows or null if not found
    return NextResponse.json(placements);
  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
