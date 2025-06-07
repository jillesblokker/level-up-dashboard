import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Create a new tile placement
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized - No valid session' }, { status: 401 });
    }

    // Ensure user exists in database
    await prisma.user.upsert({
      where: { id: session.user.id },
      update: {},
      create: {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.['full_name'] || session.user.email?.split('@')[0] || 'User'
      }
    });

    const data = await request.json();
    
    const { tileType, posX, posY } = data;
    
    if (!tileType || typeof posX !== 'number' || typeof posY !== 'number') {
      return NextResponse.json({ 
        error: 'Invalid data', 
        details: 'Missing or invalid tileType, posX, or posY' 
      }, { status: 400 });
    }

    // First check if a tile already exists at this position
    const existingTile = await prisma.tilePlacement.findFirst({
      where: {
        userId: session.user.id,
        posX,
        posY
      }
    });

    if (existingTile) {
      return NextResponse.json({ 
        error: 'Tile placement failed', 
        details: 'A tile already exists at this position',
        existingTile 
      }, { status: 409 });
    }

    // Try to create the tile placement
    try {
      const placement = await prisma.tilePlacement.create({
        data: {
          userId: session.user.id,
          tileType,
          posX,
          posY
        }
      });
      
      return NextResponse.json(placement);
    } catch (error) {
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle specific Prisma errors
        switch (error.code) {
          case 'P2002':
            return NextResponse.json({ 
              error: 'Tile placement failed', 
              details: 'A tile already exists at this position' 
            }, { status: 409 });
          case 'P2003':
            return NextResponse.json({ 
              error: 'Tile placement failed', 
              details: 'Invalid user ID' 
            }, { status: 400 });
          default:
            return NextResponse.json({ 
              error: 'Database error', 
              details: `Database error: ${error.code}` 
            }, { status: 500 });
        }
      }
      
      throw error; // Re-throw unknown errors
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
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const placements = await prisma.tilePlacement.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(placements);
  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 