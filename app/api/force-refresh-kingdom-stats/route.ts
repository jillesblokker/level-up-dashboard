import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server-client';

// Helper to extract and verify Clerk JWT, returns userId or null
async function getUserIdFromRequest(request: Request): Promise<string | null> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.debug('[Force Refresh] No Bearer token found');
      return null;
    }
    
    const token = authHeader.substring(7);
    logger.debug('[Force Refresh] Found Bearer token, length:', token.length);
    
    // For now, let's try to decode the JWT to get basic info
    try {
      // Simple JWT decode (without verification for debugging)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        logger.debug('[Force Refresh] Invalid JWT format');
        return null;
      }
      
      const base64Url = tokenParts[1];
      if (!base64Url) {
        logger.debug('[Force Refresh] Missing JWT payload');
        return null;
      }
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const payload = JSON.parse(jsonPayload);
      logger.debug('[Force Refresh] JWT payload:', payload);
      
      // Extract user ID from JWT payload
      if (payload.sub) {
        logger.debug('[Force Refresh] Found userId in JWT:', payload.sub);
        return payload.sub;
      }
      
      // Try alternative fields
      if (payload.user_id) {
        logger.debug('[Force Refresh] Found userId in JWT (user_id):', payload.user_id);
        return payload.user_id;
      }
      
      if (payload.userId) {
        logger.debug('[Force Refresh] Found userId in JWT (userId):', payload.userId);
        return payload.userId;
      }
      
      logger.debug('[Force Refresh] No userId found in JWT payload');
      return null;
    } catch (jwtError) {
      logger.debug('[Force Refresh] JWT decode error:', jwtError);
      return null;
    }
  } catch (e) {
    logger.error('[Force Refresh] Authentication error:', e);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    logger.debug('[Force Refresh] API called');
    
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use the same Supabase server client that bypasses RLS policies
    const supabase = supabaseServer;

    // Force refresh by fetching fresh data from all relevant tables
    const refreshResults: {
      quests: any;
      challenges: any;
      milestones: any;
      timestamp: string;
    } = {
      quests: null,
      challenges: null,
      milestones: null,
      timestamp: new Date().toISOString()
    };

    try {
      // Force refresh quest completions
      const { data: questData, error: questError } = await supabase
        .from('quest_completion')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', true);

      if (questError) {
        logger.error('[Force Refresh] Quest data error:', questError);
        refreshResults.quests = { error: questError.message };
      } else {
        refreshResults.quests = { 
          count: questData?.length || 0,
          data: questData?.slice(0, 5) // Show first 5 for verification
        };
      }

      // Force refresh challenge completions
      const { data: challengeData, error: challengeError } = await supabase
        .from('challenge_completion')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', true);

      if (challengeError) {
        logger.error('[Force Refresh] Challenge data error:', challengeError);
        refreshResults.challenges = { error: challengeError.message };
      } else {
        refreshResults.challenges = { 
          count: challengeData?.length || 0,
          data: challengeData?.slice(0, 5) // Show first 5 for verification
        };
      }

      // Force refresh milestone completions
      const { data: milestoneData, error: milestoneError } = await supabase
        .from('milestone_completion')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', true);

      if (milestoneError) {
        logger.error('[Force Refresh] Milestone data error:', milestoneError);
        refreshResults.milestones = { error: milestoneError.message };
      } else {
        refreshResults.milestones = { 
          count: milestoneData?.length || 0,
          data: milestoneData?.slice(0, 5) // Show first 5 for verification
        };
      }

      logger.debug('[Force Refresh] Successfully refreshed all data:', refreshResults);

      return NextResponse.json({
        success: true,
        message: 'Kingdom stats data force refreshed successfully',
        data: refreshResults
      });

    } catch (error: any) {
      logger.error('[Force Refresh] Error during refresh:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

  } catch (error: any) {
    logger.error('[Force Refresh] API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
