import { logger } from "@/lib/logger";
import { CreatureType } from '@/app/dungeon/game-logic';
import { getTodayDateString } from '@/lib/date-utils';

export interface BountyProgress {
  bountyId: string;
  targetType: CreatureType;
  requiredKills: number;
  currentKills: number;
  claimed: boolean;
  rewardGems: number;
  rewardGold: number;
}

const STORAGE_KEY = 'dungeon_bounty_progress';

function getTodayKey(): string {
  return getTodayDateString();
}

/**
 * Load today's bounty progress from localStorage
 */
export function loadBountyProgress(): BountyProgress[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    // Reset if it's a new day
    if (data.date !== getTodayKey()) return [];
    return data.progress || [];
  } catch {
    return [];
  }
}

/**
 * Initialize bounty progress for today (call on dungeon page mount)
 */
export function initBountyProgress(bounties: { id: string; targetType: CreatureType; requiredKills: number; rewardGems: number; rewardGold: number }[]): BountyProgress[] {
  const existing = loadBountyProgress();
  if (existing.length > 0) return existing;

  const progress: BountyProgress[] = bounties.map(b => ({
    bountyId: b.id,
    targetType: b.targetType,
    requiredKills: b.requiredKills,
    currentKills: 0,
    claimed: false,
    rewardGems: b.rewardGems,
    rewardGold: b.rewardGold,
  }));

  saveBountyProgress(progress);
  return progress;
}

/**
 * Record a monster kill and update bounty progress
 * Returns any bounty that was just completed (for toast notification)
 */
export function recordBountyKill(defeatedType: CreatureType): BountyProgress | null {
  const progress = loadBountyProgress();
  let completedBounty: BountyProgress | null = null;

  for (const bounty of progress) {
    if (bounty.targetType === defeatedType && !bounty.claimed && bounty.currentKills < bounty.requiredKills) {
      bounty.currentKills++;
      if (bounty.currentKills >= bounty.requiredKills) {
        completedBounty = { ...bounty };
      }
      break;
    }
  }

  saveBountyProgress(progress);
  return completedBounty;
}

/**
 * Claim a completed bounty reward
 */
export function claimBountyReward(bountyId: string): { gold: number; gems: number } | null {
  const progress = loadBountyProgress();
  const bounty = progress.find(b => b.bountyId === bountyId);

  if (!bounty || bounty.claimed || bounty.currentKills < bounty.requiredKills) {
    return null;
  }

  bounty.claimed = true;
  saveBountyProgress(progress);

  return { gold: bounty.rewardGold, gems: bounty.rewardGems };
}

/**
 * Check if all bounties are claimed
 */
export function areAllBountiesClaimed(): boolean {
  const progress = loadBountyProgress();
  return progress.length > 0 && progress.every(b => b.claimed);
}

function saveBountyProgress(progress: BountyProgress[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      date: getTodayKey(),
      progress,
    }));
  } catch (e) {
    logger.warn('[Bounty Tracker] Failed to save progress:', e);
  }
}
