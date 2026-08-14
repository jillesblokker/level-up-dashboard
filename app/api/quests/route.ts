import { logger } from "@/lib/logger";
// TROUBLESHOOTING: If you get a 500 error, check the following:
// 1. Are NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set in your environment? (Check .env and restart server)
// 2. Do the tables 'quests', 'quest_completion', and 'character_stats' exist in your Supabase database, with the expected columns?
// 3. Check your server logs for error output after 'Quests error:' or 'Error fetching quests:'
// 4. Test your API with curl or Postman to see the error response.
// 5. If you see 'Supabase client not initialized', your env vars are missing or incorrect.
//
// Health check endpoint: GET /api/quests?health=1

import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import { QuestResponse } from '@/types/quest';
import { env } from '@/lib/env';
import { auth, getAuth, clerkClient } from '@clerk/nextjs/server';
import { defaultQuests } from '@/lib/quest-sample-data';
import { formatDate, getToday } from '@/lib/date-utils';
import { logKingdomEvent } from '../kingdom/logKingdomEvent';
import { grantReward } from '../kingdom/grantReward';
import { supabaseServer } from '../../../lib/supabase/server-client';

const supabase = supabaseServer;

// Disable Next.js caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Define schemas for request validation
const questCompletionSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  questId: z.string().optional() // Optional for backward compatibility
});

const questUpdateSchema = z.object({
  title: z.string().min(1),
  completed: z.boolean(),
  questId: z.string().optional() // Optional for backward compatibility
});

// Helper to extract and verify Clerk JWT, returns userId or null
async function getUserIdFromRequest(request: Request): Promise<string | null> {
  try {
    const { verifyClerkJWT } = await import('@/lib/supabase/jwt-verification');
    const authResult = await verifyClerkJWT(request);
    if (authResult?.userId) return authResult.userId;

    const { userId: authUserId } = await auth();
    if (authUserId) return authUserId;

    const { userId: getAuthUserId } = await getAuth(request as NextRequest);
    if (getAuthUserId) return getAuthUserId;

    return null;
  } catch (e) {
    logger.error('[Clerk] JWT verification failed:', e);
    return null;
  }
}

// Health check endpoint
export async function GET(request: Request) {
  logger.debug('[Quests API] GET request received at:', new Date().toISOString());
  logger.debug('[Quests API] Request URL:', request.url);
  try {
    const { searchParams } = new URL(request.url);
    const allTime = searchParams.get('all_time') === '1';
    if (searchParams.get('health') === '1') {
      return NextResponse.json({
        status: 'healthy',
        supabaseUrl: process.env['NEXT_PUBLIC_SUPABASE_URL'],
        supabaseServiceRoleKeyPresent: !!process.env['SUPABASE_SERVICE_ROLE_KEY'],
        supabaseClientInitialized: !!supabase,
      });
    }

    // Secure Clerk JWT verification
    const userId = await getUserIdFromRequest(request);

    // Diagnostic endpoint to check quest_completion table directly
    if (searchParams.get('debug') === '1') {
      try {
        const { data: debugCompletions, error: debugError } = await supabase
          .from('quest_completion')
          .select('*')
          .eq('user_id', userId);

        // Also fetch challenges to compare
        const { data: challenges, error: challengesError } = await supabase
          .from('challenges')
          .select('id, name, title');

        // Show detailed comparison
        const detailedCompletions = debugCompletions?.map(completion => ({
          completion_id: completion.id,
          quest_id: completion.quest_id,
          completed: completion.completed,
          completed_at: completion.completed_at,
          user_id: completion.user_id,
          // Check if this quest_id matches any challenge
          matches_challenge_id: challenges?.some(c => c.id === completion.quest_id),
          matches_challenge_name: challenges?.some(c => c.name === completion.quest_id),
          challenge_ids: challenges?.map(c => c.id).slice(0, 3), // First 3 challenge IDs
          challenge_names: challenges?.map(c => c.name).slice(0, 3) // First 3 challenge names
        })) || [];

        return NextResponse.json({
          debug: true,
          userId,
          completions: detailedCompletions,
          error: debugError,
          count: debugCompletions?.length || 0,
          challenges_count: challenges?.length || 0,
          sample_challenges: challenges?.slice(0, 3) || []
        });
      } catch (debugErr) {
        return NextResponse.json({
          debug: true,
          error: String(debugErr)
        });
      }
    }
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized (Clerk JWT invalid or missing)' }, { status: 401 });
    }
    if (!process.env['NEXT_PUBLIC_SUPABASE_URL'] || !process.env['SUPABASE_SERVICE_ROLE_KEY']) {
      logger.error('[QUESTS][GET] Supabase env vars missing:', { supabaseUrl: process.env['NEXT_PUBLIC_SUPABASE_URL'], supabaseServiceRoleKey: process.env['SUPABASE_SERVICE_ROLE_KEY'] });
      return NextResponse.json({ error: 'Supabase environment variables missing.' }, { status: 500 });
    }
    if (!supabase) {
      logger.error('[QUESTS][GET] Supabase client not initialized.');
      return NextResponse.json({ error: 'Supabase client not initialized.' }, { status: 500 });
    }

    // Fetching quest definitions from quests table
    // Filter to show: 
    // 1. User's own quests (user_id = userId)
    // 2. Global quests (user_id IS NULL AND is_active = true)

    // Note: To support complex OR logic like (A) OR (B AND C), we often need .or() with proper syntax.
    // supabase .or('user_id.eq.val, and(user_id.is.null, is_active.eq.true)') might not work directly in all clients.
    // Simpler approach: Fetch ALL relevant quests (user's + all globals) and filter active globals in memory if needed, 
    // OR use a raw query if we were using pg.
    // Let's try to fetch all nulls and filter.

    let { data: rawQuests, error: questsError } = await supabase
      .from('quests')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${userId}`);

    if (questsError) {
      logger.error('Quests fetch error:', questsError);
      return NextResponse.json({ error: questsError.message }, { status: 500 });
    }

    // specific filter: if global (no user_id), must be active. If specific user quest, show it (or should we respect active there too?)
    // Let's assume user-specific quests are always active unless stated otherwise, but global ones often have an off-switch.
    let quests = (rawQuests || []).filter((q: any) => {
      if (!q.user_id) {
        // Global quest
        return q.is_active !== false; // Default to true if undefined
      }
      return true;
    });

    // --- AUTO-SEEDING FOR NEW USERS ---
    // If no quests are found for this user, seed the default onboarding quests
    if (quests && quests.length === 0) {
      logger.debug(`[Quests API] No quests found for user ${userId}. Seeding defaults...`);
      try {
        
        const seededQuests = defaultQuests.map(q => ({
          user_id: userId,
          name: (q as any).title || (q as any).name,
          description: q.description,
          category: q.category,
          difficulty: q.difficulty,
          xp_reward: (q as any).rewards?.xp || 50,
          gold_reward: (q as any).rewards?.gold || 25,
          is_active: true
        }));

        const { data: newQuests, error: seedError } = await supabase
          .from('quests')
          .insert(seededQuests)
          .select();

        if (seedError) {
          logger.error('[Quests API] Seeding error:', seedError);
        } else if (newQuests) {
          logger.debug(`[Quests API] Successfully seeded ${newQuests.length} quests`);
          quests = newQuests;
        }
      } catch (seedCatch) {
        logger.error('[Quests API] Unexpected seeding catch:', seedCatch);
      }
    }

    // Fetch sender names for friend quests
    if (quests) {
      const senderIds = [...new Set(quests.filter(q => q.sender_id).map(q => q.sender_id))];
      if (senderIds.length > 0) {
        try {
          const client = await clerkClient();
          const senders = await client.users.getUserList({ userId: senderIds });
          const senderMap = new Map(senders.data.map(u => [u.id, u.username || u.firstName || 'Unknown']));

          quests.forEach((q: any) => {
            if (q.sender_id) {
              q.senderName = senderMap.get(q.sender_id);
            }
          });
        } catch (e) {
          logger.error("Error fetching sender names:", e);
        }
      }
    }

    logger.debug('[Quests API] Quests fetched:', quests?.length || 0);
    if (quests && quests.length > 0) {
      logger.debug('[Quests API] First few quests:', quests.slice(0, 3).map(q => ({
        id: q.id,
        name: q.name,
        category: q.category,
        xp_reward: q.xp_reward,
        gold_reward: q.gold_reward,
        xp: q.xp,
        gold: q.gold
      })));
    }

    // FIXED: Use the simple, working approach that directly fetches quest completion data
    // This bypasses all the complex logic and uses the proven method
    logger.debug('[Quests API] Using proven simple approach...');

    // Get user's quest completions from quest_completion table
    const { data: questCompletions, error: completionsError } = await supabase
      .from('quest_completion')
      .select('*')
      .eq('user_id', userId);

    logger.debug('[Quests API] Quest completions fetched:', {
      count: questCompletions?.length || 0,
      error: completionsError,
      sample: questCompletions?.[0],
      allCompletions: questCompletions?.map(c => ({
        quest_id: c.quest_id,
        completed: c.completed,
        completed_at: c.completed_at
      }))
    });

    if (completionsError) {
      logger.error('[Quests API] Quest completions fetch error:', completionsError);
      return NextResponse.json({ error: completionsError.message }, { status: 500 });
    }

    function toValidUUID(str: string): string {
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
        return str;
      }
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      const hex = Math.abs(hash).toString(16).padStart(12, '0');
      return `00000000-0000-4000-8000-${hex.slice(0, 12)}`;
    }

    const requestTz = request.headers.get('x-timezone') || undefined;
    const today = getToday(requestTz);
    const completedQuests = new Map();

    logger.warn('[QUEST-BOARD-DIAGNOSTIC][GET /api/quests] Request received', {
      userId,
      requestTz,
      todayLocal: today,
      totalCompletionsInDB: questCompletions?.length || 0,
      completions: questCompletions?.map((c: any) => ({
        quest_id: c.quest_id,
        completed: c.completed,
        completed_at: c.completed_at,
        parsedLocalDate: formatDate(c.completed_at || c.created_at, requestTz),
        matchesToday: formatDate(c.completed_at || c.created_at, requestTz) === today
      }))
    });

    if (questCompletions) {
      // Group completions by quest_id to handle multiple completions of the same quest
      const questCompletionGroups = new Map();

      questCompletions.forEach((completion: any) => {
        if (!questCompletionGroups.has(completion.quest_id)) {
          questCompletionGroups.set(completion.quest_id, []);
        }
        questCompletionGroups.get(completion.quest_id).push(completion);
      });

      // Build a lookup map of all quests by ID, Name, Title (and their UUID hashes) for bi-directional mapping
      const questMetaMap = new Map<string, { id: string; name: string; title?: string }>();
      (quests || []).forEach((q: any) => {
        if (q.id) {
          const idStr = String(q.id).toLowerCase();
          questMetaMap.set(idStr, q);
          questMetaMap.set(toValidUUID(idStr), q);
        }
        if (q.name) {
          const nameStr = String(q.name).toLowerCase();
          questMetaMap.set(nameStr, q);
          questMetaMap.set(toValidUUID(nameStr), q);
        }
        if (q.title) {
          const titleStr = String(q.title).toLowerCase();
          questMetaMap.set(titleStr, q);
          questMetaMap.set(toValidUUID(titleStr), q);
        }
      });

      // For each quest, find TODAY'S completion record (or any completion if one-time quest)
      questCompletionGroups.forEach((completions, questId) => {
        const todayCompletion = completions.find((c: any) => {
          if (allTime) {
            return c.completed === true;
          }
          const cDate = formatDate(c.completed_at || c.created_at, requestTz);
          const cDateUtc = new Date(c.completed_at || c.created_at).toISOString().split('T')[0];
          const todayUtc = new Date().toISOString().split('T')[0];

          // STRICT DATE MATCHING: Must match local today's date in user's timezone (no UTC date mix-up that breaks daily reset)
          return cDate === today;
        });

        // Show as completed if there's a valid completion record for today
        if (todayCompletion && todayCompletion.completed !== false) {
          const compObj = {
            completed: true,
            completedAt: todayCompletion.completed_at,
            xpEarned: todayCompletion.xp_earned,
            goldEarned: todayCompletion.gold_earned,
            completionId: todayCompletion.id
          };
          const rawId = String(questId);
          completedQuests.set(rawId, compObj);
          completedQuests.set(rawId.toLowerCase(), compObj);
          completedQuests.set(toValidUUID(rawId.toLowerCase()), compObj);

          // ALSO index under matching quest's ID, Name, and Title if rawId matches any of them!
          const matchedQuest = questMetaMap.get(rawId.toLowerCase()) || questMetaMap.get(toValidUUID(rawId.toLowerCase()));
          if (matchedQuest) {
            if (matchedQuest.id) {
              const qid = String(matchedQuest.id);
              completedQuests.set(qid, compObj);
              completedQuests.set(qid.toLowerCase(), compObj);
              completedQuests.set(toValidUUID(qid.toLowerCase()), compObj);
            }
            if (matchedQuest.name) {
              const qname = String(matchedQuest.name);
              completedQuests.set(qname, compObj);
              completedQuests.set(qname.toLowerCase(), compObj);
              completedQuests.set(toValidUUID(qname.toLowerCase()), compObj);
            }
            if (matchedQuest.title) {
              const qtitle = String(matchedQuest.title);
              completedQuests.set(qtitle, compObj);
              completedQuests.set(qtitle.toLowerCase(), compObj);
              completedQuests.set(toValidUUID(qtitle.toLowerCase()), compObj);
            }
          }
        }
      });
    }

    const processedCompletionIds = new Set<string>();

    // Convert quests to quest format with completion status
    const questsWithCompletions = (quests || []).map((quest: any) => {
      const qId = String(quest.id || '');
      const qName = String(quest.name || '');
      // Find completion by quest ID or quest name for TODAY
      const completion = completedQuests.get(qId) || 
                         completedQuests.get(qId.toLowerCase()) || 
                         completedQuests.get(toValidUUID(qId.toLowerCase())) ||
                         completedQuests.get(qName) || 
                         completedQuests.get(qName.toLowerCase()) ||
                         completedQuests.get(toValidUUID(qName.toLowerCase()));

      const isCompleted = completion ? (completion.completed !== false) : false;
      const completionDate = completion ? (completion.completedAt || completion.completed_at) : null;

      if (completion && completion.completionId) {
        processedCompletionIds.add(String(completion.completionId));
      }

      logger.debug('[Quests API] Mapping quest:', {
        questId: quest.id,
        questName: quest.name,
        questCategory: quest.category,
        hasCompletion: !!completion,
        isCompleted,
        completionDate,
        completionData: completion
      });

      const mappedQuest: any = {
        id: quest.id,
        name: quest.name,
        title: quest.name,
        description: quest.description,
        category: quest.category, // Use the quest's actual category (already correct)
        difficulty: quest.difficulty,
        xp: quest.xp_reward || quest.xp || 50, // Use xp_reward from database, fallback to xp, then default
        gold: quest.gold_reward || quest.gold || 25, // Use gold_reward from database, fallback to gold, then default
        completed: isCompleted,
        date: completionDate,
        isNew: !isCompleted,
        completionId: isCompleted ? quest.id : undefined,
        xpEarned: completion?.xpEarned || 0,
        goldEarned: completion?.goldEarned || 0,
        isRecurring: quest.is_recurring || false,
        recurrenceInterval: quest.recurrence_interval || 'none',
        mandate_period: quest.mandate_period || 'daily',
        mandate_count: quest.mandate_count || 1
      };

      if (quest.recurrence_interval === 'once' && completion) {
        mappedQuest.isOneTime = true;
      }

      return mappedQuest;
    });

    // Synthesize completion-only quests from quest_completion table that are missing from rawQuests
    if (questCompletions) {
      questCompletions.forEach((c: any) => {
        const cDate = formatDate(c.completed_at || c.created_at, requestTz);
        const matchesToday = allTime ? c.completed === true : cDate === today;
        if (matchesToday && c.completed !== false) {
          const compId = String(c.id || c.quest_id);
          if (!processedCompletionIds.has(compId)) {
            processedCompletionIds.add(compId);
            const displayName = c.quest_id ? (String(c.quest_id).charAt(0).toUpperCase() + String(c.quest_id).slice(1)) : 'Completed habit';
            questsWithCompletions.push({
              id: c.quest_id || compId,
              name: displayName,
              title: displayName,
              description: 'Completed habit',
              category: 'might',
              difficulty: 'medium',
              xp: c.xp_earned || 50,
              gold: c.gold_earned || 25,
              completed: true,
              date: c.completed_at,
              isNew: false,
              completionId: c.id,
              xpEarned: c.xp_earned || 0,
              goldEarned: c.gold_earned || 0,
              isRecurring: true,
              recurrenceInterval: 'daily',
              mandate_period: 'daily',
              mandate_count: 1
            });
          }
        }
      });
    }

    logger.warn('[QUEST-BOARD-DIAGNOSTIC][GET /api/quests] Sending response to client', {
      totalQuests: questsWithCompletions.length,
      completedCount: questsWithCompletions.filter((q: any) => q.completed).length,
      completedQuests: questsWithCompletions.filter((q: any) => q.completed).map((q: any) => ({ id: q.id, name: q.name, date: q.date }))
    });

    // Add cache-busting headers to prevent Next.js and browser from caching response
    const response = NextResponse.json(questsWithCompletions);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
    return response;
  } catch (error) {
    logger.error('Error fetching quests:', error instanceof Error ? error.stack : error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  // Safety net
  return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
}

// Create a new quest completion
export async function POST(request: Request) {
  try {
    // Secure Clerk JWT verification
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized (Clerk JWT invalid or missing)' }, { status: 401 });
    }
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized.' }, { status: 500 });
    }
    const body = await request.json();
    const { title, category, questId } = questCompletionSchema.parse(body);

    let actualQuestId: string;

    if (questId) {
      // If questId is provided directly, use it
      actualQuestId = questId;
    } else {
      // Otherwise, find the quest ID from the challenges table using the title
      const { data: questData, error: questError } = await supabase
        .from('challenges')
        .select('id')
        .eq('name', title)
        .single();

      if (questError || !questData) {
        return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
      }

      actualQuestId = questData.id;
    }

    // Create the quest completion using the actual quest ID
    const { data: questCompletion, error } = await supabase
      .from('quest_completion')
      .insert([
        {
          user_id: userId,
          quest_id: actualQuestId,
          completed: false,
          completed_at: null
        }
      ])
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const response: QuestResponse = {
      title: (questCompletion as any)['quest_id'],
      category: 'general',
      completed: false,
      date: (questCompletion as any)['completed_at']
    };
    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error creating quest completion:', String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  // Safety net
  return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
}

// Update a quest completion status
export async function PUT(request: Request) {
  try {
    // Secure Clerk JWT verification
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized (Clerk JWT invalid or missing)' }, { status: 401 });
    }
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized.' }, { status: 500 });
    }
    const body = await request.json();
    const { title: updateTitle, completed, questId } = questUpdateSchema.parse(body);

    let actualQuestId: string;

    if (questId) {
      // If questId is provided directly, use it
      actualQuestId = questId;
    } else {
      // Otherwise, find the quest ID from the challenges table using the title
      const { data: questData, error: questError } = await supabase
        .from('challenges')
        .select('id')
        .eq('name', updateTitle)
        .single();

      if (questError || !questData) {
        return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
      }

      actualQuestId = questData.id;
    }

    // Find or create quest completion
    const { data: completions, error: findError } = await supabase
      .from('quest_completion')
      .select('*')
      .eq('user_id', userId)
      .eq('quest_id', actualQuestId)
      .limit(1);
    let questCompletion = completions?.[0];
    if (!questCompletion) {
      // Create a new completion record
      const { data: newCompletion, error: createError } = await supabase
        .from('quest_completion')
        .insert([
          {
            user_id: userId,
            quest_id: actualQuestId,
            completed: completed,
            completed_at: completed ? new Date().toISOString() : null
          }
        ])
        .single();
      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }
      questCompletion = newCompletion;
    } else {
      // Update the completion status
      const { data: updatedCompletion, error: updateError } = await supabase
        .from('quest_completion')
        .update({
          completed: completed,
          completed_at: completed ? new Date().toISOString() : null
        })
        .eq('id', String(questCompletion['id']))
        .single();
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
      questCompletion = updatedCompletion;
    }
    // If quest is completed, update character stats with default rewards
    if (completed) {
      const { data: characters, error: charError } = await supabase
        .from('character_stats')
        .select('*')
        .eq('user_id', userId)
        .limit(1);
      const character = characters?.[0];
      if (character) {
        const defaultRewards = {
          experience: 50,
          gold: 25
        };

        // Update character stats
        await supabase
          .from('character_stats')
          .update({
            experience: (character as any)['experience'] + defaultRewards.experience,
            gold: (character as any)['gold'] + defaultRewards.gold
          })
          .eq('user_id', userId);

        // CRITICAL FIX: Update quest_completion with XP and gold earned
        try {
          await supabase
            .from('quest_completion')
            .update({
              xp_earned: defaultRewards.experience,
              gold_earned: defaultRewards.gold
            })
            .eq('id', String(questCompletion['id']));
        } catch (updateError) {
          logger.warn('[Quest API] Could not update quest_completion with XP/gold (columns may not exist):', updateError);
          // Try to add the missing columns if they don't exist
          try {
            await supabase.rpc('add_quest_completion_columns');
          } catch (rpcError) {
            logger.warn('[Quest API] Could not add missing columns:', rpcError);
          }
        }

        // Log experience and gold rewards
        await grantReward({
          userId,
          type: 'exp',
          amount: defaultRewards.experience,
          relatedId: String(questCompletion['id']),
          context: { source: 'quest_completion', questTitle: String(questCompletion['quest_id']) }
        });
        await grantReward({
          userId,
          type: 'gold',
          amount: defaultRewards.gold,
          relatedId: String(questCompletion['id']),
          context: { source: 'quest_completion', questTitle: String(questCompletion['quest_id']) }
        });
      }
    }
    const response: QuestResponse = {
      title: (questCompletion as any)['quest_id'],
      category: 'general', // Default category since it might not exist in DB
      completed: !!(questCompletion as any)['completed'],
      date: (questCompletion as any)['completed_at']
    };
    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error updating quest completion:', String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  // Safety net
  return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
}

// Export quests as CSV
export async function PATCH(request: Request) {
  try {
    // Secure Clerk JWT verification
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized (Clerk JWT invalid or missing)' }, { status: 401 });
    }
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized.' }, { status: 500 });
    }
    const { data: questCompletions, error } = await supabase
      .from('quest_completion')
      .select('quest_id, completed, completed_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // Convert to CSV
    let csv = 'date,title,completed\n';
    (questCompletions as any[]).forEach((completion: any) => {
      csv += `${completion['completed_at'] || ''},${completion['quest_id'] || ''},${completion['completed'] ?? ''}\n`;
    });
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=quests.csv'
      }
    });
  } catch (error) {
    logger.error('Error exporting quests:', String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // Secure Clerk JWT verification
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized (Clerk JWT invalid or missing)' }, { status: 401 });
    }
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized.' }, { status: 500 });
    }
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Quest completion ID is required' }, { status: 400 });
    }
    const { error } = await supabase
      .from('quest_completion')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: 'Quest completion deleted' });
  } catch (error) {
    logger.error('Error deleting quest completion:', String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// TODO: Implement quests logic with Supabase client 
// TODO: Implement quests logic with Supabase client 
// TODO: Implement quests logic with Supabase client 