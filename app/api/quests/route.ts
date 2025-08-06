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
  category: z.string().min(1)
});

const questUpdateSchema = z.object({
  title: z.string().min(1),
  completed: z.boolean()
});

// Helper to extract and verify Clerk JWT, returns userId or null
async function getUserIdFromRequest(request: Request): Promise<string | null> {
  try {
    const { userId } = getAuth(request as NextRequest);
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
    // Get all available quests (system quests)
    console.log('Fetching system quests...');
    const { data: systemQuests, error: questsError } = await supabase
      .from('quests')
      .select('*')
      .order('category', { ascending: true });
    if (questsError) {
      console.error('Quests error:', questsError);
      return NextResponse.json({ error: questsError.message }, { status: 500 });
    }

    // Get user-created quests from quest_completion table
    console.log('Fetching user-created quests...');
    const { data: userQuests, error: userQuestsError } = await supabase
      .from('quest_completion')
      .select('*')
      .eq('user_id', userId)
      .is('quest_id', null); // User-created quests don't have a quest_id reference

    if (userQuestsError) {
      console.error('User quests error:', userQuestsError);
      // Don't fail completely, just log the error
    }

    // Combine system quests and user-created quests
    const allQuests = [...(systemQuests || []), ...(userQuests || [])];
    // Get user's quest completions
    let questCompletions: any[] = [];
    const { data, error } = await supabase
      .from('quest_completion')
      .select('*')
      .eq('user_id', userId);
    if (error) {
      console.error('Quest completion fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    questCompletions = data || [];
    // Combine quests with completion status (by quest_id)
    const completionMap = new Map();
    questCompletions.forEach((completion: any) => {
      const key = String(completion['quest_id'] ?? completion['quest_name']);
      completionMap.set(key, completion);
    });
    const questsWithCompletions = (allQuests as any[]).map((quest: any) => {
      const key = String(quest['id']);
      const completion = completionMap.get(key) as any;
      return {
        id: quest['id'],
        name: quest['name'],
        title: quest['name'],
        description: quest['description'],
        category: quest['category'],
        difficulty: quest['difficulty'],
        xp: quest['xp_reward'],
        gold: quest['gold_reward'],
        completed: completion?.completed ?? false,
        date: completion?.date,
        isNew: !completion,
        completionId: completion?.id
      };
    });
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
    // Validate request body
    const result = questCompletionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request body', details: result.error.issues }, { status: 400 });
    }
    const { title, category } = result.data;
    // Create the quest completion
    const { data: questCompletion, error } = await supabase
      .from('quest_completion')
      .insert([
        {
          user_id: userId,
          quest_name: title,
          category: category,
          completed: false
        }
      ])
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const response: QuestResponse = {
      title: (questCompletion as any)['quest_name'],
      category: (questCompletion as any)['category'],
      completed: (questCompletion as any)['completed'],
      date: (questCompletion as any)['date']
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
    // Validate request body
    const result = questUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request body', details: result.error.issues }, { status: 400 });
    }
    const { title: updateTitle, completed } = result.data;
    // Find or create quest completion
    const { data: completions, error: findError } = await supabase
      .from('quest_completion')
      .select('*')
      .eq('user_id', userId)
      .eq('quest_name', updateTitle)
      .limit(1);
    let questCompletion = completions?.[0];
    if (!questCompletion) {
      // Create a new completion record
      const { data: newCompletion, error: createError } = await supabase
        .from('quest_completion')
        .insert([
          {
            user_id: userId,
            quest_name: updateTitle,
            completed: false
          }
        ])
        .single();
      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }
      questCompletion = newCompletion;
    }
    // Update the completion status
    const { data: updatedCompletion, error: updateError } = await supabase
      .from('quest_completion')
      .update({
        completed
      })
      .eq('id', String(questCompletion['id']))
      .single();
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
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
        await supabase
          .from('character_stats')
          .update({
            experience: (character as any)['experience'] + defaultRewards.experience,
            gold: (character as any)['gold'] + defaultRewards.gold
          })
          .eq('user_id', userId);
        // Log experience and gold rewards
        await grantReward({
          userId,
          type: 'exp',
          amount: defaultRewards.experience,
          relatedId: String(questCompletion['id']),
          context: { source: 'quest_completion', questTitle: String(questCompletion['quest_name']) }
        });
        await grantReward({
          userId,
          type: 'gold',
          amount: defaultRewards.gold,
          relatedId: String(questCompletion['id']),
          context: { source: 'quest_completion', questTitle: String(questCompletion['quest_name']) }
        });
      }
    }
    const response: QuestResponse = {
      title: (updatedCompletion as any)['quest_name'],
      category: 'general', // Default category since it might not exist in DB
      completed: (updatedCompletion as any)['completed'],
      date: (updatedCompletion as any)['date']
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
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // Convert to CSV
    let csv = 'date,title,completed\n';
    (questCompletions as any[]).forEach((completion: any) => {
      csv += `${completion['date']},${completion['quest_name']},${completion['completed']}\n`;
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