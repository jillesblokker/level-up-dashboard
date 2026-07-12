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

// Helper to determine upgrade cost & materials
function getUpgradeRequirements(itemType: string, rarity: string, nextLevel: number) {
  const goldCost = Math.floor(100 * Math.pow(1.5, nextLevel - 1));
  const materials: { itemId: string; quantity: number }[] = [];

  if (nextLevel <= 3) {
    materials.push({ itemId: 'material-steel', quantity: 3 });
    if (itemType === 'shield') {
      materials.push({ itemId: 'material-planks', quantity: 2 });
    } else {
      materials.push({ itemId: 'material-logs', quantity: 2 });
    }
  } else if (nextLevel <= 7) {
    materials.push({ itemId: 'material-steel', quantity: 5 });
    materials.push({ itemId: 'material-silver', quantity: 3 });
    materials.push({ itemId: 'material-crystal', quantity: 1 });
  } else {
    materials.push({ itemId: 'material-silver', quantity: 8 });
    materials.push({ itemId: 'material-gold', quantity: 3 });
    materials.push({ itemId: 'material-crystal', quantity: 3 });
  }

  // Adjust materials slightly based on rarity
  if (rarity === 'legendary' || rarity === 'epic') {
    materials.forEach(m => { m.quantity = Math.floor(m.quantity * 1.5); });
  }

  return { goldCost, materials };
}

// Helper to determine success rate
function getSuccessRate(nextLevel: number) {
  if (nextLevel <= 3) return 1.0; // 100%
  if (nextLevel <= 5) return 0.8; // 80%
  if (nextLevel <= 7) return 0.65; // 65%
  if (nextLevel <= 9) return 0.45; // 45%
  return 0.25; // 25% for +10
}

// Helper to calculate upgraded stat bonus
function getStatBonus(rarity: string) {
  if (rarity === 'common') return 1;
  if (rarity === 'uncommon') return 2;
  if (rarity === 'rare') return 3;
  return 5; // Epic, Legendary, Mythic
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { dbId } = await request.json();
    if (!dbId) {
      return NextResponse.json({ error: 'dbId is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 1. Fetch item from database
    const { data: item, error: fetchError } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', userId)
      .eq('id', dbId)
      .single();

    if (fetchError || !item) {
      logger.error('[Upgrade API] Fetch item error:', fetchError);
      return NextResponse.json({ error: 'Item not found in inventory' }, { status: 404 });
    }

    const sourceOfTruth = comprehensiveItems.find((i: any) => i.id === item.item_id);
    if (!sourceOfTruth) {
      return NextResponse.json({ error: 'Item compendium details not found' }, { status: 400 });
    }

    const itemType = sourceOfTruth.type.toLowerCase();
    if (!['weapon', 'shield', 'armor'].includes(itemType)) {
      return NextResponse.json({ error: 'Only weapons, shields, and armor can be upgraded' }, { status: 400 });
    }

    const rarity = sourceOfTruth.rarity || 'common';

    const dbStats = item.stats || {};
    const currentLevel = dbStats.upgradeLevel || 0;

    if (currentLevel >= 10) {
      return NextResponse.json({ error: 'Maximum upgrade level (+10) reached' }, { status: 400 });
    }

    const nextLevel = currentLevel + 1;
    const { goldCost, materials } = getUpgradeRequirements(itemType, rarity, nextLevel);

    // 2. Fetch character stats to verify gold
    const { data: stats, error: statsError } = await supabase
      .from('character_stats')
      .select('gold')
      .eq('user_id', userId)
      .single();

    if (statsError || !stats) {
      logger.error('[Upgrade API] Fetch stats error:', statsError);
      return NextResponse.json({ error: 'Failed to retrieve character stats' }, { status: 500 });
    }

    if (stats.gold < goldCost) {
      return NextResponse.json({ error: `Not enough gold. Required: ${goldCost}, Owned: ${stats.gold}` }, { status: 400 });
    }

    // 3. Fetch user inventory to verify materials
    const { data: inventory, error: invError } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', userId);

    if (invError) {
      logger.error('[Upgrade API] Fetch inventory error:', invError);
      return NextResponse.json({ error: 'Failed to retrieve inventory' }, { status: 500 });
    }

    // Check each required material
    for (const req of materials) {
      const match = (inventory || []).find(i => i.item_id === req.itemId);
      const quantityOwned = match ? match.quantity : 0;
      if (quantityOwned < req.quantity) {
        return NextResponse.json({ 
          error: `Not enough materials. Required: ${req.quantity}x ${req.itemId}, Owned: ${quantityOwned}` 
        }, { status: 400 });
      }
    }

    // 4. Deduct Gold & Materials
    // A. Deduct Gold
    const { error: goldUpdateError } = await supabase
      .from('character_stats')
      .update({ gold: stats.gold - goldCost })
      .eq('user_id', userId);

    if (goldUpdateError) {
      logger.error('[Upgrade API] Gold deduction error:', goldUpdateError);
      return NextResponse.json({ error: 'Failed to deduct gold' }, { status: 500 });
    }

    // B. Deduct Materials
    for (const req of materials) {
      const match = (inventory || []).find(i => i.item_id === req.itemId)!;
      if (match.quantity > req.quantity) {
        await supabase
          .from('inventory_items')
          .update({ quantity: match.quantity - req.quantity })
          .eq('id', match.id);
      } else {
        await supabase
          .from('inventory_items')
          .delete()
          .eq('id', match.id);
      }
    }

    // 5. Upgrade Roll
    const successRate = getSuccessRate(nextLevel);
    const roll = Math.random();
    const isSuccess = roll <= successRate;

    if (isSuccess) {
      // UPGRADE SUCCESS
      const statBonus = getStatBonus(rarity);
      const baseCompStats = sourceOfTruth ? (sourceOfTruth.stats || {}) : {};
      
      const newStats = {
        ...baseCompStats,
        ...dbStats,
        upgradeLevel: nextLevel
      };

      if (newStats.attack !== undefined) {
        newStats.attack = (baseCompStats.attack || 0) + (statBonus * nextLevel);
      }
      if (newStats.defense !== undefined) {
        newStats.defense = (baseCompStats.defense || 0) + (statBonus * nextLevel);
      }

      // Base item name without upgrade suffix
      let cleanName = item.name || (sourceOfTruth ? sourceOfTruth.name : item.item_id);
      if (cleanName.includes(' +')) {
        cleanName = cleanName.split(' +')[0];
      }
      const newName = `${cleanName} +${nextLevel}`;

      if (item.quantity > 1) {
        // Split stack: decrement current stack, insert upgraded item
        await supabase
          .from('inventory_items')
          .update({ quantity: item.quantity - 1 })
          .eq('id', item.id);

        await supabase
          .from('inventory_items')
          .insert({
            user_id: userId,
            item_id: item.item_id,
            name: newName,
            type: itemType,
            category: item.category || sourceOfTruth.category,
            description: item.description,
            emoji: item.emoji,
            image: item.image,
            stats: newStats,
            quantity: 1,
            equipped: false,
            is_default: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      } else {
        // Update row directly
        await supabase
          .from('inventory_items')
          .update({
            name: newName,
            type: itemType,
            stats: newStats,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);
      }

      return NextResponse.json({
        success: true,
        upgraded: true,
        degraded: false,
        nextLevel,
        name: newName,
        stats: newStats,
        roll,
        successRate
      });
    } else {
      // UPGRADE FAILURE
      let degraded = false;
      let nextDegradedLevel = currentLevel;
      let newStats = { ...dbStats };
      let newName = item.name;

      if (currentLevel >= 5) {
        // 50% chance to degrade by 1 level on fail
        const degradeRoll = Math.random();
        if (degradeRoll <= 0.5) {
          degraded = true;
          nextDegradedLevel = currentLevel - 1;
          const statBonus = getStatBonus(rarity);
          const baseCompStats = sourceOfTruth ? (sourceOfTruth.stats || {}) : {};
          
          newStats = {
            ...baseCompStats,
            ...dbStats,
            upgradeLevel: nextDegradedLevel
          };

          if (newStats.attack !== undefined) {
            newStats.attack = (baseCompStats.attack || 0) + (statBonus * nextDegradedLevel);
          }
          if (newStats.defense !== undefined) {
            newStats.defense = (baseCompStats.defense || 0) + (statBonus * nextDegradedLevel);
          }

          let cleanName = item.name || (sourceOfTruth ? sourceOfTruth.name : item.item_id);
          if (cleanName.includes(' +')) {
            cleanName = cleanName.split(' +')[0];
          }
          newName = nextDegradedLevel > 0 ? `${cleanName} +${nextDegradedLevel}` : cleanName;

          if (item.quantity > 1) {
            // Split stack: decrement current stack, insert degraded item
            await supabase
              .from('inventory_items')
              .update({ quantity: item.quantity - 1 })
              .eq('id', item.id);

            await supabase
              .from('inventory_items')
              .insert({
                user_id: userId,
                item_id: item.item_id,
                name: newName,
                type: itemType,
                category: item.category || sourceOfTruth.category,
                description: item.description,
                emoji: item.emoji,
                image: item.image,
                stats: newStats,
                quantity: 1,
                equipped: false,
                is_default: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
          } else {
            // Update row directly
            await supabase
              .from('inventory_items')
              .update({
                name: newName,
                type: itemType,
                stats: newStats,
                updated_at: new Date().toISOString()
              })
              .eq('id', item.id);
          }
        }
      }

      return NextResponse.json({
        success: true,
        upgraded: false,
        degraded,
        nextLevel: nextDegradedLevel,
        name: newName,
        stats: newStats,
        roll,
        successRate
      });
    }
  } catch (error) {
    logger.error('[Upgrade API] POST Exception:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
