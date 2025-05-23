import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/app/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Create a new tile placement
export async function POST(request: Request) {
  try {
    console.log('Starting tile placement request...'); // Debug log
    
    const session = await auth();
    if (!session?.user?.id) {
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized - No valid session' }, { status: 401 });
    }

    const data = await request.json();
    console.log('Received tile placement data:', data);
    
    const { tileType, posX, posY } = data;
    
    if (!tileType || typeof posX !== 'number' || typeof posY !== 'number') {
      console.log('Invalid tile placement data:', { tileType, posX, posY });
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
      console.log('Tile already exists at position:', { posX, posY });
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
      
      console.log('Successfully created tile placement:', placement);
      return NextResponse.json(placement);
    } catch (error) {
      console.error('Database error while creating tile:', error);
      
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
    console.error('Error in tile placement endpoint:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// Get tile placements for the current user
export async function GET(request: Request) {
  try {
    const session = await auth();
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
    console.error('Error fetching tile placements:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 