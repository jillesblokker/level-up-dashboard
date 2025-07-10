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
    // Fetch all milestones
    const { data: allMilestones, error: milestonesError } = await supabaseServer
      .from('milestones')
      .select('*');
    if (milestonesError) {
      return NextResponse.json({ error: milestonesError.message }, { status: 500 });
    }
    // Fetch user's milestone completions
    const { data: completions, error: completionError } = await supabaseServer
      .from('milestone_completion')
      .select('*')
      .eq('user_id', userId);
    if (completionError) {
      return NextResponse.json({ error: completionError.message }, { status: 500 });
    }
    // Merge completion state
    const completionMap = new Map();
    completions.forEach((c: any) => completionMap.set(String(c.milestone_id), c));
    const milestonesWithCompletion = (allMilestones || []).map((m: any) => {
      const completion = completionMap.get(String(m.id));
      return {
        ...m,
        completed: completion?.completed ?? false,
        completionId: completion?.id,
        date: completion?.date,
      };
    });
    return NextResponse.json(milestonesWithCompletion);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 