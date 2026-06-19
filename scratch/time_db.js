require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log("Starting query...");
  const start = Date.now();
  const { data, error } = await supabase.from('inventory_items').select('*').limit(10);
  const end = Date.now();
  console.log(`Query finished in ${end - start}ms`);
  if (error) console.error(error);
}
check();
