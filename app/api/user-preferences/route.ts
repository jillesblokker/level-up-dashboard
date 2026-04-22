import { logger } from "@/lib/logger";
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      let query = supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId);

      if (key) {
        query = query.eq('preference_key', key);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return data;
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Unauthorized' }, { status: 401 });
    }

    const data = result.data;

    if (key && data && data.length > 0) {
      return NextResponse.json({ 
        success: true, 
        value: data[0].preference_value 
      });
    } else if (key) {
      return NextResponse.json({ 
        success: true, 
        value: null 
      });
    } else {
      const preferences: Record<string, any> = {};
      data?.forEach((pref: any) => {
        preferences[pref.preference_key] = pref.preference_value;
      });
      
      return NextResponse.json({ 
        success: true, 
        preferences 
      });
    }
  } catch (error: any) {
    logger.error('[User Preferences API] GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const BodySchema = z.object({
      key: z.string().min(1),
      value: z.any()
    });
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', details: parsed.error }, { status: 400 });
    }
    const { key, value } = parsed.data;

    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          preference_key: key,
          preference_value: value,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,preference_key'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Preference saved successfully',
      data: result.data 
    });
  } catch (error: any) {
    logger.error('[User Preferences API] POST Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      const { error } = await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', userId)
        .eq('preference_key', key);

      if (error) throw error;
      return { success: true };
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Preference deleted successfully'
    });
  } catch (error: any) {
    logger.error('[User Preferences API] DELETE Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message }, 
      { status: 500 }
    );
  }
}
