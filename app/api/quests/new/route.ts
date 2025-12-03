import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

let supabase: ReturnType<typeof createClient> | null = null;
if (supabaseUrl && supabaseServiceRoleKey) {
  supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
}

export async function POST(request: Request) {
  try {
    // Get userId from Clerk
    const { userId } = await auth();
    if (!userId) {
      console.error('[API/quests/new] Unauthorized - no userId');
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    if (!supabase) {
      console.error('[API/quests/new] Supabase client not initialized');
      return new NextResponse(JSON.stringify({ error: 'Supabase client not initialized.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    const body = await request.json();
    console.log('[API/quests/new] Received body:', body);
    const { name, description, category, difficulty, xp_reward, gold_reward } = body;
    if (!name || !category) {
      console.error('[API/quests/new] Missing required fields:', { name, category });
      return new NextResponse(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const { data, error } = await supabase
      .from('quests')
      .insert([
        {
          name,
          description,
          category,
          difficulty,
          xp_reward: xp_reward ?? 0,
          gold_reward: gold_reward ?? 0,
          user_id: userId, // Assign quest to the current user
        },
      ])
      .select()
      .single();
    if (error) {
      console.error('[API/quests/new] Supabase insert error:', error);
      return new NextResponse(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    const quest: any = data;
    return new NextResponse(JSON.stringify({
      id: quest.id,
      name: quest.name,
      description: quest.description,
      category: quest.category,
      difficulty: quest.difficulty,
      xp: quest.xp_reward,
      gold: quest.gold_reward,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[API/quests/new] Internal server error:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
} 