import { logger } from "@/lib/logger";
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { comprehensiveItems } from '@/app/lib/comprehensive-items';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  return createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!,
    { auth: { persistSession: false } }
  );
}

// Recipe definition
interface Recipe {
  id: string;
  targetItemId: string;
  goldCost: number;
  materials: { itemId: string; quantity: number }[];
}

const FORGE_RECIPES: Recipe[] = [
  {
    id: 'craft-sword-irony',
    targetItemId: 'sword-irony',
    goldCost: 50,
    materials: [
      { itemId: 'sword-twig', quantity: 1 },
      { itemId: 'material-steel', quantity: 5 },
      { itemId: 'material-planks', quantity: 2 }
    ]
  },
  {
    id: 'craft-sword-morningstar',
    targetItemId: 'sword-morningstar',
    goldCost: 120,
    materials: [
      { itemId: 'sword-irony', quantity: 1 },
      { itemId: 'material-steel', quantity: 8 },
      { itemId: 'material-planks', quantity: 3 },
      { itemId: 'material-crystal', quantity: 1 }
    ]
  },
  {
    id: 'craft-sword-sunblade',
    targetItemId: 'sword-sunblade',
    goldCost: 250,
    materials: [
      { itemId: 'sword-morningstar', quantity: 1 },
      { itemId: 'material-silver', quantity: 10 },
      { itemId: 'material-crystal', quantity: 5 }
    ]
  },
  {
    id: 'craft-sword-solaraxe',
    targetItemId: 'sword-solaraxe',
    goldCost: 500,
    materials: [
      { itemId: 'sword-sunblade', quantity: 1 },
      { itemId: 'material-gold', quantity: 15 },
      { itemId: 'material-crystal', quantity: 10 }
    ]
  },
  {
    id: 'craft-shield-defecto',
    targetItemId: 'shield-defecto',
    goldCost: 40,
    materials: [
      { itemId: 'shield-reflecto', quantity: 1 },
      { itemId: 'material-logs', quantity: 5 },
      { itemId: 'material-steel', quantity: 3 }
    ]
  },
  {
    id: 'craft-shield-blockado',
    targetItemId: 'shield-blockado',
    goldCost: 100,
    materials: [
      { itemId: 'shield-defecto', quantity: 1 },
      { itemId: 'material-steel', quantity: 8 },
      { itemId: 'material-planks', quantity: 2 },
      { itemId: 'material-crystal', quantity: 1 }
    ]
  },
  {
    id: 'craft-armor-darko',
    targetItemId: 'armor-darko',
    goldCost: 60,
    materials: [
      { itemId: 'armor-normalo', quantity: 1 },
      { itemId: 'material-logs', quantity: 4 },
      { itemId: 'material-steel', quantity: 2 }
    ]
  },
  {
    id: 'craft-armor-silvo',
    targetItemId: 'armor-silvo',
    goldCost: 300,
    materials: [
      { itemId: 'armor-darko', quantity: 1 },
      { itemId: 'material-silver', quantity: 8 },
    ]
  }
];

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { recipeId } = body;

    const recipe = FORGE_RECIPES.find(r => r.id === recipeId);
    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    const targetItem = comprehensiveItems.find(i => i.id === recipe.targetItemId);
    if (!targetItem) {
      return NextResponse.json({ error: 'Target item not found in comprehensive items' }, { status: 500 });
    }

    const supabase = getSupabaseAdmin();

    // 1. Fetch character stats to verify gold
    const { data: stats, error: statsError } = await supabase
      .from('character_stats')
      .select('gold')
      .eq('user_id', userId)
      .single();

    if (statsError || !stats) {
      logger.error('[Forge API] Fetch stats error:', statsError);
      return NextResponse.json({ error: 'Failed to retrieve character gold' }, { status: 500 });
    }

    if (stats.gold < recipe.goldCost) {
      return NextResponse.json({ error: `Not enough gold. Required: ${recipe.goldCost}, Owned: ${stats.gold}` }, { status: 400 });
    }

    // 2. Fetch user inventory to verify materials
    const { data: inventory, error: invError } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', userId);

    if (invError) {
      logger.error('[Forge API] Fetch inventory error:', invError);
      return NextResponse.json({ error: 'Failed to retrieve inventory items' }, { status: 500 });
    }

    // Check each required material
    for (const req of recipe.materials) {
      const match = (inventory || []).find(i => i.item_id === req.itemId);
      const quantityOwned = match ? match.quantity : 0;
      if (quantityOwned < req.quantity) {
        return NextResponse.json({ 
          error: `Not enough materials. Required: ${req.quantity}x ${req.itemId}, Owned: ${quantityOwned}` 
        }, { status: 400 });
      }
    }

    // 3. Perform Transaction deductions
    // A. Deduct Gold
    const { error: goldUpdateError } = await supabase
      .from('character_stats')
      .update({ gold: stats.gold - recipe.goldCost })
      .eq('user_id', userId);

    if (goldUpdateError) {
      logger.error('[Forge API] Gold update error:', goldUpdateError);
      return NextResponse.json({ error: 'Failed to deduct gold' }, { status: 500 });
    }

    // B. Deduct Materials
    for (const req of recipe.materials) {
      const match = (inventory || []).find(i => i.item_id === req.itemId)!;
      if (match.quantity > req.quantity) {
        // Decrement quantity
        await supabase
          .from('inventory_items')
          .update({ quantity: match.quantity - req.quantity })
          .eq('id', match.id);
      } else {
        // Delete row
        await supabase
          .from('inventory_items')
          .delete()
          .eq('id', match.id);
      }
    }

    // C. Add Target Item
    const existingTarget = (inventory || []).find(i => i.item_id === targetItem.id);
    if (existingTarget) {
      // Increment quantity
      const { data: updatedTarget, error: targetError } = await supabase
        .from('inventory_items')
        .update({ quantity: existingTarget.quantity + 1, updated_at: new Date().toISOString() })
        .eq('id', existingTarget.id)
        .select()
        .single();

      if (targetError) {
        logger.error('[Forge API] Increment target error:', targetError);
        return NextResponse.json({ error: 'Failed to add forged item' }, { status: 500 });
      }
      return NextResponse.json({ success: true, item: updatedTarget });
    } else {
      // Insert new item row
      const { data: insertedTarget, error: targetError } = await supabase
        .from('inventory_items')
        .insert({
          user_id: userId,
          item_id: targetItem.id,
          name: targetItem.name,
          type: targetItem.type,
          category: targetItem.category || targetItem.type,
          description: targetItem.description,
          emoji: targetItem.emoji,
          image: targetItem.image,
          stats: targetItem.stats,
          quantity: 1,
          equipped: false,
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (targetError) {
        logger.error('[Forge API] Insert target error:', targetError);
        return NextResponse.json({ error: 'Failed to add forged item' }, { status: 500 });
      }
      return NextResponse.json({ success: true, item: insertedTarget });
    }
  } catch (error) {
    logger.error('[Forge API] POST Exception:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
