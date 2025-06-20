import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Create Supabase client
    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!;
    const supabaseKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
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
        hasUrl: !!process.env['NEXT_PUBLIC_SUPABASE_URL'],
        hasKey: !!process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
        url: process.env['NEXT_PUBLIC_SUPABASE_URL']?.substring(0, 20) + '...'
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

