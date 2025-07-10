import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../pages/api/server-client';

// Helper to extract and verify Clerk JWT, returns userId or null
async function getUserIdFromRequest(request: Request): Promise<string | null> {
  try {
    const nextReq = request instanceof NextRequest ? request : new NextRequest(request.url, { headers: request.headers, method: request.method, body: (request as any).body });
    const authHeader = nextReq.headers.get('authorization');
    console.log('[getUserIdFromRequest] Authorization header:', authHeader);
    if (!authHeader) return null;
    const token = authHeader.replace(/^Bearer /i, '');
    const { userId } = getAuth(nextReq);
    console.log('[getUserIdFromRequest] Extracted userId:', userId);
    return userId || null;
  } catch (e) {
    console.error('[Clerk] JWT verification failed:', e);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Fetch all challenges
    const { data: allChallenges, error: challengesError } = await supabaseServer
      .from('challenges')
      .select('*');
    if (challengesError) {
      return NextResponse.json({ error: challengesError.message }, { status: 500 });
    }
    // Fetch user's challenge completions
    const { data: completions, error: completionError } = await supabaseServer
      .from('challenge_completion')
      .select('*')
      .eq('user_id', userId);
    if (completionError) {
      return NextResponse.json({ error: completionError.message }, { status: 500 });
    }
    // Merge completion state
    const completionMap = new Map();
    completions.forEach((c: any) => completionMap.set(String(c.challenge_id), c));
    const challengesWithCompletion = (allChallenges || []).map((c: any) => {
      const completion = completionMap.get(String(c.id));
      return {
        ...c,
        completed: completion?.completed ?? false,
        completionId: completion?.id,
        date: completion?.date,
      };
    });
    return NextResponse.json(challengesWithCompletion);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 