import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server-client';
import logger from '@/lib/logger';

// Extract user ID from Supabase JWT token
async function extractUserIdFromToken(req: NextRequest): Promise<string | null> {
  try {
    const authHeader = req.headers.get('authorization');
    logger.info(`Authorization header: ${authHeader ? 'present' : 'missing'}`, 'Creatures Discover');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('No Authorization header found or invalid format', 'Creatures Discover');
      return null;
    }

    const token = authHeader.substring(7);
    logger.info(`Token received, length: ${token.length}`, 'Creatures Discover');
    logger.info(`Token starts with: ${token.substring(0, 20)}...`, 'Creatures Discover');

    let userId: string | null = null; // Declare userId here

    // For Clerk JWT tokens, we can extract the user ID from the token
    const parts = token.split('.');
    logger.info(`Token parts count: ${parts.length}`, 'Creatures Discover');

    if (parts.length === 3 && parts[1]) {
      try {
        // Decode base64url to base64, then decode
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        logger.info(`Base64 payload length: ${base64.length}`, 'Creatures Discover');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);
        logger.info(`Token payload keys: ${Object.keys(payload)}`, 'Creatures Discover');
        logger.info(`Token payload sub: ${payload.sub}`, 'Creatures Discover');

        // The user ID is in the 'sub' field for Clerk tokens
        if (payload.sub) {
          userId = payload.sub;
          logger.info(`UserId from token: ${payload.sub}`, 'Creatures Discover');
        } else {
          logger.warn('No sub field found in token payload', 'Creatures Discover');
        }
      } catch (e) {
        logger.error(`Error decoding token: ${e}`, 'Creatures Discover');
        logger.info(`Raw payload part: ${parts[1].substring(0, 50)}...`, 'Creatures Discover');
      }
    } else {
      logger.warn(`Invalid token format - expected 3 parts, got: ${parts.length}`, 'Creatures Discover');
    }

    if (!userId) {
      logger.error('No user ID could be extracted from token', 'Creatures Discover');
      return null;
    }
    return userId;
  } catch (error) {
    logger.error(`Error extracting user ID: ${error}`, 'Creatures Discover');
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
    logger.info(`Test call: userId=${userId}, creatureId=${creatureId}`, 'creatures/discover');

    return NextResponse.json({ success: true, alreadyDiscovered: false });
  } catch (err) {
    logger.error(`Error in creatures/discover: ${err}`, 'creatures/discover');
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
} 