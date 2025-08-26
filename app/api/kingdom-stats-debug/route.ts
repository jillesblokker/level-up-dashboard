import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server-client';

const supabase = supabaseServer;

// Helper to extract and verify Clerk JWT, returns userId or null
async function getUserIdFromRequest(request: Request): Promise<string | null> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Kingdom Stats Debug] No Bearer token found');
      return null;
    }
    
    const token = authHeader.substring(7);
    console.log('[Kingdom Stats Debug] Found Bearer token, length:', token.length);
    
    // For now, let's try to decode the JWT to get basic info
    try {
      // Simple JWT decode (without verification for debugging)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.log('[Kingdom Stats Debug] Invalid JWT format');
        return null;
      }
      
      const base64Url = tokenParts[1];
      if (!base64Url) {
        console.log('[Kingdom Stats Debug] Missing JWT payload');
        return null;
      }
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const payload = JSON.parse(jsonPayload);
      console.log('[Kingdom Stats Debug] JWT payload:', payload);
      
      // Extract user ID from JWT payload
      if (payload.sub) {
        console.log('[Kingdom Stats Debug] Found userId in JWT:', payload.sub);
        return payload.sub;
      }
      
      // Try alternative fields
      if (payload.user_id) {
        console.log('[Kingdom Stats Debug] Found userId in JWT (user_id):', payload.user_id);
        return payload.user_id;
      }
      
      if (payload.userId) {
        console.log('[Kingdom Stats Debug] Found userId in JWT (userId):', payload.userId);
        return payload.userId;
      }
      
      console.log('[Kingdom Stats Debug] No userId found in JWT payload');
      return null;
    } catch (jwtError) {
      console.log('[Kingdom Stats Debug] JWT decode error:', jwtError);
      return null;
    }
  } catch (e) {
    console.error('[Kingdom Stats Debug] Authentication error:', e);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // NUCLEAR DEBUGGING - This will definitely show up
    console.log('🚨🚨🚨 NUCLEAR DEBUGGING START 🚨🚨🚨');
    console.log('🚨🚨🚨 NUCLEAR DEBUGGING - NEW API ROUTE CALLED 🚨🚨🚨');
    console.log('🚨🚨🚨 NUCLEAR DEBUGGING - TIMESTAMP:', new Date().toISOString());
    console.log('🚨🚨🚨 NUCLEAR DEBUGGING - DEPLOYMENT ID: NUCLEAR-NEW-ROUTE-2025-08-26-20-00');
    console.log('🚨🚨🚨 NUCLEAR DEBUGGING - IF YOU SEE THIS, NEW CODE IS DEPLOYED 🚨🚨🚨');
    console.log('🚨🚨🚨 NUCLEAR DEBUGGING END 🚨🚨🚨');
    
    // NUCLEAR CACHE BUSTING - Force fresh responses with unique timestamp
    const uniqueId = `NUCLEAR-NEW-ROUTE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('🚨🚨🚨 NUCLEAR UNIQUE ID:', uniqueId);
    
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      console.log('[Kingdom Stats Debug] No user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Kingdom Stats Debug] User ID:', userId);
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'quests';
    const period = searchParams.get('period') || 'week';
    
    console.log('[Kingdom Stats Debug] Tab:', tab, 'Period:', period);
    
    // Test database connection
    const { data: testData, error: testError } = await supabaseServer
      .from('quest_completion')
      .select('id, completed, completed_at, original_completion_date')
      .eq('user_id', userId)
      .limit(5);
    
    if (testError) {
      console.error('[Kingdom Stats Debug] Database connection test failed:', testError);
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: testError.message,
        nuclearId: uniqueId 
      }, { status: 500 });
    }
    
    console.log('[Kingdom Stats Debug] Database connection successful');
    console.log('[Kingdom Stats Debug] Sample data:', testData);
    
    // Return test response
    const response = NextResponse.json({ 
      success: true,
      message: 'Nuclear debugging API route working!',
      nuclearId: uniqueId,
      timestamp: new Date().toISOString(),
      databaseTest: 'SUCCESS',
      sampleData: testData
    });
    
    // NUCLEAR CACHE BUSTING - Force fresh responses
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('X-Nuclear-Debug', uniqueId);
    response.headers.set('X-Nuclear-Timestamp', Date.now().toString());
    response.headers.set('X-Nuclear-Route', 'NEW-ROUTE-BYPASS-CACHE');
    
    return response;

  } catch (error) {
    console.error('[Kingdom Stats Debug] API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      nuclearId: `ERROR-${Date.now()}`,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
