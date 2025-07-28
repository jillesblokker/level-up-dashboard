import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simple test response
    console.log('[character-strengths] Test call:', { userId });
    
    return NextResponse.json({ 
      success: true, 
      data: [],
      message: 'Character strengths API connected'
    });
  } catch (err) {
    console.error('[character-strengths] Error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
} 