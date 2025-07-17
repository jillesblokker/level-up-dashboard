import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'stats', 'strengths', 'titles', 'perks'

    if (!type) {
      return NextResponse.json({ error: 'Missing type parameter' }, { status: 400 });
    }

    const result = await authenticatedSupabaseQuery(req, async (supabase, userId) => {
      switch (type) {
        case 'stats':
          const { data: stats, error: statsError } = await supabase
            .from('character_stats')
            .select('*')
            .eq('user_id', userId)
            .single();
          if (statsError && statsError.code !== 'PGRST116') throw statsError;
          return stats;

        case 'strengths':
          const { data: strengths, error: strengthsError } = await supabase
            .from('character_strengths')
            .select('*')
            .eq('user_id', userId);
          if (strengthsError) throw strengthsError;
          return strengths || [];

        case 'titles':
          const { data: titles, error: titlesError } = await supabase
            .from('character_titles')
            .select('*')
            .eq('user_id', userId);
          if (titlesError) throw titlesError;
          return titles || [];

        case 'perks':
          const { data: perks, error: perksError } = await supabase
            .from('character_perks')
            .select('*')
            .eq('user_id', userId);
          if (perksError) throw perksError;
          return perks || [];

        default:
          throw new Error('Invalid type parameter');
      }
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json({ error: 'Missing type or data' }, { status: 400 });
    }

    const result = await authenticatedSupabaseQuery(req, async (supabase, userId) => {
      switch (type) {
        case 'stats':
          const { data: statsData, error: statsError } = await supabase
            .from('character_stats')
            .upsert({ 
              user_id: userId, 
              ...data,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' })
            .select()
            .single();
          if (statsError) throw statsError;
          return statsData;

        case 'strength':
          const { data: strengthData, error: strengthError } = await supabase
            .from('character_strengths')
            .insert({
              user_id: userId,
              ...data,
              created_at: new Date().toISOString()
            })
            .select()
            .single();
          if (strengthError) throw strengthError;
          return strengthData;

        case 'title':
          const { data: titleData, error: titleError } = await supabase
            .from('character_titles')
            .insert({
              user_id: userId,
              ...data,
              created_at: new Date().toISOString()
            })
            .select()
            .single();
          if (titleError) throw titleError;
          return titleData;

        case 'perk':
          const { data: perkData, error: perkError } = await supabase
            .from('character_perks')
            .insert({
              user_id: userId,
              ...data,
              created_at: new Date().toISOString()
            })
            .select()
            .single();
          if (perkError) throw perkError;
          return perkData;

        default:
          throw new Error('Invalid type parameter');
      }
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, id, data } = body;

    if (!type || !id || !data) {
      return NextResponse.json({ error: 'Missing type, id, or data' }, { status: 400 });
    }

    const result = await authenticatedSupabaseQuery(req, async (supabase, userId) => {
      switch (type) {
        case 'stats':
          const { data: statsData, error: statsError } = await supabase
            .from('character_stats')
            .update({ 
              ...data,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .select()
            .single();
          if (statsError) throw statsError;
          return statsData;

        case 'strength':
          const { data: strengthData, error: strengthError } = await supabase
            .from('character_strengths')
            .update(data)
            .eq('user_id', userId)
            .eq('id', id)
            .select()
            .single();
          if (strengthError) throw strengthError;
          return strengthData;

        case 'title':
          const { data: titleData, error: titleError } = await supabase
            .from('character_titles')
            .update(data)
            .eq('user_id', userId)
            .eq('id', id)
            .select()
            .single();
          if (titleError) throw titleError;
          return titleData;

        case 'perk':
          const { data: perkData, error: perkError } = await supabase
            .from('character_perks')
            .update(data)
            .eq('user_id', userId)
            .eq('id', id)
            .select()
            .single();
          if (perkError) throw perkError;
          return perkData;

        default:
          throw new Error('Invalid type parameter');
      }
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ error: 'Missing type or id parameter' }, { status: 400 });
    }

    const result = await authenticatedSupabaseQuery(req, async (supabase, userId) => {
      let tableName: string;
      switch (type) {
        case 'strength':
          tableName = 'character_strengths';
          break;
        case 'title':
          tableName = 'character_titles';
          break;
        case 'perk':
          tableName = 'character_perks';
          break;
        default:
          throw new Error('Invalid type parameter');
      }

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('user_id', userId)
        .eq('id', id);
        
      if (error) throw error;
      return { deleted: true };
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
} 