import { supabaseServer } from '@/lib/supabase/server-client';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function GET(request: Request) {
  try {
    // Add timeout handling
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 3000); // 3 second timeout
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
      
      // DAILY HABIT TRACKING APPROACH: Show challenges as completed only if completed=true for TODAY
      const completedChallenges = new Map();
      // Use Netherlands timezone (Europe/Amsterdam) for challenge display
      const now = new Date();
      // Use Intl.DateTimeFormat for reliable timezone conversion
      const netherlandsDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Amsterdam',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(now);
      const today = netherlandsDate; // Format: YYYY-MM-DD
      
      if (completions) {
        console.log('[Challenges API] Processing challenge completions for daily habit tracking:', {
          totalRecords: completions.length,
          today: today,
          sampleRecords: completions.slice(0, 3).map(c => ({
            challenge_id: c.challenge_id,
            completed: c.completed,
            date: c.date
          }))
        });
        
        // Group completions by challenge_id to handle multiple completions of the same challenge
        const challengeCompletionGroups = new Map();
        
        completions.forEach((completion: any) => {
          if (!challengeCompletionGroups.has(completion.challenge_id)) {
            challengeCompletionGroups.set(completion.challenge_id, []);
          }
          challengeCompletionGroups.get(completion.challenge_id).push(completion);
        });
        
        // For each challenge, find TODAY'S completion record
        challengeCompletionGroups.forEach((completions, challengeId) => {
          // Find completion record for today
          const todayCompletion = completions.find((c: any) => {
            const completionDate = c.date; // challenge_completion uses DATE field
            return completionDate === today;
          });
          
          console.log('[Challenges API] Processing challenge for today:', {
            challenge_id: challengeId,
            total_completions: completions.length,
            today_completion: todayCompletion ? {
              completed: todayCompletion.completed,
              date: todayCompletion.date
            } : null
          });
          
          // Show as completed ONLY if there's a completion record for today with completed=true
          if (todayCompletion && todayCompletion.completed === true) {
            completedChallenges.set(challengeId, {
              completed: true,
              date: todayCompletion.date,
              completionId: todayCompletion.id // Store the completion record ID
            });
          }
        });
      }

      console.log('[Challenges API] Completed challenges map:', Array.from(completedChallenges.entries()));
      console.log('[Challenges API] Today date:', today);
      console.log('[Challenges API] All completions:', completions?.map(c => ({
        challenge_id: c.challenge_id,
        completed: c.completed,
        date: c.date,
        is_today: c.date === today
      })));
      console.log('[Challenges API] Total completions found:', completions?.length || 0);
      console.log('[Challenges API] Completed challenges count:', completedChallenges.size);
      
      // Merge completion state using daily habit tracking
      const challengesWithCompletion = (allChallenges || []).map((c: any) => {
        // Find completion by challenge ID
        const completion = completedChallenges.get(c.id);
        const isCompleted = completion ? completion.completed : false;
        const completionDate = completion ? completion.date : null;
        
        console.log('[Challenges API] Mapping challenge:', {
          challengeId: c.id,
          challengeName: c.name,
          challengeCategory: c.category,
          hasCompletion: !!completion,
          isCompleted,
          completionDate,
          completionData: completion
        });
        
        return {
          ...c,
          completed: isCompleted,
          completionId: completion?.completionId,
          date: completionDate,
        };
      });
      
      console.log('[Challenges API] Final challenges with completion:', challengesWithCompletion.slice(0, 3).map(c => ({
        id: c.id,
        name: c.name,
        completed: c.completed,
        date: c.date
      })));
      
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
      // Use Netherlands timezone (Europe/Amsterdam) for challenge completion
      const now = new Date();
      const netherlandsDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Amsterdam',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(now);
      const today = netherlandsDate; // Format: YYYY-MM-DD
      
      if (completed) {
        // Mark challenge as completed for TODAY
        const { data, error } = await supabase
          .from('challenge_completion')
          .upsert({
            user_id: userId,
            challenge_id: challengeId,
            completed: true,
            date: today, // Use today's date in Netherlands timezone
          }, { onConflict: 'user_id,challenge_id,date' })
          .select()
          .single();
          
        if (error) {
          console.error('[Challenges PUT] Error upserting completion:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        
        return data;
      } else {
        // Mark challenge as not completed for TODAY (delete today's completion record)
        const { error } = await supabase
          .from('challenge_completion')
          .delete()
          .eq('user_id', userId)
          .eq('challenge_id', challengeId)
          .eq('date', today); // Only delete today's completion
          
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

// PATCH: Update a specific challenge
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, category, difficulty, xp, gold } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 });
    }

    // Use proper authentication
    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      console.log('[Challenges PATCH] Updating challenge:', id, 'for user:', userId);
      
      // Update the challenge in the database
      const { data, error } = await supabase
        .from('challenges')
        .update({
          name: name || undefined,
          description: description || undefined,
          category: category || undefined,
          difficulty: difficulty || undefined,
          xp: xp || undefined,
          gold: gold || undefined,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[Challenges PATCH] Database error:', error);
        throw error;
      }

      console.log('[Challenges PATCH] Successfully updated challenge:', data);
      return { success: true, data };
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Challenges PATCH] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
