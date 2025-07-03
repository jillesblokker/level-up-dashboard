import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

let supabase: ReturnType<typeof createClient> | null = null;
if (supabaseUrl && supabaseServiceRoleKey) {
  supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    if (!supabase) {
      return new NextResponse(JSON.stringify({ error: 'Supabase client not initialized.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    const body = await request.json();
    const { name, description, category, difficulty, xp, gold } = body;
    if (!name || !category) {
      return new NextResponse(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const { data, error } = await supabase
      .from('quests')
      .insert([
        {
          title: name, // DB uses 'title', frontend uses 'name'
          description,
          category,
          difficulty,
          xp_reward: xp ?? 0,
          gold_reward: gold ?? 0,
        },
      ])
      .single();
    if (error) {
      return new NextResponse(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    const quest: any = data;
    return new NextResponse(JSON.stringify({
      id: quest.id,
      name: quest.title,
      description: quest.description,
      category: quest.category,
      difficulty: quest.difficulty,
      xp: quest.xp_reward,
      gold: quest.gold_reward,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
} 