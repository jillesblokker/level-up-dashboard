// Advanced streak calculation utility with recovery features
export interface StreakData {
  streak_days: number;
  week_streaks: number;
  resilience_points: number;
  safety_net_used: boolean;
  missed_days_this_week: number;
  last_missed_date: string | null;
  consecutive_weeks_completed: number;
  streak_broken_date: string | null;
  max_streak_achieved: number;
  last_activity_date: string | null;
}

export interface StreakUpdateResult {
  newStreakData: Partial<StreakData>;
  message: string;
  resiliencePointsEarned: number;
  shouldBreakStreak: boolean;
  safetyNetActivated: boolean;
}

/**
 * Calculate what happens when a user completes or misses their daily goal
 */
export function calculateStreakUpdate(
  currentStreak: StreakData | null,
  completed: boolean,
  category: string
): StreakUpdateResult {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  
  // Initialize default streak data if none exists
  const streak: StreakData = currentStreak || {
    streak_days: 0,
    week_streaks: 0,
    resilience_points: 0,
    safety_net_used: false,
    missed_days_this_week: 0,
    last_missed_date: null,
    consecutive_weeks_completed: 0,
    streak_broken_date: null,
    max_streak_achieved: 0,
    last_activity_date: null
  };

  let newStreakData: Partial<StreakData> = {};
  let message = '';
  let resiliencePointsEarned = 0;
  let shouldBreakStreak = false;
  let safetyNetActivated = false;

  // Check if it's a new week (Monday) to reset safety net
  const todayDate = new Date();
  const isMonday = todayDate.getDay() === 1;
  const lastActivityDate = streak.last_activity_date ? new Date(streak.last_activity_date) : null;
  const isNewWeek = isMonday && (!lastActivityDate || lastActivityDate.getDay() !== 1);

  if (isNewWeek) {
    newStreakData.safety_net_used = false;
    newStreakData.missed_days_this_week = 0;
  }

  if (completed) {
    // User completed their goal today
    const wasYesterday = streak.last_activity_date === yesterday;
    const isConsecutive = wasYesterday || streak.last_activity_date === today;
    
    if (streak.last_activity_date === today) {
      // Already completed today, no change needed
      message = 'Already completed today!';
      return {
        newStreakData: {},
        message,
        resiliencePointsEarned: 0,
        shouldBreakStreak: false,
        safetyNetActivated: false
      };
    }

    // Calculate new streak
    let newStreakDays: number;
    if (isConsecutive) {
      newStreakDays = (streak.streak_days || 0) + 1;
    } else {
      // Gap in activity, check if safety net should apply
      if (!streak.safety_net_used && streak.missed_days_this_week === 0) {
        // Apply safety net - don't break streak
        newStreakDays = (streak.streak_days || 0) + 1;
        safetyNetActivated = true;
        newStreakData.safety_net_used = true;
        newStreakData.missed_days_this_week = 1;
        message = 'Safety net activated! Your streak continues despite the missed day.';
      } else {
        // Start new streak
        newStreakDays = 1;
        message = 'New streak started!';
      }
    }

    // Award resilience points for weekly completions
    if (newStreakDays % 7 === 0) {
      resiliencePointsEarned = 1;
      newStreakData.consecutive_weeks_completed = (streak.consecutive_weeks_completed || 0) + 1;
    }

    newStreakData.streak_days = newStreakDays;
    newStreakData.last_activity_date = today;
    newStreakData.max_streak_achieved = Math.max(streak.max_streak_achieved || 0, newStreakDays);
    newStreakData.resilience_points = (streak.resilience_points || 0) + resiliencePointsEarned;
    newStreakData.streak_broken_date = null; // Clear any broken streak status

    if (!safetyNetActivated) {
      message = `Streak continued! Now at ${newStreakDays} days.`;
      if (resiliencePointsEarned > 0) {
        message += ` Earned ${resiliencePointsEarned} resilience point(s) for completing a week!`;
      }
    }

  } else {
    // User missed their goal - handle streak breaking logic
    const daysSinceLastActivity = streak.last_activity_date 
      ? Math.floor((new Date(today).getTime() - new Date(streak.last_activity_date).getTime()) / (1000 * 60 * 60 * 24))
      : 1;

    if (daysSinceLastActivity === 1) {
      // Missed exactly one day - check safety net
      if (!streak.safety_net_used && streak.missed_days_this_week === 0) {
        // Can use safety net
        safetyNetActivated = true;
        newStreakData.safety_net_used = true;
        newStreakData.missed_days_this_week = 1;
        newStreakData.last_missed_date = today;
        message = 'Safety net available! You can protect your streak by using it in the Recovery tab.';
      } else {
        // Break streak
        shouldBreakStreak = true;
        newStreakData.streak_days = 0;
        newStreakData.streak_broken_date = today;
        newStreakData.missed_days_this_week = (streak.missed_days_this_week || 0) + 1;
        message = `Streak broken after ${streak.streak_days} days. Visit Recovery tab for comeback challenges!`;
      }
    } else {
      // Missed multiple days - streak is broken
      shouldBreakStreak = true;
      newStreakData.streak_days = 0;
      newStreakData.streak_broken_date = today;
      newStreakData.missed_days_this_week = Math.min(7, (streak.missed_days_this_week || 0) + daysSinceLastActivity);
      message = `Streak broken after ${streak.streak_days} days. Visit Recovery tab for comeback challenges!`;
    }
  }

  return {
    newStreakData,
    message,
    resiliencePointsEarned,
    shouldBreakStreak,
    safetyNetActivated
  };
}

/**
 * Check if user qualifies for comeback challenges
 */
export function qualifiesForComebackChallenges(streak: StreakData | null): {
  qualifies: boolean;
  reason: string;
} {
  if (!streak) {
    return {
      qualifies: true,
      reason: 'No current streak - perfect time for a fresh start!'
    };
  }

  const today = new Date();
  
  if (streak.streak_days === 0 || streak.streak_broken_date) {
    return {
      qualifies: true,
      reason: 'Streak needs rebuilding - comeback challenges can help!'
    };
  }

  if (streak.missed_days_this_week > 0) {
    return {
      qualifies: true,
      reason: 'Missed some days this week - comeback challenges can help you get back on track!'
    };
  }

  if (streak.last_activity_date) {
    const lastActivity = new Date(streak.last_activity_date);
    const daysSinceActivity = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceActivity >= 2) {
      return {
        qualifies: true,
        reason: `${daysSinceActivity} days since last activity - ease back in with comeback challenges!`
      };
    }
  }

  return {
    qualifies: false,
    reason: 'You\'re doing great! Keep up your current streak.'
  };
}

/**
 * Calculate cost for streak reconstruction based on lost days
 */
export function calculateReconstructionCost(maxStreak: number, currentStreak: number): number {
  const lostDays = maxStreak - currentStreak;
  // Base cost of 5 build tokens, +1 for every 10 lost days
  return Math.max(5, 5 + Math.floor(lostDays / 10));
} 