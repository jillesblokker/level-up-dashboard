import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const settingKey = searchParams.get('key');

    const { data, error } = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      let query = supabase
        .from('game_settings')
        .select('*')
        .eq('user_id', userId);
      
      if (settingKey) {
        query = query.eq('setting_key', settingKey);
      }
      
      const { data, error } = await query;
      return { data, error };
    });

    if (error) {
      console.error('[Game Settings API] Error fetching settings:', error);
      return NextResponse.json({ error: 'Failed to fetch game settings' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[Game Settings API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { setting_key, setting_value } = body;

    if (!setting_key) {
      return NextResponse.json({ error: 'Setting key is required' }, { status: 400 });
    }

    const { data, error } = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      const { data, error } = await supabase
        .from('game_settings')
        .upsert({
          user_id: userId,
          setting_key,
          setting_value,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'game_settings_user_id_setting_key_key'
        })
        .select()
        .single();
      
      return { data, error };
    });

    if (error) {
      console.error('[Game Settings API] Error updating settings:', error);
      return NextResponse.json({ error: 'Failed to update game settings' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[Game Settings API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const settingKey = searchParams.get('key');

    if (!settingKey) {
      return NextResponse.json({ error: 'Setting key is required' }, { status: 400 });
    }

    const { data, error } = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      const { data, error } = await supabase
        .from('game_settings')
        .delete()
        .eq('user_id', userId)
        .eq('setting_key', settingKey);
      
      return { data, error };
    });

    if (error) {
      console.error('[Game Settings API] Error deleting setting:', error);
      return NextResponse.json({ error: 'Failed to delete game setting' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[Game Settings API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 