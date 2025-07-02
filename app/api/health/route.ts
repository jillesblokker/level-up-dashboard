import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    // Test Supabase connection by selecting from a known table (e.g., 'users')
    const { error } = await supabase.from('users').select('id').limit(1);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      status: 'healthy',
      database: {
        connected: true,
        type: 'supabase',
      },
      env: {
        hasDatabaseUrl: !!process.env['DATABASE_URL'],
        nodeEnv: process.env.NODE_ENV
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      database: {
        connected: false,
        type: 'supabase'
      }
    });
  }
}
