import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

export async function GET(request: Request) {
  try {
    // Secure Clerk JWT verification
    const { userId } = await getAuth(request as NextRequest);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized (Clerk JWT invalid or missing)' }, { status: 401 });
    }

    // Fetch all global milestones (no user_id filter needed for global definitions)
    const { data: allMilestones, error: milestonesError } = await supabaseServer
      .from('milestones')
      .select('*');
    if (milestonesError) {
      console.error('[Milestones] Error fetching milestones:', milestonesError);
      return NextResponse.json({ error: milestonesError.message }, { status: 500 });
    }
    
    // Fetch user's milestone completions
    const { data: completions, error: completionError } = await supabaseServer
      .from('milestone_completion')
      .select('*')
      .eq('user_id', userId);
    if (completionError) {
      console.error('[Milestones] Error fetching completions:', completionError);
      return NextResponse.json({ error: completionError.message }, { status: 500 });
    }
    
    // Merge completion state
    const completionMap = new Map();
    completions?.forEach((c: any) => completionMap.set(String(c.milestone_id), c));
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
    console.error('[Milestones Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, category, difficulty, xp, gold, target, icon } = body;
    
    if (!name || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Secure Clerk JWT verification
    const { userId } = await getAuth(request as NextRequest);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized (Clerk JWT invalid or missing)' }, { status: 401 });
    }
    
    // Create new milestone (global definition)
    const { data: newMilestone, error } = await supabaseServer
      .from('milestones')
      .insert([
        {
          name,
          description: description || name,
          category,
          difficulty: difficulty || 'medium',
          xp: xp || 0,
          gold: gold || 0,
          target: target || 1,
          icon: icon || '🎯',
        },
      ])
      .select()
      .single();
      
    if (error) {
      console.error('[Milestones POST] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(newMilestone);
  } catch (error) {
    console.error('[Milestones POST] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Missing milestone ID' }, { status: 400 });
    }
    
    // Secure Clerk JWT verification
    const { userId } = await getAuth(request as NextRequest);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized (Clerk JWT invalid or missing)' }, { status: 401 });
    }
    
    // Delete milestone (only if it's a global milestone)
    const { error } = await supabaseServer
      .from('milestones')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('[Milestones DELETE] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Milestones DELETE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 