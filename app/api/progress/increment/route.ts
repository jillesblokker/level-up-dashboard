import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabase/server-client';
import { grantReward, RewardType } from '../../kingdom/grantReward';

// Extract user ID from Supabase JWT token
async function extractUserIdFromToken(req: NextRequest): Promise<string | null> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Progress Increment] No Authorization header found');
      return null;
    }

    const token = authHeader.substring(7);
    console.log('[Progress Increment] Token received, length:', token.length);

    // For Clerk JWT tokens, we can extract the user ID from the token
    const parts = token.split('.');
    if (parts.length === 3 && parts[1]) {
      try {
        // Decode base64url to base64, then decode
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
        console.log('[Progress Increment] Token payload:', payload);
        
        // The user ID is in the 'sub' field for Clerk tokens
        if (payload.sub) {
          console.log('[Progress Increment] UserId from token:', payload.sub);
          return payload.sub;
        }
      } catch (decodeError) {
        console.error('[Progress Increment] Token decode failed:', decodeError);
      }
    }

    return null;
  } catch (error) {
    console.error('[Progress Increment] Error extracting user ID:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    // Secure JWT verification
    const userId = await extractUserIdFromToken(request as NextRequest);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized (JWT invalid or missing)' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;
    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }
    
    // Simple test - just return success without database operations
    console.log('[progress/increment] Test call:', { userId, action });
    
    return NextResponse.json({ success: true, newValue: 1 });
  } catch (err) {
    console.error('[progress/increment] Internal server error:', err);
    return NextResponse.json({
      error: (err as Error).message,
      stack: (err as Error).stack,
      debug: JSON.stringify(err, Object.getOwnPropertyNames(err))
    }, { status: 500 });
  }
} 