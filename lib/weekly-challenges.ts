// No import needed for Quest

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  rewardXP: number;
  rewardGold: number;
  type: 'category' | 'difficulty' | 'general' | 'gold_earned';
  value?: string; // e.g. "might", "hard"
}

const CHALLENGE_POOL: WeeklyChallenge[] = [
  { id: 'c1', title: 'Might Master', description: 'Complete 3 Might quests', targetCount: 3, rewardXP: 50, rewardGold: 25, type: 'category', value: 'might' },
  { id: 'c2', title: 'Knowledge Seeker', description: 'Complete 3 Knowledge quests', targetCount: 3, rewardXP: 50, rewardGold: 25, type: 'category', value: 'knowledge' },
  { id: 'c3', title: 'Hard Worker', description: 'Complete 2 Hard quests', targetCount: 2, rewardXP: 75, rewardGold: 50, type: 'difficulty', value: 'hard' },
  { id: 'c4', title: 'Dedicated', description: 'Complete 10 quests total', targetCount: 10, rewardXP: 100, rewardGold: 50, type: 'general' },
  { id: 'c5', title: 'Wealth Accumulator', description: 'Earn 200 gold', targetCount: 200, rewardXP: 25, rewardGold: 100, type: 'gold_earned' },
  { id: 'c6', title: 'Explorer', description: 'Complete 3 Exploration quests', targetCount: 3, rewardXP: 50, rewardGold: 25, type: 'category', value: 'exploration' },
];

export function getWeeklyChallenges(seedId: string, weekNumber: number): WeeklyChallenge[] {
  // Simple deterministic random based on string sum and week number
  const seedSum = seedId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const prng = (seed: number) => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  
  let randomSeed = seedSum + weekNumber * 1000;
  
  const selected: WeeklyChallenge[] = [];
  const pool = [...CHALLENGE_POOL];
  
  for (let i = 0; i < 3; i++) {
    const r = prng(randomSeed++);
    const idx = Math.floor(r * pool.length);
    const challenge = pool[idx];
    if (challenge) selected.push(challenge);
    pool.splice(idx, 1);
  }
  
  return selected;
}

export function getCurrentWeekNumber(): number {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
}

export function calculateChallengeProgress(challenge: WeeklyChallenge, questsThisWeek: any[], goldEarnedThisWeek: number): number {
  switch (challenge.type) {
    case 'category':
      return questsThisWeek.filter(q => q.category?.toLowerCase() === challenge.value?.toLowerCase() && q.completed).length;
    case 'difficulty':
      return questsThisWeek.filter(q => q.difficulty?.toLowerCase() === challenge.value?.toLowerCase() && q.completed).length;
    case 'general':
      return questsThisWeek.filter(q => q.completed).length;
    case 'gold_earned':
      return goldEarnedThisWeek;
    default:
      return 0;
  }
}
