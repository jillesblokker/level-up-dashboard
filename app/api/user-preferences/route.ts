import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key'); // Optional: get specific preference

    let query = supabaseServer
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId);

    if (key) {
      query = query.eq('preference_key', key);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    const { data: resultData, key: requestedKey } = { data, key };

    if (requestedKey && data && data.length > 0) {
      // Return single preference value
      return NextResponse.json({ 
        success: true, 
        value: data[0].preference_value 
      });
    } else if (requestedKey) {
      // Key not found
      return NextResponse.json({ 
        success: true, 
        value: null 
      });
    } else {
      // Return all preferences as key-value pairs
      const preferences: Record<string, any> = {};
      data?.forEach((pref: any) => {
        preferences[pref.preference_key] = pref.preference_value;
      });
      
      return NextResponse.json({ 
        success: true, 
        preferences 
      });
    }
  } catch (error) {
    console.error('[User Preferences API] Error:', error);
    if (error instanceof Error) {
      console.error('[User Preferences API] Error details:', error.message, error.stack);
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
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
      value: z.union([z.string(), z.number(), z.boolean(), z.object({}).passthrough(), z.array(z.any())])
    });
    const { key, value } = BodySchema.parse(body);

    const { data, error } = await supabaseServer
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

    return NextResponse.json({ 
      success: true, 
      message: 'Preference saved successfully',
      data: data 
    });
  } catch (error) {
    console.error('[User Preferences API] Error:', error);
    if (error instanceof Error) {
      console.error('[User Preferences API] Error details:', error.message, error.stack);
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
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
      return NextResponse.json({ error: 'Missing preference key' }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from('user_preferences')
      .delete()
      .eq('user_id', userId)
      .eq('preference_key', key);

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: 'Preference deleted successfully' 
    });
  } catch (error) {
    console.error('[User Preferences API] Error:', error);
    if (error instanceof Error) {
      console.error('[User Preferences API] Error details:', error.message, error.stack);
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}
