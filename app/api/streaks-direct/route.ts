import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import { supabaseServer } from '../../../lib/supabase/server-client'

// Check if recovery columns exist in the database
async function checkRecoveryColumnsExist(): Promise<boolean> {
  // TEMPORARY: Disable recovery features to fix 500 errors
  // TODO: Re-enable after basic functionality is working
  console.log('[Recovery Check] Recovery features temporarily disabled for stability');
  return false;
}

// Get column list based on what's available
function getColumnList(hasRecoveryColumns: boolean): string {
  const baseColumns = 'streak_days, week_streaks, last_activity_date';
  
  if (hasRecoveryColumns) {
    return `${baseColumns}, resilience_points, safety_net_used, missed_days_this_week, last_missed_date, consecutive_weeks_completed, streak_broken_date, max_streak_achieved`;
  }
  
  return baseColumns;
}

// Add default values for missing recovery fields
function addDefaultRecoveryValues(data: any) {
  if (!data) return data;
  
  return {
    ...data,
    resilience_points: data.resilience_points ?? 0,
    safety_net_used: data.safety_net_used ?? false,
    missed_days_this_week: data.missed_days_this_week ?? 0,
    last_missed_date: data.last_missed_date ?? null,
    consecutive_weeks_completed: data.consecutive_weeks_completed ?? 0,
    streak_broken_date: data.streak_broken_date ?? null,
    max_streak_achieved: data.max_streak_achieved ?? (data.streak_days || 0)
  };
}

export async function GET(req: NextRequest) {
  try {
    console.log('[Streaks Direct GET] Starting request...');
    
    const { userId } = await getAuth(req)
    console.log('[Streaks Direct GET] User ID:', userId ? 'present' : 'missing');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') || 'test'
    console.log('[Streaks Direct GET] Category:', category);

    // Check if recovery columns exist
    console.log('[Streaks Direct GET] Checking recovery columns...');
    const hasRecoveryColumns = await checkRecoveryColumnsExist();
    console.log('[Streaks Direct GET] Recovery columns available:', hasRecoveryColumns);

    // Query with appropriate columns
    const columnList = getColumnList(hasRecoveryColumns);
    console.log('[Streaks Direct GET] Column list:', columnList);
    
    console.log('[Streaks Direct GET] Executing database query...');
    const { data, error } = await supabaseServer
      .from('streaks')
      .select(columnList)
      .eq('user_id', userId)
      .eq('category', category)
      .single();

    console.log('[Streaks Direct GET] Query result:', { 
      hasData: !!data, 
      errorCode: error?.code, 
      errorMessage: error?.message 
    });

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('[Streaks Direct GET] Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return with default values if no data found
    if (!data) {
      const defaultData = {
        streak_days: 0,
        week_streaks: 0,
        last_activity_date: null,
        resilience_points: 0,
        safety_net_used: false,
        missed_days_this_week: 0,
        last_missed_date: null,
        consecutive_weeks_completed: 0,
        streak_broken_date: null,
        max_streak_achieved: 0
      };
      
      return NextResponse.json(defaultData);
    }

    // Add default recovery values if needed
    const responseData = addDefaultRecoveryValues(data);

    return NextResponse.json(responseData);

  } catch (err: any) {
    console.error('[Streaks Direct GET] Error:', err);
    return NextResponse.json({
      error: err.message || 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getAuth(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
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
    } = body

    if (!category) {
      return NextResponse.json({
        error: 'Missing required fields: category'
      }, { status: 400 })
    }

    // Check if recovery columns exist
    const hasRecoveryColumns = await checkRecoveryColumnsExist();
    console.log('[Streaks Direct POST] Recovery columns available:', hasRecoveryColumns);

    const today = new Date().toISOString().slice(0, 10);
    let resilienceBonus = 0;

    // Build update data based on available columns
    const updateData: any = {
      user_id: userId,
      category: category,
      last_activity_date: today
    };

    // Add basic fields if provided
    if (streak_days !== undefined) updateData.streak_days = streak_days;
    if (week_streaks !== undefined) updateData.week_streaks = week_streaks;

    // Add recovery fields only if columns exist
    if (hasRecoveryColumns) {
      if (resilience_points !== undefined) updateData.resilience_points = resilience_points;
      if (safety_net_used !== undefined) updateData.safety_net_used = safety_net_used;
      if (missed_days_this_week !== undefined) updateData.missed_days_this_week = missed_days_this_week;
      if (last_missed_date !== undefined) updateData.last_missed_date = last_missed_date;
      if (consecutive_weeks_completed !== undefined) updateData.consecutive_weeks_completed = consecutive_weeks_completed;
      if (streak_broken_date !== undefined) updateData.streak_broken_date = streak_broken_date;
      if (max_streak_achieved !== undefined) updateData.max_streak_achieved = Math.max(max_streak_achieved, streak_days || 0);

      // Calculate resilience bonus (1 point per 7 days)
      if (streak_days && streak_days > 0 && streak_days % 7 === 0) {
        resilienceBonus = 1;
        updateData.resilience_points = (resilience_points || 0) + resilienceBonus;
      }
    } else {
      // Without recovery columns, we can't calculate resilience bonus
      resilienceBonus = 0;
    }

    // Upsert the data
    const { data, error } = await supabaseServer
      .from('streaks')
      .upsert(updateData, { onConflict: 'user_id,category' })
      .select()
      .single();

    if (error) {
      console.error('[Streaks Direct POST] Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Add default recovery values to response
    const responseData = addDefaultRecoveryValues(data);

    return NextResponse.json({
      ...responseData,
      resilienceBonus: resilienceBonus
    });

  } catch (err: any) {
    console.error('[Streaks Direct POST] Error:', err);
    return NextResponse.json({
      error: err.message || 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if recovery columns exist first
    const hasRecoveryColumns = await checkRecoveryColumnsExist();
    
    if (!hasRecoveryColumns) {
      return NextResponse.json({
        error: 'Recovery features not available. Please run the database migration first.'
      }, { status: 400 });
    }

    const body = await req.json();
    const { category, action } = body;

    if (!category || !action) {
      return NextResponse.json({
        error: 'Missing required fields: category, action'
      }, { status: 400 });
    }

    // Get current streak data
    const { data: currentStreak, error: fetchError } = await supabaseServer
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const today = new Date().toISOString().slice(0, 10);
    let updateData: any = {};
    let response: any = { success: true };

    switch (action) {
      case 'use_safety_net':
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
        const { cost = 5 } = body;
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