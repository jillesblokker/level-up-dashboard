import { getAuth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { calculateRewards } from '@/lib/game-logic';

import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

// Force dynamic route to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    // 1. Verify Auth using standard Clerk helper
    // Cast to NextRequest to satisfy Clerk type requirements if needed
    const { userId } = getAuth(request as NextRequest);

    if (!userId) {
      console.warn('[Challenges API] No userId found via getAuth');
      return NextResponse.json({ error: 'Unauthorized - invalid session' }, { status: 401 });
    }

    // 2. Create fresh client (Service Role)
    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
    const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Challenges API] Missing env vars:', { url: !!supabaseUrl, key: !!supabaseServiceKey });
      return NextResponse.json({ error: 'Server configuration error: Missing Supabase credentials' }, { status: 500 });
    }

    const serviceClient = createClient(
      supabaseUrl,
      supabaseServiceKey,
      { auth: { persistSession: false } }
    );

    // 3. Fetch Challenges (Global)
    const { data: allChallenges, error: challengesError } = await serviceClient
      .from('challenges')
      .select('*');

    if (challengesError) throw challengesError;

    // 4. Fetch Completions (User)
    const { data: allCompletions, error: completionError } = await serviceClient
      .from('challenge_completion')
      .select('*')
      .eq('user_id', userId);

    if (completionError) throw completionError;

    // 5. Process Data
    const today = formatNetherlandsDate(new Date()) || new Date().toISOString().slice(0, 10);
    logger.info(`Querying for today: ${today}, userId: ${userId}`, 'Challenges API');

    // ... (rest of processing logic stays roughly the same, but needs to be adapted to not use return { data: ... })

    // Filter to only today's completions
    const todaysCompletions = (allCompletions || []).filter((completion: any) => {
      if (!completion.date) return false;
      const dbDate = String(completion.date).split('T')[0];
      const todayDate = today.split('T')[0];
      return dbDate === todayDate;
    });

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
    }

    // Merge completion state
    const challengesWithCompletion = (allChallenges || []).map((c: any) => {
      const completion = completedChallenges.get(c.id);
      return {
        ...c,
        completed: completion ? completion.completed : false,
        completionId: completion?.completionId,
        date: completion ? completion.date : null,
        completion_debug: {
          isCompleted: !!completion,
          completionDate: completion?.date,
          today
        }
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
    // ... catch block handles response
    console.error('[Challenges API Error]', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
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
      const isAuthError = result.error?.includes('Authentication') || result.error?.includes('JWT');
      const status = isAuthError ? 401 : 500;
      return NextResponse.json({ error: result.error }, { status });
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
