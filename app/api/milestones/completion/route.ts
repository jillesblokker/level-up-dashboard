import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../../pages/api/server-client';

// Create or update milestone completion
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
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
    const { userId } = await auth();
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
    const { userId } = await auth();
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