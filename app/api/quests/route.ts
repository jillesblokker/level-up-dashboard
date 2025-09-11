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
import { getAuth } from '@clerk/nextjs/server';
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
    const { userId } = await getAuth(request as NextRequest);
    console.log('[Quests API] getUserIdFromRequest - Clerk userId:', userId);
    return userId || null;
  } catch (e) {
    console.error('[Clerk] JWT verification failed:', e);
    return null;
  }
}

// Health check endpoint
export async function GET(request: Request) {
  console.log('[Quests API] GET request received at:', new Date().toISOString());
  console.log('[Quests API] Request URL:', request.url);
  try {
    const { searchParams } = new URL(request.url);
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
      console.error('[QUESTS][GET] Supabase env vars missing:', { supabaseUrl: process.env['NEXT_PUBLIC_SUPABASE_URL'], supabaseServiceRoleKey: process.env['SUPABASE_SERVICE_ROLE_KEY'] });
      return NextResponse.json({ error: 'Supabase environment variables missing.' }, { status: 500 });
    }
    if (!supabase) {
      console.error('[QUESTS][GET] Supabase client not initialized.');
      return NextResponse.json({ error: 'Supabase client not initialized.' }, { status: 500 });
    }

    // FIXED: Fetch from quests table (which has the actual quest definitions)
    // Fetching quest definitions from quests table
    const { data: quests, error: questsError } = await supabase
      .from('quests')
      .select('*');

    if (questsError) {
      console.error('Quests fetch error:', questsError);
      return NextResponse.json({ error: questsError.message }, { status: 500 });
    }
    
    console.log('[Quests API] Quests fetched:', quests?.length || 0);
    if (quests && quests.length > 0) {
      console.log('[Quests API] First few quests:', quests.slice(0, 3).map(q => ({
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
    console.log('[Quests API] Using proven simple approach...');
    
    // Get user's quest completions from quest_completion table
    const { data: questCompletions, error: completionsError } = await supabase
      .from('quest_completion')
      .select('*')
      .eq('user_id', userId);

    console.log('[Quests API] Quest completions fetched:', {
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
      console.error('[Quests API] Quest completions fetch error:', completionsError);
      return NextResponse.json({ error: completionsError.message }, { status: 500 });
    }

    // NEW APPROACH: Handle both active completions and historical data
    // This preserves historical data while showing current quest status
    const completedQuests = new Map();
    if (questCompletions) {
      console.log('[Quests API] Processing quest completions with historical preservation:', {
        totalRecords: questCompletions.length,
        sampleRecords: questCompletions.slice(0, 3).map(c => ({
          quest_id: c.quest_id,
          completed: c.completed,
          completed_at: c.completed_at,
          xp_earned: c.xp_earned,
          gold_earned: c.gold_earned
        }))
      });
      
      // Group completions by quest_id to handle multiple completions of the same quest
      const questCompletionGroups = new Map();
      
      questCompletions.forEach((completion: any) => {
        if (!questCompletionGroups.has(completion.quest_id)) {
          questCompletionGroups.set(completion.quest_id, []);
        }
        questCompletionGroups.get(completion.quest_id).push(completion);
      });
      
      // For each quest, find the most recent completion
      questCompletionGroups.forEach((completions, questId) => {
        // Sort by completed_at descending to get the most recent
        const sortedCompletions = completions.sort((a: any, b: any) => 
          new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
        );
        
        const mostRecentCompletion = sortedCompletions[0];
        const completionDate = new Date(mostRecentCompletion.completed_at);
        const isRecent = completionDate > new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
        
        console.log('[Quests API] Processing quest completions:', {
          quest_id: questId,
          total_completions: completions.length,
          most_recent: {
            completed: mostRecentCompletion.completed,
            completed_at: mostRecentCompletion.completed_at,
            isRecent
          }
        });
        
        // Show as completed if:
        // 1. The most recent completion has completed=true AND is recent (active completion)
        // 2. OR if there's any completion with completed=true (historical completion)
        const hasActiveCompletion = mostRecentCompletion.completed === true && isRecent;
        const hasHistoricalCompletion = completions.some((c: any) => c.completed === true);
        
        if (hasActiveCompletion || hasHistoricalCompletion) {
          completedQuests.set(questId, {
            completed: hasActiveCompletion, // Only true if actively completed today
            completedAt: mostRecentCompletion.completed_at,
            xpEarned: mostRecentCompletion.xp_earned,
            goldEarned: mostRecentCompletion.gold_earned,
            isHistorical: !hasActiveCompletion && hasHistoricalCompletion
          });
        }
      });
    }

    console.log('[Quests API] Completed quests map:', Array.from(completedQuests.entries()));
    console.log('[Quests API] Sample quest completion keys:', Array.from(completedQuests.keys()).slice(0, 5));
    console.log('[Quests API] Sample quest names:', quests?.slice(0, 5).map(q => q.name));

    // Convert quests to quest format with completion status
    const questsWithCompletions = (quests || []).map((quest: any) => {
      // Find completion by quest ID (since smart quest completion stores by ID)
      const completion = completedQuests.get(quest.id);
      const isCompleted = completion ? completion.completed : false;
      const completionDate = completion ? completion.completedAt : null;
      
      console.log('[Quests API] Mapping quest:', {
        questId: quest.id,
        questName: quest.name,
        questCategory: quest.category,
        hasCompletion: !!completion,
        isCompleted,
        completionDate,
        completionData: completion
      });
      
      return {
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
        goldEarned: completion?.goldEarned || 0
      };
    });

    // Debug: Check final results
    const finalCompletedCount = questsWithCompletions.filter(q => q.completed).length;
    const finalIncompleteCount = questsWithCompletions.filter(q => !q.completed).length;
    const completedQuestsList = questsWithCompletions.filter(q => q.completed).map(q => ({ id: q.id, name: q.name }));
    console.log('[Quests API] Final counts:', { completed: finalCompletedCount, incomplete: finalIncompleteCount });
    console.log('[Quests API] Completed quests:', completedQuestsList);
    console.log('[Quests API] Final quests with completions (proven method):', questsWithCompletions.slice(0, 3));
    
    // Add cache-busting headers to prevent Next.js from caching the response
    const response = NextResponse.json(questsWithCompletions);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
    return response;
  } catch (error) {
    console.error('Error fetching quests:', error instanceof Error ? error.stack : error);
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
    console.error('Error creating quest completion:', String(error));
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
          console.warn('[Quest API] Could not update quest_completion with XP/gold (columns may not exist):', updateError);
          // Try to add the missing columns if they don't exist
          try {
            await supabase.rpc('add_quest_completion_columns');
          } catch (rpcError) {
            console.warn('[Quest API] Could not add missing columns:', rpcError);
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
    console.error('Error updating quest completion:', String(error));
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
    console.error('Error exporting quests:', String(error));
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
    console.error('Error deleting quest completion:', String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// TODO: Implement quests logic with Supabase client 
// TODO: Implement quests logic with Supabase client 
// TODO: Implement quests logic with Supabase client 