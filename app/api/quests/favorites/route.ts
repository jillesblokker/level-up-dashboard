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
      console.error('Error fetching quest favorites:', error);
      return NextResponse.json({ error: 'Failed to fetch quest favorites' }, { status: 500 });
    }

    const favoritedQuestIds = data?.map(item => item.quest_id) || [];
    return NextResponse.json({ favorites: favoritedQuestIds });

  } catch (error) {
    console.error('Error in quest favorites API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Quest already favorited' }, { status: 409 });
      }
      console.error('Error adding quest to favorites:', error);
      return NextResponse.json({ error: 'Failed to add quest to favorites' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Error in quest favorites API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
      console.error('Error removing quest from favorites:', error);
      return NextResponse.json({ error: 'Failed to remove quest from favorites' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in quest favorites API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 