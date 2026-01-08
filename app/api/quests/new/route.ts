import { NextRequest, NextResponse } from 'next/server';
import { calculateRewards } from '@/lib/game-logic';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  console.log('[API/quests/new] ===== REQUEST START =====');
  console.log('[API/quests/new] URL:', request.url);
  console.log('[API/quests/new] Headers:', Object.fromEntries(request.headers.entries()));

  try {
    // Get userId from Clerk - try both methods
    const { userId: authUserId } = await auth();
    const authHeader = request.headers.get('authorization');

    console.log('[API/quests/new] Auth check:', {
      authUserId,
      hasAuthHeader: !!authHeader,
      headerValue: authHeader?.substring(0, 20) + '...'
    });

    // Use authUserId from auth() function
    const userId = authUserId;

    if (!userId) {
      console.error('[API/quests/new] No userId found');
      return NextResponse.json({
        error: 'Unauthorized - No user session found'
      }, { status: 401 });
    }

    console.log('[API/quests/new] Authenticated userId:', userId);

    // Initialize Supabase client
    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
    const supabaseServiceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('[API/quests/new] Missing Supabase environment variables');
      return NextResponse.json({
        error: 'Server configuration error'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    console.log('[API/quests/new] Supabase client initialized');

    const body = await request.json();
    console.log('[API/quests/new] Received body:', body);

    const { name, description, category, difficulty, mandate_period, mandate_count } = body;

    if (!name || !category) {
      console.error('[API/quests/new] Missing required fields:', { name, category });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Calculate rewards based on difficulty
    const rewards = calculateRewards(difficulty || 'medium');
    const xp_reward = rewards.xp;
    const gold_reward = rewards.gold;

    console.log('[API/quests/new] About to insert quest into Supabase...');

    const { data, error } = await supabase
      .from('quests')
      .insert([
        {
          name,
          description,
          category,
          difficulty,
          xp_reward,
          gold_reward,
          is_recurring: mandate_period !== 'once',
          mandate_period: mandate_period || 'daily',
          mandate_count: mandate_count || 1,
          user_id: userId,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[API/quests/new] Supabase insert error:', error);
      throw error;
    }

    console.log('[API/quests/new] Quest created successfully:', data);
    const quest: any = data;
    console.log('[API/quests/new] Returning success response');
    return NextResponse.json({
      id: quest.id,
      name: quest.name,
      description: quest.description,
      category: quest.category,
      difficulty: quest.difficulty,
      xp: quest.xp_reward,
      gold: quest.gold_reward,
    });
  } catch (error: any) {
    console.error('[API/quests/new] Internal server error:', error);
    console.error('[API/quests/new] Error stack:', error.stack);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}