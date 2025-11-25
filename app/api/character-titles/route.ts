import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import logger from '@/lib/logger';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simple test response
    logger.info(`Test call: userId=${userId}`, 'Character Titles');

    return NextResponse.json({
      success: true,
      data: [],
      message: 'Character titles API connected'
    });
  } catch (err) {
    logger.error(`Error: ${err}`, 'Character Titles');
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
} 