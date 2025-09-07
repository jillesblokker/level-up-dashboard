// Quick test to see what tables exist and what data they contain
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testTables() {
  console.log('🔍 Testing database tables...\n');
  
  // Test challenges table
  try {
    const { data: challenges, error } = await supabase
      .from('challenges')
      .select('id, name, category')
      .limit(5);
    
    console.log('📋 CHALLENGES table:');
    console.log('  Count:', challenges?.length || 0);
    console.log('  Sample:', challenges?.slice(0, 3));
    console.log('  Categories:', [...new Set(challenges?.map(c => c.category) || [])]);
    console.log('  Error:', error?.message || 'None');
  } catch (err) {
    console.log('📋 CHALLENGES table: ERROR -', err.message);
  }
  
  console.log('\n');
  
  // Test quests table
  try {
    const { data: quests, error } = await supabase
      .from('quests')
      .select('id, name, category')
      .limit(5);
    
    console.log('⚔️ QUESTS table:');
    console.log('  Count:', quests?.length || 0);
    console.log('  Sample:', quests?.slice(0, 3));
    console.log('  Categories:', [...new Set(quests?.map(q => q.category) || [])]);
    console.log('  Error:', error?.message || 'None');
  } catch (err) {
    console.log('⚔️ QUESTS table: ERROR -', err.message);
  }
  
  console.log('\n');
  
  // Test quest_completion table
  try {
    const { data: completions, error } = await supabase
      .from('quest_completion')
      .select('quest_id, completed')
      .limit(5);
    
    console.log('✅ QUEST_COMPLETION table:');
    console.log('  Count:', completions?.length || 0);
    console.log('  Sample:', completions?.slice(0, 3));
    console.log('  Error:', error?.message || 'None');
  } catch (err) {
    console.log('✅ QUEST_COMPLETION table: ERROR -', err.message);
  }
}

testTables().catch(console.error);