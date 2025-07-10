import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../../pages/api/server-client';

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

// Create or update milestone completion
export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { milestoneId } = await request.json();
    if (!milestoneId) {
      return NextResponse.json({ error: 'Missing milestoneId' }, { status: 400 });
    }
    const { data, error } = await supabaseServer
      .from('milestone_completion')
      .upsert([
        { user_id: userId, milestone_id: milestoneId }
      ], { onConflict: 'user_id,milestone_id' })
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update milestone completion status
export async function PUT(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { milestoneId, completed } = await request.json();
    if (!milestoneId || typeof completed !== 'boolean') {
      return NextResponse.json({ error: 'Missing milestoneId or completed' }, { status: 400 });
    }
    const { data, error } = await supabaseServer
      .from('milestone_completion')
      .update({ completed })
      .eq('user_id', userId)
      .eq('milestone_id', milestoneId)
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get all milestone completions for user
export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data, error } = await supabaseServer
      .from('milestone_completion')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 