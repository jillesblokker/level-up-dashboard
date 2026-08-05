import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '/Users/jilles/Thrivehaven/.env.local' });
dotenv.config({ path: '/Users/jilles/Thrivehaven/.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSync() {
  const userId = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC';

  // 1. Find Toothbrushing quest ID
  const { data: q } = await supabase
    .from('quests')
    .select('*')
    .eq('user_id', userId)
    .ilike('name', '%Toothbrushing%')
    .single();

  console.log("Toothbrushing quest:", q);

  if (q) {
    // Insert completion row for today
    const { data: comp, error } = await supabase
      .from('quest_completion')
      .insert({
        quest_id: q.id,
        user_id: userId,
        completed: true,
        completed_at: new Date().toISOString()
      })
      .select('*');

    console.log("Completion insert result:", { comp, error });
  }
}

testSync().catch(console.error);
