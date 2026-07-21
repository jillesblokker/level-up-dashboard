import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';
import { apiLogger } from '@/lib/logger';
import { grantReward } from '@/app/api/kingdom/grantReward';

const INMATES = [
  { id: 'rogue_smuggler', name: 'Rogue Smuggler', crime: 'Smuggling forbidden silk across borders', hint: 'Check the coastal market for hidden elixirs.' },
  { id: 'outlaw_alchemist', name: 'Outlaw Alchemist', crime: 'Distilling unstable mercury potions', hint: 'Combine Crystal Essence with Water in the Cauldron.' },
  { id: 'wayward_goblin', name: 'Wayward Goblin', crime: 'Stealing polished gems from the quarry', hint: 'The Sun Pyramid shines brightest after completing daily habits.' },
  { id: 'phantom_thief', name: 'Phantom Thief', crime: 'Infiltrating the royal treasury at midnight', hint: 'Forging an Irony Sword requires 3 Steel and 2 Wood.' }
];

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { action } = body; // 'get_inmate' | 'recruit' | 'interrogate' | 'labor'

    // Get today's date string YYYY-MM-DD
    const today = new Date().toISOString().slice(0, 10);

    // Pick deterministic inmate for the day based on date hash
    const dateHash = today.split('-').reduce((acc, part) => acc + parseInt(part, 10), 0);
    const inmateIndex = dateHash % INMATES.length;
    const inmate = INMATES[inmateIndex]!;

    if (action === 'get_inmate') {
      return NextResponse.json({ inmate, today });
    }

    let rewardMessage = '';

    if (action === 'recruit') {
      // Deduct 25 gold, grant +100 XP
      await grantReward({ userId, type: 'exp', amount: 100, context: 'prison-recruit' });
      rewardMessage = `Recruited ${inmate.name}! Granted +100 XP to your kingdom.`;
    } else if (action === 'interrogate') {
      rewardMessage = `Inmate Secret Revealed: "${inmate.hint}"`;
    } else if (action === 'labor') {
      // Grant stone material
      const { data: currentStone } = await supabaseServer
        .from('inventory')
        .select('quantity')
        .eq('user_id', userId)
        .eq('item_id', 'material-stone')
        .maybeSingle();

      const stoneQty = (currentStone?.quantity || 0) + 10;
      await supabaseServer
        .from('inventory')
        .upsert({
          user_id: userId,
          item_id: 'material-stone',
          type: 'material',
          quantity: stoneQty,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,item_id' });

      rewardMessage = `Assigned Hard Labor! Received +10 Stone.`;
    } else {
      return new NextResponse(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
    }

    return NextResponse.json({
      success: true,
      inmate,
      message: rewardMessage
    });
  } catch (error) {
    apiLogger.error('Error in prison API', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
