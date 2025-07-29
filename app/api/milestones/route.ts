import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function GET(request: Request) {
  try {
    // Use authenticated Supabase query with proper Clerk JWT verification
    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      // Fetch all milestones
      const { data: allMilestones, error: milestonesError } = await supabase
        .from('milestones')
        .select('*');
      if (milestonesError) {
        throw milestonesError;
      }
      
      // Fetch user's milestone completions
      const { data: completions, error: completionError } = await supabase
        .from('milestone_completion')
        .select('*')
        .eq('user_id', userId);
      if (completionError) {
        throw completionError;
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
      
      return milestonesWithCompletion;
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data);
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
    
    // Use authenticated Supabase query with proper Clerk JWT verification
    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      // Create new milestone
      const { data: newMilestone, error } = await supabase
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
        throw error;
      }
      
      return newMilestone;
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Milestones POST] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 