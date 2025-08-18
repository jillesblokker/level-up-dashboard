import { NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const preferenceKey = searchParams.get('preference_key');
    
    if (!preferenceKey) {
      return NextResponse.json({ error: 'preference_key is required' }, { status: 400 });
    }

    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .eq('preference_key', preferenceKey)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }
      
      return data;
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[User Preferences API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { preference_key, preference_value } = body;
    
    if (!preference_key || preference_value === undefined) {
      return NextResponse.json({ error: 'preference_key and preference_value are required' }, { status: 400 });
    }

    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      // Attempt write with modern column name (preference_value)
      const attemptUpsert = async () => {
        return await supabase
          .from('user_preferences')
          .upsert({
            user_id: userId,
            preference_key,
            preference_value,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,preference_key' })
          .select()
          .single();
      };

      let upsertRes = await attemptUpsert();
      if (upsertRes.error && upsertRes.error.code === '42703') {
        // Column does not exist in this environment; retry with legacy 'value' column
        upsertRes = await supabase
          .from('user_preferences')
          .upsert({
            user_id: userId,
            preference_key,
            // @ts-ignore legacy column for backward compatibility
            value: preference_value,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,preference_key' })
          .select()
          .single();
      }

      if (upsertRes.error) throw upsertRes.error;
      return upsertRes.data;
    });

    if (!result.success) {
      // Return 500 for database failures rather than Unauthorized
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[User Preferences API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 