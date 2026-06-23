import { create } from 'zustand';
import { CREATURE_DEFINITIONS, CreatureDefinition } from '@/lib/creature-mapping';
import { getUserPreference, setUserPreference } from '@/lib/user-preferences-manager';
import { CARD_TYPES, variantLabel } from '@/lib/pack-generator';
import { getInventory, removeFromInventory, addToInventory } from '@/lib/inventory-manager';
import { gainGold } from '@/lib/gold-manager';
import { loadTileInventory, saveTileInventory } from '@/lib/data-loaders';

export interface CitizenState {
  active: boolean;
  favorite: boolean;
  lastFedAt: string | null; // ISO String
  activeDays: number; // Duration in days (e.g. 1, 3, 7)
  lastHarvestedAt: string | null; // ISO String
  affection: number;
}

export interface Citizen {
  id: string; // achievement ID like '001' or 'mythic-[card]-[variant]'
  name: string;
  filename: string; // e.g. 'Flamio.png' or 'Mythic1red.png'
  type: 'fire' | 'water' | 'earth' | 'nature' | 'ice' | 'monster' | 'special';
  greetings: string[];
  scale: number;
  isMythic: boolean;
  cardId?: number;
  variantId?: number;
  rarity?: string;
  variantLabel?: string;
  // Merged states
  active: boolean;
  favorite: boolean;
  lastFedAt: string | null;
  activeDays: number;
  lastHarvestedAt: string | null;
  affection: number;
}

interface CitizensStore {
  citizens: Citizen[];
  loading: boolean;
  error: string | null;
  isSleepy: boolean;
  offlineCatchup: {
    gold: number;
    items: Record<string, { quantity: number; name: string; emoji: string }>;
  } | null;
  clearOfflineCatchup: () => void;
  loadCitizens: (userId: string) => Promise<void>;
  toggleActive: (userId: string, citizenId: string) => Promise<void>;
  toggleFavorite: (userId: string, citizenId: string) => Promise<void>;
  bulkToggleFavorite: (userId: string, citizenIds: string[], value: boolean) => Promise<void>;
  feedCitizen: (userId: string, citizenId: string, foodItemId: string) => Promise<boolean>;
  harvestCitizen: (userId: string, citizenId: string, multiplier?: number) => Promise<boolean>;
  increaseAffection: (userId: string, citizenId: string, amount: number) => Promise<void>;
  decreaseAffection: (userId: string, citizenId: string, amount: number) => Promise<void>;
}

// Map card types/rarity to habitat types
const getMythicType = (cardId: number): 'fire' | 'water' | 'earth' | 'nature' | 'ice' | 'monster' | 'special' => {
  switch (cardId) {
    case 1: return 'nature';
    case 2: return 'earth';
    case 3: return 'nature';
    case 4: return 'water';
    case 5: return 'fire';
    case 6: return 'earth';
    case 7: return 'water';
    case 8: return 'fire';
    case 9: return 'special';
    case 10: return 'special';
    default: return 'special';
  }
};

function generateGatherDrop(citizen: Citizen): { id: string; name: string; description: string; type: 'food'|'material'; emoji: string; image: string; quantity: number } | null {
  if (Math.random() >= 0.20) return null;
  let gatheredItem = 'food-red';
  let gatheredName = 'Red Fish';
  let gatheredDesc = 'A red fish';
  let gatheredType: 'food' | 'material' = 'food';
  let gatheredEmoji = '🐟';
  let gatheredImage = '/images/items/food/fish-red.webp';

  // 50% chance it's a biome-specific material, 50% chance it's generic food
  if (Math.random() < 0.50) {
    gatheredType = 'material';
    switch (citizen.type) {
      case 'nature':
        gatheredItem = 'material-logs';
        gatheredName = 'Wooden Logs';
        gatheredDesc = 'Basic building material gathered from the forest.';
        gatheredEmoji = '🪵';
        gatheredImage = '/images/items/materials/material-logs.webp';
        break;
      case 'earth':
        gatheredItem = 'material-stone';
        gatheredName = 'Stone';
        gatheredDesc = 'Sturdy stone gathered from the mountains.';
        gatheredEmoji = '🪨';
        gatheredImage = '/images/items/materials/material-stone.webp';
        break;
      case 'fire':
        gatheredItem = 'material-steel';
        gatheredName = 'Steel';
        gatheredDesc = 'Forged steel gathered near the volcanic vents.';
        gatheredEmoji = '⛓️';
        gatheredImage = '/images/items/materials/material-steel.webp';
        break;
      case 'water':
        gatheredItem = 'material-water';
        gatheredName = 'Water';
        gatheredDesc = 'Fresh water gathered from the lakes.';
        gatheredEmoji = '💧';
        gatheredImage = '/images/items/materials/material-water.webp';
        break;
      case 'ice':
        gatheredItem = 'material-crystal';
        gatheredName = 'Crystal';
        gatheredDesc = 'A shimmering crystal gathered from the frozen peaks.';
        gatheredEmoji = '💎';
        gatheredImage = '/images/items/materials/material-crystal.webp';
        break;
      default:
        gatheredItem = 'material-logs';
        gatheredName = 'Wooden Logs';
        gatheredDesc = 'Basic building material.';
        gatheredEmoji = '🪵';
        gatheredImage = '/images/items/materials/material-logs.webp';
    }
  }
  return { id: gatheredItem, name: gatheredName, description: gatheredDesc, type: gatheredType, emoji: gatheredEmoji, image: gatheredImage, quantity: 1 };
}

// Map food items to active days
export const FOOD_DAYS_MAP: Record<string, number> = {
  // Fish (primary food)
  'food-red': 1,
  'food-red-starter': 1,
  'food-blue': 3,
  'food-silver': 3,
  'food-golden': 7,
  'food-rainbow': 7,
  // Potions (can also nourish citizens)
  'potion-health': 1,
  'potion-health-starter': 1,
  'potion-mana': 1,
  'potion-mana-starter': 1,
  'potion-stamina': 2,
  'potion-exp': 3,
  'potion-gold': 3,
  // Water (essential nourishment)
  'material-water': 1,
};

export const useCitizensStore = create<CitizensStore>((set, get) => ({
  citizens: [],
  loading: false,
  error: null,
  isSleepy: false,
  offlineCatchup: null,
  clearOfflineCatchup: () => set({ offlineCatchup: null }),

  loadCitizens: async (userId: string) => {
    if (!userId) return;
    set({ loading: true, error: null });

    try {
      // Parallel fetches for achievements, mythic cards, citizen preferences, and character stats (for sleepy check)
      const [achievementsRes, mythicsRes, prefState, charStatsRes] = await Promise.all([
        fetch('/api/achievements').catch(() => null),
        fetch('/api/packs/mythics').catch(() => null),
        getUserPreference('citizens_state') as Promise<Record<string, CitizenState> | null>,
        fetch('/api/character-stats').catch(() => null)
      ]);

      let isSleepy = false;
      if (charStatsRes && charStatsRes.ok) {
        const statsData = await charStatsRes.json();
        if (statsData.lastCompletedAt) {
          const hoursSinceLastComplete = (Date.now() - new Date(statsData.lastCompletedAt).getTime()) / (1000 * 60 * 60);
          if (hoursSinceLastComplete > 24) {
            isSleepy = true;
          }
        }
      }

      const savedPrefs = prefState || {};

      // 1. Get unlocked standard achievement creature IDs (length 3, not starting with '9')
      let unlockedAchievementIds = new Set<string>();
      if (achievementsRes && achievementsRes.ok) {
        const data = await achievementsRes.json();
        const achievementsList = Array.isArray(data) ? data : (data.achievements || []);
        achievementsList.forEach((a: any) => {
          const id = a.achievement_id || a.id;
          if (id && id.length === 3 && !id.startsWith('9')) {
            unlockedAchievementIds.add(id);
          }
        });
      }

      // 2. Get unlocked mythic cards
      let unlockedMythics: any[] = [];
      if (mythicsRes && mythicsRes.ok) {
        const data = await mythicsRes.json();
        unlockedMythics = data.mythics || [];
      }

      // Build citizens list
      const updatedCitizens: Citizen[] = [];

      // Add unlocked achievement creatures
      Object.keys(CREATURE_DEFINITIONS).forEach((id) => {
        if (id.startsWith('9')) return; // Exclude animal companions
        if (unlockedAchievementIds.has(id)) {
          const def = CREATURE_DEFINITIONS[id]!;
          const state: CitizenState = savedPrefs[id] || {
            active: false,
            favorite: false,
            lastFedAt: null,
            activeDays: 0,
            lastHarvestedAt: null,
            affection: 0
          };

          updatedCitizens.push({
            id,
            name: def.name,
            filename: def.filename,
            type: def.type,
            greetings: def.greetings,
            scale: def.scale,
            isMythic: false,
            ...state
          });
        }
      });

      // Add unlocked mythic cards
      unlockedMythics.forEach((m: any) => {
        const cardId = parseInt(m.card_id);
        const variantId = parseInt(m.variant_id);
        const cardDef = CARD_TYPES.find((c) => c.number === cardId);
        if (!cardDef) return;

        const colorNames = ['red', 'green', 'blue', 'white', 'black'];
        const colorName = colorNames[variantId] || 'red';
        const citizenId = `mythic-${cardId}-${variantId}`;
        const state: CitizenState = savedPrefs[citizenId] || {
          active: false,
          favorite: false,
          lastFedAt: null,
          activeDays: 0,
          lastHarvestedAt: null,
          affection: 0
        };

        updatedCitizens.push({
          id: citizenId,
          name: `${cardDef.rarity} #${cardId} (${colorName})`,
          filename: `Mythic${cardId}${colorName}.png`,
          type: getMythicType(cardId),
          greetings: [
            "Shimmering with magic!",
            "I wield ancient card powers.",
            "Rare to meet you here!"
          ],
          scale: 0.95,
          isMythic: true,
          cardId,
          variantId,
          rarity: cardDef.rarity,
          variantLabel: variantLabel(cardId, variantId),
          ...state
        });
      });

      let totalOfflineGold = 0;
      const offlineItems: Record<string, { quantity: number; name: string; emoji: string }> = {};
      let hadOfflineGathering = false;
      const nowMs = Date.now();

      if (!isSleepy) {
         updatedCitizens.forEach(citizen => {
            if (citizen.active && isHarvestReady(citizen) && citizen.lastHarvestedAt) {
               const baseGold = citizen.isMythic
                 ? Math.floor(Math.random() * 36) + 40
                 : Math.floor(Math.random() * 11) + 15;
               
               totalOfflineGold += baseGold;
               
               const drop = generateGatherDrop(citizen);
               if (drop) {
                 if (offlineItems[drop.id]) {
                   offlineItems[drop.id].quantity += drop.quantity;
                 } else {
                   offlineItems[drop.id] = drop;
                 }
               }
               
               citizen.lastHarvestedAt = new Date().toISOString();
               hadOfflineGathering = true;
            }
         });
      }

      let offlineCatchup = null;
      if (hadOfflineGathering) {
         const citizenPrefs: Record<string, CitizenState> = {};
         updatedCitizens.forEach((c) => {
           citizenPrefs[c.id] = {
             active: c.active,
             favorite: c.favorite,
             lastFedAt: c.lastFedAt,
             activeDays: c.activeDays,
             lastHarvestedAt: c.lastHarvestedAt,
             affection: c.affection || 0,
           };
         });
         setUserPreference('citizens_state', citizenPrefs).catch(console.error);

         if (totalOfflineGold > 0) gainGold(totalOfflineGold, 'offline-catchup').catch(console.error);
         Object.values(offlineItems).forEach(item => {
           addToInventory(userId, item as any).catch(console.error);
         });

         offlineCatchup = {
           gold: totalOfflineGold,
           items: offlineItems
         };
      }

      set({ citizens: updatedCitizens, isSleepy, offlineCatchup, loading: false });
    } catch (error: any) {
      console.error('Failed to load citizens:', error);
      set({ error: error.message || 'Failed to load citizens', loading: false });
    }
  },

  toggleActive: async (userId: string, citizenId: string) => {
    const { citizens } = get();
    const updated = citizens.map((c) =>
      c.id === citizenId ? { ...c, active: !c.active } : c
    );

    // Save preferences
    const citizenPrefs: Record<string, CitizenState> = {};
    updated.forEach((c) => {
      citizenPrefs[c.id] = {
        active: c.active,
        favorite: c.favorite,
        lastFedAt: c.lastFedAt,
        activeDays: c.activeDays,
        lastHarvestedAt: c.lastHarvestedAt,
        affection: c.affection || 0,
      };
    });

    set({ citizens: updated });
    await setUserPreference('citizens_state', citizenPrefs);
  },

  toggleFavorite: async (userId: string, citizenId: string) => {
    const { citizens } = get();
    const updated = citizens.map((c) =>
      c.id === citizenId ? { ...c, favorite: !c.favorite } : c
    );

    // Save preferences
    const citizenPrefs: Record<string, CitizenState> = {};
    updated.forEach((c) => {
      citizenPrefs[c.id] = {
        active: c.active,
        favorite: c.favorite,
        lastFedAt: c.lastFedAt,
        activeDays: c.activeDays,
        lastHarvestedAt: c.lastHarvestedAt,
        affection: c.affection || 0,
      };
    });

    set({ citizens: updated });
    await setUserPreference('citizens_state', citizenPrefs);
  },

  bulkToggleFavorite: async (userId: string, citizenIds: string[], value: boolean) => {
    const { citizens } = get();
    const idSet = new Set(citizenIds);
    const updated = citizens.map((c) =>
      idSet.has(c.id) ? { ...c, favorite: value } : c
    );

    // Build and write prefs in a single operation — no race condition
    const citizenPrefs: Record<string, CitizenState> = {};
    updated.forEach((c) => {
      citizenPrefs[c.id] = {
        active: c.active,
        favorite: c.favorite,
        lastFedAt: c.lastFedAt,
        activeDays: c.activeDays,
        lastHarvestedAt: c.lastHarvestedAt,
        affection: c.affection || 0,
      };
    });

    set({ citizens: updated });
    await setUserPreference('citizens_state', citizenPrefs);
  },

  feedCitizen: async (userId: string, citizenId: string, foodItemId: string) => {
    const { citizens } = get();
    const citizen = citizens.find((c) => c.id === citizenId);
    if (!citizen) return false;

    let hasFood = false;
    const isTileInventory = foodItemId.startsWith('material-');

    if (isTileInventory) {
      const tileInv = await loadTileInventory(userId);
      const dbKey = foodItemId === 'material-water' ? 'water' : foodItemId;
      const item = tileInv[dbKey];
      if (item && item.quantity > 0) {
        hasFood = true;
        item.quantity -= 1;
        await saveTileInventory(userId, tileInv);
      }
    } else {
      const inventory = await getInventory(userId);
      const invItem = inventory.find((i) => i.id === foodItemId && i.quantity > 0);
      if (invItem) {
        hasFood = true;
        await removeFromInventory(userId, foodItemId, 1);
      }
    }

    if (!hasFood) return false;

    // Update state
    const daysToAdd = FOOD_DAYS_MAP[foodItemId] || 1;
    const now = new Date().toISOString();

    const updated = citizens.map((c) => {
      if (c.id === citizenId) {
        return {
          ...c,
          lastFedAt: now,
          activeDays: daysToAdd,
        };
      }
      return c;
    });

    const citizenPrefs: Record<string, CitizenState> = {};
    updated.forEach((c) => {
      citizenPrefs[c.id] = {
        active: c.active,
        favorite: c.favorite,
        lastFedAt: c.lastFedAt,
        activeDays: c.activeDays,
        lastHarvestedAt: c.lastHarvestedAt,
        affection: c.affection || 0,
      };
    });

    set({ citizens: updated });
    await setUserPreference('citizens_state', citizenPrefs);
    return true;
  },

  harvestCitizen: async (userId: string, citizenId: string, multiplier?: number) => {
    const { citizens, isSleepy } = get();
    if (isSleepy) return false; // Prevent harvesting if citizens are sleepy

    const citizen = citizens.find((c) => c.id === citizenId);
    if (!citizen) return false;

    // Calculate reward
    const isMythic = citizen.isMythic;
    const baseGold = isMythic
      ? Math.floor(Math.random() * 36) + 40 // 40-75 gold
      : Math.floor(Math.random() * 11) + 15; // 15-25 gold

    const goldAmount = Math.floor(baseGold * (multiplier || 1));

    // Award gold
    await gainGold(goldAmount, `citizen-collect:${citizen.name}`);

    // Biome-Specific Passive Gathering
    const drop = generateGatherDrop(citizen);
    if (drop) {
      await addToInventory(userId, drop as any);
      
      // We don't have a reliable way to show an individual toast here if the UI doesn't know what was gathered,
      // but the old code also just dispatched an event.
      window.dispatchEvent(new CustomEvent('inventory-updated', { detail: { itemId: drop.id } }));
    }

    // Update harvest date
    const now = new Date().toISOString();
    const updated = citizens.map((c) => {
      if (c.id === citizenId) {
        return {
          ...c,
          lastHarvestedAt: now,
        };
      }
      return c;
    });

    const citizenPrefs: Record<string, CitizenState> = {};
    updated.forEach((c) => {
      citizenPrefs[c.id] = {
        active: c.active,
        favorite: c.favorite,
        lastFedAt: c.lastFedAt,
        activeDays: c.activeDays,
        lastHarvestedAt: c.lastHarvestedAt,
        affection: c.affection || 0,
      };
    });

    set({ citizens: updated });
    await setUserPreference('citizens_state', citizenPrefs);
    return true;
  },

  increaseAffection: async (userId: string, citizenId: string, amount: number) => {
    if (!userId || !citizenId) return;
    const { citizens } = get();
    const citizen = citizens.find(c => c.id === citizenId);
    if (!citizen) return;

    const newAffection = Math.min(100, (citizen.affection || 0) + amount);
    
    // Optimistic update
    set(state => ({
      citizens: state.citizens.map(c => 
        c.id === citizenId ? { ...c, affection: newAffection } : c
      )
    }));

    // Update backend
    const citizenState: CitizenState = {
      active: citizen.active,
      favorite: citizen.favorite,
      lastFedAt: citizen.lastFedAt,
      activeDays: citizen.activeDays,
      lastHarvestedAt: citizen.lastHarvestedAt,
      affection: newAffection
    };

    const currentPrefs = await getUserPreference('citizens_state') || {};
    await setUserPreference('citizens_state', { ...currentPrefs, [citizen.id]: citizenState });
  },

  decreaseAffection: async (userId: string, citizenId: string, amount: number) => {
    if (!userId || !citizenId) return;
    const { citizens } = get();
    const citizen = citizens.find(c => c.id === citizenId);
    if (!citizen) return;

    const newAffection = Math.max(0, (citizen.affection || 0) - amount);
    
    // Optimistic update
    set(state => ({
      citizens: state.citizens.map(c => 
        c.id === citizenId ? { ...c, affection: newAffection } : c
      )
    }));

    // Update backend
    const citizenState: CitizenState = {
      active: citizen.active,
      favorite: citizen.favorite,
      lastFedAt: citizen.lastFedAt,
      activeDays: citizen.activeDays,
      lastHarvestedAt: citizen.lastHarvestedAt,
      affection: newAffection
    };

    const currentPrefs = await getUserPreference('citizens_state') || {};
    await setUserPreference('citizens_state', { ...currentPrefs, [citizen.id]: citizenState });
  }
}));

// Helper to determine if a citizen is currently hungry
export function isCitizenHungry(citizen: { lastFedAt: string | null; activeDays: number; favorite: boolean }): boolean {
  if (!citizen.lastFedAt) return true;
  const fedTime = new Date(citizen.lastFedAt).getTime();
  const durationMs = citizen.activeDays * 24 * 60 * 60 * 1000;
  return Date.now() > fedTime + durationMs;
}

// Helper to determine if reward collection is available (24h cooldown)
export function isHarvestReady(citizen: { lastHarvestedAt: string | null; lastFedAt: string | null; activeDays: number; favorite: boolean }): boolean {
  // Must not be hungry
  if (isCitizenHungry(citizen)) return false;
  if (!citizen.lastHarvestedAt) return true;

  const lastHarvest = new Date(citizen.lastHarvestedAt).getTime();
  const cooldownMs = 24 * 60 * 60 * 1000; // 24 hours
  return Date.now() > lastHarvest + cooldownMs;
}
