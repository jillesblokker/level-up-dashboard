import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../pages/api/server-client';

export async function GET(req: NextRequest) {
  try {
    console.log('[Milestones Direct] Starting request');
    
    // Use the same auth pattern as working endpoints
    const { userId } = await getAuth(req);
    console.log('[Milestones Direct] Got userId:', userId);
    
    if (!userId) {
      console.log('[Milestones Direct] No userId, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Milestones Direct] About to query milestones table');
    
    // Fetch all milestones
    const { data: allMilestones, error: milestonesError } = await supabaseServer
      .from('milestones')
      .select('*');
    
    console.log('[Milestones Direct] Milestones query result:', { 
      dataLength: allMilestones?.length, 
      error: milestonesError?.message 
    });
    
    if (milestonesError) {
      console.error('[Milestones Direct] Milestones error:', milestonesError);
      return NextResponse.json({ error: milestonesError.message }, { status: 500 });
    }

    console.log('[Milestones Direct] About to query checked_milestones table');
    
    // Fetch user's milestone completions
    const { data: completions, error: completionError } = await supabaseServer
      .from('checked_milestones')
      .select('*')
      .eq('user_id', userId);
      
    console.log('[Milestones Direct] Checked milestones query result:', { 
      dataLength: completions?.length, 
      error: completionError?.message 
    });

    if (completionError) {
      console.error('[Milestones Direct] Completions error:', completionError);
      return NextResponse.json({ error: completionError.message }, { status: 500 });
    }

    // Merge completion state
    const completionMap = new Map();
    completions?.forEach((c: any) => completionMap.set(String(c.milestone_id), c));
    const milestonesWithCompletion = (allMilestones || []).map((m: any) => {
      const completion = completionMap.get(String(m.id));
      return {
        ...m,
        completed: !!completion,
        completionId: completion?.id,
        checked_at: completion?.checked_at,
      };
    });

    console.log('[Milestones Direct] Returning merged data, count:', milestonesWithCompletion.length);
    return NextResponse.json(milestonesWithCompletion);

  } catch (error) {
    console.error('[Milestones Direct Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 