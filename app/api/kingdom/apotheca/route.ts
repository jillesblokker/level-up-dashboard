import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';
import { apiLogger } from '@/lib/logger';
import { grantReward } from '@/app/api/kingdom/grantReward';

const DECOCTIONS = [
  { id: 'elixir_haste', name: 'Elixir of Haste', effect: 'Grants +150 XP to boost daily focus', type: 'xp', amount: 150 },
  { id: 'tincture_midas', name: 'Tincture of Midas', effect: 'Transforms lead into +75 Gold', type: 'gold', amount: 75 },
  { id: 'tonic_vitality', name: 'Tonic of Vitality', effect: 'Restores spirit with +5 Gems', type: 'gems', amount: 5 }
];

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { action, tradeItem } = body; // 'get_status' | 'drink_brew' | 'botanical_trade'

    const today = new Date().toISOString().slice(0, 10);

    if (action === 'get_status') {
      const dateHash = today.split('-').reduce((acc, part) => acc + parseInt(part, 10), 0);
      const brew = DECOCTIONS[dateHash % DECOCTIONS.length] || DECOCTIONS[0];
      return NextResponse.json({ brew, today });
    }

    if (action === 'drink_brew') {
      const dateHash = today.split('-').reduce((acc, part) => acc + parseInt(part, 10), 0);
      const brew = DECOCTIONS[dateHash % DECOCTIONS.length] || DECOCTIONS[0];

      if (brew.type === 'xp') {
        await grantReward({ userId, type: 'exp', amount: brew.amount, context: 'apotheca-brew' });
      } else if (brew.type === 'gold') {
        await grantReward({ userId, type: 'gold', amount: brew.amount, context: 'apotheca-brew' });
      } else if (brew.type === 'gems') {
        await grantReward({ userId, type: 'gems', amount: brew.amount, context: 'apotheca-brew' });
      }

      return NextResponse.json({
        success: true,
        brew,
        message: `Drank ${brew.name}! ${brew.effect}.`
      });
    } else if (action === 'botanical_trade') {
      const materialId = tradeItem || 'material-water';
      
      const { data: currentMat } = await supabaseServer
        .from('inventory')
        .select('quantity')
        .eq('user_id', userId)
        .eq('item_id', materialId)
        .maybeSingle();

      const currentQty = currentMat?.quantity || 0;
      if (currentQty < 1) {
        return new NextResponse(JSON.stringify({ error: `Insufficient ${materialId}` }), { status: 400 });
      }

      // Deduct 1 material, grant 1 crystal
      await supabaseServer
        .from('inventory')
        .update({ quantity: currentQty - 1, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('item_id', materialId);

      const { data: crystalMat } = await supabaseServer
        .from('inventory')
        .select('quantity')
        .eq('user_id', userId)
        .eq('item_id', 'material-crystal')
        .maybeSingle();

      const crystalQty = (crystalMat?.quantity || 0) + 1;
      await supabaseServer
        .from('inventory')
        .upsert({
          user_id: userId,
          item_id: 'material-crystal',
          type: 'material',
          quantity: crystalQty,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,item_id' });

      return NextResponse.json({
        success: true,
        message: `Distilled ${materialId.replace('material-', '')} into 1x Crystal Essence!`
      });
    }

    return new NextResponse(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
  } catch (error) {
    apiLogger.error('Error in apotheca API', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
