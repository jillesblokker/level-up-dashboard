import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Create Supabase client
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false
      }
    });
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      return NextResponse.json({ 
        error: 'User auth error', 
        details: userError.message,
        user: null 
      });
    }

    // Test a simple query to see if RLS is working
    const { data: testData, error: testError } = await supabase
      .from('character_stats')
      .select('*')
      .limit(1);

    return NextResponse.json({
      user: user ? {
        id: user.id,
        email: user.email,
        aud: user.aud,
        role: user.role
      } : null,
      testQuery: {
        data: testData,
        error: testError ? testError.message : null,
        code: testError ? testError.code : null
      },
      message: 'Auth debug info'
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
} 