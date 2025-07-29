import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function GET(req: NextRequest) {
  console.log('🚨 [MILESTONES-SIMPLE-API] ROUTE EXECUTED - VERSION CHECK 2024-01-15');
  console.log('🚨 [MILESTONES-SIMPLE-API] Request URL:', req.url);
  console.log('🚨 [MILESTONES-SIMPLE-API] Request method:', req.method);
  
  try {
    console.log('[Milestones Simple] Starting basic test');
    
    // Use authenticated Supabase query with proper Clerk JWT verification
    const result = await authenticatedSupabaseQuery(req, async (supabase, userId) => {
      console.log('[Milestones Simple] Got userId:', userId);
      
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
      console.log('[Milestones Simple] Auth failed:', result.error);
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    console.log('[Milestones Simple] Returning milestones:', result.data?.length || 0);
    return NextResponse.json(result.data || []);

  } catch (error) {
    console.error('[Milestones Simple] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 