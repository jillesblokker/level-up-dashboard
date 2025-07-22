import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../lib/supabase/server-client';

export async function GET(req: NextRequest) {
  try {
    // Use the same auth pattern as working endpoints
    const { userId } = await getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get category from query params
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || 'test';

    // Query database - try new fields first, fallback to basic fields if they don't exist
    let data, error;
    try {
      // Try to select all fields including new recovery fields
      const result = await supabaseServer
        .from('streaks')
        .select(`
          streak_days, 
          week_streaks, 
          resilience_points, 
          safety_net_used, 
          missed_days_this_week, 
          last_missed_date, 
          consecutive_weeks_completed, 
          streak_broken_date, 
          max_streak_achieved,
          last_activity_date
        `)
        .eq('user_id', userId)
        .eq('category', category)
        .single();
      
      data = result.data;
      error = result.error;
    } catch (newFieldsError) {
      // If new fields don't exist, fallback to basic fields only
      console.log('[Streaks Direct] New fields not available, using basic fields:', newFieldsError);
      const fallbackResult = await supabaseServer
        .from('streaks')
        .select('streak_days, week_streaks, last_activity_date')
        .eq('user_id', userId)
        .eq('category', category)
        .single();
      
      data = fallbackResult.data;
      error = fallbackResult.error;
      
      // Add default values for missing recovery fields
      if (data) {
        data = {
          ...data,
          resilience_points: 0,
          safety_net_used: false,
          missed_days_this_week: 0,
          last_missed_date: null,
          consecutive_weeks_completed: 0,
          streak_broken_date: null,
          max_streak_achieved: data.streak_days || 0
        };
      }
    }
        
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      return NextResponse.json({ 
        error: error.message,
        code: error.code 
      }, { status: 500 });
    }
    
    return NextResponse.json(data || { 
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
    });

  } catch (err: any) {
    console.error('[Streaks Direct] Error:', err);
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
    const { 
      category, 
      streak_days, 
      week_streaks,
      resilience_points,
      safety_net_used,
      missed_days_this_week,
      last_missed_date,
      consecutive_weeks_completed,
      streak_broken_date,
      max_streak_achieved
    } = body;

    if (!category) {
      return NextResponse.json({ 
        error: 'Missing required field: category' 
      }, { status: 400 });
    }

    // Calculate resilience points award for completing weeks
    const today = new Date().toISOString().slice(0, 10);
    let resilienceBonus = 0;
    
    // Award 1 resilience point for every 7 days of streak (weekly completion)
    if (streak_days && streak_days % 7 === 0 && streak_days > 0) {
      resilienceBonus = 1;
    }

    // Build the update object
    const updateData: any = {
      user_id: userId,
      category: category,
      last_activity_date: today,
    };

    // Only update provided fields
    if (streak_days !== undefined) updateData.streak_days = streak_days;
    if (week_streaks !== undefined) updateData.week_streaks = week_streaks;
    if (resilience_points !== undefined) updateData.resilience_points = resilience_points + resilienceBonus;
    if (safety_net_used !== undefined) updateData.safety_net_used = safety_net_used;
    if (missed_days_this_week !== undefined) updateData.missed_days_this_week = missed_days_this_week;
    if (last_missed_date !== undefined) updateData.last_missed_date = last_missed_date;
    if (consecutive_weeks_completed !== undefined) updateData.consecutive_weeks_completed = consecutive_weeks_completed;
    if (streak_broken_date !== undefined) updateData.streak_broken_date = streak_broken_date;
    if (max_streak_achieved !== undefined) updateData.max_streak_achieved = Math.max(max_streak_achieved, streak_days || 0);

    // Insert/update directly (RLS is disabled) - handle backward compatibility
    let data, error;
    try {
      const result = await supabaseServer
        .from('streaks')
        .upsert(updateData, { onConflict: 'user_id,category' })
        .select()
        .single();
      data = result.data;
      error = result.error;
    } catch (upsertError) {
      // If new fields don't exist, try with basic fields only
      console.log('[Streaks Direct POST] New fields not available, using basic fields');
      const basicUpdateData: any = {
        user_id: userId,
        category: category,
        last_activity_date: today
      };
      
      // Only include fields that are defined and exist in old schema
      if (streak_days !== undefined) basicUpdateData.streak_days = streak_days;
      if (week_streaks !== undefined) basicUpdateData.week_streaks = week_streaks;
      
      const fallbackResult = await supabaseServer
        .from('streaks')
        .upsert(basicUpdateData, { onConflict: 'user_id,category' })
        .select()
        .single();
      
      data = fallbackResult.data;
      error = fallbackResult.error;
      resilienceBonus = 0; // Can't calculate resilience bonus without new fields
    }
        
    if (error) {
      return NextResponse.json({ 
        error: error.message,
        code: error.code 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data,
      resilienceBonus: resilienceBonus
    });

  } catch (err: any) {
    console.error('[Streaks Direct POST] Error:', err);
    return NextResponse.json({ 
      error: err.message || 'Unknown error' 
    }, { status: 500 });
  }
}

// New endpoint for streak recovery actions
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { category, action } = body;

    if (!category || !action) {
      return NextResponse.json({ 
        error: 'Missing required fields: category, action' 
      }, { status: 400 });
    }

    // Get current streak data - handle backward compatibility
    let currentStreak, fetchError;
    try {
      const result = await supabaseServer
        .from('streaks')
        .select('*')
        .eq('user_id', userId)
        .eq('category', category)
        .single();
      currentStreak = result.data;
      fetchError = result.error;
    } catch (selectError) {
      // If new fields don't exist, get basic fields only
      const fallbackResult = await supabaseServer
        .from('streaks')
        .select('streak_days, week_streaks, last_activity_date')
        .eq('user_id', userId)
        .eq('category', category)
        .single();
      
      currentStreak = fallbackResult.data;
      fetchError = fallbackResult.error;
      
      // Add default recovery values
      if (currentStreak) {
        currentStreak = {
          ...currentStreak,
          safety_net_used: false,
          missed_days_this_week: 0,
          streak_broken_date: null,
          max_streak_achieved: currentStreak.streak_days || 0
        };
      }
    }

    if (fetchError && fetchError.code !== 'PGRST116') {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const today = new Date().toISOString().slice(0, 10);
    let updateData: any = {};
    let response: any = { success: true };

    switch (action) {
      case 'use_safety_net':
        // Use safety net to prevent streak break
        if (!currentStreak?.safety_net_used && currentStreak?.missed_days_this_week < 1) {
          updateData = {
            safety_net_used: true,
            missed_days_this_week: (currentStreak?.missed_days_this_week || 0) + 1,
            last_missed_date: today
          };
          response.message = 'Safety net activated! Your streak is protected for this missed day.';
        } else {
          return NextResponse.json({ 
            error: 'Safety net already used this week or too many missed days' 
          }, { status: 400 });
        }
        break;

      case 'reconstruct_streak':
        // Spend build tokens to restore broken streak
        const { cost = 5 } = body; // Default cost of 5 build tokens
        
        // Check if user has enough build tokens (this would need integration with build token system)
        if (currentStreak?.streak_broken_date) {
          updateData = {
            streak_days: currentStreak.max_streak_achieved || 0,
            streak_broken_date: null,
            missed_days_this_week: 0,
            safety_net_used: false
          };
          response.message = `Streak reconstructed! Restored to ${currentStreak.max_streak_achieved} days.`;
          response.buildTokensCost = cost;
        } else {
          return NextResponse.json({ 
            error: 'No broken streak to reconstruct' 
          }, { status: 400 });
        }
        break;

      case 'reset_weekly_safety_net':
        // Reset safety net for new week (called automatically)
        updateData = {
          safety_net_used: false,
          missed_days_this_week: 0
        };
        response.message = 'Weekly safety net reset';
        break;

      default:
        return NextResponse.json({ 
          error: 'Invalid action' 
        }, { status: 400 });
    }

    // Apply the update
    const { data, error } = await supabaseServer
      .from('streaks')
      .upsert({
        user_id: userId,
        category: category,
        ...updateData
      }, { onConflict: 'user_id,category' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ...response, data });

  } catch (err: any) {
    console.error('[Streaks Direct PUT] Error:', err);
    return NextResponse.json({ 
      error: err.message || 'Unknown error' 
    }, { status: 500 });
  }
} 