import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const settingKey = searchParams.get('key');

    console.log(`[Game Settings API] GET request for key: ${settingKey}`);

    const { data, error } = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      console.log(`[Game Settings API] User ID: ${userId}`);
      
      // First, let's check if the table exists and see its structure
      const { data: tableInfo, error: tableError } = await supabase
        .from('game_settings')
        .select('*')
        .limit(1);
      
      console.log(`[Game Settings API] Table info check - data:`, tableInfo, 'error:', tableError);
      
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
      console.log(`[Game Settings API] Raw query result:`, JSON.stringify(data, null, 2));
      
      // Transform the data to extract values from JSONB
      if (data) {
        const transformedData = data.map(setting => ({
          ...setting,
          setting_value: setting.setting_value?.value || setting.setting_value // Extract from JSONB or fallback
        }));
        console.log(`[Game Settings API] Transformed data:`, transformedData);
        return { data: transformedData, error };
      }
      
      return { data, error };
    });

    if (error) {
      console.error(`[Game Settings API] Database error:`, error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    console.log(`[Game Settings API] Final response data:`, data);
    return NextResponse.json({ data });
  } catch (error) {
    console.error(`[Game Settings API] Unexpected error:`, error);
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
      
      // Store the value as a proper JSON object for JSONB column
      const upsertData = {
        user_id: userId,
        setting_key,
        setting_value: { value: setting_value }, // Wrap in JSON object for JSONB
        updated_at: new Date().toISOString()
      };
      
      console.log(`[Game Settings API] Upsert data:`, upsertData);
      
      // First, let's check what exists before the upsert
      const { data: existingData, error: existingError } = await supabase
        .from('game_settings')
        .select('*')
        .eq('user_id', userId)
        .eq('setting_key', setting_key);
      
      console.log(`[Game Settings API] Existing data before upsert:`, existingData, 'error:', existingError);
      
      // Try the upsert operation
      const { data, error } = await supabase
        .from('game_settings')
        .upsert(upsertData, { onConflict: 'user_id,setting_key' })
        .select();
      
      console.log(`[Game Settings API] Upsert result - data:`, data, 'error:', error);
      
      // Now let's verify what was actually created/updated
      const { data: verifyData, error: verifyError } = await supabase
        .from('game_settings')
        .select('*')
        .eq('user_id', userId)
        .eq('setting_key', setting_key);
      
      console.log(`[Game Settings API] Verification after upsert:`, verifyData, 'error:', verifyError);
      
      return { data, error };
    });

    if (error) {
      console.error(`[Game Settings API] Database error:`, error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    console.log(`[Game Settings API] Successfully created/updated setting:`, data);
    return NextResponse.json({ data });
  } catch (error) {
    console.error(`[Game Settings API] Unexpected error:`, error);
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