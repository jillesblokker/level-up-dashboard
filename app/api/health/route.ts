import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export async function GET() {
  try {
    // Create Supabase client
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    // Test basic connection
    const { data, error } = await supabase
      .from('character_stats')
      .select('count')
      .limit(1);

    return NextResponse.json({
      status: 'healthy',
      supabase: {
        connected: !error,
        error: error ? error.message : null,
        code: error ? error.code : null,
        data: data
      },
      env: {
        hasUrl: !!env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        url: env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...'
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

