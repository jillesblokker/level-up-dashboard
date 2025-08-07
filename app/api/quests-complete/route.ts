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

    // For now, return quests without completion status since checked_quests table doesn't exist
    const questsWithCompletions = (quests || []).map((quest: any) => {
      return {
        id: quest.id,
        name: quest.name,
        title: quest.title,
        description: quest.description,
        category: quest.category,
        difficulty: quest.difficulty,
        xp: quest.xp,
        gold: quest.gold,
        completed: false, // Default to false since we can't track completion yet
        date: null,
        isNew: true,
        completionId: undefined
      };
    });

    console.log(`Returning ${questsWithCompletions.length} quests`);
    return NextResponse.json(questsWithCompletions);
  } catch (error) {
    console.error('Error fetching quests:', error instanceof Error ? error.stack : error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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
    console.log('Quest completion request:', body);
    
    // For now, just return success since we can't track completion without the checked_quests table
    // TODO: Create a proper completion tracking system
    return NextResponse.json({ 
      success: true, 
      message: 'Quest completion tracked (temporary - no database storage)' 
    });
  } catch (error) {
    console.error('Error updating quest completion:', error instanceof Error ? error.stack : error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 