import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function GET(request: NextRequest) {
  try {
    // Add timeout handling
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 8000); // 8 second timeout
    });

    const { searchParams } = new URL(request.url);
    const settingKey = searchParams.get('key');

    const queryPromise = authenticatedSupabaseQuery(request, async (supabase, userId) => {
      let query = supabase
        .from('game_settings')
        .select('*')
        .eq('user_id', userId);
      
      if (settingKey) {
        query = query.eq('setting_key', settingKey);
      }
      
      const { data, error } = await query;
      
      // Return the data as-is since we're now storing values directly
      if (data) {
        return { data, error };
      }
      
      return { data, error };
    });

    // Race between timeout and query
    const result = await Promise.race([queryPromise, timeoutPromise]) as any;

    if (result.error) {
      console.error(`[Game Settings API] Database error:`, result.error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error(`[Game Settings API] Unexpected error:`, error);
    
    // Handle timeout specifically
    if (error instanceof Error && error.message === 'Request timeout') {
      return NextResponse.json(
        { error: 'Request timeout - please try again' }, 
        { status: 408 }
      );
    }
    
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
      // Store the value directly in the JSONB column
      const upsertData = {
        user_id: userId,
        setting_key,
        setting_value: setting_value, // Store the value directly
        updated_at: new Date().toISOString()
      };
      
      // Try the upsert operation
      const { data, error } = await supabase
        .from('game_settings')
        .upsert(upsertData, { onConflict: 'user_id,setting_key' })
        .select();
      
      return { data, error };
    });

    if (error) {
      console.error(`[Game Settings API] Database error:`, error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

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