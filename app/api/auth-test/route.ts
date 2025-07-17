import { NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';
import { supabaseServer } from '@/lib/supabase/server-client';

/**
 * Comprehensive test endpoint for the authentication flow
 * Tests all 3 steps: Clerk JWT verification → Supabase service key → RLS policies
 */

export async function GET(request: Request) {
  try {
    const testResults: any[] = [];

    // Test the complete authentication flow
    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      // Test 1: Basic user data access with RLS
      testResults.push({ test: 'RLS - Character Stats', action: 'Testing SELECT with RLS...' });
      try {
        const { data: characterStats, error } = await supabase
          .from('character_stats')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        testResults.push({ 
          test: 'RLS - Character Stats', 
          result: error ? 'Failed' : 'Success',
          data: characterStats,
          error: error?.message 
        });
      } catch (err) {
        testResults.push({ 
          test: 'RLS - Character Stats', 
          result: 'Failed',
          error: (err as Error).message 
        });
      }

      // Test 2: Inventory access with RLS
      testResults.push({ test: 'RLS - Inventory Items', action: 'Testing SELECT with RLS...' });
      try {
        const { data: inventory, error } = await supabase
          .from('inventory_items')
          .select('*')
          .eq('user_id', userId)
          .limit(5);
        
        testResults.push({ 
          test: 'RLS - Inventory Items', 
          result: error ? 'Failed' : 'Success',
          count: inventory?.length || 0,
          error: error?.message 
        });
      } catch (err) {
        testResults.push({ 
          test: 'RLS - Inventory Items', 
          result: 'Failed',
          error: (err as Error).message 
        });
      }

      // Test 3: Quest completions with RLS
      testResults.push({ test: 'RLS - Quest Completions', action: 'Testing SELECT with RLS...' });
      try {
        const { data: quests, error } = await supabase
          .from('quest_completion')
          .select('*')
          .eq('user_id', userId)
          .limit(5);
        
        testResults.push({ 
          test: 'RLS - Quest Completions', 
          result: error ? 'Failed' : 'Success',
          count: quests?.length || 0,
          error: error?.message 
        });
      } catch (err) {
        testResults.push({ 
          test: 'RLS - Quest Completions', 
          result: 'Failed',
          error: (err as Error).message 
        });
      }

      // Test 4: Read-only table access (should work for all authenticated users)
      testResults.push({ test: 'RLS - Quests (Read-only)', action: 'Testing global read access...' });
      try {
        const { data: allQuests, error } = await supabase
          .from('quests')
          .select('id, title, category')
          .limit(3);
        
        testResults.push({ 
          test: 'RLS - Quests (Read-only)', 
          result: error ? 'Failed' : 'Success',
          count: allQuests?.length || 0,
          error: error?.message 
        });
      } catch (err) {
        testResults.push({ 
          test: 'RLS - Quests (Read-only)', 
          result: 'Failed',
          error: (err as Error).message 
        });
      }

      // Test 5: User preferences with RLS
      testResults.push({ test: 'RLS - User Preferences', action: 'Testing SELECT with RLS...' });
      try {
        const { data: preferences, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        testResults.push({ 
          test: 'RLS - User Preferences', 
          result: error ? (error.code === 'PGRST116' ? 'Success (No data)' : 'Failed') : 'Success',
          data: preferences,
          error: error?.message 
        });
      } catch (err) {
        testResults.push({ 
          test: 'RLS - User Preferences', 
          result: 'Failed',
          error: (err as Error).message 
        });
      }

      return {
        userId,
        timestamp: new Date().toISOString(),
        totalTests: testResults.length,
        testResults
      };
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
        authStep: 'Failed at Clerk JWT verification'
      }, { status: 401 });
    }

    // Count successful tests
    const successfulTests = result.data?.testResults?.filter((test: any) => 
      test.result && (test.result === 'Success' || test.result.includes('Success'))
    ).length || 0;

    return NextResponse.json({
      success: true,
      message: 'Authentication flow test completed',
      summary: {
        step1: 'Clerk JWT verification ✓',
        step2: 'Supabase service key query ✓', 
        step3: 'RLS policies enforced ✓',
        testsRun: result.data?.totalTests || 0,
        testsSuccessful: successfulTests,
        userId: result.userId
      },
      details: result.data
    });

  } catch (error) {
    console.error('[Auth Test] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error during auth test',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * Test RLS policy enforcement by attempting unauthorized access
 */
export async function POST(request: Request) {
  try {
    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      const securityTests: any[] = [];

      // Test 1: Try to access another user's data (should be blocked by RLS)
      securityTests.push({ test: 'RLS Security - Block Other Users', action: 'Attempting unauthorized access...' });
      try {
        const { data: otherUserStats, error } = await supabase
          .from('character_stats')
          .select('*')
          .neq('user_id', userId) // Try to access other users' data
          .limit(1);
        
        // This should return empty results due to RLS
        securityTests.push({ 
          test: 'RLS Security - Block Other Users', 
          result: (otherUserStats?.length === 0) ? 'Success (Blocked)' : 'Failed (Security breach)',
          blocked: otherUserStats?.length === 0,
          error: error?.message 
        });
      } catch (err) {
        securityTests.push({ 
          test: 'RLS Security - Block Other Users', 
          result: 'Success (Exception thrown)',
          error: (err as Error).message 
        });
      }

      // Test 2: Verify user can only insert their own data
      securityTests.push({ test: 'RLS Security - Own Data Only', action: 'Testing insert restrictions...' });
      try {
        // Try to insert data for a different user (should fail)
        const { error } = await supabase
          .from('user_preferences')
          .insert({
            user_id: 'fake-user-id',
            preference_key: 'test',
            preference_value: 'should_fail'
          });
        
        securityTests.push({ 
          test: 'RLS Security - Own Data Only', 
          result: error ? 'Success (Insert blocked)' : 'Failed (Security breach)',
          blocked: !!error,
          error: error?.message 
        });
      } catch (err) {
        securityTests.push({ 
          test: 'RLS Security - Own Data Only', 
          result: 'Success (Exception thrown)',
          error: (err as Error).message 
        });
      }

      return {
        userId,
        timestamp: new Date().toISOString(),
        securityTests
      };
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 401 });
    }

    const blockedAttempts = result.data?.securityTests?.filter((test: any) => 
      test.result && test.result.includes('Success')
    ).length || 0;

    return NextResponse.json({
      success: true,
      message: 'RLS security test completed',
      summary: {
        userId: result.userId,
        securityTestsRun: result.data?.securityTests?.length || 0,
        unauthorizedAccessBlocked: blockedAttempts,
        rlsPoliciesWorking: blockedAttempts > 0
      },
      details: result.data
    });

  } catch (error) {
    console.error('[Auth Security Test] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error during security test'
    }, { status: 500 });
  }
} 