import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function GET(req: NextRequest) {
  try {
    console.log('[Debug Streaks] Starting debug test...');
    
    const result = await authenticatedSupabaseQuery(req, async (supabase, userId) => {
      const debugResults: any = {
        step1_userId: userId,
        step2_functionTest: null,
        step3_directQuery: null,
        step4_streaksQuery: null,
        step5_permissions: null
      };

      // Step 1: Test if we can call the public function directly
      try {
        const { data: functionResult, error: functionError } = await supabase.rpc('public.get_current_user_id');
        debugResults.step2_functionTest = {
          success: !functionError,
          result: functionResult,
          error: functionError?.message
        };
      } catch (err) {
        debugResults.step2_functionTest = {
          success: false,
          error: (err as Error).message
        };
      }

      // Step 2: Test direct query to streaks table
      try {
        const { data: directData, error: directError } = await supabase
          .from('streaks')
          .select('*')
          .limit(1);
        
        debugResults.step3_directQuery = {
          success: !directError,
          count: directData?.length || 0,
          error: directError?.message,
          errorCode: directError?.code
        };
      } catch (err) {
        debugResults.step3_directQuery = {
          success: false,
          error: (err as Error).message
        };
      }

      // Step 3: Test the actual streaks query with user filter
      try {
        const { data: streakData, error: streakError } = await supabase
          .from('streaks')
          .select('streak_days, week_streaks')
          .eq('user_id', userId)
          .eq('category', 'test')
          .single();
        
        debugResults.step4_streaksQuery = {
          success: !streakError || streakError.code === 'PGRST116',
          data: streakData,
          error: streakError?.message,
          errorCode: streakError?.code
        };
      } catch (err) {
        debugResults.step4_streaksQuery = {
          success: false,
          error: (err as Error).message
        };
      }

      // Step 4: Test function permissions
      try {
        const { data: permTest } = await supabase.rpc('public.set_user_context', { user_id: userId });
        const { data: contextTest } = await supabase.rpc('public.get_current_user_id');
        
        debugResults.step5_permissions = {
          setContextSuccess: true,
          getCurrentUserResult: contextTest,
          match: contextTest === userId
        };
      } catch (err) {
        debugResults.step5_permissions = {
          setContextSuccess: false,
          error: (err as Error).message
        };
      }

      return debugResults;
    });

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error,
        step: 'authenticatedSupabaseQuery failed'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      debug: result.data,
      userId: result.userId,
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    console.error('[Debug Streaks] Error:', err);
    return NextResponse.json({ 
      error: err.message || 'Unknown error',
      stack: err.stack
    }, { status: 500 });
  }
} 