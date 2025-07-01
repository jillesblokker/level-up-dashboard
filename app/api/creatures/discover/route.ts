import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
);

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { creatureId } = body;
    if (!creatureId) {
      return NextResponse.json({ error: 'Creature ID is required' }, { status: 400 });
    }
    // Insert into DiscoveredCreatures if not already present
    const { data: existing, error: fetchError } = await supabase
      .from('DiscoveredCreatures')
      .select('*')
      .eq('user_id', userId)
      .eq('creature_id', creatureId)
      .single();
    if (existing) {
      return NextResponse.json({ success: true, alreadyDiscovered: true });
    }
    const { error } = await supabase.from('DiscoveredCreatures').insert([
      {
        user_id: userId,
        creature_id: creatureId,
        discovered_at: new Date().toISOString(),
      },
    ]);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
} 