import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../../lib/supabase/server-client';

// Helper to extract and verify Clerk JWT, returns userId or null
async function getUserIdFromRequest(request: Request): Promise<string | null> {
  try {
    const { userId } = await getAuth(request as NextRequest);
    console.log('[Challenges Completion API] getUserIdFromRequest - Clerk userId:', userId);
    return userId || null;
  } catch (e) {
    console.error('[Clerk] JWT verification failed:', e);
    return null;
  }
}

// Create or update challenge completion
export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { challengeId } = await request.json();
    if (!challengeId) {
      return NextResponse.json({ error: 'Missing challengeId' }, { status: 400 });
    }
    // Use Netherlands timezone (Europe/Amsterdam) for challenge completion
    const now = new Date();
    const netherlandsDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Amsterdam',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);
    const today = netherlandsDate; // Format: YYYY-MM-DD

    const { data, error } = await supabaseServer
      .from('challenge_completion')
      .upsert([
        {
          user_id: userId,
          challenge_id: challengeId,
          completed: true,
          date: today // Use Netherlands timezone date format (YYYY-MM-DD)
        }
      ], { onConflict: 'user_id,challenge_id' })
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update challenge completion status
export async function PUT(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { challengeId, completed } = await request.json();
    if (!challengeId || typeof completed !== 'boolean') {
      return NextResponse.json({ error: 'Missing challengeId or completed' }, { status: 400 });
    }
    const { data, error } = await supabaseServer
      .from('challenge_completion')
      .update({ completed })
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get all challenge completions for user
export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data, error } = await supabaseServer
      .from('challenge_completion')
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