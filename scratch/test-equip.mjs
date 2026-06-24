import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const userId = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC';
  const { data, error } = await supabase
    .from('inventory_items')
    .select('id, item_id, name, type, category, equipped')
    .eq('user_id', userId)
    .eq('equipped', true);

  console.log("Error:", error);
  console.log("Equipped items:", data);
}
test();
