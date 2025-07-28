import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simple test response
    console.log('[kingdom-events] Test call:', { userId });
    
    return NextResponse.json({ 
      success: true, 
      data: [],
      message: 'Kingdom events API connected'
    });
  } catch (err) {
    console.error('[kingdom-events] Error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
} 