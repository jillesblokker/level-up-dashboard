// Debug script to check quest completion data
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugQuestCompletions() {
  console.log('🔍 Debugging Quest Completions...\n');
  
  // Get a test user ID (you'll need to replace this with an actual user ID)
  const { data: users, error: usersError } = await supabase
    .from('quest_completion')
    .select('user_id')
    .limit(1);
    
  if (usersError || !users || users.length === 0) {
    console.log('❌ No quest completion records found');
    return;
  }
  
  const userId = users[0].user_id;
  console.log(`👤 Using user ID: ${userId}\n`);
  
  // Get all quest completions for this user
  const { data: completions, error: completionsError } = await supabase
    .from('quest_completion')
    .select('*')
    .eq('user_id', userId);
    
  if (completionsError) {
    console.error('❌ Error fetching completions:', completionsError);
    return;
  }
  
  console.log(`📊 Found ${completions.length} completion records:`);
  completions.forEach((completion, index) => {
    console.log(`  ${index + 1}. Quest ID: ${completion.quest_id}`);
    console.log(`     Completed: ${completion.completed}`);
    console.log(`     Completed At: ${completion.completed_at}`);
    console.log(`     XP Earned: ${completion.xp_earned}`);
    console.log(`     Gold Earned: ${completion.gold_earned}`);
    console.log('');
  });
  
  // Get all quests
  const { data: quests, error: questsError } = await supabase
    .from('quests')
    .select('id, name, category')
    .limit(10);
    
  if (questsError) {
    console.error('❌ Error fetching quests:', questsError);
    return;
  }
  
  console.log(`📋 Found ${quests.length} quests:`);
  quests.forEach((quest, index) => {
    console.log(`  ${index + 1}. ID: ${quest.id}`);
    console.log(`     Name: ${quest.name}`);
    console.log(`     Category: ${quest.category}`);
    console.log('');
  });
  
  // Check which quests have completions
  console.log('🔗 Quest-Completion Mapping:');
  quests.forEach(quest => {
    const completion = completions.find(c => c.quest_id === quest.id);
    if (completion) {
      const isCompleted = completion.completed === true && completion.completed_at !== null;
      console.log(`  ✅ ${quest.name}: ${isCompleted ? 'COMPLETED' : 'INCOMPLETE'} (${completion.completed}, ${completion.completed_at})`);
    } else {
      console.log(`  ❌ ${quest.name}: NO RECORD`);
    }
  });
}

debugQuestCompletions().catch(console.error);
