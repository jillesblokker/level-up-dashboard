// TROUBLESHOOTING: If you get a 500 error, check the following:
// 1. Are NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set in your environment? (Check .env and restart server)
// 2. Does the table 'achievements' exist in your Supabase database, with the expected columns?
// 3. Check your server logs for error output after '[ACHIEVEMENTS][GET] Internal server error:'
// 4. Test your API with curl or Postman to see the error response.
// 5. If you see 'Supabase client not initialized', your env vars are missing or incorrect.
//
// Health check endpoint: GET /api/achievements?health=1
// Test endpoint: GET /api/achievements?test=1
// Debug endpoint: GET /api/achievements?debug=1
// Schema test endpoint: GET /api/achievements?schema=1
// FORCE DEPLOYMENT: This comment ensures fresh deployment

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../lib/supabase/server-client';

// Health check endpoint
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Health check endpoint
    if (searchParams.get('health') === '1') {
      return NextResponse.json({
        status: 'healthy',
        supabaseUrl: process.env['NEXT_PUBLIC_SUPABASE_URL'],
        supabaseServiceRoleKeyPresent: !!process.env['SUPABASE_SERVICE_ROLE_KEY'],
        timestamp: new Date().toISOString(),
      });
    }

    // Test endpoint
    if (searchParams.get('test') === '1') {
      console.log('[ACHIEVEMENTS][TEST] Testing Supabase connection...');
      try {
        const { data, error } = await supabaseServer
          .from('achievements')
          .select('count')
          .limit(1);
        
        if (error) {
          console.error('[ACHIEVEMENTS][TEST] Supabase test error:', error);
          return NextResponse.json({ 
            test: 'failed', 
            error: error.message,
            code: error.code 
          }, { status: 500 });
        }
        
        return NextResponse.json({ 
          test: 'success', 
          data: data,
          timestamp: new Date().toISOString()
        });
      } catch (testError) {
        console.error('[ACHIEVEMENTS][TEST] Test exception:', testError);
        return NextResponse.json({ 
          test: 'exception', 
          error: testError instanceof Error ? testError.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    // Schema test endpoint
    if (searchParams.get('schema') === '1') {
      console.log('[ACHIEVEMENTS][SCHEMA] Testing table schema...');
      try {
        // Try to select all columns to see what exists
        const { data, error } = await supabaseServer
          .from('achievements')
          .select('*')
          .limit(1);
        
        if (error) {
          console.error('[ACHIEVEMENTS][SCHEMA] Schema test error:', error);
          return NextResponse.json({ 
            schema: 'error', 
            error: error.message,
            code: error.code,
            details: error.details
          }, { status: 500 });
        }
        
        // Get column information
        const { data: columns, error: columnError } = await supabaseServer
          .rpc('get_table_columns', { table_name: 'achievements' })
          .single();
        
        return NextResponse.json({ 
          schema: 'success', 
          data: data,
          columns: columnError ? 'Could not get column info' : columns,
          timestamp: new Date().toISOString()
        });
      } catch (schemaError) {
        console.error('[ACHIEVEMENTS][SCHEMA] Schema test exception:', schemaError);
        return NextResponse.json({ 
          schema: 'exception', 
          error: schemaError instanceof Error ? schemaError.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    // Debug endpoint
    if (searchParams.get('debug') === '1') {
      console.log('[ACHIEVEMENTS][DEBUG] Testing Clerk auth...');
      try {
        const { userId } = await auth();
        console.log('[ACHIEVEMENTS][DEBUG] Clerk auth result:', { userId });
        
        return NextResponse.json({
          debug: 'success',
          clerkUserId: userId,
          hasUserId: !!userId,
          timestamp: new Date().toISOString()
        });
      } catch (authError) {
        console.error('[ACHIEVEMENTS][DEBUG] Clerk auth error:', authError);
        return NextResponse.json({
          debug: 'auth_error',
          error: authError instanceof Error ? authError.message : 'Unknown auth error',
          timestamp: new Date().toISOString()
        }, { status: 500 });
      }
    }

    // Get user ID from Clerk auth
    const { userId } = await auth();
    console.log('[ACHIEVEMENTS][GET] User ID from Clerk:', userId);

    if (!userId) {
      console.log('[ACHIEVEMENTS][GET] No userId found in auth');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get userId from query params (for backward compatibility)
    const queryUserId = searchParams.get('userId');
    console.log('[ACHIEVEMENTS][GET] Query userId:', queryUserId);

    // Use query userId if provided, otherwise use auth userId
    const targetUserId = queryUserId || userId;

    console.log('[ACHIEVEMENTS][GET] Fetching achievements for user:', targetUserId);

    // First, try to get a single row to see what columns exist
    const { data: sampleData, error: sampleError } = await supabaseServer
      .from('achievements')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('[ACHIEVEMENTS][GET] Sample query error:', sampleError);
      return NextResponse.json({ 
        error: sampleError.message, 
        code: sampleError.code,
        details: sampleError.details,
        hint: sampleError.hint
      }, { status: 500 });
    }

    console.log('[ACHIEVEMENTS][GET] Sample data structure:', sampleData);

    // Now fetch achievements for the specific user
    const { data, error } = await supabaseServer
      .from('achievements')
      .select('*')
      .eq('user_id', targetUserId);

    if (error) {
      console.error('[ACHIEVEMENTS][GET] Supabase query error:', error);
      return NextResponse.json({ 
        error: error.message, 
        code: error.code,
        details: error.details,
        hint: error.hint
      }, { status: 500 });
    }

    console.log('[ACHIEVEMENTS][GET] Raw data from Supabase:', data);

    // Map the data based on what columns actually exist
    const achievements = (data || []).map(row => {
      const achievement: any = {
        id: row.id,
        userId: row.user_id,
        achievementId: row.achievement_id,
        achievementName: row.achievement_name,
        description: row.description,
      };
      
      // Only add unlockedAt if the column exists
      if (row.unlocked_at !== undefined) {
        achievement.unlockedAt = row.unlocked_at;
      }
      
      return achievement;
    });

    console.log('[ACHIEVEMENTS][GET] Processed achievements:', achievements);

    return NextResponse.json(achievements);
  } catch (error) {
    console.error('[ACHIEVEMENTS][GET] Internal server error:', error instanceof Error ? error.stack : error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 