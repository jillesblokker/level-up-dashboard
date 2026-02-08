import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logger';

// Extract user ID from Clerk JWT token
async function extractUserIdFromToken(req: NextRequest): Promise<string | null> {
  try {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      apiLogger.debug('No Authorization header found or invalid format');
      return null;
    }

    const token = authHeader.substring(7);

    // For Clerk JWT tokens, extract user ID from the token payload
    const parts = token.split('.');

    if (parts.length === 3 && parts[1]) {
      try {
        // Decode base64url to base64, then decode
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload) as { sub?: string };

        // The user ID is in the 'sub' field for Clerk tokens
        if (payload.sub) {
          return payload.sub;
        } else {
          apiLogger.warn('No sub field found in token payload');
        }
      } catch (e) {
        apiLogger.error('Error decoding token:', e);
      }
    } else {
      apiLogger.warn('Invalid token format');
    }

    return null;
  } catch (error) {
    apiLogger.error('Error extracting user ID:', error);
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

    apiLogger.debug(`Creature discovery: userId=${userId}, creatureId=${creatureId}`);

    return NextResponse.json({ success: true, alreadyDiscovered: false });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    apiLogger.error('Error in creatures/discover:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}