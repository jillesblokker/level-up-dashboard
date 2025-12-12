import { supabaseServer } from '@/lib/supabase/server-client';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';
import logger from '@/lib/logger';
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

    // Use authenticated Supabase query with proper Clerk JWT verification
    const queryPromise = authenticatedSupabaseQuery(request, async (supabase, userId) => {
      // Fetch all challenges
      const { data: allChallenges, error: challengesError } = await supabase
        .from('challenges')
        .select('*');
      if (challengesError) {
        throw challengesError;
      }

      // Use Netherlands timezone (Europe/Amsterdam) for challenge display
      const today = formatNetherlandsDate(new Date()) || new Date().toISOString().slice(0, 10);

      logger.info(`Querying for today: ${today}, userId: ${userId}`, 'Challenges API');

      // Fetch all challenge completions for the user, then filter by date in code
      // This avoids type casting issues between DATE column and string comparison
      const { data: allCompletions, error: completionError } = await supabase
        .from('challenge_completion')
        .select('*')
        .eq('user_id', userId);
      if (completionError) {
        throw completionError;
      }

      logger.info(`All completions fetched: ${allCompletions?.length || 0}`, 'Challenges API');
      if (allCompletions?.length) {
        logger.info('Sample completions:', 'Challenges API', JSON.stringify(allCompletions.slice(0, 3).map((c: any) => ({
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
          logger.info(`✅ Found today match: challenge_id=${completion.challenge_id}, dbDate=${dbDate}, todayDate=${todayDate}, completed=${completion.completed}`, 'Challenges API');
        }

        return matches;
      });

      logger.info(`Today's completions after filtering: ${todaysCompletions.length}`, 'Challenges API');

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
        logger.warn(`⚠️ No completions found for today: ${today}`, 'Challenges API');
        logger.info(`Available dates in completions: ${JSON.stringify([...new Set((allCompletions || []).map((c: any) => String(c.date).split('T')[0]))])}`, 'Challenges API');
      }

      logger.info(`Completed challenges map: ${JSON.stringify(Array.from(completedChallenges.entries()))}`, 'Challenges API');
      logger.info(`Today date: ${today}`, 'Challenges API');
      logger.info(`All completions (today only): ${JSON.stringify(todaysCompletions?.map((c: any) => ({
        challenge_id: c.challenge_id,
        completed: c.completed,
        date: c.date,
        is_today: true
      })))}`, 'Challenges API');
      logger.info(`Total completions found: ${todaysCompletions?.length || 0}`, 'Challenges API');
      logger.info(`Completed challenges count: ${completedChallenges.size}`, 'Challenges API');

      // Merge completion state using daily habit tracking
      const challengesWithCompletion = (allChallenges || []).map((c: any) => {
        // Find completion by challenge ID
        const completion = completedChallenges.get(c.id);
        const isCompleted = completion ? completion.completed : false;
        const completionDate = completion ? completion.date : null;

        logger.info(`Mapping challenge: ${JSON.stringify({
          challengeId: c.id,
          challengeName: c.name,
          challengeCategory: c.category,
          hasCompletion: !!completion,
          isCompleted,
          completionDate,
          completionData: completion
        })}`, 'Challenges API');

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

      logger.info(`Final challenges with completion: ${JSON.stringify(challengesWithCompletion.slice(0, 3).map(c => ({
        id: c.id,
        name: c.name,
        completed: c.completed,
        date: c.date
      })))}`, 'Challenges API');

      return {
        data: challengesWithCompletion,
        debug_all_completions: allCompletions
      };
    });

    // Race between timeout and query
    const result = await Promise.race([queryPromise, timeoutPromise]) as any;

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    // Log debug info to server console instead of breaking the response structure
    // result.data contains { data: challenges, debug_all_completions: completions }
    const { data: challenges, debug_all_completions } = result.data;

    logger.info(`DEBUG ALL COMPLETIONS: ${JSON.stringify(debug_all_completions)}`, 'Challenges API');

    return NextResponse.json(challenges, {
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
        logger.info(`Upserting completion: userId=${userId}, challengeId=${challengeId}, today=${today}, dateType=${typeof today}`, 'Challenges PUT');

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

        logger.info(`Saving completion with date: ${today}`, 'Challenges PUT');

        if (error) {
          logger.error(`❌ Error upserting completion: ${error.message}`, 'Challenges PUT');
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        logger.info(`✅ Successfully saved completion: id=${data?.id}, challenge_id=${data?.challenge_id}, completed=${data?.completed}, date=${data?.date}, dateType=${typeof data?.date}`, 'Challenges PUT');

        // Verify the data was actually saved by querying it back
        const { data: verifyData, error: verifyError } = await supabase
          .from('challenge_completion')
          .select('*')
          .eq('user_id', userId)
          .eq('challenge_id', challengeId)
          .eq('date', today)
          .single();

        if (verifyError) {
          logger.error(`⚠️ Verification query failed: ${verifyError.message}`, 'Challenges PUT');
        } else {
          logger.info(`✅ Verification successful - data exists in DB: id=${verifyData?.id}, date=${verifyData?.date}, completed=${verifyData?.completed}`, 'Challenges PUT');
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
        logger.info(`Received challenges data for user: ${userId}, Count: ${challenges.length}`, 'Challenges POST');
        return { success: true, message: 'Challenges data received' };
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 401 });
      }
      return NextResponse.json(result.data);
    }

    // Handle single challenge creation
    const { name, instructions, description, category, difficulty, setsReps, tips, weight } = body;

    if (!name || !category) {
      return NextResponse.json({ error: 'Missing required fields (name, category)' }, { status: 400 });
    }

    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      logger.info(`Creating new challenge: ${name} for user: ${userId}`, 'Challenges POST');

      // Map frontend fields to DB columns
      // Note: 'instructions' from frontend maps to 'description' in DB usually, 
      // but we'll prefer 'description' if provided.
      // 'setsReps' maps to 'sets' or 'reps' depending on schema, we'll try 'sets' as a generic container
      const rewards = calculateRewards(difficulty || 'medium');
      const challengeData = {
        name,
        description: description || instructions || '',
        category,
        difficulty: difficulty || 'medium',
        xp: rewards.xp,
        gold: rewards.gold,
        sets: setsReps || null, // Storing sets/reps in 'sets' column
        tips: tips || null,
        weight: weight || null,
        // We might want to mark this as a user-created challenge if the schema supports it
        // e.g. created_by: userId
      };

      const { data: newChallenge, error } = await supabase
        .from('challenges')
        .insert([challengeData])
        .select()
        .single();

      if (error) {
        logger.error(`Database error creating challenge: ${error.message}`, 'Challenges POST');
        throw error;
      }

      logger.info(`Successfully created challenge: ${newChallenge.id}`, 'Challenges POST');
      return { success: true, data: newChallenge };
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    logger.error(`Error in POST: ${error}`, 'Challenges POST');
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
      logger.info(`Updating challenge: ${id} for user: ${userId}`, 'Challenges PATCH');

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
        logger.error(`Database error: ${error.message}`, 'Challenges PATCH');
        throw error;
      }

      logger.info(`Successfully updated challenge: ${JSON.stringify(data)}`, 'Challenges PATCH');
      return { success: true, data };
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    logger.error(`Error: ${error}`, 'Challenges PATCH');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
