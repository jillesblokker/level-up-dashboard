import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Test Prisma connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    return NextResponse.json({
      status: 'healthy',
      database: {
        connected: true,
        type: 'prisma',
        test: result
      },
      env: {
        hasDatabaseUrl: !!process.env['DATABASE_URL'],
        nodeEnv: process.env.NODE_ENV
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      database: {
        connected: false,
        type: 'prisma'
      }
    });
  }
}
