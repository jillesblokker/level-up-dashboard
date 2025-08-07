import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../lib/supabase/server-client';

const supabase = supabaseServer;

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

export async function GET(request: Request) {
  try {
    // Secure Clerk JWT verification
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized (Clerk JWT invalid or missing)' }, { status: 401 });
    }
    
    if (!supabase) {
      console.error('[QUESTS][GET] Supabase client not initialized.');
      return NextResponse.json({ error: 'Supabase client not initialized.' }, { status: 500 });
    }

    // Fetch quests from quests table
    console.log('Fetching quests from quests table...');
    const { data: quests, error: questsError } = await supabase
      .from('quests')
      .select('*');

    if (questsError) {
      console.error('Quests fetch error:', questsError);
      return NextResponse.json({ error: questsError.message }, { status: 500 });
    }

    // Get user's quest completions from checked_quests table (if it exists)
    console.log('Fetching user quest completions...');
    const { data: questCompletions, error: completionsError } = await supabase
      .from('checked_quests')
      .select('*')
      .eq('user_id', userId);

    // Create a map of completed quests
    const completedQuests = new Map();
    if (!completionsError && questCompletions) {
      questCompletions.forEach((completion: any) => {
        completedQuests.set(completion['quest_id'], completion['checked_at']);
      });
    }

    // Convert quests data to quest format
    const questsWithCompletions = (quests || []).map((quest: any) => {
      const isCompleted = completedQuests.has(quest.id);
      const completionDate = completedQuests.get(quest.id);
      
      return {
        id: quest.id,
        name: quest.name,
        title: quest.title,
        description: quest.description,
        category: quest.category,
        difficulty: quest.difficulty,
        xp: quest.xp,
        gold: quest.gold,
        completed: isCompleted,
        date: completionDate,
        isNew: !isCompleted,
        completionId: isCompleted ? quest.id : undefined
      };
    });

    console.log(`Returning ${questsWithCompletions.length} quests`);
    return NextResponse.json(questsWithCompletions);
  } catch (error) {
    console.error('Error fetching quests:', error instanceof Error ? error.stack : error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
