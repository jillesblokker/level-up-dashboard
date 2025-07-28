import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simple test response
    console.log('[character-titles] Test call:', { userId });
    
    return NextResponse.json({ 
      success: true, 
      data: [],
      message: 'Character titles API connected'
    });
  } catch (err) {
    console.error('[character-titles] Error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
} 