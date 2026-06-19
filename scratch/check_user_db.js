require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data } = await supabase.from('inventory_items').select('*').limit(100);
  const userItems = data.filter(i => !i.item_id.startsWith('kingdom-tile'));
  console.log("Found", userItems.length, "items for the user:");
  const equipped = userItems.filter(i => i.equipped);
  const stored = userItems.filter(i => !i.equipped);
  
  console.log("\n--- EQUIPPED (" + equipped.length + ") ---");
  equipped.forEach(i => console.log(`- ${i.name} (${i.item_id})`));
  
  console.log("\n--- STORED (" + stored.length + ") ---");
  stored.forEach(i => console.log(`- ${i.name} (${i.item_id})`));
}
check();
