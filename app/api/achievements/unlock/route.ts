import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabase = createClient<Database>(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
);

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { achievementId } = body;

    if (!achievementId) {
      return NextResponse.json({ error: 'Achievement ID is required' }, { status: 400 });
    }

    // Check if achievement is already unlocked in Supabase
    const { data: existing, error: fetchError } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .single();

    if (existing) {
      return NextResponse.json({ 
        success: true, 
        achievementId,
        message: 'Achievement already unlocked',
        alreadyUnlocked: true
      });
    }

    // Insert new achievement unlock into Supabase
    const { error } = await supabase.from('achievements').insert([
      {
        user_id: userId,
        achievement_id: achievementId,
        achievement_name: achievementId, // You may want to look up the name elsewhere
        unlocked_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error('Error unlocking achievement in Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`Achievement unlocked in Supabase: ${achievementId} for user: ${userId}`);

    return NextResponse.json({ 
      success: true, 
      achievementId,
      message: 'Achievement unlocked successfully',
    });
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 