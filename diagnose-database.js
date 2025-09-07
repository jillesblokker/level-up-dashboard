// Diagnostic tool to see what's in the database tables
const { createClient } = require('@supabase/supabase-js');

// Try to load environment variables from .env file if it exists
try {
  require('dotenv').config();
} catch (e) {
  console.log('Note: dotenv not available, using system environment variables');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceRoleKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function diagnoseDatabase() {
  console.log('🔍 DIAGNOSING DATABASE TABLES...\n');
  
  // 1. Check CHALLENGES table
  console.log('📋 CHALLENGES TABLE:');
  try {
    const { data: challenges, error } = await supabase
      .from('challenges')
      .select('id, name, category, difficulty')
      .limit(10);
    
    if (error) {
      console.log('  ❌ Error:', error.message);
    } else {
      console.log('  ✅ Count:', challenges?.length || 0);
      console.log('  📊 Categories:', [...new Set(challenges?.map(c => c.category) || [])]);
      console.log('  📝 Sample entries:');
      challenges?.slice(0, 5).forEach(c => {
        console.log(`    - ${c.name} (${c.category}) [${c.difficulty}]`);
      });
    }
  } catch (err) {
    console.log('  ❌ Exception:', err.message);
  }
  
  console.log('\n');
  
  // 2. Check QUESTS table
  console.log('⚔️ QUESTS TABLE:');
  try {
    const { data: quests, error } = await supabase
      .from('quests')
      .select('id, name, category, difficulty')
      .limit(10);
    
    if (error) {
      console.log('  ❌ Error:', error.message);
    } else {
      console.log('  ✅ Count:', quests?.length || 0);
      console.log('  📊 Categories:', [...new Set(quests?.map(q => q.category) || [])]);
      console.log('  📝 Sample entries:');
      quests?.slice(0, 5).forEach(q => {
        console.log(`    - ${q.name} (${q.category}) [${q.difficulty}]`);
      });
    }
  } catch (err) {
    console.log('  ❌ Exception:', err.message);
  }
  
  console.log('\n');
  
  // 3. Check MILESTONES table
  console.log('🏆 MILESTONES TABLE:');
  try {
    const { data: milestones, error } = await supabase
      .from('milestones')
      .select('id, name, category, target')
      .limit(10);
    
    if (error) {
      console.log('  ❌ Error:', error.message);
    } else {
      console.log('  ✅ Count:', milestones?.length || 0);
      console.log('  📊 Categories:', [...new Set(milestones?.map(m => m.category) || [])]);
      console.log('  📝 Sample entries:');
      milestones?.slice(0, 5).forEach(m => {
        console.log(`    - ${m.name} (${m.category}) [target: ${m.target}]`);
      });
    }
  } catch (err) {
    console.log('  ❌ Exception:', err.message);
  }
  
  console.log('\n');
  
  // 4. Check QUEST_COMPLETION table
  console.log('✅ QUEST_COMPLETION TABLE:');
  try {
    const { data: completions, error } = await supabase
      .from('quest_completion')
      .select('quest_id, completed, completed_at')
      .limit(10);
    
    if (error) {
      console.log('  ❌ Error:', error.message);
    } else {
      console.log('  ✅ Count:', completions?.length || 0);
      console.log('  📝 Sample entries:');
      completions?.slice(0, 5).forEach(c => {
        console.log(`    - ${c.quest_id} (completed: ${c.completed})`);
      });
    }
  } catch (err) {
    console.log('  ❌ Exception:', err.message);
  }
  
  console.log('\n🎯 SUMMARY:');
  console.log('This will help us understand which table contains the actual quest data');
  console.log('and what categories are being used in the database.');
}

diagnoseDatabase().catch(console.error);
