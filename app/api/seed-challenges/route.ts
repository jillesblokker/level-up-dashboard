import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabase/server-client';

export async function GET(request: Request) {
  try {
    console.log('[Seed Challenges] Starting database seeding...');
    
    // Simple key protection for seeding
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (key !== 'seed123') {
      return NextResponse.json({ error: 'Unauthorized - invalid key' }, { status: 401 });
    }
    
    // First clear existing challenges
    const { error: deleteError } = await supabaseServer
      .from('challenges')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
    if (deleteError && deleteError.code !== 'PGRST116') { // PGRST116 = no rows to delete
      console.error('[Seed Challenges] Error clearing existing challenges:', deleteError);
    }
    
    // Define challenge data
    const challenges = [
      // Push Day (Chest, Shoulders, Triceps)
      { name: 'Push-up', description: 'Start in high plank, keep core tight, lower to near-ground, push up (3x12)', category: 'Push Day (Chest, Shoulders, Triceps)', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Overhead Press', description: 'Stand tall, press dumbbells overhead, control the descent (3x10)', category: 'Push Day (Chest, Shoulders, Triceps)', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Tricep Dip', description: 'Sit on chair edge, lower body using arms, push back up (3x10)', category: 'Push Day (Chest, Shoulders, Triceps)', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Pike Push-up', description: 'Start in downward dog, lower head towards ground, push up (3x8)', category: 'Push Day (Chest, Shoulders, Triceps)', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Diamond Push-up', description: 'Make diamond with hands, perform push-up (3x8)', category: 'Push Day (Chest, Shoulders, Triceps)', difficulty: 'medium', xp: 50, gold: 25 },
      
      // Pull Day (Back, Biceps)
      { name: 'Pull-up', description: 'Hang from bar, pull up until chin over bar, lower with control (3x8)', category: 'Pull Day (Back, Biceps)', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Bent-over Row', description: 'Hinge at hips, pull dumbbells to your sides, squeeze shoulder blades (3x12)', category: 'Pull Day (Back, Biceps)', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Bicep Curl', description: 'Stand tall, curl dumbbells up, control the descent (3x15)', category: 'Pull Day (Back, Biceps)', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Reverse Fly', description: 'Hinge forward, spread arms wide with dumbbells, squeeze shoulder blades (3x12)', category: 'Pull Day (Back, Biceps)', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Hammer Curl', description: 'Hold dumbbells with neutral grip, curl up and down (3x12)', category: 'Pull Day (Back, Biceps)', difficulty: 'medium', xp: 50, gold: 25 },
      
      // Leg Day
      { name: 'Squat', description: 'Feet shoulder-width apart, lower hips back and down, drive through heels to stand (3x15)', category: 'Leg Day', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Lunge', description: 'Step forward into lunge, push back to starting position (3x10 per leg)', category: 'Leg Day', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Calf Raise', description: 'Rise up on toes, hold briefly, lower slowly (3x20)', category: 'Leg Day', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Glute Bridge', description: 'Lie on back, drive hips up, squeeze glutes at top (3x15)', category: 'Leg Day', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Wall Sit', description: 'Back against wall, slide down to 90-degree angle, hold (3x45 sec)', category: 'Leg Day', difficulty: 'medium', xp: 50, gold: 25 },
      
      // Core & Flexibility
      { name: 'Plank', description: 'Hold high plank position, keep core tight, breathe steady (3x45 sec)', category: 'Core & Flexibility', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Russian Twist', description: 'Sit with legs up, twist torso side to side (3x20)', category: 'Core & Flexibility', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Dead Bug', description: 'Lie on back, extend opposite arm and leg, return to start (3x10 per side)', category: 'Core & Flexibility', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Cat-Cow Stretch', description: 'On hands and knees, arch and round your spine slowly (2x10)', category: 'Core & Flexibility', difficulty: 'easy', xp: 30, gold: 15 },
      { name: 'Child Pose', description: 'Kneel and sit back on heels, reach arms forward (2x30 sec)', category: 'Core & Flexibility', difficulty: 'easy', xp: 30, gold: 15 },
      
      // HIIT & Full Body
      { name: 'Burpee', description: 'Squat, jump to plank, jump in, explode up – repeat (3x15)', category: 'HIIT & Full Body', difficulty: 'hard', xp: 75, gold: 35 },
      { name: 'Mountain Climber', description: 'Start in high plank, run knees to chest quickly (3x30 sec)', category: 'HIIT & Full Body', difficulty: 'hard', xp: 75, gold: 35 },
      { name: 'Jump Squat', description: 'Squat down then jump explosively, land softly (3x20)', category: 'HIIT & Full Body', difficulty: 'hard', xp: 75, gold: 35 },
      { name: 'Full Body Push-up', description: 'Choose board color to target chest/triceps/shoulders (3x12)', category: 'HIIT & Full Body', difficulty: 'medium', xp: 50, gold: 25 }
    ];
    
    console.log('[Seed Challenges] Inserting', challenges.length, 'challenges...');
    
    // Insert challenges into database
    const { data, error } = await supabaseServer
      .from('challenges')
      .insert(challenges)
      .select();
      
    if (error) {
      console.error('[Seed Challenges] Error inserting challenges:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('[Seed Challenges] Successfully seeded', data.length, 'challenges');
    
    return NextResponse.json({ 
      message: `Successfully seeded ${data.length} challenges`,
      challenges: data.length
    });
    
  } catch (error) {
    console.error('[Seed Challenges] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 