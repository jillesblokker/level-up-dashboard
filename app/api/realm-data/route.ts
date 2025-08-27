import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

const realmDataSchema = z.object({
  key: z.string(),
  value: z.any(),
});

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    let query = supabaseServer.from('user_preferences').select('*').eq('user_id', userId);
    if (key) {
      query = query.eq('preference_key', key);
    }
    const { data, error } = await query;
    if (error) throw error;
    
    const { data: resultData, key: requestedKey } = { data, key };
    
    if (requestedKey && data && data.length > 0) {
      return NextResponse.json({ success: true, value: data[0].preference_value });
    } else if (requestedKey) {
      return NextResponse.json({ success: true, value: null });
    } else {
      // Return all realm-related preferences
      const realmPreferences = data?.filter(item => 
        item.preference_key.startsWith('realm-') ||
        item.preference_key.startsWith('animal-') ||
        item.preference_key.startsWith('mystery-')
      ) || [];
      
      const formattedPreferences: Record<string, any> = {};
      realmPreferences.forEach(item => {
        formattedPreferences[item.preference_key] = item.preference_value;
      });
      
      return NextResponse.json({ success: true, preferences: formattedPreferences });
    }
  } catch (error) {
    console.error('[Realm Data API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { key, value } = realmDataSchema.parse(body);

    const { error } = await supabaseServer
      .from('user_preferences')
      .upsert({
        user_id: userId,
        preference_key: key,
        preference_value: value,
      }, {
        onConflict: 'user_id,preference_key'
      });

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Realm data saved successfully' });
  } catch (error) {
    console.error('[Realm Data API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
      return NextResponse.json({ error: 'Key parameter is required' }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from('user_preferences')
      .delete()
      .eq('user_id', userId)
      .eq('preference_key', key);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Realm data deleted successfully' });
  } catch (error) {
    console.error('[Realm Data API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
