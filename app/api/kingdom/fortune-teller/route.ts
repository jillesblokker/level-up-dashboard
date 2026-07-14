import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';
import { apiLogger } from '@/lib/logger';
import { grantReward } from '@/app/api/kingdom/grantReward';

const MATERIALS = [
  'material-water',
  'material-logs',
  'material-stone',
  'material-steel',
  'material-crystal'
];

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { x, y, tileId, cardChoice } = body;

    if (tileId !== 'fortune_teller') {
      return new NextResponse(JSON.stringify({ error: 'Invalid tile' }), { status: 400 });
    }

    // Check if the timer already exists and is active
    const { data: existingTimer } = await supabaseServer
      .from('property_timers')
      .select('*')
      .eq('user_id', userId)
      .eq('x', x)
      .eq('y', y)
      .maybeSingle();

    if (existingTimer && !existingTimer.is_ready) {
      const now = Date.now();
      const endTime = new Date(existingTimer.end_time).getTime();
      if (now < endTime) {
        return new NextResponse(JSON.stringify({ error: 'Fortune teller is resting.' }), { status: 400 });
      }
    }

    let rewardMessage = '';

    // Handle rewards
    if (cardChoice === 'king') {
      const randomMaterial = MATERIALS[Math.floor(Math.random() * MATERIALS.length)] || 'material-logs';
      
      // Update inventory directly
      const { data: currentItem } = await supabaseServer
        .from('inventory')
        .select('quantity')
        .eq('user_id', userId)
        .eq('item_id', randomMaterial)
        .maybeSingle();

      const currentQuantity = currentItem?.quantity || 0;
      
      await supabaseServer
        .from('inventory')
        .upsert({
          user_id: userId,
          item_id: randomMaterial,
          type: 'material',
          quantity: currentQuantity + 1,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,item_id' });

      rewardMessage = `1x ${randomMaterial.replace('material-', '').toUpperCase()}`;
    } else if (cardChoice === 'joker') {
      const { data: currentItem } = await supabaseServer
        .from('inventory')
        .select('quantity')
        .eq('user_id', userId)
        .eq('item_id', 'scratch-card-mythic')
        .maybeSingle();

      const currentQuantity = currentItem?.quantity || 0;

      await supabaseServer
        .from('inventory')
        .upsert({
          user_id: userId,
          item_id: 'scratch-card-mythic',
          type: 'scratch-card',
          quantity: currentQuantity + 1,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,item_id' });

      rewardMessage = `1x Mythic Scratch Card`;
    } else if (cardChoice === 'ace') {
      await grantReward({ userId, type: 'gems', amount: 5, context: 'fortune-teller' });
      rewardMessage = `5 Gems`;
    } else {
      return new NextResponse(JSON.stringify({ error: 'Invalid card choice' }), { status: 400 });
    }

    // Set 24 hour cooldown
    const cooldownMs = 24 * 60 * 60 * 1000;
    const endTimeIso = new Date(Date.now() + cooldownMs).toISOString();

    await supabaseServer
      .from('property_timers')
      .upsert({
        user_id: userId,
        x,
        y,
        tile_id: 'fortune_teller',
        end_time: endTimeIso,
        is_ready: false,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,x,y' });

    return new NextResponse(JSON.stringify({ success: true, rewardMessage }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    apiLogger.error("Error in fortune-teller API", error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
