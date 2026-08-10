import { supabaseServer } from '@/lib/supabase/server-client';
import { logger } from '@/lib/logger';
import { clerkClient } from '@clerk/nextjs/server';
import { calculateFillCurve, HouseCupStandings, HouseCupCategorySummary } from '@/lib/house-cup-utils';

export type { HouseCupStandings, HouseCupCategorySummary };
export { calculateFillCurve };

/**
 * Records points in the house_cup_ledger table (§4).
 * Points: Quest = 1, Challenge = 10, Milestone = 100
 */
export async function recordHouseCupPoints(params: {
  userId: string;
  categoryId: string;
  sourceType: 'quest' | 'challenge' | 'milestone';
  sourceId: string;
  points: number;
  reversalOfId?: string;
  occurredAt?: string;
}) {
  const { userId, categoryId, sourceType, sourceId, points, reversalOfId, occurredAt } = params;
  const currentYear = new Date().getFullYear();
  const catSlug = (categoryId || 'might').toLowerCase();

  try {
    const supabase = supabaseServer;

    // 1. Insert into ledger
    const { data: ledgerRow, error: ledgerErr } = await supabase
      .from('house_cup_ledger')
      .insert({
        user_id: userId,
        category_id: catSlug,
        source_type: sourceType,
        source_id: sourceId,
        points: points,
        reversal_of: reversalOfId || null,
        occurred_at: occurredAt || new Date().toISOString(),
        cup_year: currentYear,
      })
      .select()
      .maybeSingle();

    if (ledgerErr) {
      logger.error('[House Cup] Error writing to house_cup_ledger:', ledgerErr);
    }

    // 2. Maintain house_cup_totals cache
    const { data: existingTotal } = await supabase
      .from('house_cup_totals')
      .select('points')
      .eq('user_id', userId)
      .eq('cup_year', currentYear)
      .eq('category_id', catSlug)
      .maybeSingle();

    const newTotalPoints = Math.max(0, (existingTotal?.points || 0) + points);

    await supabase
      .from('house_cup_totals')
      .upsert({
        user_id: userId,
        cup_year: currentYear,
        category_id: catSlug,
        points: newTotalPoints,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,cup_year,category_id' });

    return { success: true, ledgerRow, newTotalPoints };
  } catch (err) {
    logger.error('[House Cup] Unexpected error in recordHouseCupPoints:', err);
    return { success: false, error: err };
  }
}

/**
 * Calculates and records scaled House Cup Virtue Energy from Dungeon Keep victories.
 * Factors in floor height, difficulty multipliers, habit combat stat buffs, and Guardian Pet strikers.
 */
export async function recordDungeonVictoryVirtuePoints(params: {
  userId: string;
  floor: number;
  difficulty?: 'normal' | 'hard' | 'epic' | 'boss';
  primaryCategory?: string;
  petStrikerUsed?: boolean;
}) {
  const { userId, floor = 1, difficulty = 'normal', primaryCategory = 'conquest', petStrikerUsed = false } = params;

  // 1. Calculate Base Energy & Difficulty Multiplier
  const baseEnergy = Math.max(1, floor) * 10;
  const diffMultiplier = difficulty === 'boss' ? 5.0 : (difficulty === 'hard' || difficulty === 'epic') ? 2.0 : 1.0;
  const totalVirtuePoints = Math.round(baseEnergy * diffMultiplier);

  // 2. Main Virtue Category Credit
  const mainResult = await recordHouseCupPoints({
    userId,
    categoryId: primaryCategory,
    sourceType: 'milestone',
    sourceId: `dungeon-floor-${floor}-${Date.now()}`,
    points: totalVirtuePoints,
  });

  // 3. Guardian Pet Support Striker Bonus (+10 Vitality & +10 Wellness)
  if (petStrikerUsed) {
    await recordHouseCupPoints({
      userId,
      categoryId: 'vitality',
      sourceType: 'quest',
      sourceId: `dungeon-pet-vitality-${Date.now()}`,
      points: 10,
    });
    await recordHouseCupPoints({
      userId,
      categoryId: 'wellness',
      sourceType: 'quest',
      sourceId: `dungeon-pet-wellness-${Date.now()}`,
      points: 10,
    });
  }

  return {
    success: true,
    totalVirtuePoints,
    difficultyMultiplier: diffMultiplier,
    petBonusAwarded: petStrikerUsed,
    mainResult,
  };
}

/**
 * Fetches the House Cup standings for a viewer's circle (viewer + allies) for a given year (§2 & §3).
 * Integrates database ledger history & character stats so main character & allies show live points.
 */
export async function getHouseCupCircleStandings(viewerId: string, year?: number): Promise<HouseCupStandings[]> {
  const cupYear = year || new Date().getFullYear();
  const supabase = supabaseServer;

  // 1. Get viewer's allies/friends list (or top realm players automatically)
  const { data: friendsData } = await supabase
    .from('friends')
    .select('friend_id, user_id, status')
    .or(`user_id.eq.${viewerId},friend_id.eq.${viewerId}`);

  const circleUserIds = new Set<string>([viewerId]);
  if (friendsData) {
    friendsData.forEach(f => {
      if (!f.status || f.status === 'accepted') {
        if (f.user_id === viewerId && f.friend_id) circleUserIds.add(f.friend_id);
        if (f.friend_id === viewerId && f.user_id) circleUserIds.add(f.user_id);
      }
    });
  }

  // If fewer than 5 members, automatically include top realm players so the cup is alive without manual invites
  if (circleUserIds.size < 5) {
    const { data: topPlayers } = await supabase
      .from('character_stats')
      .select('user_id')
      .neq('user_id', viewerId)
      .limit(10);

    if (topPlayers) {
      topPlayers.forEach(p => circleUserIds.add(p.user_id));
    }
  }

  const userIdsArray = Array.from(circleUserIds);

  // 2. Fetch house_cup_totals cache
  const { data: totalsData } = await supabase
    .from('house_cup_totals')
    .select('user_id, category_id, points')
    .in('user_id', userIdsArray)
    .eq('cup_year', cupYear);

  // 3. Fetch house_cup_ledger rows for detailed ledger history
  const { data: ledgerData } = await supabase
    .from('house_cup_ledger')
    .select('user_id, category_id, points')
    .in('user_id', userIdsArray)
    .eq('cup_year', cupYear);

  // 4. Fetch display names/titles & experience from character_stats
  const { data: statsData } = await supabase
    .from('character_stats')
    .select('user_id, display_name, character_name, title, experience')
    .in('user_id', userIdsArray);

  // Also query Clerk for real user names (firstName, username, email)
  const clerkNamesMap = new Map<string, string>();
  try {
    const clerk = await clerkClient();
    const clerkUsers = await clerk.users.getUserList({ userId: userIdsArray, limit: 100 });
    if (clerkUsers && clerkUsers.data) {
      clerkUsers.data.forEach((u: any) => {
        const name = u.firstName || u.username || (u.emailAddresses[0]?.emailAddress ? u.emailAddresses[0].emailAddress.split('@')[0] : null);
        if (name) clerkNamesMap.set(u.id, name);
      });
    }
  } catch (err) {
    logger.warn('[getHouseCupCircleStandings] Clerk user lookup skipped:', err);
  }

  // Deterministic fantasy name generator for fallback so NO user is ever named generic 'Ally'
  const FALLBACK_NAMES = [
    'Rowan Eldergrove',
    'Lyra Starling',
    'Kaelen Vane',
    'Evelyn Vance',
    'Garrick Ironwill',
    'Soren Brightblade',
    'Aria Sunstrider',
    'Thorne Oakshield',
  ];

  const getDeterministicAllyName = (uid: string, index: number): string => {
    let hash = 0;
    for (let i = 0; i < uid.length; i++) {
      hash = (hash << 5) - hash + uid.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash + index) % FALLBACK_NAMES.length;
    return FALLBACK_NAMES[idx]!;
  };

  const statsMap = new Map<string, { name: string; title: string; experience: number }>();
  if (statsData) {
    statsData.forEach(s => {
      const clerkName = clerkNamesMap.get(s.user_id);
      const name = (s.display_name && s.display_name !== 'Ally') ? s.display_name : ((s.character_name && s.character_name !== 'Ally') ? s.character_name : clerkName);
      statsMap.set(s.user_id, {
        name: name || 'Adventurer',
        title: s.title || 'Novice',
        experience: s.experience || 0,
      });
    });
  }

  const ALL_CATEGORIES = ['might', 'knowledge', 'honor', 'castle', 'craft', 'vitality', 'wellness', 'exploration', 'conquest'];

  // Map totals per user
  const standingsMap = new Map<string, HouseCupStandings>();

  userIdsArray.forEach((uid, index) => {
    const clerkName = clerkNamesMap.get(uid);
    const existing = statsMap.get(uid);
    const resolvedName = (existing?.name && existing.name !== 'Ally' && existing.name !== 'Adventurer')
      ? existing.name
      : (clerkName || (uid === viewerId ? 'You' : getDeterministicAllyName(uid, index)));

    const userMeta = {
      name: resolvedName,
      title: existing?.title || 'Novice',
      experience: existing?.experience || 0,
    };
    const userCategories: Record<string, { points: number; fill: number }> = {};
    ALL_CATEGORIES.forEach(cat => {
      userCategories[cat] = { points: 0, fill: 0 };
    });

    standingsMap.set(uid, {
      user_id: uid,
      display_name: userMeta.name,
      title: userMeta.title,
      is_viewer: uid === viewerId,
      categories: userCategories,
      total_points: 0,
      categories_won: 0,
    });
  });

  // Merge house_cup_totals into standings
  if (totalsData) {
    totalsData.forEach(row => {
      const entry = standingsMap.get(row.user_id);
      if (entry) {
        const points = Math.max(0, row.points || 0);
        const catKey = (row.category_id || 'might').toLowerCase();
        entry.categories[catKey] = {
          points,
          fill: calculateFillCurve(points),
        };
      }
    });
  }

  // Merge house_cup_ledger rows into standings if totalsData was incomplete
  if (ledgerData && ledgerData.length > 0) {
    const ledgerAgg = new Map<string, Record<string, number>>();
    ledgerData.forEach(row => {
      const uid = row.user_id;
      const catKey = (row.category_id || 'might').toLowerCase();
      if (!ledgerAgg.has(uid)) ledgerAgg.set(uid, {});
      const userAgg = ledgerAgg.get(uid)!;
      userAgg[catKey] = (userAgg[catKey] || 0) + (row.points || 0);
    });

    ledgerAgg.forEach((cats, uid) => {
      const entry = standingsMap.get(uid);
      if (entry) {
        Object.entries(cats).forEach(([catKey, ledgerPts]) => {
          const currentPts = entry.categories[catKey]?.points || 0;
          if (ledgerPts > currentPts) {
            entry.categories[catKey] = {
              points: ledgerPts,
              fill: calculateFillCurve(ledgerPts),
            };
          }
        });
      }
    });
  }



  // Calculate final total points per user
  standingsMap.forEach(entry => {
    let sum = 0;
    Object.values(entry.categories).forEach(c => {
      sum += c.points;
    });
    entry.total_points = sum;
  });

  // Calculate category winners
  const standingsList = Array.from(standingsMap.values());
  ALL_CATEGORIES.forEach(cat => {
    let highestPoints = -1;
    let winner: HouseCupStandings | null = null;

    standingsList.forEach(st => {
      const p = st.categories[cat]?.points || 0;
      if (p > highestPoints) {
        highestPoints = p;
        winner = st;
      }
    });

    if (winner && highestPoints > 0) {
      (winner as HouseCupStandings).categories_won += 1;
    }
  });

  return standingsList;
}
