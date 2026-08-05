import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '/Users/jilles/Thrivehaven/.env.local' });
dotenv.config({ path: '/Users/jilles/Thrivehaven/.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSmartCompletion() {
  const userId = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC';
  console.log("--- DEBUGGING QUEST SMART COMPLETION & GET /api/quests ---");

  // 1. Fetch user completions currently in DB
  const { data: completions, error: compErr } = await supabase
    .from('quest_completion')
    .select('*')
    .eq('user_id', userId);

  console.log("Current quest_completion count in DB:", completions?.length || 0);
  console.log("Completions sample:", completions?.slice(0, 5));

  // 2. Fetch quests table
  const { data: quests, error: questErr } = await supabase
    .from('quests')
    .select('*')
    .or(`user_id.is.null,user_id.eq.${userId}`);

  console.log("Current quests count in DB:", quests?.length || 0);
  console.log("Quests sample:", quests?.map(q => ({ id: q.id, name: q.name, user_id: q.user_id })));
}

debugSmartCompletion().catch(console.error);
