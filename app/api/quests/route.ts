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
    const { userId } = getAuth(request as NextRequest);
    console.log('[Quests API] getUserIdFromRequest - Clerk userId:', userId);
    return userId || null;
  } catch (e) {
    console.error('[Clerk] JWT verification failed:', e);
    return null;
  }
}

// Health check endpoint
export async function GET(request: Request) {
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

    // FIXED: Fetch from challenges table (which actually has quest definitions)
    // Fetching quest definitions from challenges table
    const { data: challenges, error: challengesError } = await supabase
      .from('challenges')
      .select('*');

    if (challengesError) {
      console.error('Challenges fetch error:', challengesError);
      return NextResponse.json({ error: challengesError.message }, { status: 500 });
    }
    
    console.log('[Quests API] Challenges fetched:', challenges?.length || 0);
    if (challenges && challenges.length > 0) {
      console.log('[Quests API] First few challenges:', challenges.slice(0, 3).map(c => ({
        id: c.id,
        name: c.name,
        category: c.category
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
      sample: questCompletions?.[0]
    });

    if (completionsError) {
      console.error('[Quests API] Quest completions fetch error:', completionsError);
      return NextResponse.json({ error: completionsError.message }, { status: 500 });
    }

    // Create a map of completed quests by quest_id (which stores challenge names)
    const completedQuests = new Map();
    if (questCompletions) {
      questCompletions.forEach((completion: any) => {
        const isCompleted = completion.completed === true && completion.completed_at !== null;
        console.log('[Quests API] Processing completion:', {
          quest_id: completion.quest_id,
          completed: completion.completed,
          completed_at: completion.completed_at,
          isCompleted
        });
        completedQuests.set(completion.quest_id, {
          completed: isCompleted,
          completedAt: completion.completed_at,
          xpEarned: completion.xp_earned,
          goldEarned: completion.gold_earned
        });
      });
    }

    console.log('[Quests API] Completed quests map:', Array.from(completedQuests.entries()));
    console.log('[Quests API] Sample quest completion keys:', Array.from(completedQuests.keys()).slice(0, 5));
    console.log('[Quests API] Sample challenge names:', challenges?.slice(0, 5).map(c => c.name));

    // Convert challenges to quest format with completion status
    const questsWithCompletions = (challenges || []).map((challenge: any) => {
      // Find completion by challenge name (since quest_id stores names, not IDs)
      const completion = completedQuests.get(challenge.name);
      const isCompleted = completion ? completion.completed : false;
      const completionDate = completion ? completion.completedAt : null;
      
      console.log('[Quests API] Mapping challenge:', {
        challengeId: challenge.id,
        challengeName: challenge.name,
        hasCompletion: !!completion,
        isCompleted,
        completionDate,
        completionData: completion
      });
      
      return {
        id: challenge.id,
        name: challenge.name,
        title: challenge.name,
        description: challenge.description,
        category: challenge.category,
        difficulty: challenge.difficulty,
        xp: challenge.xp,
        gold: challenge.gold,
        completed: isCompleted,
        date: completionDate,
        isNew: !isCompleted,
        completionId: isCompleted ? challenge.id : undefined,
        xpEarned: completion?.xpEarned || 0,
        goldEarned: completion?.goldEarned || 0
      };
    });

    // Debug: Check final results
    const finalCompletedCount = questsWithCompletions.filter(q => q.completed).length;
    const finalIncompleteCount = questsWithCompletions.filter(q => !q.completed).length;
    console.log('[Quests API] Final counts:', { completed: finalCompletedCount, incomplete: finalIncompleteCount });
    console.log('[Quests API] Final quests with completions (proven method):', questsWithCompletions.slice(0, 3));
    return NextResponse.json(questsWithCompletions);
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