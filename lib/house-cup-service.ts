import { supabaseServer } from '@/lib/supabase/server-client';
import { logger } from '@/lib/logger';

export interface HouseCupStandings {
  user_id: string;
  display_name: string;
  title: string;
  is_viewer: boolean;
  categories: Record<string, { points: number; fill: number }>;
  total_points: number;
  categories_won: number;
}

export interface HouseCupCategorySummary {
  category_id: string;
  points: number;
  fill: number;
}

/**
 * Calculates the power 0.6 fill curve for House Cup hourglasses (§5 of spec).
 * fill = clamp(pow(points / 50000, 0.6), 0, 1)
 */
export function calculateFillCurve(points: number): number {
  if (points <= 0) return 0;
  const ratio = Math.min(1, points / 50000);
  const fill = Math.pow(ratio, 0.6);
  return Math.min(1, Math.max(0, fill));
}

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
      // Fallback: update running totals directly if ledger table or trigger is pending
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
 * Fetches the House Cup standings for a viewer's circle (viewer + allies) for a given year (§2 & §3).
 */
export async function getHouseCupCircleStandings(viewerId: string, year?: number): Promise<HouseCupStandings[]> {
  const cupYear = year || new Date().getFullYear();
  const supabase = supabaseServer;

  // 1. Get viewer's allies/friends list
  const { data: friendsData } = await supabase
    .from('user_friends')
    .select('friend_id, user_id')
    .or(`user_id.eq.${viewerId},friend_id.eq.${viewerId}`)
    .eq('status', 'accepted');

  const circleUserIds = new Set<string>([viewerId]);
  if (friendsData) {
    friendsData.forEach(f => {
      if (f.user_id === viewerId) circleUserIds.add(f.friend_id);
      if (f.friend_id === viewerId) circleUserIds.add(f.user_id);
    });
  }

  const userIdsArray = Array.from(circleUserIds);

  // 2. Fetch totals for all circle members
  const { data: totalsData } = await supabase
    .from('house_cup_totals')
    .select('user_id, category_id, points')
    .in('user_id', userIdsArray)
    .eq('cup_year', cupYear);

  // 3. Fetch display names/titles
  const { data: statsData } = await supabase
    .from('character_stats')
    .select('user_id, display_name, character_name, title')
    .in('user_id', userIdsArray);

  const statsMap = new Map<string, { name: string; title: string }>();
  if (statsData) {
    statsData.forEach(s => {
      statsMap.set(s.user_id, {
        name: s.display_name || s.character_name || 'Adventurer',
        title: s.title || 'Novice',
      });
    });
  }

  const ALL_CATEGORIES = ['might', 'knowledge', 'honor', 'castle', 'craft', 'vitality', 'wellness', 'exploration'];

  // Map totals per user
  const standingsMap = new Map<string, HouseCupStandings>();

  userIdsArray.forEach(uid => {
    const userMeta = statsMap.get(uid) || { name: uid === viewerId ? 'You' : 'Ally', title: 'Novice' };
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

  // Calculate total points
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

  // Sort overall standings by categories_won DESC, then total_points DESC
  return standingsList.sort((a, b) => {
    if (b.categories_won !== a.categories_won) return b.categories_won - a.categories_won;
    return b.total_points - a.total_points;
  });
}
