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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized.' }, { status: 500 });
    }
    const body = await request.json();
    const { name, description, category, difficulty, rewards } = body;
    if (!name || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('quests')
      .insert([
        {
          title: name, // DB uses 'title', frontend uses 'name'
          description,
          category,
          difficulty,
          rewards,
        },
      ])
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const quest: any = data;
    return NextResponse.json({
      id: quest.id,
      name: quest.title,
      description: quest.description,
      category: quest.category,
      difficulty: quest.difficulty,
      rewards: quest.rewards,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 