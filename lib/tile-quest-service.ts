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
}

export const TILE_QUEST_DEFINITIONS: TileQuestDef[] = [
  {
    tileIds: ['zen-garden'],
    questName: 'Zen Garden Meditation',
    category: 'wellness',
    xp: 50,
    gold: 25,
    mandateCount: 1,
  },
  {
    tileIds: ['jousting', 'archery', 'watchtower', 'barracks'],
    questName: 'Complete 3 Dungeon Battles',
    category: 'might',
    xp: 75,
    gold: 40,
    mandateCount: 3,
  },
];

/**
 * Checks Kingdom Map grid tiles and auto-unlocks corresponding daily quests if not present.
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
  const updatedQuests = [...cachedQuests];

  TILE_QUEST_DEFINITIONS.forEach(def => {
    const hasTileOnMap = def.tileIds.some(tid => activeTileTypes.has(tid.toLowerCase()));
    if (!hasTileOnMap) return;

    const alreadyExists = updatedQuests.some((q: any) => {
      const qName = (q.name || q.title || q.id || '').toLowerCase();
      return qName === def.questName.toLowerCase();
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
      const alreadyNotified = getUserScopedItem(notifyKey);

      if (!alreadyNotified) {
        setUserScopedItem(notifyKey, 'true');
        toast({
          title: "Daily Quest Unlocked! 🗺️✨",
          description: `New daily habit added: "${def.questName}". Complete it today for extra rewards!`,
          duration: 2000,
        });
      }
    }
  });

  if (newlyUnlockedCount > 0) {
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
 * Tracks dungeon battle wins and auto-completes "Complete 3 Dungeon Battles" quest on 3rd win.
 */
export async function recordDungeonBattleWin(): Promise<void> {
  const todayStr = new Intl.DateTimeFormat('en-CA').format(new Date());
  const countKey = `daily-dungeon-battles-${todayStr}`;
  const currentCount = Number(getUserScopedItem(countKey) || '0') + 1;
  setUserScopedItem(countKey, String(currentCount));

  logger.info(`[TileQuestService] Dungeon battle won today: ${currentCount}/3`);

  if (currentCount >= 3) {
    await autoCompleteTileQuest('Complete 3 Dungeon Battles', 'might', 75, 40);
  }
}

/**
 * Auto-completes "Zen Garden Meditation" quest upon finishing a meditation session.
 */
export async function recordZenMeditationCompletion(): Promise<void> {
  await autoCompleteTileQuest('Zen Garden Meditation', 'wellness', 50, 25);
}

/**
 * Helper to auto-complete a tile quest and trigger reward toasts & cross-device sync.
 */
async function autoCompleteTileQuest(questName: string, category: string, xp: number, gold: number): Promise<void> {
  const todayStr = new Intl.DateTimeFormat('en-CA').format(new Date());
  const cacheKey = 'quests-cache';

  let cachedQuests: any[] = [];
  try {
    const raw = getUserScopedItem(cacheKey);
    if (raw) cachedQuests = JSON.parse(raw);
  } catch {}

  const targetQuest = cachedQuests.find((q: any) => {
    const qName = (q.name || q.title || q.id || '').toLowerCase();
    return qName === questName.toLowerCase();
  });

  if (targetQuest && targetQuest.completed) {
    logger.info(`[TileQuestService] Quest "${questName}" is already completed today.`);
    return;
  }

  // 1. Optimistically update local cache
  const updatedQuests = cachedQuests.map((q: any) => {
    const qName = (q.name || q.title || q.id || '').toLowerCase();
    if (qName === questName.toLowerCase()) {
      return { ...q, completed: true, completed_at: new Date().toISOString() };
    }
    return q;
  });

  if (!targetQuest) {
    updatedQuests.push({
      id: `tile-quest-${questName.toLowerCase().replace(/\s+/g, '-')}`,
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

  // 2. Persist completion to backend
  try {
    const res = await fetchWithAuth('/api/quests/smart-completion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: questName,
        category,
        xpEarned: xp,
        goldEarned: gold,
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
