import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../lib/supabase/server-client';

// Comeback challenges - easier versions of regular challenges to rebuild momentum
const comebackChallenges = {
  'Push/Legs/Core': [
    { name: 'Easy Push-up', description: 'Start with 5 push-ups (knee push-ups OK)', xp: 25, gold: 10, difficulty: 'easy' },
    { name: 'Wall Push', description: 'Stand arm\'s length from wall, do 10 wall push-ups', xp: 20, gold: 8, difficulty: 'easy' },
    { name: 'Chair Dip', description: 'Sit on chair edge, do 5 gentle dips', xp: 25, gold: 10, difficulty: 'easy' },
  ],
  'Pull/Shoulder/Core': [
    { name: 'Arm Circles', description: '10 forward + 10 backward arm circles', xp: 20, gold: 8, difficulty: 'easy' },
    { name: 'Door Frame Stretch', description: 'Hold door frame stretch for 30 seconds', xp: 15, gold: 6, difficulty: 'easy' },
    { name: 'Shoulder Shrugs', description: 'Do 15 shoulder shrugs, hold for 2 seconds each', xp: 20, gold: 8, difficulty: 'easy' },
  ],
  'Legs/Arms/Core': [
    { name: 'Chair Stand', description: 'Stand up and sit down from chair 10 times', xp: 25, gold: 10, difficulty: 'easy' },
    { name: 'Heel Raises', description: 'Rise up on toes 15 times, hold briefly', xp: 20, gold: 8, difficulty: 'easy' },
    { name: 'Seated March', description: 'Sit and march in place for 30 seconds', xp: 20, gold: 8, difficulty: 'easy' },
  ],
  'HIIT & Full Body': [
    { name: 'Step Touch', description: 'Step side to side for 30 seconds', xp: 20, gold: 8, difficulty: 'easy' },
    { name: 'Gentle Jumping Jacks', description: 'Do 10 gentle jumping jacks (step out instead of jumping)', xp: 25, gold: 10, difficulty: 'easy' },
    { name: 'Deep Breathing', description: 'Take 10 deep breaths, hold for 3 seconds each', xp: 15, gold: 6, difficulty: 'easy' },
  ]
};

export async function GET(req: NextRequest) {
  try {
    const { userId } = await getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    if (!category) {
      return NextResponse.json({ error: 'Category parameter required' }, { status: 400 });
    }

    // Check if user qualifies for comeback challenges
    const { data: streak, error: streakError } = await supabaseServer
      .from('streaks')
      .select('streak_days, streak_broken_date, last_activity_date, missed_days_this_week')
      .eq('user_id', userId)
      .eq('category', category)
      .single();

    if (streakError && streakError.code !== 'PGRST116') {
      return NextResponse.json({ error: streakError.message }, { status: 500 });
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let qualifiesForComeback = false;
    let reason = '';

    if (!streak || streak.streak_days === 0) {
      qualifiesForComeback = true;
      reason = 'No current streak - perfect time for a fresh start!';
    } else if (streak.streak_broken_date) {
      const brokenDate = new Date(streak.streak_broken_date);
      const daysSinceBroken = Math.floor((today.getTime() - brokenDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceBroken >= 1 && daysSinceBroken <= 7) {
        qualifiesForComeback = true;
        reason = `Streak broken ${daysSinceBroken} day(s) ago - let\'s rebuild momentum!`;
      }
    } else if (streak.missed_days_this_week > 0) {
      qualifiesForComeback = true;
      reason = 'Missed some days this week - comeback challenges can help you get back on track!';
    } else if (streak.last_activity_date) {
      const lastActivity = new Date(streak.last_activity_date);
      const daysSinceActivity = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceActivity >= 2) {
        qualifiesForComeback = true;
        reason = `${daysSinceActivity} days since last activity - ease back in with comeback challenges!`;
      }
    }

    const challenges = comebackChallenges[category as keyof typeof comebackChallenges] || [];

    return NextResponse.json({
      qualifiesForComeback,
      reason,
      challenges: qualifiesForComeback ? challenges : [],
      category,
      streakInfo: streak
    });

  } catch (err: any) {
    console.error('[Comeback Challenges] Error:', err);
    return NextResponse.json({ 
      error: err.message || 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { category, challengeName, completed } = body;

    if (!category || !challengeName || completed === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields: category, challengeName, completed' 
      }, { status: 400 });
    }

    // Find the challenge
    const categoryChalls = comebackChallenges[category as keyof typeof comebackChallenges] || [];
    const challenge = categoryChalls.find(c => c.name === challengeName);

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    if (completed) {
      // Award XP and gold for completing comeback challenge
      // This would integrate with your character stats system
      
      // Get current streak data
      const { data: currentStreak, error: fetchError } = await supabaseServer
        .from('streaks')
        .select('*')
        .eq('user_id', userId)
        .eq('category', category)
        .single();

      const today = new Date().toISOString().slice(0, 10);
      
      // If this is their first activity after a break, start rebuilding streak
      let newStreakDays = 1;
      if (currentStreak && currentStreak.last_activity_date === today) {
        // Already active today, don't increment
        newStreakDays = currentStreak.streak_days || 1;
      }

      // Update streak with comeback progress
      const { data: updatedStreak, error: updateError } = await supabaseServer
        .from('streaks')
        .upsert({
          user_id: userId,
          category: category,
          streak_days: newStreakDays,
          last_activity_date: today,
          missed_days_this_week: Math.max(0, (currentStreak?.missed_days_this_week || 0) - 1), // Reduce missed days
          streak_broken_date: null // Clear broken status
        }, { onConflict: 'user_id,category' })
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Great job! Completed "${challengeName}" and earned ${challenge.xp} XP, ${challenge.gold} gold!`,
        rewards: {
          xp: challenge.xp,
          gold: challenge.gold
        },
        streakData: updatedStreak
      });
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('[Comeback Challenges POST] Error:', err);
    return NextResponse.json({ 
      error: err.message || 'Unknown error' 
    }, { status: 500 });
  }
} 