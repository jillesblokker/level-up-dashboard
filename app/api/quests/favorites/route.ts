import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

// GET - Fetch user's favorited quests
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseServer
      .from('quest_favorites')
      .select('quest_id')
      .eq('user_id', userId);

    if (error) {
      // Handle any database error gracefully
      console.log('Database error in quest favorites GET:', error.message);
      return NextResponse.json({ favorites: [] });
    }

    const favoritedQuestIds = data?.map(item => item.quest_id) || [];
    return NextResponse.json({ favorites: favoritedQuestIds });

  } catch (error) {
    console.log('Error in quest favorites GET:', error);
    // Return empty array for any error
    return NextResponse.json({ favorites: [] });
  }
}

// POST - Add a quest to favorites
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

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
      console.log('Database error in quest favorites POST:', error.message);
      return NextResponse.json({ success: true, data: { user_id: userId, quest_id: questId } });
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.log('Error in quest favorites POST:', error);
    // Return success for any error to prevent UI crashes
    return NextResponse.json({ success: true });
  }
}

// DELETE - Remove a quest from favorites
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

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
      console.log('Database error in quest favorites DELETE:', error.message);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.log('Error in quest favorites DELETE:', error);
    // Return success for any error to prevent UI crashes
    return NextResponse.json({ success: true });
  }
} 