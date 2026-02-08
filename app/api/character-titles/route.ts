import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { apiLogger } from '@/lib/logger';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simple test response
    apiLogger.debug(`Character Titles: userId=${userId}`);

    return NextResponse.json({
      success: true,
      data: [],
      message: 'Character titles API connected'
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    apiLogger.error('Character Titles Error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}