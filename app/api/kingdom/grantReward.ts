import { logKingdomEvent } from './logKingdomEvent';

export type RewardType = 'exp' | 'gold' | 'item' | 'achievement' | 'custom' | 'challenge' | 'quest';

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
  const logArgs: any = {
    userId,
    eventType: mapRewardTypeToEventType(type),
    amount,
    context: { ...context, rewardType: type }
  };
  if (relatedId !== undefined) {
    logArgs.relatedId = relatedId;
  }
  console.log('[grantReward] Logging event:', logArgs);
  const result = await logKingdomEvent(logArgs);
  console.log('[grantReward] logKingdomEvent result:', result);
} 