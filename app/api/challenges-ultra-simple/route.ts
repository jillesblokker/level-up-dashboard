import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Self-contained simplified logger
const logger = {
  info: (msg: string, ctx?: any) => console.log(`[Challenges API Info] ${msg}`, ctx || ''),
  error: (msg: string, ctx?: any) => console.error(`[Challenges API Error] ${msg}`, ctx || ''),
};

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
    // 1. Verify Auth using modern Clerk async helper
    const { userId } = await auth();

    if (!userId) {
      console.warn('[Challenges API] No userId found via auth()');
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
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { challengeId, completed } = body;

    if (!challengeId || completed === undefined) {
      return NextResponse.json({ error: 'Missing challengeId or completed status' }, { status: 400 });
    }

    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!;
    const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']!;
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

    const today = formatNetherlandsDate(new Date()) || new Date().toISOString().slice(0, 10);

    if (completed) {
      const { data, error } = await serviceClient.from('challenge_completion').upsert({
        user_id: userId,
        challenge_id: challengeId,
        completed: true,
        date: today,
      }, { onConflict: 'user_id,challenge_id,date' }).select().single();

      if (error) throw error;

      // --- Category Streak Logic ---
      try {
        // 1. Get the category of the challenge just completed
        const { data: challenge } = await serviceClient
          .from('challenges')
          .select('category')
          .eq('id', challengeId)
          .single();

        if (challenge && challenge.category) {
          const category = challenge.category;

          // 2. Fetch all challenges in this category
          const { data: catChallenges } = await serviceClient
            .from('challenges')
            .select('id')
            .eq('category', category);

          if (catChallenges && catChallenges.length > 0) {
            const challengeIds = catChallenges.map(c => c.id);

            // 3. Count completions for these challenges today
            const { count } = await serviceClient
              .from('challenge_completion')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', userId)
              .eq('date', today)
              .eq('completed', true)
              .in('challenge_id', challengeIds);

            // 4. If all are completed, update the streaks table
            if (count === catChallenges.length) {
              console.log(`[Streak] Category ${category} completed for user ${userId}`);

              const { data: existingStreak } = await serviceClient
                .from('streaks')
                .select('*')
                .eq('user_id', userId)
                .eq('category', category)
                .single();

              const yesterday = formatNetherlandsDate(new Date(Date.now() - 86400000));
              let newStreak = 1;

              if (existingStreak) {
                const lastCheckIn = formatNetherlandsDate(existingStreak.last_check_in);
                if (lastCheckIn === yesterday) {
                  newStreak = (existingStreak.current_streak || 0) + 1;
                } else if (lastCheckIn === today) {
                  newStreak = existingStreak.current_streak || 1;
                }
              }

              await serviceClient
                .from('streaks')
                .upsert({
                  user_id: userId,
                  category: category,
                  current_streak: newStreak,
                  last_check_in: new Date().toISOString()
                }, { onConflict: 'user_id,category' });
            }
          }
        }
      } catch (streakErr) {
        console.error('[Streak Error] Failed to update category streak:', streakErr);
      }
      // --- End Category Streak Logic ---

      return NextResponse.json(data);
    } else {
      const { error } = await serviceClient.from('challenge_completion').delete()
        .eq('user_id', userId)
        .eq('challenge_id', challengeId)
        .eq('date', today);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// Minimal POST implementation for completeness (if needed)
export async function POST(request: Request) {
  return NextResponse.json({ message: "Not implemented in simplified version" }, { status: 501 });
}

export async function PATCH(request: Request) {
  return NextResponse.json({ message: "Not implemented in simplified version" }, { status: 501 });
}
