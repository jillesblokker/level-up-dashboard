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

    // Fetch achievements from Supabase
    const { data, error } = await supabaseServer
      .from('achievements')
      .select('*')
      .eq('user_id', targetUserId)
      .order('unlocked_at', { ascending: false });

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

    const achievements = (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      achievementId: row.achievement_id,
      unlockedAt: row.unlocked_at,
      achievementName: row.achievement_name,
      description: row.description,
    }));

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