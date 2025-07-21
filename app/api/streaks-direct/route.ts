import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../pages/api/server-client';

export async function GET(req: NextRequest) {
  try {
    // Use the same auth pattern as working endpoints
    const { userId } = await getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get category from query params
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || 'test';

    // Query database directly (RLS is disabled)
    const { data, error } = await supabaseServer
      .from('streaks')
      .select('streak_days, week_streaks')
      .eq('user_id', userId)
      .eq('category', category)
      .single();
        
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      return NextResponse.json({ 
        error: error.message,
        code: error.code 
      }, { status: 500 });
    }
    
    return NextResponse.json(data || { streak_days: 0, week_streaks: 0 });

  } catch (err: any) {
    console.error('[Streaks Direct] Error:', err);
    return NextResponse.json({ 
      error: err.message || 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Use the same auth pattern as working endpoints
    const { userId } = await getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { category, streak_days, week_streaks } = body;

    if (!category || streak_days === undefined || week_streaks === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields: category, streak_days, week_streaks' 
      }, { status: 400 });
    }

    // Insert/update directly (RLS is disabled)
    const { data, error } = await supabaseServer
      .from('streaks')
      .upsert({
        user_id: userId,
        category: category,
        streak_days: streak_days,
        week_streaks: week_streaks,
        last_completed_at: new Date().toISOString(),
      }, { onConflict: 'user_id,category' })
      .select()
      .single();
        
    if (error) {
      return NextResponse.json({ 
        error: error.message,
        code: error.code 
      }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data });

  } catch (err: any) {
    console.error('[Streaks Direct POST] Error:', err);
    return NextResponse.json({ 
      error: err.message || 'Unknown error' 
    }, { status: 500 });
  }
} 