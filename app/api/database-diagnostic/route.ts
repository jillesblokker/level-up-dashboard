import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import { supabaseServer } from '../../../lib/supabase/server-client'

export async function GET(req: NextRequest) {
  try {
    console.log('[Database Diagnostic] Starting diagnostic...');
    
    // Test 1: Check authentication
    const { userId } = await getAuth(req);
    console.log('[Database Diagnostic] Auth check:', userId ? 'OK' : 'FAILED');
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        test: 'auth',
        status: 'failed' 
      }, { status: 401 });
    }

    // Test 2: Basic database connection
    console.log('[Database Diagnostic] Testing basic connection...');
    const basicTest = await supabaseServer
      .from('streaks')
      .select('count')
      .limit(1);
      
    console.log('[Database Diagnostic] Basic test result:', {
      error: basicTest.error,
      hasData: !!basicTest.data
    });

    // Test 3: Check if streaks table exists with basic columns
    console.log('[Database Diagnostic] Testing basic columns...');
    const basicColumnsTest = await supabaseServer
      .from('streaks')
      .select('streak_days, week_streaks, last_activity_date')
      .limit(1);
      
    console.log('[Database Diagnostic] Basic columns test:', {
      error: basicColumnsTest.error,
      hasData: !!basicColumnsTest.data
    });

    // Test 4: Check if new recovery columns exist
    console.log('[Database Diagnostic] Testing recovery columns...');
    const recoveryTest = await supabaseServer
      .from('streaks')
      .select('resilience_points, safety_net_used')
      .limit(1);
      
    console.log('[Database Diagnostic] Recovery columns test:', {
      error: recoveryTest.error,
      hasData: !!recoveryTest.data
    });

    // Test 5: Check user's data specifically
    console.log('[Database Diagnostic] Testing user data...');
    const userTest = await supabaseServer
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .limit(1);
      
    console.log('[Database Diagnostic] User data test:', {
      error: userTest.error,
      hasData: !!userTest.data,
      count: userTest.data?.length
    });

    return NextResponse.json({
      status: 'diagnostic_complete',
      tests: {
        auth: userId ? 'passed' : 'failed',
        basic_connection: basicTest.error ? 'failed' : 'passed',
        basic_columns: basicColumnsTest.error ? 'failed' : 'passed', 
        recovery_columns: recoveryTest.error ? 'failed' : 'passed',
        user_data: userTest.error ? 'failed' : 'passed'
      },
      errors: {
        basic_connection: basicTest.error?.message,
        basic_columns: basicColumnsTest.error?.message,
        recovery_columns: recoveryTest.error?.message,
        user_data: userTest.error?.message
      },
      userId: userId
    });

  } catch (err: any) {
    console.error('[Database Diagnostic] Exception:', err);
    return NextResponse.json({
      error: err.message || 'Unknown error',
      status: 'exception'
    }, { status: 500 });
  }
} 