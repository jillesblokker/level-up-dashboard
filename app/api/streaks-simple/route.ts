import { NextRequest, NextResponse } from 'next/server';
import { verifyClerkJWT } from '@/lib/supabase/jwt-verification';
import { supabaseServer } from '@/lib/supabase/server-client';

export async function GET(req: NextRequest) {
  try {
    console.log('[Streaks Simple] Starting test...');
    
    // Step 1: Verify JWT only
    const authResult = await verifyClerkJWT(req);
    if (!authResult.success || !authResult.userId) {
      console.log('[Streaks Simple] Auth failed:', authResult.error);
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    console.log('[Streaks Simple] Auth success, userId:', authResult.userId);

    // Step 2: Get category from query
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || 'test';

    // Step 3: Query database directly WITHOUT set_user_context
    const { data, error } = await supabaseServer
      .from('streaks')
      .select('streak_days, week_streaks')
      .eq('user_id', authResult.userId)
      .eq('category', category)
      .single();
        
    if (error && error.code !== 'PGRST116') {
      console.log('[Streaks Simple] DB error:', error);
      return NextResponse.json({ 
        error: error.message,
        code: error.code,
        userId: authResult.userId,
        category: category
      }, { status: 500 });
    }
    
    console.log('[Streaks Simple] Success!');
    return NextResponse.json({
      data: data || { streak_days: 0, week_streaks: 0 },
      userId: authResult.userId,
      category: category,
      message: 'Success without set_user_context'
    });

  } catch (err: any) {
    console.error('[Streaks Simple] Error:', err);
    return NextResponse.json({ 
      error: err.message || 'Unknown error',
      stack: err.stack
    }, { status: 500 });
  }
} 