import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const settingKey = searchParams.get('key');

    console.log(`[Game Settings API] GET request for key: ${settingKey}`);

    const { data, error } = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      console.log(`[Game Settings API] User ID: ${userId}`);
      
      let query = supabase
        .from('game_settings')
        .select('*')
        .eq('user_id', userId);
      
      if (settingKey) {
        query = query.eq('setting_key', settingKey);
        console.log(`[Game Settings API] Filtering by setting_key: ${settingKey}`);
      }
      
      const { data, error } = await query;
      console.log(`[Game Settings API] Query result - data:`, data, 'error:', error);
      
      if (data && data.length > 0) {
        console.log(`[Game Settings API] Found ${data.length} settings:`);
        data.forEach((setting, index) => {
          console.log(`[Game Settings API] Setting ${index}:`, {
            user_id: setting.user_id,
            setting_key: setting.setting_key,
            setting_value: setting.setting_value,
            updated_at: setting.updated_at
          });
        });
      } else {
        console.log(`[Game Settings API] No settings found for user ${userId}`);
      }
      
      return { data, error };
    });

    if (error) {
      console.error('[Game Settings API] Error fetching settings:', error);
      return NextResponse.json({ error: 'Failed to fetch game settings' }, { status: 500 });
    }

    console.log(`[Game Settings API] Returning data:`, data);
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

    console.log(`[Game Settings API] POST request - setting_key: ${setting_key}, setting_value: ${setting_value}`);

    if (!setting_key) {
      return NextResponse.json({ error: 'Setting key is required' }, { status: 400 });
    }

    const { data, error } = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      console.log(`[Game Settings API] Creating/updating setting for user ${userId}`);
      
      const upsertData = {
        user_id: userId,
        setting_key,
        setting_value,
        updated_at: new Date().toISOString()
      };
      
      console.log(`[Game Settings API] Upsert data:`, upsertData);
      
      const { data, error } = await supabase
        .from('game_settings')
        .upsert(upsertData, {
          onConflict: 'game_settings_user_id_setting_key_key'
        })
        .select()
        .single();
      
      console.log(`[Game Settings API] Upsert result - data:`, data, 'error:', error);
      
      if (data) {
        console.log(`[Game Settings API] Successfully created/updated setting:`, {
          user_id: data.user_id,
          setting_key: data.setting_key,
          setting_value: data.setting_value,
          updated_at: data.updated_at
        });
      }
      
      return { data, error };
    });

    if (error) {
      console.error('[Game Settings API] Error updating settings:', error);
      return NextResponse.json({ error: 'Failed to update game settings' }, { status: 500 });
    }

    console.log(`[Game Settings API] Returning created/updated data:`, data);
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