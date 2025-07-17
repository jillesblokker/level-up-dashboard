import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function GET(req: NextRequest) {
  try {
    // Get category from query params
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    if (!category) {
      return NextResponse.json({ error: 'Missing category parameter' }, { status: 400 });
    }

    // Use authenticated Supabase query with proper Clerk JWT verification
    const result = await authenticatedSupabaseQuery(req, async (supabase, userId) => {
      const { data, error } = await supabase
        .from('streaks')
        .select('streak_days, week_streaks')
        .eq('user_id', userId)
        .eq('category', category)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }
      
      return data || { streak_days: 0, week_streaks: 0 };
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, streak_days, week_streaks } = body;

    if (!category || streak_days === undefined || week_streaks === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields: category, streak_days, week_streaks' 
      }, { status: 400 });
    }

    // Use authenticated Supabase query with proper Clerk JWT verification
    const result = await authenticatedSupabaseQuery(req, async (supabase, userId) => {
      const { data, error } = await supabase
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
        throw error;
      }
      
      return data;
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
} 