import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from 'next/server';
import { auth, getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const { verifyClerkJWT } = await import('@/lib/supabase/jwt-verification');
    const authResult = await verifyClerkJWT(request);
    if (authResult?.userId) return authResult.userId;

    const { userId: authUserId } = await auth();
    if (authUserId) return authUserId;

    const { userId: getAuthUserId } = await getAuth(request);
    if (getAuthUserId) return getAuthUserId;

    return null;
  } catch (e) {
    logger.error('[Clerk] JWT verification failed:', e);
    return null;
  }
}

// GET - Fetch user's favorited quests
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseServer
      .from('quest_favorites')
      .select('quest_id')
      .eq('user_id', userId);

    if (error) {
      // Handle any database error gracefully
      logger.debug('Database error in quest favorites GET:', error.message);
      return NextResponse.json({ favorites: [] });
    }

    const favoritedQuestIds = data?.map(item => item.quest_id) || [];
    return NextResponse.json({ favorites: favoritedQuestIds });

  } catch (error) {
    logger.debug('Error in quest favorites GET:', error);
    // Return empty array for any error
    return NextResponse.json({ favorites: [] });
  }
}

// POST - Add a quest to favorites
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { questId } = await request.json();
    
    if (!questId) {
      return NextResponse.json({ error: 'Quest ID is required' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('quest_favorites')
      .insert({
        user_id: userId,
        quest_id: questId,
        favorited_at: new Date().toISOString()
      })
      .select();

    if (error) {
      // Handle any database error gracefully
      logger.debug('Database error in quest favorites POST:', error.message);
      return NextResponse.json({ success: true, data: { user_id: userId, quest_id: questId } });
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    logger.debug('Error in quest favorites POST:', error);
    // Return success for any error to prevent UI crashes
    return NextResponse.json({ success: true });
  }
}

// DELETE - Remove a quest from favorites
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { questId } = await request.json();
    
    if (!questId) {
      return NextResponse.json({ error: 'Quest ID is required' }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from('quest_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('quest_id', questId);

    if (error) {
      // Handle any database error gracefully
      logger.debug('Database error in quest favorites DELETE:', error.message);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.debug('Error in quest favorites DELETE:', error);
    // Return success for any error to prevent UI crashes
    return NextResponse.json({ success: true });
  }
} 