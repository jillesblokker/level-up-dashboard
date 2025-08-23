const { createClient } = require('@supabase/supabase-js');

// Manually construct the correct Supabase service role key
const supabaseUrl = 'https://uunfpqrauivviygysjzj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1bmZwcXJhdWl2dml5Z3lzanpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk4NjYzMywiZXhwIjoyMDY0NTYyNjMzfQ.Mj368623YmNJoVaT79RzoERAFpS5cYvNpDbSjvHGT24';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  console.log('🔍 Checking table structures...\n');
  
  try {
    // Check challenge_completion table structure
    console.log('🏆 CHALLENGE_COMPLETION TABLE STRUCTURE:');
    console.log('='.repeat(50));
    
    const { data: challengeSample, error: challengeError } = await supabase
      .from('challenge_completion')
      .select('*')
      .limit(1);
    
    if (challengeError) {
      console.error('Challenge table error:', challengeError);
    } else if (challengeSample && challengeSample.length > 0) {
      console.log('Available columns:', Object.keys(challengeSample[0]));
      console.log('Sample data:', challengeSample[0]);
    } else {
      console.log('No data in challenge_completion table');
    }
    
    console.log('\n');
    
    // Check quest_completion table structure for comparison
    console.log('📋 QUEST_COMPLETION TABLE STRUCTURE:');
    console.log('='.repeat(50));
    
    const { data: questSample, error: questError } = await supabase
      .from('quest_completion')
      .select('*')
      .limit(1);
    
    if (questError) {
      console.error('Quest table error:', questError);
    } else if (questSample && questSample.length > 0) {
      console.log('Available columns:', Object.keys(questSample[0]));
      console.log('Sample data:', questSample[0]);
    } else {
      console.log('No data in quest_completion table');
    }
    
    console.log('\n');
    
    // Check milestone_completion table structure
    console.log('🎯 MILESTONE_COMPLETION TABLE STRUCTURE:');
    console.log('='.repeat(50));
    
    const { data: milestoneSample, error: milestoneError } = await supabase
      .from('milestone_completion')
      .select('*')
      .limit(1);
    
    if (milestoneError) {
      console.error('Milestone table error:', milestoneError);
    } else if (milestoneSample && milestoneSample.length > 0) {
      console.log('Available columns:', Object.keys(milestoneSample[0]));
      console.log('Sample data:', milestoneSample[0]);
    } else {
      console.log('No data in milestone_completion table');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTableStructure();
