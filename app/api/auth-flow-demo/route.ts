import { NextResponse } from 'next/server';
import { authenticatedSupabaseQuery, verifyClerkJWT } from '@/lib/supabase/jwt-verification';
import { supabaseServer } from '@/lib/supabase/server-client';

/**
 * Demonstration of the complete authentication flow from the diagram:
 * 
 * 1. User signs in with Clerk
 * 2. Frontend sends request with Clerk JWT in Authorization header
 * 3. Backend verifies JWT with Clerk 
 * 4. Backend queries Supabase with service key
 * 5. Return data to Frontend
 */

export async function GET(request: Request) {
  try {
    // Complete authentication flow
    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      // This query runs with Supabase service key privileges
      // Get user's basic info and some game data
      const [userPrefs, characterStats, inventory] = await Promise.all([
        // User preferences
        supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', userId)
          .single(),
        
        // Character stats
        supabase
          .from('character_stats')
          .select('*')
          .eq('user_id', userId)
          .single(),
          
        // Inventory count
        supabase
          .from('inventory_items')
          .select('id')
          .eq('user_id', userId)
      ]);

      return {
        userId,
        userPreferences: userPrefs.data,
        characterStats: characterStats.data,
        inventoryCount: inventory.data?.length || 0,
        timestamp: new Date().toISOString()
      };
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error }, 
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: 'Authentication flow completed successfully',
      authFlow: {
        step1: 'Clerk JWT verified ✓',
        step2: 'Supabase queried with service key ✓',
        step3: 'Data returned to frontend ✓'
      },
      data: result.data
    });

  } catch (error) {
    console.error('[Auth Flow Demo] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

/**
 * Example of manual step-by-step authentication (for debugging)
 */
export async function POST(request: Request) {
  try {
    const steps: any[] = [];

    // Step 1: Verify Clerk JWT
    steps.push({ step: 1, action: 'Verifying Clerk JWT...' });
    const authResult = await verifyClerkJWT(request);
    
    if (!authResult.success) {
      steps.push({ step: 1, result: 'Failed', error: authResult.error });
      return NextResponse.json({ steps }, { status: 401 });
    }
    
    steps.push({ step: 1, result: 'Success', userId: authResult.userId });

    // Step 2: Query Supabase with service key
    steps.push({ step: 2, action: 'Querying Supabase with service key...' });
    
    try {
      const { data: userData, error } = await supabaseServer
        .from('character_stats')
        .select('level, xp, gold')
        .eq('user_id', authResult.userId!)
        .single();
        
      if (error) {
        steps.push({ step: 2, result: 'Failed', error: error.message });
        return NextResponse.json({ steps }, { status: 500 });
      }
      
      steps.push({ step: 2, result: 'Success', data: userData });

      // Step 3: Return success response
      steps.push({ step: 3, action: 'Returning data to frontend', result: 'Success' });

      return NextResponse.json({
        message: 'Authentication flow completed step by step',
        steps,
        finalData: userData
      });

    } catch (dbError) {
      steps.push({ step: 2, result: 'Failed', error: 'Database connection error' });
      return NextResponse.json({ steps }, { status: 500 });
    }

  } catch (error) {
    console.error('[Auth Flow Demo POST] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 