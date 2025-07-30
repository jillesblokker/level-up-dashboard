import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: questId } = await params;
    const body = await req.json();
    const { name, description, category, difficulty, xp_reward, gold_reward } = body;

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
    const result = await authenticatedSupabaseQuery(req, async (supabase, userId) => {
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

    return NextResponse.json(result.data, {
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