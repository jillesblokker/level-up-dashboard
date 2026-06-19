require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('inventory_items').select('*').limit(100);
  if (error) console.error(error);
  else {
    const userItems = data.filter(i => !i.item_id.startsWith('kingdom-tile'));
    for (const item of userItems) {
      console.log(`${item.name} (${item.item_id}): equipped=${item.equipped}, user_id=${item.user_id}`);
    }
  }
}
check();
