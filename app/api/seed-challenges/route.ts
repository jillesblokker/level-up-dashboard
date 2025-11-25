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
      // Push/Legs/Core
      { name: 'Squat (Barbell/Dumbbell)', description: 'Feet shoulder-width, chest up, lower hips back and down (3x10)', category: 'Push/Legs/Core', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Push-up', description: 'Hands shoulder-width, body in straight line, lower chest to floor (3x12)', category: 'Push/Legs/Core', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Lunge (Walking/Static)', description: 'Step forward, lower back knee, keep torso upright (3x10 per leg)', category: 'Push/Legs/Core', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Dumbbell Shoulder Press', description: 'Seated or standing, press weights overhead (3x10)', category: 'Push/Legs/Core', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Plank', description: 'Forearms on ground, body straight, hold (3x45 sec)', category: 'Push/Legs/Core', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Leg Raise', description: 'Lying on back, lift legs to 90 degrees, lower slowly (3x12)', category: 'Push/Legs/Core', difficulty: 'medium', xp: 50, gold: 25 },

      // Pull/Shoulder/Core
      { name: 'Deadlift (Dumbbell/Kettlebell)', description: 'Hinge at hips, keep back flat, lift weight (3x10)', category: 'Pull/Shoulder/Core', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Dumbbell Row', description: 'Hand on bench, pull weight to hip (3x10 per arm)', category: 'Pull/Shoulder/Core', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Lateral Raise', description: 'Lift weights to side until shoulder height (3x12)', category: 'Pull/Shoulder/Core', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Bicep Curl', description: 'Curl weights up, keep elbows pinned (3x12)', category: 'Pull/Shoulder/Core', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Russian Twist', description: 'Seated, lean back, twist torso side to side (3x20 total)', category: 'Pull/Shoulder/Core', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Superman', description: 'Lying on stomach, lift arms and legs (3x12)', category: 'Pull/Shoulder/Core', difficulty: 'medium', xp: 50, gold: 25 },

      // Legs/Arms/Core
      { name: 'Goblet Squat', description: 'Hold weight at chest, squat down (3x12)', category: 'Legs/Arms/Core', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Glute Bridge', description: 'Lying on back, lift hips up (3x15)', category: 'Legs/Arms/Core', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Tricep Dip (Chair/Bench)', description: 'Lower body using arms, push back up (3x12)', category: 'Legs/Arms/Core', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Hammer Curl', description: 'Curl weights with palms facing each other (3x12)', category: 'Legs/Arms/Core', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Bicycle Crunch', description: 'Opposite elbow to opposite knee (3x20 total)', category: 'Legs/Arms/Core', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Calf Raise', description: 'Lift heels off ground, pause at top (3x20)', category: 'Legs/Arms/Core', difficulty: 'medium', xp: 50, gold: 25 },

      // Core & Flexibility
      { name: 'Sun Salutation A', description: 'Flow through yoga poses (5 rounds)', category: 'Core & Flexibility', difficulty: 'easy', xp: 30, gold: 15 },
      { name: 'Cat-Cow Stretch', description: 'Arch and round spine on all fours (10 reps)', category: 'Core & Flexibility', difficulty: 'easy', xp: 30, gold: 15 },
      { name: 'Bird-Dog', description: 'Extend opposite arm and leg, hold (3x10 per side)', category: 'Core & Flexibility', difficulty: 'medium', xp: 40, gold: 20 },
      { name: 'Child\'s Pose', description: 'Kneel, sit back on heels, stretch arms forward (Hold 1 min)', category: 'Core & Flexibility', difficulty: 'easy', xp: 30, gold: 15 },
      { name: 'Hip Flexor Stretch', description: 'Lunge position, push hips forward (30 sec per side)', category: 'Core & Flexibility', difficulty: 'easy', xp: 30, gold: 15 },
      { name: 'Seated Forward Fold', description: 'Legs straight, reach for toes (Hold 1 min)', category: 'Core & Flexibility', difficulty: 'easy', xp: 30, gold: 15 },

      // HIIT & Full Body
      { name: 'Burpee', description: 'Squat, jump to plank, jump in, explode up – repeat (3x15)', category: 'HIIT & Full Body', difficulty: 'hard', xp: 75, gold: 35 },
      { name: 'Mountain Climber', description: 'Start in high plank, run knees to chest quickly (3x30 sec)', category: 'HIIT & Full Body', difficulty: 'hard', xp: 75, gold: 35 },
      { name: 'Jump Squat', description: 'Squat down then jump explosively, land softly (3x20)', category: 'HIIT & Full Body', difficulty: 'hard', xp: 75, gold: 35 },
      { name: 'Dumbbell Row (repeat)', description: 'Same as bent-over row – hinge and pull dumbbells to sides (3x12)', category: 'HIIT & Full Body', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Lunge (with dumbbells)', description: 'Step forward, keep torso upright, push back up (3x10 per leg)', category: 'HIIT & Full Body', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Push-up (your choice of board color)', description: 'Choose board color to target chest/triceps/shoulders (3x12)', category: 'HIIT & Full Body', difficulty: 'medium', xp: 50, gold: 25 }
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