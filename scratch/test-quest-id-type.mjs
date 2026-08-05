import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '/Users/jilles/Thrivehaven/.env.local' });
dotenv.config({ path: '/Users/jilles/Thrivehaven/.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const userId = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC';
  
  // Check column types / attempt insert with text quest_id
  const testPayload = {
    quest_id: 'test-text-quest-id',
    user_id: userId,
    completed: true,
    completed_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('quest_completion')
    .insert(testPayload)
    .select('*');

  console.log("Insert result:", { data, error });

  if (!error && data) {
    // Clean up test row
    await supabase.from('quest_completion').delete().eq('id', data[0].id);
    console.log("Cleaned up test row successfully!");
  }
}

testInsert().catch(console.error);
