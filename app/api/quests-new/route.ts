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

    // Fetch quests from challenges table
    console.log('Fetching quests from challenges table...');
    const { data: challenges, error: challengesError } = await supabase
      .from('challenges')
      .select('*');

    if (challengesError) {
      console.error('Challenges fetch error:', challengesError);
      return NextResponse.json({ error: challengesError.message }, { status: 500 });
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

    // Convert challenges data to quest format
    const questsWithCompletions = (challenges || []).map((challenge: any) => {
      const isCompleted = completedQuests.has(challenge.id);
      const completionDate = completedQuests.get(challenge.id);
      
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
        completionId: isCompleted ? challenge.id : undefined
      };
    });

    console.log(`Returning ${questsWithCompletions.length} quests`);
    return NextResponse.json(questsWithCompletions);
  } catch (error) {
    console.error('Error fetching quests:', error instanceof Error ? error.stack : error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 