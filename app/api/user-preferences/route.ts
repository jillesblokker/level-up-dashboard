import { logger } from "@/lib/logger";
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  return createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!,
    { auth: { persistSession: false } }
  );
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId);

    if (key) {
      query = query.eq('preference_key', key);
    }

    const { data, error } = await query;
    if (error) {
      logger.error('[User Preferences API] DB error on GET:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (key && data && data.length > 0) {
      return NextResponse.json({ success: true, value: data[0].preference_value });
    } else if (key) {
      return NextResponse.json({ success: true, value: null });
    } else {
      const preferences: Record<string, unknown> = {};
      data?.forEach((pref: { preference_key: string; preference_value: unknown }) => {
        preferences[pref.preference_key] = pref.preference_value;
      });
      return NextResponse.json({ success: true, preferences });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('[User Preferences API] GET Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        preference_key: key,
        preference_value: value,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,preference_key' })
      .select()
      .single();

    if (error) {
      logger.error('[User Preferences API] DB error on POST:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Preference saved successfully', data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('[User Preferences API] POST Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', userId)
      .eq('preference_key', key);

    if (error) {
      logger.error('[User Preferences API] DB error on DELETE:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Preference deleted successfully' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('[User Preferences API] DELETE Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: msg }, { status: 500 });
  }
}
