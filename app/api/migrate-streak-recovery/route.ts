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

    // First, let's check if the columns already exist
    console.log('[Streak Recovery Migration] Checking if columns already exist...');
    const { data: existingColumns, error: checkError } = await supabase
      .from('streaks')
      .select('resilience_points, safety_net_used, missed_days_this_week, last_missed_date, consecutive_weeks_completed, streak_broken_date, max_streak_achieved')
      .limit(1);

    if (!checkError && existingColumns) {
      console.log('[Streak Recovery Migration] Columns already exist! Migration not needed.');
      return NextResponse.json({ 
        success: true, 
        message: 'Streak recovery features are already enabled! 🎉',
        alreadyMigrated: true,
        columnsExist: true
      });
    }

    console.log('[Streak Recovery Migration] Columns do not exist, attempting migration...');

    // Try to create a custom RPC function for the migration
    const migrationSQL = `
      -- Add new columns to the streaks table for recovery features
      ALTER TABLE public.streaks ADD COLUMN IF NOT EXISTS resilience_points INTEGER DEFAULT 0;
      ALTER TABLE public.streaks ADD COLUMN IF NOT EXISTS safety_net_used BOOLEAN DEFAULT false;
      ALTER TABLE public.streaks ADD COLUMN IF NOT EXISTS missed_days_this_week INTEGER DEFAULT 0;
      ALTER TABLE public.streaks ADD COLUMN IF NOT EXISTS last_missed_date DATE;
      ALTER TABLE public.streaks ADD COLUMN IF NOT EXISTS consecutive_weeks_completed INTEGER DEFAULT 0;
      ALTER TABLE public.streaks ADD COLUMN IF NOT EXISTS streak_broken_date DATE;
      ALTER TABLE public.streaks ADD COLUMN IF NOT EXISTS max_streak_achieved INTEGER DEFAULT 0;
      
      -- Update existing streaks to set max_streak_achieved
      UPDATE public.streaks 
      SET max_streak_achieved = GREATEST(streak_days, COALESCE(max_streak_achieved, 0))
      WHERE max_streak_achieved IS NULL OR max_streak_achieved < streak_days;
    `;

    // Try different approaches to execute the migration
    let migrationSuccess = false;
    let migrationError = null;

    // Approach 1: Try exec_sql RPC
    try {
      console.log('[Streak Recovery Migration] Attempting exec_sql RPC...');
      const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
      if (!error) {
        migrationSuccess = true;
        console.log('[Streak Recovery Migration] exec_sql RPC succeeded!');
      } else {
        migrationError = error.message;
        console.log('[Streak Recovery Migration] exec_sql RPC failed:', error.message);
      }
    } catch (err: any) {
      migrationError = err.message;
      console.log('[Streak Recovery Migration] exec_sql RPC exception:', err.message);
    }

    // Approach 2: Try creating a temporary function
    if (!migrationSuccess) {
      try {
        console.log('[Streak Recovery Migration] Attempting temporary function approach...');
        
        // Create a temporary function to execute the migration
        const createFunctionSQL = `
          CREATE OR REPLACE FUNCTION temp_migrate_streak_recovery()
          RETURNS TEXT AS $$
          BEGIN
            ALTER TABLE public.streaks ADD COLUMN IF NOT EXISTS resilience_points INTEGER DEFAULT 0;
            ALTER TABLE public.streaks ADD COLUMN IF NOT EXISTS safety_net_used BOOLEAN DEFAULT false;
            ALTER TABLE public.streaks ADD COLUMN IF NOT EXISTS missed_days_this_week INTEGER DEFAULT 0;
            ALTER TABLE public.streaks ADD COLUMN IF NOT EXISTS last_missed_date DATE;
            ALTER TABLE public.streaks ADD COLUMN IF NOT EXISTS consecutive_weeks_completed INTEGER DEFAULT 0;
            ALTER TABLE public.streaks ADD COLUMN IF NOT EXISTS streak_broken_date DATE;
            ALTER TABLE public.streaks ADD COLUMN IF NOT EXISTS max_streak_achieved INTEGER DEFAULT 0;
            
            UPDATE public.streaks 
            SET max_streak_achieved = GREATEST(streak_days, COALESCE(max_streak_achieved, 0))
            WHERE max_streak_achieved IS NULL OR max_streak_achieved < streak_days;
            
            RETURN 'Migration completed successfully';
          END;
          $$ LANGUAGE plpgsql;
        `;

        const { error: createError } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
        if (!createError) {
          // Execute the function
          const { data: result, error: execError } = await supabase.rpc('temp_migrate_streak_recovery');
          if (!execError) {
            migrationSuccess = true;
            console.log('[Streak Recovery Migration] Temporary function approach succeeded!');
            
            // Clean up the temporary function
            await supabase.rpc('exec_sql', { sql: 'DROP FUNCTION IF EXISTS temp_migrate_streak_recovery();' });
          } else {
            migrationError = execError.message;
          }
        } else {
          migrationError = createError.message;
        }
      } catch (err: any) {
        migrationError = err.message;
        console.log('[Streak Recovery Migration] Temporary function approach failed:', err.message);
      }
    }

    if (!migrationSuccess) {
      console.log('[Streak Recovery Migration] All automated approaches failed, providing manual instructions');
      
      // Provide manual migration instructions
      return NextResponse.json({ 
        success: false,
        error: 'Automated migration not available',
        message: 'The automated migration failed, but you can run it manually.',
        manualInstructions: {
          title: 'Manual Migration Required',
          steps: [
            '1. Go to your Supabase Dashboard',
            '2. Navigate to SQL Editor',
            '3. Copy and paste the migration SQL below',
            '4. Click Run to execute the migration',
            '5. Refresh this page to enable recovery features'
          ],
          sql: migrationSQL,
          note: 'This is safe to run multiple times - it uses IF NOT EXISTS clauses.'
        },
        technicalDetails: migrationError
      }, { status: 400 });
    }

    // Verify the migration was successful
    console.log('[Streak Recovery Migration] Verifying migration...');
    const { data: columnCheck, error: verifyError } = await supabase
      .from('streaks')
      .select('resilience_points, safety_net_used, missed_days_this_week, last_missed_date, consecutive_weeks_completed, streak_broken_date, max_streak_achieved')
      .limit(1);

    if (verifyError) {
      console.error('[Streak Recovery Migration] Verification failed:', verifyError);
      return NextResponse.json({ 
        error: 'Migration completed but verification failed', 
        details: verifyError.message 
      }, { status: 500 });
    }

    console.log('[Streak Recovery Migration] Migration completed successfully!');

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
      ]
    });

  } catch (error: any) {
    console.error('[Streak Recovery Migration] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
