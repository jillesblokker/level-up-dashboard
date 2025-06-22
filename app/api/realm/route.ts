import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getPrismaClient } from '@/lib/prisma';

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const prisma = getPrismaClient();
    const realmMap = await prisma.realmMap.findUnique({
      where: { userId },
    });

    if (!realmMap) {
      return new NextResponse(JSON.stringify({ grid: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return NextResponse.json({ grid: realmMap.grid });
  } catch (error) {
    console.error('Failed to fetch realm map:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch realm map' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { grid } = await request.json();

    if (!grid) {
      return new NextResponse(JSON.stringify({ error: 'Grid data is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const prisma = getPrismaClient();
    const updatedMap = await prisma.realmMap.upsert({
      where: { userId },
      update: { grid: JSON.stringify(grid) },
      create: { userId, grid: JSON.stringify(grid) },
    });

    return NextResponse.json({ success: true, grid: updatedMap.grid });
  } catch (error) {
    console.error('Failed to save realm map:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to save realm map' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 