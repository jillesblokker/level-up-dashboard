import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!
);

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Load all eggs for the user
    const { data: eggs, error } = await supabaseAdmin
      .from('easter_eggs')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('[API] Error loading eggs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[API] Eggs loaded for user:', userId, 'Count:', eggs?.length || 0);
    return NextResponse.json({ eggs: eggs || [] });

  } catch (err: any) {
    console.error('[API] Easter eggs GET error:', err);
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, eggId, position } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action required' }, { status: 400 });
    }

    if (action === 'initialize') {
      // Create 10 eggs for the user
      const eggs = [];
      for (let i = 1; i <= 10; i++) {
        eggs.push({
          user_id: userId,
          egg_id: i,
          found: false,
          position: { x: 100 + (i * 50), y: 100 + (i * 30) }
        });
      }

      const { data, error } = await supabaseAdmin
        .from('easter_eggs')
        .insert(eggs)
        .select();

      if (error) {
        console.error('[API] Error creating eggs:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log('[API] Eggs initialized for user:', userId);
      return NextResponse.json({ success: true, eggs: data });

    } else if (action === 'find') {
      if (!eggId) {
        return NextResponse.json({ error: 'Egg ID required' }, { status: 400 });
      }

      // Mark egg as found
      const { data, error } = await supabaseAdmin
        .from('easter_eggs')
        .update({ 
          found: true, 
          found_at: new Date().toISOString() 
        })
        .eq('user_id', userId)
        .eq('egg_id', eggId)
        .select()
        .single();

      if (error) {
        console.error('[API] Error finding egg:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log('[API] Egg found:', eggId, 'for user:', userId);
      return NextResponse.json({ success: true, egg: data });

    } else if (action === 'reset') {
      // Delete all eggs for the user
      const { error } = await supabaseAdmin
        .from('easter_eggs')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('[API] Error resetting eggs:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log('[API] Eggs reset for user:', userId);
      return NextResponse.json({ success: true });

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (err: any) {
    console.error('[API] Easter eggs POST error:', err);
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
} 