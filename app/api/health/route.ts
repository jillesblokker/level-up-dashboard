import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server-client';

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Test Supabase connection
    const { data, error } = await supabaseServer
      .from('challenges')
      .select('count')
      .limit(1);
    
    const dbTime = Date.now() - startTime;
    
    if (error) {
      return NextResponse.json({
        status: 'error',
        database: 'failed',
        error: error.message,
        responseTime: dbTime
      }, { status: 500 });
    }
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      responseTime: dbTime,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      database: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
