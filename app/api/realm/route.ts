import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { GridCell } from '@/types/grid';

// Validation schemas
const gridCellSchema = z.object({
  x: z.number(),
  y: z.number(),
  type: z.string(),
  rotation: z.number().optional(),
});

const gridSchema = z.array(gridCellSchema);

// Error handling middleware
const handleError = (error: unknown) => {
  console.error('Realm route error:', error);
  if (error instanceof z.ZodError) {
    return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
  }
  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const realmMap = await prisma.realmMap.findUnique({
      where: { userId: session.user.id },
    });

    if (!realmMap) {
      return NextResponse.json({ grid: [] });
    }

    const grid = JSON.parse(realmMap.grid) as GridCell[];
    return NextResponse.json({ grid });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const grid = gridSchema.parse(body.grid);

    await prisma.realmMap.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        grid: JSON.stringify(grid),
      },
      update: {
        grid: JSON.stringify(grid),
        lastSynced: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const realmMap = await prisma.realmMap.findUnique({
      where: { userId: session.user.id },
    });

    if (!realmMap) {
      return NextResponse.json({ error: 'No realm map found' }, { status: 404 });
    }

    const grid = JSON.parse(realmMap.grid) as GridCell[];
    const csvHeader = 'x,y,type,rotation\n';
    const csvData = grid.map(cell => 
      `${cell.x},${cell.y},${cell.type},${cell.rotation || 0}`
    ).join('\n');

    const csvContent = csvHeader + csvData;
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=realm-map.csv',
      },
    });
  } catch (error) {
    return handleError(error);
  }
} 