import { supabaseServer } from '@/lib/supabase/server-client';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function GET(request: Request) {
  try {
    // Add timeout handling
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 8000); // 8 second timeout
    });

    // Use authenticated Supabase query with proper Clerk JWT verification
    const queryPromise = authenticatedSupabaseQuery(request, async (supabase, userId) => {
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

    // Race between timeout and query
    const result = await Promise.race([queryPromise, timeoutPromise]) as any;

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Challenges Error]', error);
    
    // Handle timeout specifically
    if (error instanceof Error && error.message === 'Request timeout') {
      return NextResponse.json(
        { error: 'Request timeout - please try again' }, 
        { status: 408 }
      );
    }
    
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

    // Use proper authentication
    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      if (completed) {
        // Mark challenge as completed
        const { data, error } = await supabase
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
        
        return data;
      } else {
        // Mark challenge as not completed (delete the completion record)
        const { error } = await supabase
          .from('challenge_completion')
          .delete()
          .eq('user_id', userId)
          .eq('challenge_id', challengeId);
          
        if (error) {
          console.error('[Challenges PUT] Error deleting completion:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        
        return { success: true };
      }
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Challenges PUT] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Handle bulk challenges data for migration
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { challenges } = body;
    
    if (!challenges || !Array.isArray(challenges)) {
      return NextResponse.json({ error: 'Invalid challenges data' }, { status: 400 });
    }

    // Use proper authentication
    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      // For now, just return success since challenges are typically seeded data
      // The actual challenge data is stored in the challenges table
      // User-specific completion data is handled by the PUT method
      console.log('[Challenges POST] Received challenges data for user:', userId, 'Count:', challenges.length);
      
      return { success: true, message: 'Challenges data received' };
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Challenges POST] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
