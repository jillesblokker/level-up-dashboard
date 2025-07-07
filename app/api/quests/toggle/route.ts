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
    const { userId, questId } = body;
    if (!userId || !questId) {
      return NextResponse.json({ error: 'Missing userId or questId' }, { status: 400 });
    }
    // Check if completion exists
    const { data: existing, error: findError } = await supabase
      .from('quest_completion')
      .select('id')
      .eq('user_id', userId)
      .eq('quest_id', questId)
      .maybeSingle();
    if (findError) {
      return NextResponse.json({ error: findError.message }, { status: 500 });
    }
    if (existing && existing.id) {
      // Delete completion (mark as incomplete)
      const { error: deleteError } = await supabase
        .from('quest_completion')
        .delete()
        .eq('id', existing.id);
      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }
      return NextResponse.json({ completed: false });
    } else {
      // Insert completion (mark as complete)
      // Fetch quest rewards
      const { data: quest, error: questError } = await supabase
        .from('quests')
        .select('xp_reward, gold_reward')
        .eq('id', questId)
        .single();
      if (questError || !quest) {
        return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
      }
      const { error: insertError } = await supabase
        .from('quest_completion')
        .insert([
          {
            user_id: userId,
            quest_id: questId,
            xp_earned: quest.xp_reward,
            gold_earned: quest.gold_reward,
          },
        ]);
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      return NextResponse.json({ completed: true });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 