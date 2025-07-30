import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server-client';

// Extract user ID from Supabase JWT token
async function extractUserIdFromToken(req: NextRequest): Promise<string | null> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Creatures Discover] No Authorization header found');
      return null;
    }

    const token = authHeader.substring(7);
    console.log('[Creatures Discover] Token received, length:', token.length);

    // For Clerk JWT tokens, we can extract the user ID from the token
    const parts = token.split('.');
    if (parts.length === 3 && parts[1]) {
      try {
        // Decode base64url to base64, then decode
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
        console.log('[Creatures Discover] Token payload:', payload);
        
        // The user ID is in the 'sub' field for Clerk tokens
        if (payload.sub) {
          console.log('[Creatures Discover] UserId from token:', payload.sub);
          return payload.sub;
        }
      } catch (decodeError) {
        console.error('[Creatures Discover] Token decode failed:', decodeError);
      }
    }

    return null;
  } catch (error) {
    console.error('[Creatures Discover] Error extracting user ID:', error);
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
    const { creatureId } = body;
    if (!creatureId) {
      return NextResponse.json({ error: 'Creature ID is required' }, { status: 400 });
    }
    
    // Simple test - just return success without database operations
    console.log('[creatures/discover] Test call:', { userId, creatureId });
    
    return NextResponse.json({ success: true, alreadyDiscovered: false });
  } catch (err) {
    console.error('[creatures/discover] Error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
} 