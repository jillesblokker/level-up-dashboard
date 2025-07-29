import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../../lib/supabase/server-client';
import { grantReward } from '../../kingdom/grantReward';

// Helper to extract and verify Clerk JWT, returns userId or null
async function getUserIdFromRequest(request: Request): Promise<string | null> {
  try {
    const { userId } = getAuth(request as NextRequest);
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
        { 
          user_id: userId, 
          milestone_id: milestoneId
        }
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
    
    // If completing a milestone, fetch it to get rewards
    if (completed) {
      const { data: milestone, error: milestoneError } = await supabaseServer
        .from('milestones')
        .select('id, name, xp, gold')
        .eq('id', milestoneId)
        .single();
      if (milestoneError || !milestone) {
        console.error('[API/milestones/completion] Milestone not found:', milestoneError);
        return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
      }
      
      // Grant rewards for milestone completion
      if (milestone.xp && milestone.xp > 0) {
        await grantReward({
          userId,
          type: 'exp',
          relatedId: milestoneId,
          amount: milestone.xp,
          context: { gold: milestone.gold || 0, source: 'milestone_completion' }
        });
      }
      if (milestone.gold && milestone.gold > 0) {
        await grantReward({
          userId,
          type: 'gold',
          relatedId: milestoneId,
          amount: milestone.gold,
          context: { xp: milestone.xp || 0, source: 'milestone_completion' }
        });
      }
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