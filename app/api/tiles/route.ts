import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Create a new tile placement
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized - No valid session' }, { status: 401 });
    }

    // Ensure user exists in database
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: '',
        name: 'User'
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
        userId,
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
          userId,
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
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const placements = await prisma.tilePlacement.findMany({
      where: {
        userId
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
