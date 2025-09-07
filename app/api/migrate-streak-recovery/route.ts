import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('[Streak Recovery Migration] Starting migration...');
    
    // Check authentication
    const { userId } = await getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Streak Recovery Migration] Authenticated user:', userId);

    // Use service role key for admin operations
    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
    const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Execute migration statements directly
    const migrationResults = [];

    // Add resilience_points column
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE public.streaks ADD COLUMN IF NOT EXISTS resilience_points INTEGER DEFAULT 0;'
      });
      if (error) throw error;
      migrationResults.push({ column: 'resilience_points', success: true });
    } catch (err: any) {
      migrationResults.push({ column: 'resilience_points', error: err.message });
    }

    // Add safety_net_used column
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE public.streaks ADD COLUMN IF NOT EXISTS safety_net_used BOOLEAN DEFAULT false;'
      });
      if (error) throw error;
      migrationResults.push({ column: 'safety_net_used', success: true });
    } catch (err: any) {
      migrationResults.push({ column: 'safety_net_used', error: err.message });
    }

    // Add missed_days_this_week column
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE public.streaks ADD COLUMN IF NOT EXISTS missed_days_this_week INTEGER DEFAULT 0;'
      });
      if (error) throw error;
      migrationResults.push({ column: 'missed_days_this_week', success: true });
    } catch (err: any) {
      migrationResults.push({ column: 'missed_days_this_week', error: err.message });
    }

    // Add last_missed_date column
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE public.streaks ADD COLUMN IF NOT EXISTS last_missed_date DATE;'
      });
      if (error) throw error;
      migrationResults.push({ column: 'last_missed_date', success: true });
    } catch (err: any) {
      migrationResults.push({ column: 'last_missed_date', error: err.message });
    }

    // Add consecutive_weeks_completed column
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE public.streaks ADD COLUMN IF NOT EXISTS consecutive_weeks_completed INTEGER DEFAULT 0;'
      });
      if (error) throw error;
      migrationResults.push({ column: 'consecutive_weeks_completed', success: true });
    } catch (err: any) {
      migrationResults.push({ column: 'consecutive_weeks_completed', error: err.message });
    }

    // Add streak_broken_date column
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE public.streaks ADD COLUMN IF NOT EXISTS streak_broken_date DATE;'
      });
      if (error) throw error;
      migrationResults.push({ column: 'streak_broken_date', success: true });
    } catch (err: any) {
      migrationResults.push({ column: 'streak_broken_date', error: err.message });
    }

    // Add max_streak_achieved column
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE public.streaks ADD COLUMN IF NOT EXISTS max_streak_achieved INTEGER DEFAULT 0;'
      });
      if (error) throw error;
      migrationResults.push({ column: 'max_streak_achieved', success: true });
    } catch (err: any) {
      migrationResults.push({ column: 'max_streak_achieved', error: err.message });
    }

    // Update existing streaks to set max_streak_achieved
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: 'UPDATE public.streaks SET max_streak_achieved = GREATEST(streak_days, COALESCE(max_streak_achieved, 0)) WHERE max_streak_achieved IS NULL OR max_streak_achieved < streak_days;'
      });
      if (error) throw error;
      migrationResults.push({ operation: 'update_max_streak', success: true });
    } catch (err: any) {
      migrationResults.push({ operation: 'update_max_streak', error: err.message });
    }

    // Check for any failures
    const failedOperations = migrationResults.filter(r => r.error);
    if (failedOperations.length > 0) {
      console.error('[Streak Recovery Migration] Some operations failed:', failedOperations);
      return NextResponse.json({ 
        error: 'Some migration operations failed', 
        details: failedOperations,
        results: migrationResults 
      }, { status: 500 });
    }

    console.log('[Streak Recovery Migration] All operations completed successfully');

    // Verify the migration by checking if the new columns exist
    const { data: columnCheck, error: checkError } = await supabase
      .from('streaks')
      .select('resilience_points, safety_net_used, missed_days_this_week, last_missed_date, consecutive_weeks_completed, streak_broken_date, max_streak_achieved')
      .limit(1);

    if (checkError) {
      console.error('[Streak Recovery Migration] Column verification failed:', checkError);
      return NextResponse.json({ 
        error: 'Migration completed but verification failed', 
        details: checkError.message 
      }, { status: 500 });
    }

    console.log('[Streak Recovery Migration] Column verification successful');

    return NextResponse.json({ 
      success: true, 
      message: 'Streak recovery migration completed successfully! 🎉',
      verified: true,
      columnsAdded: [
        'resilience_points',
        'safety_net_used', 
        'missed_days_this_week',
        'last_missed_date',
        'consecutive_weeks_completed',
        'streak_broken_date',
        'max_streak_achieved'
      ],
      results: migrationResults
    });

  } catch (error: any) {
    console.error('[Streak Recovery Migration] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
