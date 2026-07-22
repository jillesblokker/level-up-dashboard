import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';
import { apiLogger } from '@/lib/logger';

const CONVERSIONS: Record<string, { cost: number; targetItem: string; name: string; quantity: number; emoji: string; image: string; dailyLimit: number }> = {
  logs: { cost: 100, targetItem: 'material-logs', name: 'Wood Logs', quantity: 10, emoji: '🪵', image: '/images/items/materials/material-logs.webp', dailyLimit: 5 },
  stone: { cost: 100, targetItem: 'material-stone', name: 'Cobblestone', quantity: 10, emoji: '🪨', image: '/images/items/materials/material-stone.webp', dailyLimit: 5 },
  water: { cost: 250, targetItem: 'material-water', name: 'Fresh Water', quantity: 1, emoji: '💧', image: '/images/items/materials/material-water.webp', dailyLimit: 3 },
  crystal: { cost: 500, targetItem: 'material-crystal', name: 'Essence Crystal', quantity: 1, emoji: '💎', image: '/images/items/materials/material-crystal.webp', dailyLimit: 2 },
};

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { optionKey } = body; // 'logs' | 'stone' | 'water' | 'crystal'

    const option = CONVERSIONS[optionKey];
    if (!option) {
      return new NextResponse(JSON.stringify({ error: 'Invalid conversion option' }), { status: 400 });
    }

    // 1. Check user stats (gold)
    const { data: stats } = await supabaseServer
      .from('character_stats')
      .select('gold')
      .eq('user_id', userId)
      .single();

    const currentGold = stats?.gold || 0;
    if (currentGold < option.cost) {
      return new NextResponse(JSON.stringify({ error: `Insufficient Gold. Required: ${option.cost} Gold` }), { status: 400 });
    }

    // 2. Deduct Gold (with non-negative floor bound)
    const newGold = Math.max(0, currentGold - option.cost);
    await supabaseServer
      .from('character_stats')
      .update({ gold: newGold, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    // 3. Upsert material inventory
    const { data: currentMat } = await supabaseServer
      .from('inventory_items')
      .select('quantity')
      .eq('user_id', userId)
      .eq('item_id', option.targetItem)
      .maybeSingle();

    const newQty = (currentMat?.quantity || 0) + option.quantity;

    await supabaseServer
      .from('inventory_items')
      .upsert({
        user_id: userId,
        item_id: option.targetItem,
        name: option.name,
        type: 'material',
        category: 'material',
        emoji: option.emoji,
        image: option.image,
        quantity: newQty,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,item_id' });

    return NextResponse.json({
      success: true,
      message: `Exchanged ${option.cost} Gold for +${option.quantity} ${option.name}!`,
      newGold: currentGold - option.cost,
      newMaterialQty: newQty
    });
  } catch (error) {
    apiLogger.error('Error converting materials', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
