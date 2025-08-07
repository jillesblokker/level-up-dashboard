import { supabaseServer } from '@/lib/supabase/server-client';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function GET(request: Request) {
  try {
    // Use authenticated Supabase query with proper Clerk JWT verification
    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      // Fetch all challenges
      const { data: allChallenges, error: challengesError } = await supabase
        .from('challenges')
        .select('*');
      if (challengesError) {
        throw challengesError;
      }
      
      // Fetch user's challenge completions
      const { data: completions, error: completionError } = await supabase
        .from('challenge_completion')
        .select('*')
        .eq('user_id', userId);
      if (completionError) {
        throw completionError;
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
      
      return challengesWithCompletion;
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Challenges Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { challengeId, completed } = body;
    
    if (!challengeId || completed === undefined) {
      return NextResponse.json({ error: 'Missing challengeId or completed status' }, { status: 400 });
    }

    // TEMPORARILY DISABLE AUTHENTICATION FOR TESTING
    // const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
    const userId = 'test-user-id'; // Use test user ID for now
    
    if (completed) {
      // Mark challenge as completed
      const { data, error } = await supabaseServer
        .from('challenge_completion')
        .upsert({
          user_id: userId,
          challenge_id: challengeId,
          completed: true,
          date: new Date().toISOString(),
        }, { onConflict: 'user_id,challenge_id' })
        .select()
        .single();
        
      if (error) {
        console.error('[Challenges PUT] Error upserting completion:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json(data);
    } else {
      // Mark challenge as not completed (delete the completion record)
      const { error } = await supabaseServer
        .from('challenge_completion')
        .delete()
        .eq('user_id', userId)
        .eq('challenge_id', challengeId);
        
      if (error) {
        console.error('[Challenges PUT] Error deleting completion:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({ success: true });
    }
    // });

    // if (!result.success) {
    //   return NextResponse.json({ error: result.error }, { status: 401 });
    // }

    // return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Challenges PUT] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
