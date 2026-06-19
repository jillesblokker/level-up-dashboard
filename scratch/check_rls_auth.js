require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const dummyToken = jwt.sign(
  { sub: 'user_2kPqfMrd4Wl4Kz6iC9OIfLCLx8E' },
  process.env.SUPABASE_JWT_SECRET || 'your-super-secret-jwt-token-with-at-least-32-characters-long',
  { expiresIn: '1h' }
);

async function check() {
  supabase.auth.setSession({ access_token: dummyToken, refresh_token: '' });
  const { data, error } = await supabase.from('inventory_items').select('*').limit(1);
  console.log("Auth query result:", data, error);
}
check();
