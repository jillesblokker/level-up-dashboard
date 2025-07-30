import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  console.log('[Quests API] === PUT REQUEST START ===');
  try {
    const { id: questId } = await params;
    const body = await req.json();
    const { name, description, category, difficulty, xp_reward, gold_reward } = body;

    console.log('[Quests API] PUT request for questId:', questId);
    console.log('[Quests API] Request body:', { name, description, category, difficulty, xp_reward, gold_reward });
    console.log('[Quests API] Request headers:', Object.fromEntries(req.headers.entries()));
    console.log('[Quests API] Authorization header:', req.headers.get('authorization') ? 'present' : 'missing');

    if (!name || !description || !category || !difficulty) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, description, category, difficulty' 
      }, { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Use authenticated Supabase query with proper Clerk JWT verification
    console.log('[Quests API] About to call authenticatedSupabaseQuery...');
    const result = await authenticatedSupabaseQuery(req, async (supabase, userId) => {
      console.log('[Quests API] Authenticated query with userId:', userId);
      
      // First, let's check if the quest exists and belongs to the user
      const { data: existingQuest, error: fetchError } = await supabase
        .from('quests')
        .select('*')
        .eq('id', questId)
        .eq('user_id', userId)
        .single();
        
      console.log('[Quests API] Existing quest check:', { 
        hasData: !!existingQuest, 
        errorCode: fetchError?.code, 
        errorMessage: fetchError?.message 
      });
      
      if (fetchError) {
        console.error('[Quests API] Error fetching quest:', fetchError);
        throw fetchError;
      }
      
      if (!existingQuest) {
        console.error('[Quests API] Quest not found or doesn\'t belong to user');
        throw new Error('Quest not found or access denied');
      }
      
      console.log('[Quests API] Updating quest:', existingQuest.name);
      
      const { data, error } = await supabase
        .from('quests')
        .update({
          name,
          description,
          category,
          difficulty,
          xp_reward: xp_reward || 0,
          gold_reward: gold_reward || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', questId)
        .eq('user_id', userId)
        .select()
        .single();
        
      if (error) {
        console.error('[Quests API] Update error:', error);
        throw error;
      }
      
      console.log('[Quests API] Update successful:', data);
      return data;
    });

    console.log('[Quests API] Result from authenticatedSupabaseQuery:', result);
    
    if (!result.success) {
      console.log('[Quests API] Authentication failed, returning 401');
      return NextResponse.json({ error: result.error }, { 
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    return NextResponse.json(result.data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (err: any) {
    console.log('[Quests API] === PUT REQUEST ERROR ===', err.message);
    return NextResponse.json({ error: err.message || 'Unknown error' }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: questId } = await params;

    // Use authenticated Supabase query with proper Clerk JWT verification
    const result = await authenticatedSupabaseQuery(req, async (supabase, userId) => {
      const { data, error } = await supabase
        .from('quests')
        .delete()
        .eq('id', questId)
        .eq('user_id', userId)
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      return data;
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { 
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    return NextResponse.json({ success: true }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 