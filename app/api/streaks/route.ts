import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!;
const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY']!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

export async function GET(req: NextRequest) {
  try {
    // Get user from Clerk JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'No auth header' }, { status: 401 });
    const token = authHeader.replace('Bearer ', '');
    // Clerk JWT is not used for Supabase here, but could be verified if needed
    // Get user_id and category from query params
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get('user_id');
    const category = searchParams.get('category');
    if (!user_id || !category) {
      return NextResponse.json({ error: 'Missing user_id or category' }, { status: 400 });
    }
    // Fetch streaks from Supabase
    const { data, error } = await supabase
      .from('streaks')
      .select('streak_days, week_streaks')
      .eq('user_id', user_id)
      .eq('category', category)
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data || { streak_days: 0, week_streaks: 0 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
} 