import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { QuestResponse } from '@/types/quest';
import { env } from '@/lib/env';
import { create_supabase_server_client } from '@/app/lib/supabase/server-client';

// Define schemas for request validation
const questCompletionSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1)
});

const questUpdateSchema = z.object({
  questName: z.string().min(1),
  completed: z.boolean()
});

// Get all available quests and their completion status for the current user
export async function GET(request: Request) {
  try {
    const { getToken, userId } = await auth();
    const token = await getToken();
    const supabase = create_supabase_server_client(token || undefined);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    
    // Validate date parameter if provided
    let date: Date | undefined;
    if (dateParam) {
      try {
        date = new Date(dateParam);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date');
        }
      } catch {
        return NextResponse.json({ error: 'Invalid date parameter' }, { status: 400 });
      }
    }

    // Get all available quests
    const { data: allQuests, error: questsError } = await supabase
      .from('quests')
      .select('*')
      .order('category', { ascending: true });
    if (questsError) {
      return NextResponse.json({ error: questsError.message }, { status: 500 });
    }

    // Get user's quest completions
    let completionsQuery = supabase
      .from('quest_completion')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (date) {
      completionsQuery = completionsQuery
        .gte('date', date.toISOString())
        .lt('date', new Date(new Date(date).setDate(date.getDate() + 1)).toISOString());
    }
    const { data: questCompletions, error: completionsError } = await completionsQuery;
    if (completionsError) {
      return NextResponse.json({ error: completionsError.message }, { status: 500 });
    }

    // Create a map of quest completions for quick lookup
    const completionMap = new Map();
    questCompletions.forEach((completion: any) => {
      const key = `${completion.quest_name}`;
      completionMap.set(key, completion);
    });

    // Combine quests with completion status
    const questsWithCompletions = (allQuests as any[]).map((quest: any) => {
      const key = `${quest.title}`;
      const completion = completionMap.get(key) as any;
      return {
        id: quest.id,
        title: quest.title,
        description: quest.description,
        category: quest.category,
        difficulty: quest.difficulty,
        rewards: quest.rewards,
        completed: completion?.completed ?? false,
        date: completion?.date,
        isNew: !completion, // Mark as new if no completion record exists
        completionId: completion?.id
      };
    });

    return NextResponse.json(questsWithCompletions);
  } catch (error) {
    console.error('Error fetching quests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create a new quest completion
export async function POST(request: Request) {
  try {
    const { getToken, userId } = await auth();
    const token = await getToken();
    const supabase = create_supabase_server_client(token || undefined);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const result = questCompletionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request body', details: result.error.issues }, { status: 400 });
    }
    
    const { name, category } = result.data;

    // Create the quest completion
    const { data: questCompletion, error } = await supabase
      .from('quest_completion')
      .insert([
        {
          user_id: userId,
          quest_name: name,
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
      name: (questCompletion as any).quest_name,
      category: (questCompletion as any).category,
      completed: (questCompletion as any).completed,
      date: (questCompletion as any).date
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating quest completion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update a quest completion status
export async function PUT(request: Request) {
  try {
    const { getToken, userId } = await auth();
    const token = await getToken();
    const supabase = create_supabase_server_client(token || undefined);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const result = questUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request body', details: result.error.issues }, { status: 400 });
    }
    
    const { questName, completed } = result.data;

    // Find or create quest completion
    const { data: completions, error: findError } = await supabase
      .from('quest_completion')
      .select('*')
      .eq('user_id', userId)
      .eq('quest_name', questName)
      .limit(1);
    let questCompletion = completions?.[0];

    if (!questCompletion) {
      // Create a new completion record
      const { data: newCompletion, error: createError } = await supabase
        .from('quest_completion')
        .insert([
          {
            user_id: userId,
            quest_name: questName,
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
        date: completed ? new Date().toISOString() : questCompletion.date
      })
      .eq('id', questCompletion.id)
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
            experience: character.experience + defaultRewards.experience,
            gold: character.gold + defaultRewards.gold
          })
          .eq('id', character.id);
      }
    }

    const response: QuestResponse = {
      name: (updatedCompletion as any).quest_name,
      category: (updatedCompletion as any).category,
      completed: (updatedCompletion as any).completed,
      date: (updatedCompletion as any).date
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating quest completion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Export quests as CSV
export async function PATCH(request: Request) {
  try {
    const { getToken, userId } = await auth();
    const token = await getToken();
    const supabase = create_supabase_server_client(token || undefined);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    let csv = 'date,name,completed\n';
    questCompletions.forEach((completion: any) => {
      csv += `${(completion as any).date},${(completion as any).quest_name},${(completion as any).completed}\n`;
    });

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=quests.csv'
      }
    });
  } catch (error) {
    console.error('Error exporting quests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { getToken, userId } = await auth();
    const token = await getToken();
    const supabase = create_supabase_server_client(token || undefined);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    console.error('Error deleting quest completion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// TODO: Implement quests logic with Supabase client 