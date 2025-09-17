import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

export async function POST(request: NextRequest) {
  try {
    console.log('[Restore Original Challenges] Starting restoration process');
    
    const { userId } = await auth();
    if (!userId) {
      console.error('[Restore Original Challenges] Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Restore Original Challenges] Authenticated user:', userId);
    
    // First, clear existing challenges
    const { error: deleteError } = await supabaseServer
      .from('challenges')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (deleteError) {
      console.error('[Restore Original Challenges] Error clearing existing challenges:', deleteError);
      return NextResponse.json({ error: 'Failed to clear existing challenges' }, { status: 500 });
    }

    console.log('[Restore Original Challenges] Cleared existing challenges');

    // Insert the user's original challenges
    const originalChallenges = [
      // Push/Legs/Core Category
      { name: 'Push-up (blue – chest, push-up board, 3 positions)', description: 'Place hands on the blue slots (left, middle, right), perform 12 push-ups per position.', category: 'Push/Legs/Core', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Push-up (green – triceps, push-up board, 3 positions)', description: 'Place hands on the green slots and perform 10 triceps push-ups per position.', category: 'Push/Legs/Core', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Goblet Squat (with dumbbell/barbell)', description: 'Hold a dumbbell in front of your chest, squat deeply with control.', category: 'Push/Legs/Core', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Lunges (left & right)', description: 'Step forward deeply, bend your back knee toward the floor, alternate legs.', category: 'Push/Legs/Core', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Crunch', description: 'Lie on your back, feet flat, curl up toward your knees.', category: 'Push/Legs/Core', difficulty: 'easy', xp: 30, gold: 15 },
      { name: 'Plank', description: 'Support on forearms and toes, hold your body straight and core tight.', category: 'Push/Legs/Core', difficulty: 'medium', xp: 50, gold: 25 },

      // Pull/Shoulder/Core Category
      { name: 'Australian Pull-up (under table)', description: 'Grip the table edge, pull chest to the edge, lower with control.', category: 'Pull/Shoulder/Core', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Dumbbell Bent-Over Row', description: 'Lean forward, keep back straight, row dumbbells to your ribs.', category: 'Pull/Shoulder/Core', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Push-up (yellow – shoulders, 3 positions)', description: 'Place hands on yellow slots, lower your head between your hands.', category: 'Pull/Shoulder/Core', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Push-up (red – shoulders, 3 positions)', description: 'Use red slots, perform push-ups targeting shoulders.', category: 'Pull/Shoulder/Core', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Side Plank (left & right)', description: 'Support on one forearm, lift hips high and hold – do both sides.', category: 'Pull/Shoulder/Core', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Lying Leg Raise', description: 'Lie flat, raise legs up, lower slowly while keeping back flat.', category: 'Pull/Shoulder/Core', difficulty: 'medium', xp: 50, gold: 25 },

      // Legs/Arms/Core Category
      { name: 'Squat (barbell or 2 dumbbells)', description: 'Hold weight on shoulders, squat deep with control.', category: 'Legs/Arms/Core', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Dumbbell Deadlift', description: 'Stand tall, bend at hips, lower dumbbells close to legs and lift.', category: 'Legs/Arms/Core', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Dumbbell Bicep Curl', description: 'Stand tall, curl dumbbells to shoulders, lower slowly.', category: 'Legs/Arms/Core', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Dumbbell Shoulder Press', description: 'Press dumbbells overhead while standing or seated.', category: 'Legs/Arms/Core', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Reverse Plank', description: 'Sit with legs extended, lift hips, support on heels and hands.', category: 'Legs/Arms/Core', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Crunch', description: 'Lie back, feet flat, lift shoulders off the floor.', category: 'Legs/Arms/Core', difficulty: 'easy', xp: 30, gold: 15 },

      // HIIT & Full Body Category
      { name: 'Burpee', description: 'Squat, jump to plank, jump in, explode up – repeat.', category: 'HIIT & Full Body', difficulty: 'hard', xp: 75, gold: 35 },
      { name: 'Mountain Climber', description: 'Start in high plank, run knees to chest quickly.', category: 'HIIT & Full Body', difficulty: 'hard', xp: 75, gold: 35 },
      { name: 'Jump Squat', description: 'Squat down then jump explosively, land softly.', category: 'HIIT & Full Body', difficulty: 'hard', xp: 75, gold: 35 },
      { name: 'Dumbbell Row (repeat)', description: 'Same as bent-over row – hinge and pull dumbbells to sides.', category: 'HIIT & Full Body', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Lunge (with dumbbells)', description: 'Step forward, keep torso upright, push back up.', category: 'HIIT & Full Body', difficulty: 'medium', xp: 50, gold: 25 },
      { name: 'Push-up (your choice of board color)', description: 'Choose board color to target chest/triceps/shoulders.', category: 'HIIT & Full Body', difficulty: 'medium', xp: 50, gold: 25 }
    ];

    const { data: insertData, error: insertError } = await supabaseServer
      .from('challenges')
      .insert(originalChallenges)
      .select();

    if (insertError) {
      console.error('[Restore Original Challenges] Error inserting challenges:', insertError);
      return NextResponse.json({ error: 'Failed to insert original challenges' }, { status: 500 });
    }

    console.log('[Restore Original Challenges] Successfully restored:', insertData?.length || 0, 'original challenges');

    // Group challenges by category for response
    const challengesByCategory = originalChallenges.reduce((acc, challenge) => {
      if (!acc[challenge.category]) {
        acc[challenge.category] = [];
      }
      acc[challenge.category].push(challenge.name);
      return acc;
    }, {} as Record<string, string[]>);

    return NextResponse.json({ 
      success: true,
      message: `Successfully restored ${insertData?.length || 0} original challenges`,
      restored: insertData?.length || 0,
      challengesByCategory,
      totalCategories: Object.keys(challengesByCategory).length
    });

  } catch (error) {
    console.error('[Restore Original Challenges] Internal server error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
  }
}
