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