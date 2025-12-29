import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import { supabaseServer } from '../../../lib/supabase/server-client'

// Check if recovery columns exist in the database
async function checkRecoveryColumnsExist(): Promise<boolean> {
  // TEMPORARY: Disable recovery features to fix 500 errors
  // TODO: Re-enable after basic functionality is working
  // Recovery features temporarily disabled for stability
  return false;
}

// Get column list based on what's available
function getColumnList(hasRecoveryColumns: boolean): string {
  // Only use columns that definitely exist based on diagnostic results
  const baseColumns = 'streak_days, week_streaks, last_check_in';

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
    // Add missing basic column with default
    last_activity_date: data.last_activity_date ?? null,
    // Add recovery columns with defaults
    resilience_points: data.resilience_points ?? 0,
    safety_net_used: data.safety_net_used ?? false,
    missed_days_this_week: data.missed_days_this_week ?? 0,
    last_missed_date: data.last_missed_date ?? null,
    consecutive_weeks_completed: data.consecutive_weeks_completed ?? 0,
    streak_broken_date: data.streak_broken_date ?? null,
    max_streak_achieved: data.max_streak_achieved ?? (data.streak_days || 0)
  };
}

// Extract user ID from Supabase JWT token
async function extractUserIdFromToken(req: NextRequest): Promise<string | null> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No Authorization header
      return null;
    }

    const token = authHeader.substring(7);
    // Token received

    // For Clerk JWT tokens, we can extract the user ID from the token
    // This is a simplified approach - in production you should verify the JWT
    const parts = token.split('.');
    if (parts.length === 3 && parts[1]) {
      try {
        // Decode base64url to base64, then decode
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
        // Token payload decoded

        // The user ID is in the 'sub' field for Clerk tokens
        if (payload.sub) {
          // UserId from token
          return payload.sub;
        }
      } catch (decodeError) {
        console.error('[Streaks Direct] Token decode failed:', decodeError);
      }
    }

    // Fallback: try to get user ID from Clerk
    try {
      const { userId } = await getAuth(req);
      if (userId) {
        // Got userId from Clerk
        return userId;
      }
    } catch (clerkError) {
      console.error('[Streaks Direct] Clerk auth failed:', clerkError);
    }

    return null;
  } catch (error) {
    console.error('[Streaks Direct] Error extracting user ID:', error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    // Start GET request

    const userId = await extractUserIdFromToken(req);
    // User ID present? (internal)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') || 'test'
    // Category param

    // Check if recovery columns exist
    // Checking recovery columns
    const hasRecoveryColumns = await checkRecoveryColumnsExist();
    // Recovery columns available flag

    // Query with appropriate columns
    const columnList = getColumnList(hasRecoveryColumns);
    // Selected column list

    // Executing database query
    const { data, error } = await supabaseServer
      .from('streaks')
      .select(columnList)
      .eq('user_id', userId)
      .eq('category', category)
      .single();

    // Query result (omitted)

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('[Streaks Direct GET] Database error:', error);
      return NextResponse.json({ error: error.message }, {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // Return with default values if no data found
    if (!data) {
      const defaultData = {
        streak_days: 0,
        week_streaks: 0,
        last_check_in: null,
        last_activity_date: null,
        resilience_points: 0,
        safety_net_used: false,
        missed_days_this_week: 0,
        last_missed_date: null,
        consecutive_weeks_completed: 0,
        streak_broken_date: null,
        max_streak_achieved: 0
      };

      return NextResponse.json(defaultData, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // Add default recovery values if needed
    const responseData = addDefaultRecoveryValues(data);

    return NextResponse.json(responseData, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (err: any) {
    console.error('[Streaks Direct GET] Error:', err);
    return NextResponse.json({
      error: err.message || 'Unknown error'
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await extractUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      })
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
      }, {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      })
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
      last_check_in: new Date().toISOString()
      // Note: last_activity_date column doesn't exist in current database
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
      return NextResponse.json({ error: error.message }, {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Add default recovery values to response
    const responseData = addDefaultRecoveryValues(data);

    return NextResponse.json({
      ...responseData,
      resilienceBonus: resilienceBonus
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (err: any) {
    console.error('[Streaks Direct POST] Error:', err);
    return NextResponse.json({
      error: err.message || 'Unknown error'
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await extractUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Check if recovery columns exist first
    const hasRecoveryColumns = await checkRecoveryColumnsExist();

    if (!hasRecoveryColumns) {
      return NextResponse.json({
        error: 'Recovery features not available. Please run the database migration first.'
      }, {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const body = await req.json();
    const { category, action } = body;

    if (!category || !action) {
      return NextResponse.json({
        error: 'Missing required fields: category, action'
      }, {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Get current streak data (only select columns that exist)
    const { data: currentStreak, error: fetchError } = await supabaseServer
      .from('streaks')
      .select('streak_days, week_streaks')
      .eq('user_id', userId)
      .eq('category', category)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      return NextResponse.json({ error: fetchError.message }, {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Since recovery features are currently disabled, return error for all actions
    return NextResponse.json({
      error: 'Recovery features are temporarily disabled. Basic streak functionality is available, but recovery actions require database migration.',
      availableAfterMigration: ['use_safety_net', 'reconstruct_streak', 'reset_weekly_safety_net'],
      action: action
    }, {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (err: any) {
    console.error('[Streaks Direct PUT] Error:', err);
    return NextResponse.json({
      error: err.message || 'Unknown error'
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 