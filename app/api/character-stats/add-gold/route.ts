import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server-client';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount } = body;

    if (!amount || typeof amount !== 'number') {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    // Get current gold
    const { data: existingData, error: fetchError } = await supabaseServer
      .from('character_stats')
      .select('gold')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    const currentGold = existingData?.gold || 0;
    const newGold = currentGold + amount;

    // Update gold
    const { data, error } = await supabaseServer
      .from('character_stats')
      .upsert({ 
        user_id: userId, 
        gold: newGold,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, gold: newGold });
  } catch (error: any) {
    logger.error('[Character Stats API] Add Gold Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
