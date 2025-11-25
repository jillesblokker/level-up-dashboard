// Simple test script to check database data
// Run this in your Supabase SQL editor

console.log('=== CHECKING QUEST_COMPLETION TABLE ===');
console.log('1. First, let\'s see what\'s in quest_completion:');
console.log('SELECT * FROM quest_completion LIMIT 10;');

console.log('\n2. Check the table structure:');
console.log('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'quest_completion\';');

console.log('\n3. Check if there are any quest completions for any user:');
console.log('SELECT user_id, quest_id, completed, completed_at FROM quest_completion WHERE completed = true LIMIT 10;');

console.log('\n4. Check the challenges table:');
console.log('SELECT id, name, category FROM challenges LIMIT 10;');

console.log('\n5. Check if there are any users in the system:');
console.log('SELECT DISTINCT user_id FROM quest_completion LIMIT 10;');

console.log('\n=== RUN THESE QUERIES IN SUPABASE SQL EDITOR ===');
console.log('This will help us see what data actually exists and what the table structure looks like.');
