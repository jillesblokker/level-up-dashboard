import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function GET(request: NextRequest) {
  try {
    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      const { data, error } = await supabase
        .from('active_perks')
        .select('*')
        .eq('user_id', userId)
        .gte('expires_at', new Date().toISOString()); // Only active perks
      
      if (error) throw error;
      return data || [];
    });

    if (!result.success) {
      logger.error('[Active Perks API] Error fetching perks:', result.error);
      return NextResponse.json({ error: result.error || 'Failed to fetch active perks' }, { status: 500 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    logger.error('[Active Perks API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { perk_name, effect, expires_at } = body;

    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      const { data, error } = await supabase
        .from('active_perks')
        .upsert({
          user_id: userId,
          perk_name,
          effect,
          expires_at
        }, {
          onConflict: 'active_perks_user_id_perk_name_key'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    });

    if (!result.success) {
      logger.error('[Active Perks API] Error updating perks:', result.error);
      return NextResponse.json({ error: result.error || 'Failed to update active perks' }, { status: 500 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    logger.error('[Active Perks API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const perkName = searchParams.get('perk_name');

    if (!perkName) {
      return NextResponse.json({ error: 'Perk name is required' }, { status: 400 });
    }

    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      const { data, error } = await supabase
        .from('active_perks')
        .delete()
        .eq('user_id', userId)
        .eq('perk_name', perkName);
      
      if (error) throw error;
      return data;
    });

    if (!result.success) {
      logger.error('[Active Perks API] Error deleting perk:', result.error);
      return NextResponse.json({ error: result.error || 'Failed to delete perk' }, { status: 500 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    logger.error('[Active Perks API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 