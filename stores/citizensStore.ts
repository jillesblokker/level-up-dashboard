import { create } from 'zustand';
import { CREATURE_DEFINITIONS, CreatureDefinition } from '@/lib/creature-mapping';
import { getUserPreference, setUserPreference } from '@/lib/user-preferences-manager';
import { CARD_TYPES, variantLabel, getMythicName } from '@/lib/pack-generator';
import { getInventory, removeFromInventory, addToInventory } from '@/lib/inventory-manager';
import { gainGold } from '@/lib/gold-manager';
import { loadTileInventory, saveTileInventory } from '@/lib/data-loaders';
import { getClerkToken } from '@/lib/auth-helpers';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

export interface CitizenState {
  active: boolean;
  favorite: boolean;
  lastFedAt: string | null; // ISO String
  activeDays: number; // Duration in days (e.g. 1, 3, 7)
  lastHarvestedAt: string | null; // ISO String
  affection: number;
  level?: number;
  experience?: number;
  lockedReason?: 'expedition' | null;
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
  level: number;
  experience: number;
  lockedReason?: 'expedition' | null;
}

interface CitizensStore {
  citizens: Citizen[];
  combatSupporters: string[]; // Active combat supporters (max 2)
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
  trainCitizen: (userId: string, citizenId: string, foodItemId: string, scrollItemId: string, foodQty?: number, scrollQty?: number) => Promise<{ success: boolean; error?: string; leveledUp?: boolean }>;
  addCitizenExp: (userId: string, citizenId: string, amount: number) => Promise<{ success: boolean; newLevel: number; leveledUp: boolean }>;
  toggleSupporter: (userId: string, citizenId: string) => Promise<void>;
  boostActiveCitizensNourishment: (userId: string, hoursToAdd?: number) => Promise<void>;
  triggerAutopilotHarvest: (userId: string, activePartnerId: string | undefined) => Promise<{ gold: number; items: Record<string, { quantity: number; name: string; emoji: string }>; partnerName: string; count: number } | null>;
  mergeDuplicateCitizens: (userId: string) => Promise<{ success: boolean; count: number; mergedNames: string[] }>;
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

function calculateDecayedAffection(savedAffection: number, lastFedAt: string | null, activeDays: number): number {
  if (!lastFedAt) return 0;
  const fedTime = new Date(lastFedAt).getTime();
  const durationMs = activeDays * 24 * 60 * 60 * 1000;
  const hungryDurationMs = Math.max(0, Date.now() - (fedTime + durationMs));
  const hungryDays = Math.floor(hungryDurationMs / (24 * 60 * 60 * 1000));
  if (hungryDays > 0) {
    return Math.max(0, savedAffection - hungryDays * 2);
  }
  return savedAffection;
}

function generateGatherDrop(citizen: Citizen): { id: string; name: string; description: string; type: 'consumable'|'material'; emoji: string; image: string; quantity: number } | null {
  const affection = citizen.affection || 0;
  const dropChance = 0.20 + (affection / 100) * 0.20; // 20% to 40% chance based on affection
  if (Math.random() >= dropChance) return null;
  let gatheredItem = 'food-red';
  let gatheredName = 'Red Fish';
  let gatheredDesc = 'A red fish';
  let gatheredType: 'consumable' | 'material' = 'consumable';
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
  'fish-red': 1,
  'food-red-starter': 1,
  'fish-blue': 3,
  'fish-silver': 3,
  'fish-golden': 7,
  'fish-rainbow': 7,
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
  combatSupporters: [],
  loading: false,
  error: null,
  isSleepy: false,
  offlineCatchup: null,
  clearOfflineCatchup: () => set({ offlineCatchup: null }),

  loadCitizens: async (userId: string) => {
    if (!userId) return;
    set({ loading: true, error: null });

    try {
      const token = await getClerkToken().catch(() => null);
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      // Parallel fetches for achievements, mythic cards, citizen preferences, hidden IDs, merged levels, and character stats (for sleepy check)
      const [achievementsRes, mythicsRes, prefState, hiddenIdsState, mergedLevelsState, charStatsRes, supportersState] = await Promise.all([
        fetch('/api/achievements', { headers }).catch(() => null),
        fetch('/api/packs/mythics', { headers }).catch(() => null),
        getUserPreference('citizens_state') as Promise<Record<string, CitizenState> | null>,
        getUserPreference('citizens_hidden_ids') as Promise<string[] | null>,
        getUserPreference('citizens_merged_levels') as Promise<Record<string, number> | null>,
        fetch('/api/character-stats', { headers }).catch(() => null),
        getUserPreference('combat_supporters') as Promise<string[] | null>
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
      const combatSupporters = Array.isArray(supportersState) ? supportersState : [];
      const hiddenIdsSet = new Set<string>(Array.isArray(hiddenIdsState) ? hiddenIdsState : []);
      const mergedLevels = mergedLevelsState || {};

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

      // Build raw citizens list
      const rawCitizens: Citizen[] = [];

      // Add unlocked achievement creatures
      Object.keys(CREATURE_DEFINITIONS).forEach((id) => {
        if (id.startsWith('9')) return; // Exclude animal companions
        if (unlockedAchievementIds.has(id)) {
          const def = CREATURE_DEFINITIONS[id]!;
          const rawState: CitizenState = savedPrefs[id] || {
            active: false,
            favorite: false,
            lastFedAt: null,
            activeDays: 0,
            lastHarvestedAt: null,
            affection: 0,
            level: 1,
            experience: 0
          };
          const state = {
            ...rawState,
            affection: calculateDecayedAffection(rawState.affection || 0, rawState.lastFedAt, rawState.activeDays),
            level: rawState.level || 1,
            experience: rawState.experience || 0
          };

          rawCitizens.push({
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

      // Add unlocked mythic cards with unique instance IDs
      unlockedMythics.forEach((m: any, idx: number) => {
        const cardId = parseInt(m.card_id);
        const variantId = parseInt(m.variant_id);
        const cardDef = CARD_TYPES.find((c) => c.number === cardId);
        if (!cardDef) return;

        const colorNames = ['red', 'green', 'blue', 'white', 'black'];
        const colorName = colorNames[variantId] || 'red';
        const citizenId = m.id ? `mythic-${m.id}` : `mythic-${cardId}-${variantId}-${idx}`;
        const rawState: CitizenState = savedPrefs[citizenId] || savedPrefs[`mythic-${cardId}-${variantId}`] || {
          active: false,
          favorite: false,
          lastFedAt: null,
          activeDays: 0,
          lastHarvestedAt: null,
          affection: 0,
          level: 1,
          experience: 0
        };
        const state = {
          ...rawState,
          affection: calculateDecayedAffection(rawState.affection || 0, rawState.lastFedAt, rawState.activeDays),
          level: rawState.level || 1,
          experience: rawState.experience || 0
        };

        rawCitizens.push({
          id: citizenId,
          name: getMythicName(cardId, variantId),
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

      // Group citizens by species key and apply merged levels / hidden filters
      const groupedBySpecies: Record<string, Citizen[]> = {};
      rawCitizens.forEach(c => {
        const speciesKey = (c.filename || c.name).toLowerCase();
        if (!groupedBySpecies[speciesKey]) groupedBySpecies[speciesKey] = [];
        groupedBySpecies[speciesKey].push(c);
      });

      const updatedCitizens: Citizen[] = [];

      for (const [speciesKey, group] of Object.entries(groupedBySpecies)) {
        const unhiddenGroup = group.filter(c => !hiddenIdsSet.has(c.id));
        const isSpeciesMerged = mergedLevels[speciesKey] !== undefined || (group.length > 1 && unhiddenGroup.length < group.length);

        if (isSpeciesMerged) {
          const targetGroup = unhiddenGroup.length > 0 ? unhiddenGroup : group;
          const primary = [...targetGroup].sort((a, b) => (b.active ? 100 : 0) + (b.level || 1) - ((a.active ? 100 : 0) + (a.level || 1)))[0]!;
          const rawTotalLevel = mergedLevels[speciesKey] || group.reduce((sum, c) => sum + (c.level || 1), 0);
          const totalLevel = Math.min(100, Math.max(1, rawTotalLevel));
          const totalExp = group.reduce((sum, c) => sum + (c.experience || 0), 0);
          const maxAffection = Math.max(...group.map(c => c.affection || 0));

          updatedCitizens.push({
            ...primary,
            level: totalLevel,
            experience: totalExp,
            affection: maxAffection
          });
        } else {
          unhiddenGroup.forEach(c => updatedCitizens.push(c));
        }
      }

      let totalOfflineGold = 0;
      const offlineItems: Record<string, { quantity: number; name: string; emoji: string }> = {};
      let hadOfflineGathering = false;

      if (!isSleepy) {
         updatedCitizens.forEach(citizen => {
            if (citizen.active && isHarvestReady(citizen) && citizen.lastHarvestedAt) {
               const baseGold = citizen.isMythic
                 ? Math.floor(Math.random() * 36) + 40
                 : Math.floor(Math.random() * 11) + 15;
               
               totalOfflineGold += baseGold;
               
               const drop = generateGatherDrop(citizen);
               if (drop) {
                 const existingItem = offlineItems[drop.id];
                 if (existingItem) {
                   existingItem.quantity += drop.quantity;
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
              level: c.level || 1,
              experience: c.experience || 0,
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

      set({ citizens: updatedCitizens, combatSupporters, isSleepy, offlineCatchup, loading: false });
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
        level: c.level || 1,
        experience: c.experience || 0,
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
        level: c.level || 1,
        experience: c.experience || 0,
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
        level: c.level || 1,
        experience: c.experience || 0,
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
      const itemKey = tileInv[dbKey] ? dbKey : (tileInv[foodItemId] ? foodItemId : null);
      if (itemKey && tileInv[itemKey] && tileInv[itemKey].quantity > 0) {
        hasFood = true;
        tileInv[itemKey].quantity -= 1;
        if (tileInv[itemKey].quantity <= 0) {
          delete tileInv[itemKey];
          delete tileInv[dbKey];
          delete tileInv[foodItemId];
        }
        await saveTileInventory(userId, tileInv);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('character-inventory-update'));
        }
      }
    } else {
      const inventory = await getInventory(userId);
      const invItem = inventory.find((i) => i.id === foodItemId && i.quantity > 0);
      if (invItem) {
        hasFood = true;
        await removeFromInventory(userId, foodItemId, 1);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('character-inventory-update'));
        }
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
        level: c.level || 1,
        experience: c.experience || 0,
      };
    });

    set({ citizens: updated });
    await setUserPreference('citizens_state', citizenPrefs);

    // Trigger random encounter check for feed
    try {
      const { checkAndTriggerEncounter } = await import('@/lib/encounter-trigger-service');
      checkAndTriggerEncounter('feed');
    } catch (e) {
      console.warn('Feed encounter check error:', e);
    }

    return true;
  },

  boostActiveCitizensNourishment: async (userId: string, hoursToAdd: number = 4) => {
    const { citizens } = get();
    if (!citizens || citizens.length === 0) return;

    const now = new Date().toISOString();
    const updated = citizens.map((c) => {
      if (c.active) {
        return {
          ...c,
          lastFedAt: now,
          activeDays: Math.min((c.activeDays || 1) + 1, 7),
          affection: Math.min((c.affection || 0) + 1, 100),
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
        level: c.level || 1,
        experience: c.experience || 0,
      };
    });

    set({ citizens: updated });
    await setUserPreference('citizens_state', citizenPrefs);
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

    const affection = citizen.affection || 0;
    const affectionScale = 1.0 + (affection / 100) * 0.5; // up to +50% gold

    // Check active alchemy buffs for Double Harvest Draught
    let doubleHarvestActive = false;
    try {
      const activeBuffs = await getUserPreference('active_alchemy_buffs') as any || {};
      if (activeBuffs.doubleHarvestUntil && new Date(activeBuffs.doubleHarvestUntil).getTime() > Date.now()) {
        doubleHarvestActive = true;
      }
    } catch (e) {
      console.error('[Citizens Store] Failed to check double harvest buff:', e);
    }

    const harvestMultiplier = doubleHarvestActive ? 2 : 1;
    const goldAmount = Math.floor(baseGold * affectionScale * (multiplier || 1) * harvestMultiplier);

    // Award gold
    await gainGold(goldAmount, `citizen-collect:${citizen.name}`);

    // Biome-Specific Passive Gathering
    const drop = generateGatherDrop(citizen);
    if (drop) {
      const finalQuantity = drop.quantity * harvestMultiplier;
      await addToInventory(userId, { ...drop, quantity: finalQuantity } as any);
      
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
        level: c.level || 1,
        experience: c.experience || 0,
      };
    });

    set({ citizens: updated });
    await setUserPreference('citizens_state', citizenPrefs);

    // Trigger random encounter check for harvest
    try {
      const { checkAndTriggerEncounter } = await import('@/lib/encounter-trigger-service');
      checkAndTriggerEncounter('harvest');
    } catch (e) {
      console.warn('Harvest encounter check error:', e);
    }

    return true;
  },

  triggerAutopilotHarvest: async (userId: string, activePartnerId: string | undefined) => {
    const { citizens, isSleepy } = get();
    if (isSleepy || !activePartnerId) return null;

    const partner = citizens.find((c) => c.id === activePartnerId);
    if (!partner || isCitizenHungry(partner)) return null;

    const harvestable = citizens.filter((c) => c.active && isHarvestReady(c));
    if (harvestable.length === 0) return null;

    let doubleHarvestActive = false;
    try {
      const activeBuffs = await getUserPreference('active_alchemy_buffs') as any || {};
      if (activeBuffs.doubleHarvestUntil && new Date(activeBuffs.doubleHarvestUntil).getTime() > Date.now()) {
        doubleHarvestActive = true;
      }
    } catch (e) {
      console.error('[Citizens Store] Failed to check double harvest buff in autopilot:', e);
    }

    const harvestMultiplier = doubleHarvestActive ? 2 : 1;
    let totalGoldCollected = 0;
    const itemsCollected: Record<string, { quantity: number; name: string; emoji: string }> = {};

    for (const citizen of harvestable) {
      const isMythic = citizen.isMythic;
      const baseGold = isMythic
        ? Math.floor(Math.random() * 36) + 40
        : Math.floor(Math.random() * 11) + 15;
      
      const affection = citizen.affection || 0;
      const affectionScale = 1.0 + (affection / 100) * 0.5; // up to +50% gold
      const goldAmount = Math.floor(baseGold * affectionScale * harvestMultiplier);
      totalGoldCollected += goldAmount;

      await gainGold(goldAmount, `autopilot-collect:${citizen.name}`);

      const drop = generateGatherDrop(citizen);
      if (drop) {
        const finalQuantity = drop.quantity * harvestMultiplier;
        await addToInventory(userId, { ...drop, quantity: finalQuantity } as any);
        const existing = itemsCollected[drop.id];
        if (existing) {
          existing.quantity += finalQuantity;
        } else {
          itemsCollected[drop.id] = { quantity: finalQuantity, name: drop.name, emoji: drop.emoji };
        }
      }
    }

    const now = new Date().toISOString();
    const updated = citizens.map((c) => {
      if (c.active && isHarvestReady(c)) {
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
        level: c.level || 1,
        experience: c.experience || 0,
      };
    });

    set({ citizens: updated });
    await setUserPreference('citizens_state', citizenPrefs);

    window.dispatchEvent(new Event('character-inventory-update'));
    window.dispatchEvent(new Event('character-stats-update'));

    return {
      gold: totalGoldCollected,
      items: itemsCollected,
      partnerName: partner.name,
      count: harvestable.length
    };
  },

  addCitizenExp: async (userId: string, citizenId: string, amount: number) => {
    if (!userId || !citizenId || amount <= 0) return { success: false, newLevel: 1, leveledUp: false };
    const { citizens } = get();
    const citizen = citizens.find(c => c.id === citizenId);
    if (!citizen) return { success: false, newLevel: 1, leveledUp: false };

    const currentLvl = citizen.level || 1;
    const currentExp = citizen.experience || 0;
    const totalExp = currentExp + amount;

    // 100 EXP required per level
    const expPerLevel = 100;
    const newLvl = Math.min(100, Math.max(1, currentLvl + Math.floor(totalExp / expPerLevel)));
    const remainderExp = totalExp % expPerLevel;
    const leveledUp = newLvl > currentLvl;

    const updated = citizens.map(c => {
      if (c.id === citizenId) {
        return {
          ...c,
          level: newLvl,
          experience: remainderExp
        };
      }
      return c;
    });

    const citizenPrefs: Record<string, CitizenState> = {};
    updated.forEach(c => {
      citizenPrefs[c.id] = {
        active: c.active,
        favorite: c.favorite,
        lastFedAt: c.lastFedAt,
        activeDays: c.activeDays,
        lastHarvestedAt: c.lastHarvestedAt,
        affection: c.affection || 0,
        level: c.level || 1,
        experience: c.experience || 0
      };
    });

    set({ citizens: updated });
    await setUserPreference('citizens_state', citizenPrefs);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('character-stats-update'));
    }

    return { success: true, newLevel: newLvl, leveledUp };
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
  },

  trainCitizen: async (userId: string, citizenId: string, foodItemId: string, scrollItemId: string, foodQty: number = 1, scrollQty: number = 1) => {
    if (!userId || !citizenId) return { success: false, error: 'User or Citizen ID missing' };
    const { citizens } = get();
    const citizen = citizens.find(c => c.id === citizenId);
    if (!citizen) return { success: false, error: 'Citizen not found' };
    if (citizen.lockedReason) return { success: false, error: 'Citizen is currently away on an airship expedition' };

    const level = citizen.level || 1;
    if (level >= 100) return { success: false, error: 'Maximum level (+100) reached' };

    const goldCost = Math.min(500, 50 * level);

    // Check stats & gold
    try {
      const statsRes = await fetchWithAuth('/api/character-stats');
      if (!statsRes.ok) return { success: false, error: 'Failed to retrieve stats' };
      const stats = await statsRes.json();
      if (stats.gold < goldCost) return { success: false, error: 'Not enough gold' };

      // Check materials
      const inventory = await getInventory(userId);
      const foodMat = inventory.find(i => i.id === foodItemId);
      const scrollMat = inventory.find(i => i.id === scrollItemId);

      if (!foodMat || foodMat.quantity < foodQty) {
        return { success: false, error: `Not enough food (need ${foodQty})` };
      }
      if (!scrollMat || scrollMat.quantity < scrollQty) {
        return { success: false, error: `Not enough scrolls (need ${scrollQty})` };
      }

      // Deduct gold & resources
      await gainGold(-goldCost, 'barracks-training');
      await removeFromInventory(userId, foodItemId, foodQty);
      await removeFromInventory(userId, scrollItemId, scrollQty);

      // Check City Guild Blessing for Double Citizen Training XP
      let xpMultiplier = 1;
      try {
        const allDistricts: any = await getUserPreference('habit_focus_districts') || {};
        Object.keys(allDistricts).forEach(key => {
          const dist = allDistricts[key];
          if (dist && dist.locationType === 'city' && dist.guildBlessingUntil) {
            if (new Date(dist.guildBlessingUntil).getTime() > Date.now()) {
              xpMultiplier = 2;
            }
          }
        });
      } catch {}

      // Add experience
      let newXP = (citizen.experience || 0) + (50 * xpMultiplier);
      let newLevel = level;
      let leveledUp = false;
      const xpReq = level * 100;

      if (newXP >= xpReq) {
        newXP = newXP - xpReq;
        newLevel = Math.min(100, level + 1);
        leveledUp = true;
      }

      const citizenState: CitizenState = {
        active: citizen.active,
        favorite: citizen.favorite,
        lastFedAt: citizen.lastFedAt,
        activeDays: citizen.activeDays,
        lastHarvestedAt: citizen.lastHarvestedAt,
        affection: citizen.affection || 0,
        level: newLevel,
        experience: newXP
      };

      const currentPrefs = await getUserPreference('citizens_state') || {};
      await setUserPreference('citizens_state', { ...currentPrefs, [citizen.id]: citizenState });

      // Update store state
      set(state => ({
        citizens: state.citizens.map(c => 
          c.id === citizenId ? { ...c, level: newLevel, experience: newXP } : c
        )
      }));

      // Trigger inventory update
      window.dispatchEvent(new Event('character-inventory-update'));

      return { success: true, leveledUp };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error training citizen' };
    }
  },

  toggleSupporter: async (userId: string, citizenId: string) => {
    if (!userId || !citizenId) return;
    const { combatSupporters, citizens } = get();
    const citizen = citizens.find(c => c.id === citizenId);
    if (citizen?.lockedReason) return;
 
    let newSupporters = [...combatSupporters];
    if (newSupporters.includes(citizenId)) {
      newSupporters = newSupporters.filter(id => id !== citizenId);
    } else {
      if (newSupporters.length >= 2) {
        newSupporters.shift(); // Remove oldest
      }
      newSupporters.push(citizenId);
    }

    await setUserPreference('combat_supporters', newSupporters);
    set({ combatSupporters: newSupporters });
  },

  mergeDuplicateCitizens: async (userId: string) => {
    const { citizens } = get();
    const grouped: Record<string, Citizen[]> = {};

    citizens.forEach(c => {
      const key = c.filename?.toLowerCase() || c.name?.toLowerCase() || c.id;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(c);
    });

    const mergedList: Citizen[] = [];
    const mergedNamesSet = new Set<string>();
    let totalMergedCount = 0;
    const citizenPrefs: Record<string, CitizenState> = {};
    const hiddenIds = new Set<string>(await getUserPreference('citizens_hidden_ids') as string[] || []);

    for (const group of Object.values(grouped)) {
      if (group.length > 1) {
        totalMergedCount += (group.length - 1);
        mergedNamesSet.add(group[0]!.name);

        // Sort: active ones or highest level first
        const primary = [...group].sort((a, b) => (b.active ? 100 : 0) + (b.level || 1) - ((a.active ? 100 : 0) + (a.level || 1)))[0]!;
        const combinedLevel = Math.min(100, Math.max(1, group.reduce((sum, c) => sum + (c.level || 1), 0)));
        const combinedExp = group.reduce((sum, c) => sum + (c.experience || 0), 0);
        const maxAffection = Math.max(...group.map(c => c.affection || 0));

        const updatedPrimary: Citizen = {
          ...primary,
          level: combinedLevel,
          experience: combinedExp,
          affection: maxAffection
        };

        mergedList.push(updatedPrimary);

        group.forEach(c => {
          if (c.id !== primary.id) {
            hiddenIds.add(c.id);
          }
        });

        citizenPrefs[primary.id] = {
          active: updatedPrimary.active,
          favorite: updatedPrimary.favorite,
          lastFedAt: updatedPrimary.lastFedAt,
          activeDays: updatedPrimary.activeDays,
          lastHarvestedAt: updatedPrimary.lastHarvestedAt,
          affection: updatedPrimary.affection,
          level: updatedPrimary.level,
          experience: updatedPrimary.experience
        };
      } else {
        const c = group[0]!;
        mergedList.push(c);
        citizenPrefs[c.id] = {
          active: c.active,
          favorite: c.favorite,
          lastFedAt: c.lastFedAt,
          activeDays: c.activeDays,
          lastHarvestedAt: c.lastHarvestedAt,
          affection: c.affection || 0,
          level: c.level || 1,
          experience: c.experience || 0
        };
      }
    }

    await setUserPreference('citizens_state', citizenPrefs);
    await setUserPreference('citizens_hidden_ids', Array.from(hiddenIds));

    set({ citizens: mergedList });
    return {
      success: true,
      count: totalMergedCount,
      mergedNames: Array.from(mergedNamesSet)
    };
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
