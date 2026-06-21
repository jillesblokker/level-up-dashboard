import { logger } from "@/lib/logger";
import { logKingdomEvent } from './logKingdomEvent';
import { supabaseServer } from '@/lib/supabase/server-client';

export type RewardType = 'exp' | 'gold' | 'item' | 'achievement' | 'custom' | 'challenge' | 'quest' | 'ember_essence' | 'frost_essence' | 'tide_essence' | 'verdant_essence';

function mapRewardTypeToEventType(type: RewardType): 'quest' | 'challenge' | 'gold' | 'exp' | 'reward' {
  switch (type) {
    case 'exp':
      return 'exp';
    case 'gold':
      return 'gold';
    case 'challenge':
      return 'challenge';
    case 'quest':
      return 'quest';
    default:
      return 'reward';
  }
}

export async function grantReward({
  userId,
  type,
  amount,
  relatedId,
  context
}: {
  userId: string,
  type: RewardType,
  amount?: number,
  relatedId?: string,
  context?: any
}) {
  logger.debug('[grantReward] Granting reward:', { userId, type, amount, relatedId });

  // Actually grant the rewards by updating character stats
  if (amount && amount > 0) {
    try {
      // Fetch current stats
      const { data: currentStats } = await supabaseServer
        .from('character_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const currentGold = currentStats?.gold || 0;
      const currentXP = currentStats?.experience || 0;
      const currentLevel = currentStats?.level || 1;

      if (type === 'gold') {
        // Update gold
        const newGold = currentGold + amount;
        await supabaseServer
          .from('character_stats')
          .upsert({
            user_id: userId,
            gold: newGold,
            experience: currentXP,
            level: currentLevel,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });
        logger.debug('[grantReward] Gold updated:', { old: currentGold, new: newGold, added: amount });
      } else if (type === 'exp' || type === 'quest') {
        // Update experience (and recalculate level if needed)
        const newXP = currentXP + amount;
        // Simple level calculation: level = floor(sqrt(xp / 100)) + 1
        const newLevel = Math.max(currentLevel, Math.floor(Math.sqrt(newXP / 100)) + 1);

        await supabaseServer
          .from('character_stats')
          .upsert({
            user_id: userId,
            gold: currentGold,
            experience: newXP,
            level: newLevel,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });
        logger.debug('[grantReward] XP updated:', { old: currentXP, new: newXP, added: amount, level: newLevel });
      } else if (['ember_essence', 'frost_essence', 'tide_essence', 'verdant_essence'].includes(type)) {
        const currentEssence = currentStats?.[type] || 0;
        const newEssence = currentEssence + amount;
        
        await supabaseServer
          .from('character_stats')
          .upsert({
            user_id: userId,
            [type]: newEssence,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });
        logger.debug(`[grantReward] ${type} updated:`, { old: currentEssence, new: newEssence, added: amount });
      }
    } catch (error) {
      logger.error('[grantReward] Error updating character stats:', error);
      // Continue to log the event even if stats update fails
    }
  }

  // Log the event for tracking
  const logArgs: any = {
    userId,
    eventType: mapRewardTypeToEventType(type),
    amount,
    context: { ...context, rewardType: type }
  };
  if (relatedId !== undefined) {
    logArgs.relatedId = relatedId;
  }
  logger.debug('[grantReward] Logging event:', logArgs);
  const result = await logKingdomEvent(logArgs);
  logger.debug('[grantReward] Event logged:', result);
  return true;
}