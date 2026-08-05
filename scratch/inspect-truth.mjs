import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '/Users/jilles/Thrivehaven/.env.local' });
dotenv.config({ path: '/Users/jilles/Thrivehaven/.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTruthDetails() {
  const userId = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC';
  
  const { data: questCompletions } = await supabase
    .from('quest_completion')
    .select('*')
    .eq('user_id', userId);

  console.log(`\n--- ALL QUEST COMPLETIONS IN SUPABASE DB (${questCompletions?.length || 0} total) ---`);
  (questCompletions || []).forEach(c => {
    console.log(`Quest ID: ${c.quest_id} | Completed At: ${c.completed_at || c.created_at}`);
  });

  const { data: milestoneData } = await supabase
    .from('milestone_progress')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  console.log(`\n--- MILESTONE PROGRESS DATA IN SUPABASE DB ---`);
  console.log(JSON.stringify(milestoneData?.progress_data, null, 2));

  const { data: challengeCompletions } = await supabase
    .from('challenge_completion')
    .select('*')
    .eq('user_id', userId);

  console.log(`\n--- CHALLENGE COMPLETIONS IN SUPABASE DB (${challengeCompletions?.length || 0} total) ---`);
  (challengeCompletions || []).slice(0, 10).forEach(c => {
    console.log(`Challenge ID: ${c.challenge_id || c.id} | Date: ${c.date || c.completed_at}`);
  });
}

inspectTruthDetails().catch(console.error);
