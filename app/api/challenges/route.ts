import { supabaseServer } from '@/lib/supabase/server-client';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

import { calculateRewards } from '@/lib/game-logic';

const netherlandsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Amsterdam',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

function formatNetherlandsDate(input?: string | Date | null) {
  if (!input) return null;

  if (typeof input === 'string') {
    const normalized = input.includes('T') ? (input.split('T')[0] ?? input) : input;
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      return normalized;
    }

    const parsed = new Date(input);
    if (!Number.isNaN(parsed.getTime())) {
      return netherlandsFormatter.format(parsed);
    }

    return normalized;
  }

  return netherlandsFormatter.format(input);
}

export async function GET(request: Request) {
  try {
    // Add timeout handling
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 15000); // 15 second timeout
    });

    // Authenticate user directly
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseServer;

    try {
      // SECURITY: Set user context for RLS
      await supabase.rpc('set_user_context', { user_id: userId });
    } catch (e) {
      // Ignore context error if RLS is disabled or RPC missing, but log it
      console.warn('Failed to set user context:', e);
    }

    // Fetch all challenges
    const { data: allChallenges, error: challengesError } = await supabase
      .from('challenges')
      .select('*');
    if (challengesError) {
      throw challengesError;
    }

    // Use Netherlands timezone (Europe/Amsterdam) for challenge display
    const today = formatNetherlandsDate(new Date()) || new Date().toISOString().slice(0, 10);

    console.log(`[Challenges API] Querying for today: ${today}, userId: ${userId}`);

    // Fetch all challenge completions for the user, then filter by date in code
    // This avoids type casting issues between DATE column and string comparison
    const { data: allCompletions, error: completionError } = await supabase
      .from('challenge_completion')
      .select('*')
      .eq('user_id', userId);
    if (completionError) {
      throw completionError;
    }

    console.log(`[Challenges API] All completions fetched: ${allCompletions?.length || 0}`);
    if (allCompletions?.length) {
      console.log('[Challenges API] Sample completions:', JSON.stringify(allCompletions.slice(0, 3).map((c: any) => ({
        challenge_id: c.challenge_id,
        completed: c.completed,
        date: c.date,
        date_type: typeof c.date,
        date_string: String(c.date)
      }))));
    }

    // Filter to only today's completions, normalizing dates for comparison
    const todaysCompletions = (allCompletions || []).filter((completion: any) => {
      if (!completion.date) return false;

      // Normalize both dates to YYYY-MM-DD for comparison
      // The database date might be a full ISO string or just a date string
      const dbDate = String(completion.date).split('T')[0];
      const todayDate = today.split('T')[0];

      const matches = dbDate === todayDate;

      if (matches) {
        console.log(`[Challenges API] ✅ Found today match: challenge_id=${completion.challenge_id}, dbDate=${dbDate}, todayDate=${todayDate}, completed=${completion.completed}`);
      }

      return matches;
    });

    console.log(`[Challenges API] Today's completions after filtering: ${todaysCompletions.length}`);

    const completedChallenges = new Map();

    if (todaysCompletions.length > 0) {
      todaysCompletions.forEach((completion: any) => {
        if (completion.completed === true) {
          completedChallenges.set(completion.challenge_id, {
            completed: true,
            date: String(completion.date).split('T')[0],
            completionId: completion.id
          });
        }
      });
    } else {
      console.warn(`[Challenges API] ⚠️ No completions found for today: ${today}`);
      console.log(`[Challenges API] Available dates in completions: ${JSON.stringify([...new Set((allCompletions || []).map((c: any) => String(c.date).split('T')[0]))])}`);
    }

    console.log(`[Challenges API] Completed challenges map: ${JSON.stringify(Array.from(completedChallenges.entries()))}`);
    console.log(`[Challenges API] Today date: ${today}`);
    console.log(`[Challenges API] All completions (today only): ${JSON.stringify(todaysCompletions?.map((c: any) => ({
      challenge_id: c.challenge_id,
      completed: c.completed,
      date: c.date,
      is_today: true
    })))}`);
    console.log(`[Challenges API] Total completions found: ${todaysCompletions?.length || 0}`);
    console.log(`[Challenges API] Completed challenges count: ${completedChallenges.size}`);

    // Merge completion state using daily habit tracking
    const challengesWithCompletion = (allChallenges || []).map((c: any) => {
      // Find completion by challenge ID
      const completion = completedChallenges.get(c.id);
      const isCompleted = completion ? completion.completed : false;
      const completionDate = completion ? completion.date : null;

      // Reduce log spam
      if (isCompleted) {
        console.log(`[Challenges API] Mapping challenge: ${JSON.stringify({
          challengeId: c.id,
          challengeName: c.name,
          hasCompletion: !!completion,
          isCompleted
        })}`);
      }

      return {
        ...c,
        completed: isCompleted,
        completionId: completion?.completionId,
        date: completionDate,
        completion_debug: {
          isCompleted,
          completionDate,
          today,
          matches: completionDate === today,
          raw_completion: completion
        }
      };
    });

    console.log(`[Challenges API] Final challenges with completion sample: ${JSON.stringify(challengesWithCompletion.slice(0, 3).map(c => ({
      id: c.id,
      name: c.name,
      completed: c.completed,
      date: c.date
    })))}`);

    const result = {
      data: {
        data: challengesWithCompletion,
        debug_all_completions: allCompletions
      },
      success: true
    };

    // Log debug info
    console.log(`[Challenges API] DEBUG ALL COMPLETIONS: ${JSON.stringify(allCompletions)}`);

    return NextResponse.json(challengesWithCompletion, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });


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

// PUT: Toggle completion status
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
      const today = formatNetherlandsDate(new Date()) || new Date().toISOString().slice(0, 10);

      if (completed) {
        // Mark challenge as completed for TODAY
        console.log(`[Challenges PUT] Upserting completion: userId=${userId}, challengeId=${challengeId}, today=${today}`);

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

        console.log(`[Challenges PUT] Saving completion with date: ${today}`);

        if (error) {
          console.error(`[Challenges PUT] ❌ Error upserting completion: ${error.message}`);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log(`[Challenges PUT] ✅ Successfully saved completion: id=${data?.id}, completed=${data?.completed}, date=${data?.date}`);

        // Verify the data was actually saved by querying it back
        const { data: verifyData, error: verifyError } = await supabase
          .from('challenge_completion')
          .select('*')
          .eq('user_id', userId)
          .eq('challenge_id', challengeId)
          .eq('date', today)
          .single();

        if (verifyError) {
          console.error(`[Challenges PUT] ⚠️ Verification query failed: ${verifyError.message}`);
        } else {
          console.log(`[Challenges PUT] ✅ Verification successful - data exists in DB: id=${verifyData?.id}`);
        }

        return data;
      } else {
        // Mark challenge as not completed for TODAY (delete today's completion record)
        const { error } = await supabase
          .from('challenge_completion')
          .delete()
          .eq('user_id', userId)
          .eq('challenge_id', challengeId)
          .eq('date', today);

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

    return NextResponse.json(result.data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('[Challenges PUT] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


// POST: Create a new challenge or handle bulk migration
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Handle bulk migration (legacy/seed support)
    if (body.challenges && Array.isArray(body.challenges)) {
      const { challenges } = body;

      const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
        console.log(`[Challenges POST] Received challenges data for user: ${userId}, Count: ${challenges.length}`);
        return { success: true, message: 'Challenges data received' };
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 401 });
      }
      return NextResponse.json(result.data);
    }

    // Handle single challenge creation
    const { name, instructions, description, category, difficulty, setsReps, tips, weight, mandate_period, mandate_count } = body;

    if (!name || !category) {
      return NextResponse.json({ error: 'Missing required fields (name, category)' }, { status: 400 });
    }

    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      console.log(`[Challenges POST] Creating new challenge: ${name} for user: ${userId}`);

      // Map frontend fields to DB columns
      const rewards = calculateRewards(difficulty || 'medium');
      const challengeData = {
        name,
        description: description || instructions || '',
        category,
        difficulty: difficulty || 'medium',
        xp: rewards.xp,
        gold: rewards.gold,
        sets: setsReps || null,
        tips: tips || null,
        weight: weight || null,
        mandate_period: mandate_period || 'daily',
        mandate_count: mandate_count || 1,
      };

      const { data: newChallenge, error } = await supabase
        .from('challenges')
        .insert([challengeData])
        .select()
        .single();

      if (error) {
        console.error(`[Challenges POST] Database error creating challenge: ${error.message}`);
        throw error;
      }

      console.log(`[Challenges POST] Successfully created challenge: ${newChallenge.id}`);
      return { success: true, data: newChallenge };
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error(`[Challenges POST] Error in POST: ${error}`);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update a specific challenge
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, category, difficulty } = body;

    if (!id) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 });
    }

    // Use proper authentication
    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      console.log(`[Challenges PATCH] Updating challenge: ${id} for user: ${userId}`);

      // Update the challenge in the database
      const { data, error } = await supabase
        .from('challenges')
        .update({
          name: name || undefined,
          description: description || undefined,
          category: category || undefined,
          difficulty: difficulty || undefined,
          xp: difficulty ? calculateRewards(difficulty).xp : undefined,
          gold: difficulty ? calculateRewards(difficulty).gold : undefined,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`[Challenges PATCH] Database error: ${error.message}`);
        throw error;
      }

      console.log(`[Challenges PATCH] Successfully updated challenge: ${JSON.stringify(data)}`);
      return { success: true, data };
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error(`[Challenges PATCH] Error: ${error}`);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
