import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  try {
    console.log('[Auth Test] API called at', new Date().toISOString());
    
    // Try to get auth from request
    const { userId } = await getAuth(request as any);
    console.log('[Auth Test] Clerk userId:', userId);
    
    if (!userId) {
      console.log('[Auth Test] No userId found');
      return NextResponse.json({ error: 'No user ID found' }, { status: 401 });
    }
    
    console.log('[Auth Test] Success! UserId:', userId);
    return NextResponse.json({ 
      success: true, 
      userId: userId,
      message: 'Authentication working'
    });
  } catch (error) {
    console.error('[Auth Test] Error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
} 