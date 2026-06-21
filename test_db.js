const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.from('kingdom_grid').select('grid_data').eq('user_id', 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC').single();
  if (data && data.grid_data) {
    console.log(JSON.stringify(data.grid_data[0], null, 2));
    console.log("...");
    console.log(JSON.stringify(data.grid_data.find(t => t.id === 'castle-1-0-1-0'), null, 2));
  }
}
test();
