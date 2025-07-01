import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: Request) {
  const logs: any[] = [];
  try {
    const { userId } = await auth();
    logs.push({ step: 'auth', userId });
    if (!userId) {
      logs.push({ error: 'Unauthorized' });
      return NextResponse.json({ error: 'Unauthorized', logs }, { status: 401 });
    }
    const body = await request.json();
    const { creatureId } = body;
    logs.push({ step: 'body', creatureId });
    if (!creatureId) {
      logs.push({ error: 'Creature ID is required' });
      return NextResponse.json({ error: 'Creature ID is required', logs }, { status: 400 });
    }
    // Insert into DiscoveredCreatures if not already present
    const { data: existing, error: fetchError } = await supabase
      .from('DiscoveredCreatures')
      .select('*')
      .eq('user_id', userId)
      .eq('creature_id', creatureId)
      .single();
    logs.push({ step: 'fetch', existing, fetchError });
    if (existing) {
      logs.push({ step: 'already discovered' });
      return NextResponse.json({ success: true, alreadyDiscovered: true, logs });
    }
    const { error, data: insertData } = await supabase.from('DiscoveredCreatures').insert([
      {
        user_id: userId,
        creature_id: creatureId,
        discovered_at: new Date().toISOString(),
      },
    ]);
    logs.push({ step: 'insert', insertData, error });
    if (error) {
      logs.push({ error: error.message });
      return NextResponse.json({ error: error.message, logs }, { status: 500 });
    }
    logs.push({ step: 'success' });
    return NextResponse.json({ success: true, logs });
  } catch (err) {
    logs.push({ error: (err as Error).message });
    return NextResponse.json({ error: (err as Error).message, logs }, { status: 500 });
  }
} 