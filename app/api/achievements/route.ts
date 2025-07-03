// TROUBLESHOOTING: If you get a 500 error, check the following:
// 1. Are NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set in your environment? (Check .env and restart server)
// 2. Does the table 'achievements' exist in your Supabase database, with the expected columns?
// 3. Check your server logs for error output after '[ACHIEVEMENTS][GET] Internal server error:'
// 4. Test your API with curl or Postman to see the error response.
// 5. If you see 'Supabase client not initialized', your env vars are missing or incorrect.
//
// Health check endpoint: GET /api/achievements?health=1

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl) {
  console.error('[ACHIEVEMENTS][INIT] NEXT_PUBLIC_SUPABASE_URL is missing from environment variables.');
}
if (!supabaseServiceRoleKey) {
  console.error('[ACHIEVEMENTS][INIT] SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.');
}

let supabase: ReturnType<typeof createClient> | null = null;
if (supabaseUrl && supabaseServiceRoleKey) {
  supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
}

// Health check endpoint
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get('health') === '1') {
      return NextResponse.json({
        status: 'healthy',
        supabaseUrl,
        supabaseServiceRoleKeyPresent: !!supabaseServiceRoleKey,
        supabaseClientInitialized: !!supabase,
      });
    }
    // Optionally check for Authorization header
    const authHeader = request.headers.get('authorization');
    console.log('[ACHIEVEMENTS][GET] Authorization header:', authHeader);
    if (!authHeader) {
      console.error('[ACHIEVEMENTS][GET] Missing Authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('[ACHIEVEMENTS][GET] Supabase env vars missing:', { supabaseUrl, supabaseServiceRoleKey });
      return NextResponse.json({ error: 'Supabase environment variables missing.' }, { status: 500 });
    }
    if (!supabase) {
      console.error('[ACHIEVEMENTS][GET] Supabase client not initialized.');
      return NextResponse.json({ error: 'Supabase client not initialized.' }, { status: 500 });
    }
    const userId = searchParams.get('userId');
    // Fetch all achievements (optionally filter by userId)
    let query = supabase.from('achievements').select('*').order('unlocked_at', { ascending: false });
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query;
    if (error) {
      console.error('[ACHIEVEMENTS][GET] Query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const achievements = (data || []).map(row => ({
      achievementId: row['achievement_id'],
      unlockedAt: row['unlocked_at'],
      achievementName: row['achievement_name'],
      description: row['description'],
    }));
    return NextResponse.json(achievements);
  } catch (error) {
    console.error('[ACHIEVEMENTS][GET] Internal server error:', error instanceof Error ? error.stack : error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 