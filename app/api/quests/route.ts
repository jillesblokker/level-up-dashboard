// TROUBLESHOOTING: If you get a 500 error, check the following:
// 1. Are NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set in your environment? (Check .env and restart server)
// 2. Do the tables 'quests', 'quest_completion', and 'character_stats' exist in your Supabase database, with the expected columns?
// 3. Check your server logs for error output after 'Quests error:' or 'Error fetching quests:'
// 4. Test your API with curl or Postman to see the error response.
// 5. If you see 'Supabase client not initialized', your env vars are missing or incorrect.
//
// Health check endpoint: GET /api/quests?health=1

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { QuestResponse } from '@/types/quest';
import { env } from '@/lib/env';

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl) {
  console.error('[QUESTS][INIT] NEXT_PUBLIC_SUPABASE_URL is missing from environment variables.');
}
if (!supabaseServiceRoleKey) {
  console.error('[QUESTS][INIT] SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.');
}

let supabase: ReturnType<typeof createClient> | null = null;
if (supabaseUrl && supabaseServiceRoleKey) {
  supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
}

// Define schemas for request validation
const questCompletionSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1)
});

const questUpdateSchema = z.object({
  title: z.string().min(1),
  completed: z.boolean()
});

// Health check endpoint
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get('health') === '1') {
      return NextResponse.json({
        status: 'healthy',
        supabaseUrl,
        supabaseServiceRoleKeyPresent: !!supabaseServiceRoleKey,
        supabaseClientInitialized: !!supabase,
      });
    }
    // Optionally check for Authorization header
    const authHeader = request.headers.get('authorization');
    console.log('[QUESTS][GET] Authorization header:', authHeader);
    if (!authHeader) {
      console.error('[QUESTS][GET] Missing Authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('[QUESTS][GET] Supabase env vars missing:', { supabaseUrl, supabaseServiceRoleKey });
      return NextResponse.json({ error: 'Supabase environment variables missing.' }, { status: 500 });
    }
    if (!supabase) {
      console.error('[QUESTS][GET] Supabase client not initialized.');
      return NextResponse.json({ error: 'Supabase client not initialized.' }, { status: 500 });
    }
    const userId = searchParams.get('userId');
    // Get all available quests
    console.log('Fetching all quests...');
    const { data: allQuests, error: questsError } = await supabase
      .from('quests')
      .select('*')
      .order('category', { ascending: true });
    if (questsError) {
      console.error('Quests error:', questsError);
      return NextResponse.json({ error: questsError.message }, { status: 500 });
    }
    // Get user's quest completions if userId is provided
    let questCompletions: any[] = [];
    if (userId) {
      const { data, error } = await supabase
        .from('quest_completion')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      if (error) {
        console.error('Quest completion fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      questCompletions = data || [];
    }
    // Combine quests with completion status if userId is provided
    let questsWithCompletions = allQuests;
    if (userId) {
      const completionMap = new Map();
      questCompletions.forEach((completion: any) => {
        const key = `${completion['quest_name']}`;
        completionMap.set(key, completion);
      });
      questsWithCompletions = (allQuests as any[]).map((quest: any) => {
        const key = `${quest['name']}`;
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
    } else {
      // If no userId, still map name for allQuests
      questsWithCompletions = (allQuests as any[]).map((quest: any) => ({
        id: quest['id'],
        name: quest['name'],
        title: quest['name'],
        description: quest['description'],
        category: quest['category'],
        difficulty: quest['difficulty'],
        xp: quest['xp_reward'],
        gold: quest['gold_reward'],
        completed: false,
        date: null,
        isNew: true,
        completionId: null
      }));
    }
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
    // Require Authorization header
    const authHeader = request.headers.get('authorization');
    console.log('[QUESTS][POST] Authorization header:', authHeader);
    if (!authHeader) {
      console.error('[QUESTS][POST] Missing Authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized.' }, { status: 500 });
    }
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
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
          completed: false,
          date: new Date().toISOString()
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
    // Require Authorization header
    const authHeader = request.headers.get('authorization');
    console.log('[QUESTS][PUT] Authorization header:', authHeader);
    if (!authHeader) {
      console.error('[QUESTS][PUT] Missing Authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized.' }, { status: 500 });
    }
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
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
            category: 'general',
            completed: false,
            date: new Date().toISOString()
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
        completed,
        date: completed ? new Date().toISOString() : questCompletion['date']
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
          .eq('id', (character as any)['id']);
      }
    }
    const response: QuestResponse = {
      title: (updatedCompletion as any)['quest_name'],
      category: (updatedCompletion as any)['category'],
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
    // Require Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized.' }, { status: 500 });
    }
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
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
    // Require Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized.' }, { status: 500 });
    }
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
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