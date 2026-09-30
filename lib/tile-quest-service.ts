import { toast } from "@/components/ui/use-toast";
import { getUserScopedItem, setUserScopedItem } from "@/lib/user-scoped-storage";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { showQuestCompletionToast } from "@/components/enhanced-reward-toast";
import { logger } from "@/lib/logger";

export interface TileQuestDef {
  tileIds: string[];
  questName: string;
  category: string;
  xp: number;
  gold: number;
  mandateCount: number;
  aliases?: string[];
}

export const TILE_QUEST_DEFINITIONS: TileQuestDef[] = [
  {
    tileIds: ['zen-garden', 'zen_garden', 'whispering-canopy', 'whispering-canopy-tile', 'meditation', 'abbey', 'fairy-ring', 'fairy-ring-tile'],
    questName: 'Meditation',
    category: 'wellness',
    xp: 50,
    gold: 25,
    mandateCount: 1,
    aliases: ['5-minute meditation', '5 minute meditation', 'zen garden meditation', 'daily meditation'],
  },
  {
    tileIds: ['dungeon', 'dungeon-tile', 'castle', 'jousting', 'archery', 'watchtower', 'barracks', 'prison', 'prison-tile'],
    questName: 'Dungeon crawl 3x',
    category: 'might',
    xp: 75,
    gold: 40,
    mandateCount: 3,
    aliases: ['complete 3 dungeon battles', 'dungeon battles', 'complete 3 dungeon crawl'],
  },
];

/**
 * Checks Kingdom Map grid tiles and auto-unlocks corresponding daily quests if not present.
 * Also cleans up legacy aliases/duplicates from quests-cache.
 */
export function checkAndUnlockTileQuests(gridTiles: any[]): void {
  if (!Array.isArray(gridTiles) || gridTiles.length === 0) return;

  const todayStr = new Intl.DateTimeFormat('en-CA').format(new Date());
  const activeTileTypes = new Set<string>();

  gridTiles.forEach(row => {
    if (Array.isArray(row)) {
      row.forEach(tile => {
        const type = (tile?.type || tile?.id || '').toLowerCase();
        if (type) activeTileTypes.add(type);
      });
    } else if (row && (row.type || row.id)) {
      const type = (row.type || row.id || '').toLowerCase();
      if (type) activeTileTypes.add(type);
    }
  });

  const cacheKey = 'quests-cache';
  let cachedQuests: any[] = [];
  try {
    const raw = getUserScopedItem(cacheKey);
    if (raw) cachedQuests = JSON.parse(raw);
  } catch {}

  let newlyUnlockedCount = 0;
  let hasCleanedDuplicates = false;

  // First: Clean up legacy aliases / duplicates and deduplicate against canonical names
  let updatedQuests: any[] = [];
  const canonicalNames = new Set(TILE_QUEST_DEFINITIONS.map(d => d.questName.toLowerCase()));

  cachedQuests.forEach((q: any) => {
    const qName = (q.name || q.title || q.id || '').toLowerCase().trim();
    const qId = String(q.id || '').toLowerCase().trim();

    // Check if this quest matches an alias of any tile quest
    const matchingDef = TILE_QUEST_DEFINITIONS.find(def => {
      const canonicalMatch = def.questName.toLowerCase() === qName;
      const aliasMatch = def.aliases?.some(a => a.toLowerCase() === qName);
      const idMatch = qId === `tile-quest-${def.questName.toLowerCase().replace(/\s+/g, '-')}` ||
        def.aliases?.some(a => qId === `tile-quest-${a.toLowerCase().replace(/\s+/g, '-')}`);
      return canonicalMatch || aliasMatch || idMatch;
    });

    if (matchingDef) {
      // If we already have the canonical quest in updatedQuests, merge completion status if needed and skip duplicate
      const existingCanonicalIndex = updatedQuests.findIndex(uq => (uq.name || uq.title || '').toLowerCase().trim() === matchingDef.questName.toLowerCase());
      if (existingCanonicalIndex !== -1) {
        if (q.completed && !updatedQuests[existingCanonicalIndex].completed) {
          updatedQuests[existingCanonicalIndex].completed = true;
          updatedQuests[existingCanonicalIndex].completed_at = q.completed_at || new Date().toISOString();
        }
        hasCleanedDuplicates = true;
        return;
      }

      // Rename legacy aliases to the canonical name
      if (qName !== matchingDef.questName.toLowerCase()) {
        hasCleanedDuplicates = true;
        updatedQuests.push({
          ...q,
          id: `tile-quest-${matchingDef.questName.toLowerCase().replace(/\s+/g, '-')}`,
          name: matchingDef.questName,
          title: matchingDef.questName,
          category: matchingDef.category,
          mandateCount: matchingDef.mandateCount,
          xp: q.xp || matchingDef.xp,
          gold: q.gold || matchingDef.gold,
        });
        return;
      }
    }

    updatedQuests.push(q);
  });

  // Second: Add missing tile quests for active tiles
  TILE_QUEST_DEFINITIONS.forEach(def => {
    const hasTileOnMap = def.tileIds.some(tid => activeTileTypes.has(tid.toLowerCase()));
    if (!hasTileOnMap) return;

    const alreadyExists = updatedQuests.some((q: any) => {
      const qName = (q.name || q.title || q.id || '').toLowerCase().trim();
      const qId = String(q.id || '').toLowerCase().trim();
      const canonicalMatch = qName === def.questName.toLowerCase();
      const aliasMatch = def.aliases?.some(a => a.toLowerCase() === qName);
      const idMatch = qId === `tile-quest-${def.questName.toLowerCase().replace(/\s+/g, '-')}`;
      return canonicalMatch || aliasMatch || idMatch;
    });

    if (!alreadyExists) {
      const newQuestObj = {
        id: `tile-quest-${def.questName.toLowerCase().replace(/\s+/g, '-')}`,
        name: def.questName,
        title: def.questName,
        category: def.category,
        completed: false,
        xp: def.xp,
        gold: def.gold,
        mandateCount: def.mandateCount,
        created_at: new Date().toISOString(),
        isTileUnlocked: true,
      };

      updatedQuests.push(newQuestObj);
      newlyUnlockedCount++;

      const notifyKey = `tile_quest_notified_${def.questName.toLowerCase().replace(/\s+/g, '-')}`;
      setUserScopedItem(notifyKey, 'true');
    }
  });

  if (newlyUnlockedCount > 0 || hasCleanedDuplicates) {
    try {
      setUserScopedItem(cacheKey, JSON.stringify(updatedQuests));
      setUserScopedItem('quests-cache-date', todayStr);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('global-sync-tick', { detail: { quests: updatedQuests } }));
        window.dispatchEvent(new Event('quest-added'));
      }
    } catch (err) {
      logger.error('[TileQuestService] Error updating quest cache:', err);
    }
  }
}

/**
 * Tracks dungeon battle wins and auto-completes "Dungeon crawl 3x" quest on 3rd win.
 */
export async function recordDungeonBattleWin(): Promise<void> {
  const todayStr = new Intl.DateTimeFormat('en-CA').format(new Date());
  const countKey = `daily-dungeon-battles-${todayStr}`;
  const currentCount = Number(getUserScopedItem(countKey) || '0') + 1;
  setUserScopedItem(countKey, String(currentCount));

  logger.info(`[TileQuestService] Dungeon battle won today: ${currentCount}/3`);

  if (currentCount >= 3) {
    await autoCompleteTileQuest('Dungeon crawl 3x', 'might', 75, 40, ['complete 3 dungeon battles', 'dungeon battles', 'complete 3 dungeon crawl']);
  }
}

/**
 * Auto-completes "Meditation" quest upon finishing a meditation session.
 */
export async function recordZenMeditationCompletion(): Promise<void> {
  await autoCompleteTileQuest('Meditation', 'wellness', 50, 25, ['5-minute meditation', '5 minute meditation', 'zen garden meditation', 'daily meditation']);
}

/**
 * Helper to auto-complete a tile quest and trigger reward toasts & cross-device sync.
 */
async function autoCompleteTileQuest(
  questName: string,
  category: string,
  xp: number,
  gold: number,
  aliases: string[] = []
): Promise<void> {
  const todayStr = new Intl.DateTimeFormat('en-CA').format(new Date());
  const cacheKey = 'quests-cache';

  let cachedQuests: any[] = [];
  try {
    const raw = getUserScopedItem(cacheKey);
    if (raw) cachedQuests = JSON.parse(raw);
  } catch {}

  const allNames = [questName.toLowerCase(), ...aliases.map(a => a.toLowerCase())];

  const targetQuest = cachedQuests.find((q: any) => {
    const qName = (q.name || q.title || q.id || '').toLowerCase().trim();
    const qId = String(q.id || '').toLowerCase().trim();
    return allNames.includes(qName) || allNames.some(name => qId === `tile-quest-${name.replace(/\s+/g, '-')}`);
  });

  if (targetQuest && targetQuest.completed) {
    logger.info(`[TileQuestService] Quest "${questName}" is already completed today.`);
    return;
  }

  // 1. Optimistically update local cache
  let matchedInList = false;
  const updatedQuests = cachedQuests.map((q: any) => {
    const qName = (q.name || q.title || q.id || '').toLowerCase().trim();
    const qId = String(q.id || '').toLowerCase().trim();
    if (allNames.includes(qName) || allNames.some(name => qId === `tile-quest-${name.replace(/\s+/g, '-')}`)) {
      matchedInList = true;
      return {
        ...q,
        name: questName,
        title: questName,
        completed: true,
        completed_at: new Date().toISOString()
      };
    }
    return q;
  });

  const canonicalId = targetQuest?.id || `tile-quest-${questName.toLowerCase().replace(/\s+/g, '-')}`;

  if (!matchedInList) {
    updatedQuests.push({
      id: canonicalId,
      name: questName,
      title: questName,
      category,
      completed: true,
      completed_at: new Date().toISOString(),
      xp,
      gold,
      isTileUnlocked: true,
    });
  }

  try {
    setUserScopedItem(cacheKey, JSON.stringify(updatedQuests));
    setUserScopedItem('quests-cache-date', todayStr);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('global-sync-tick', { detail: { quests: updatedQuests } }));
      window.dispatchEvent(new Event('quest-added'));
      window.dispatchEvent(new Event('character-stats-update'));
    }
  } catch {}

  // 2. Persist completion to backend using the smart-completion API
  try {
    const res = await fetchWithAuth('/api/quests/smart-completion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questId: canonicalId,
        completed: true,
        xpReward: xp,
        goldReward: gold,
      }),
    });

    if (res.ok) {
      showQuestCompletionToast(questName, xp, gold);
    }
  } catch (err) {
    logger.error(`[TileQuestService] Error completing quest "${questName}":`, err);
    showQuestCompletionToast(questName, xp, gold);
  }
}
