const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('🔍 Checking Supabase data...\n');
  
  try {
    // 1. Check quest_completion table
    console.log('📋 QUEST COMPLETION DATA:');
    console.log('='.repeat(50));
    const { data: quests, error: questError } = await supabase
      .from('quest_completion')
      .select('*')
      .order('completed_at', { ascending: false })
      .limit(10);
    
    if (questError) {
      console.error('Quest error:', questError);
    } else {
      console.table(quests?.map(q => ({
        id: q.id,
        user_id: q.user_id?.substring(0, 8) + '...',
        quest_id: q.quest_id,
        completed: q.completed,
        completed_at: q.completed_at,
        gold_earned: q.gold_earned,
        xp_earned: q.xp_earned
      })) || []);
    }
    
    console.log('\n');
    
    // 2. Check challenge_completion table
    console.log('🏆 CHALLENGE COMPLETION DATA:');
    console.log('='.repeat(50));
    const { data: challenges, error: challengeError } = await supabase
      .from('challenge_completion')
      .select('*')
      .order('completed_at', { ascending: false })
      .limit(10);
    
    if (challengeError) {
      console.error('Challenge error:', challengeError);
    } else {
      console.table(challenges?.map(c => ({
        id: c.id,
        user_id: c.user_id?.substring(0, 8) + '...',
        challenge_id: c.challenge_id,
        completed: c.completed,
        completed_at: c.completed_at,
        gold_earned: c.gold_earned,
        xp_earned: c.xp_earned
      })) || []);
    }
    
    console.log('\n');
    
    // 3. Check milestone_completion table
    console.log('🎯 MILESTONE COMPLETION DATA:');
    console.log('='.repeat(50));
    const { data: milestones, error: milestoneError } = await supabase
      .from('milestone_completion')
      .select('*')
      .order('date', { ascending: false })
      .limit(10);
    
    if (milestoneError) {
      console.error('Milestone error:', milestoneError);
    } else {
      console.table(milestones?.map(m => ({
        id: m.id,
        user_id: m.user_id?.substring(0, 8) + '...',
        milestone_id: m.milestone_id,
        completed: m.completed,
        date: m.date
      })) || []);
    }
    
    console.log('\n');
    
    // 4. Check challenges table (quest definitions)
    console.log('📚 CHALLENGES TABLE (Quest Definitions):');
    console.log('='.repeat(50));
    const { data: challengeDefs, error: challengeDefError } = await supabase
      .from('challenges')
      .select('*')
      .limit(10);
    
    if (challengeDefError) {
      console.error('Challenge definitions error:', challengeDefError);
    } else {
      console.table(challengeDefs?.map(c => ({
        id: c.id,
        name: c.name,
        title: c.title,
        type: c.type,
        gold_reward: c.gold_reward,
        xp_reward: c.xp_reward
      })) || []);
    }
    
    console.log('\n');
    
    // 5. Check milestones table
    console.log('🏁 MILESTONES TABLE:');
    console.log('='.repeat(50));
    const { data: milestoneDefs, error: milestoneDefError } = await supabase
      .from('milestones')
      .select('*')
      .limit(10);
    
    if (milestoneDefError) {
      console.error('Milestone definitions error:', milestoneDefError);
    } else {
      console.table(milestoneDefs?.map(m => ({
        id: m.id,
        name: m.name,
        title: m.title,
        type: m.type,
        gold_reward: m.gold_reward,
        xp_reward: m.xp_reward
      })) || []);
    }
    
    console.log('\n');
    
    // 6. Summary statistics
    console.log('📊 SUMMARY STATISTICS:');
    console.log('='.repeat(50));
    
    const { count: questCount } = await supabase
      .from('quest_completion')
      .select('*', { count: 'exact', head: true });
    
    const { count: challengeCount } = await supabase
      .from('challenge_completion')
      .select('*', { count: 'exact', head: true });
    
    const { count: milestoneCount } = await supabase
      .from('milestone_completion')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Total quest completions: ${questCount || 0}`);
    console.log(`Total challenge completions: ${challengeCount || 0}`);
    console.log(`Total milestone completions: ${milestoneCount || 0}`);
    
    // Check for recent data
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24*60*60*1000).toISOString().split('T')[0];
    
    console.log(`\nRecent activity:`);
    console.log(`Today (${today}): Check data above`);
    console.log(`Yesterday (${yesterday}): Check data above`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkData();
