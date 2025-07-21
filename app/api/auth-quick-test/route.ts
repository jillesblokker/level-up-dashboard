import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

export async function GET(request: NextRequest) {
  const debug: any = {
    timestamp: new Date().toISOString(),
    step: 1,
    status: 'Starting auth test...'
  };

  try {
    // Step 1: Check authorization header
    const authHeader = request.headers.get('authorization');
    debug.step = 1;
    debug.authHeaderPresent = !!authHeader;
    debug.authHeaderLength = authHeader?.length || 0;
    debug.authHeaderStart = authHeader?.substring(0, 20);
    
    if (!authHeader) {
      debug.error = 'No authorization header';
      return NextResponse.json({ debug, error: 'No authorization header' }, { status: 401 });
    }

    // Step 2: Extract token
    debug.step = 2;
    const token = authHeader.replace(/^Bearer /i, '');
    debug.tokenExtracted = !!token;
    debug.tokenLength = token.length;
    debug.tokenStart = token.substring(0, 20);

    if (!token || token === authHeader) {
      debug.error = 'Invalid token format';
      return NextResponse.json({ debug, error: 'Invalid token format' }, { status: 401 });
    }

    // Step 3: Clerk verification
    debug.step = 3;
    const { userId } = await getAuth(request);
    debug.clerkUserId = userId;
    debug.clerkSuccess = !!userId;

    if (!userId) {
      debug.error = 'Clerk getAuth returned no userId';
      return NextResponse.json({ debug, error: 'Clerk auth failed' }, { status: 401 });
    }

    // Step 4: Test Supabase connection
    debug.step = 4;
    debug.supabaseConfigured = !!supabaseServer;
    debug.envVars = {
      supabaseUrl: !!process.env['NEXT_PUBLIC_SUPABASE_URL'],
      serviceKey: !!process.env['SUPABASE_SERVICE_ROLE_KEY']
    };

    // Step 5: Simple query test
    debug.step = 5;
    try {
      const { data, error } = await supabaseServer
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .limit(1);
      
      debug.querySuccess = !error;
      debug.queryError = error?.message;
      debug.queryCode = error?.code;
      debug.resultCount = data?.length || 0;
    } catch (queryErr) {
      debug.querySuccess = false;
      debug.queryException = (queryErr as Error).message;
    }

    // Step 6: Return success
    debug.step = 6;
    debug.status = 'All tests completed';

    return NextResponse.json({
      success: true,
      message: 'Auth test completed',
      debug
    });

  } catch (error) {
    debug.error = error instanceof Error ? error.message : String(error);
    debug.stack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json({
      success: false,
      error: 'Auth test failed',
      debug
    }, { status: 500 });
  }
} 