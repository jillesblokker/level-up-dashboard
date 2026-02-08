import { supabaseServer } from '@/lib/supabase/server-client';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';
import { apiLogger } from '@/lib/logger';
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
      apiLogger.warn('Failed to set user context:', e);
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

    apiLogger.debug(`Querying for today: ${today}, userId: ${userId}`);

    // Fetch all challenge completions for the user, then filter by date in code
    // This avoids type casting issues between DATE column and string comparison
    const { data: allCompletions, error: completionError } = await supabase
      .from('challenge_completion')
      .select('*')
      .eq('user_id', userId);
    if (completionError) {
      throw completionError;
    }

    apiLogger.debug(`All completions fetched: ${allCompletions?.length || 0}`);

    // Filter to only today's completions, normalizing dates for comparison
    const todaysCompletions = (allCompletions || []).filter((completion: Record<string, unknown>) => {
      if (!completion['date']) return false;

      // Normalize both dates to YYYY-MM-DD for comparison
      // The database date might be a full ISO string or just a date string
      const dbDate = String(completion['date']).split('T')[0];
      const todayDate = today.split('T')[0];

      return dbDate === todayDate;
    });

    apiLogger.debug(`Today's completions after filtering: ${todaysCompletions.length}`);

    const completedChallenges = new Map();

    if (todaysCompletions.length > 0) {
      todaysCompletions.forEach((completion: Record<string, unknown>) => {
        if (completion['completed'] === true) {
          completedChallenges.set(completion['challenge_id'], {
            completed: true,
            date: String(completion['date']).split('T')[0],
            completionId: completion['id']
          });
        }
      });
    } else {
      apiLogger.debug(`No completions found for today: ${today}`);
    }

    // Merge completion state using daily habit tracking
    const challengesWithCompletion = (allChallenges || []).map((c: Record<string, unknown>) => {
      // Find completion by challenge ID
      const completion = completedChallenges.get(c['id']);
      const isCompleted = completion ? completion.completed : false;
      const completionDate = completion ? completion.date : null;

      return {
        ...c,
        completed: isCompleted,
        completionId: completion?.completionId,
        date: completionDate,
      };
    });

    return NextResponse.json(challengesWithCompletion, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });


  } catch (error) {
    apiLogger.error('Challenges GET error:', error);

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
        apiLogger.debug(`Upserting completion: userId=${userId}, challengeId=${challengeId}, today=${today}`);

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
          apiLogger.error(`Error upserting completion: ${error.message}`);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        apiLogger.debug(`Successfully saved completion: id=${data?.id}`);
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
          apiLogger.error('Error deleting completion:', error);
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
    apiLogger.error('Challenges PUT error:', error);
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
        apiLogger.debug(`Received challenges data for user: ${userId}, Count: ${challenges.length}`);
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
      apiLogger.debug(`Creating new challenge: ${name} for user: ${userId}`);

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
        apiLogger.error(`Database error creating challenge: ${error.message}`);
        throw error;
      }

      apiLogger.debug(`Successfully created challenge: ${newChallenge.id}`);
      return { success: true, data: newChallenge };
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    apiLogger.error('Challenges POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update a specific challenge
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, category, difficulty, mandate_period, mandate_count } = body;

    if (!id) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 });
    }

    // Use proper authentication
    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      apiLogger.debug(`Updating challenge: ${id} for user: ${userId}`);

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
          mandate_period: mandate_period || undefined,
          mandate_count: mandate_count || undefined,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        apiLogger.error(`Database error updating challenge: ${error.message}`);
        throw error;
      }

      apiLogger.debug(`Successfully updated challenge: ${id}`);
      return { success: true, data };
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    apiLogger.error('Challenges PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
