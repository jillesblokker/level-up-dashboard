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
}

interface CitizensStore {
  citizens: Citizen[];
  loading: boolean;
  error: string | null;
  loadCitizens: (userId: string) => Promise<void>;
  toggleActive: (userId: string, citizenId: string) => Promise<void>;
  toggleFavorite: (userId: string, citizenId: string) => Promise<void>;
  feedCitizen: (userId: string, citizenId: string, foodItemId: string) => Promise<boolean>;
  harvestCitizen: (userId: string, citizenId: string) => Promise<boolean>;
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

  loadCitizens: async (userId: string) => {
    if (!userId) return;
    set({ loading: true, error: null });

    try {
      // Parallel fetches for achievements, mythic cards, and citizen preferences
      const [achievementsRes, mythicsRes, prefState] = await Promise.all([
        fetch('/api/achievements').catch(() => null),
        fetch('/api/packs/mythics').catch(() => null),
        getUserPreference('citizens_state') as Promise<Record<string, CitizenState> | null>
      ]);

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
          const state = savedPrefs[id] || {
            active: false,
            favorite: false,
            lastFedAt: null,
            activeDays: 0,
            lastHarvestedAt: null
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
        const state = savedPrefs[citizenId] || {
          active: false,
          favorite: false,
          lastFedAt: null,
          activeDays: 0,
          lastHarvestedAt: null
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

      set({ citizens: updatedCitizens, loading: false });
    } catch (err: any) {
      console.error('Failed to load citizens:', err);
      set({ error: err.message || 'Failed to load citizens', loading: false });
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
      const item = tileInv[foodItemId];
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
      };
    });

    set({ citizens: updated });
    await setUserPreference('citizens_state', citizenPrefs);
    return true;
  },

  harvestCitizen: async (userId: string, citizenId: string) => {
    const { citizens } = get();
    const citizen = citizens.find((c) => c.id === citizenId);
    if (!citizen) return false;

    // Calculate reward
    const isMythic = citizen.isMythic;
    const goldAmount = isMythic
      ? Math.floor(Math.random() * 36) + 40 // 40-75 gold
      : Math.floor(Math.random() * 11) + 15; // 15-25 gold

    // Award gold
    await gainGold(goldAmount, `citizen-collect:${citizen.name}`);

    // Random extra material/food (20% chance)
    if (Math.random() < 0.20) {
      const extraItems = ['material-logs', 'food-red'];
      const randomItem = extraItems[Math.floor(Math.random() * extraItems.length)]!;
      await addToInventory(userId, {
        id: randomItem,
        name: randomItem === 'material-logs' ? 'Wooden Logs' : 'Red Fish',
        description: randomItem === 'material-logs' ? 'Basic building material' : 'A red fish',
        type: randomItem === 'material-logs' ? 'material' : 'food',
        quantity: 1,
        image: randomItem === 'material-logs' ? '/images/items/materials/material-logs.webp' : '/images/items/food/fish-red.webp',
        emoji: randomItem === 'material-logs' ? '🪵' : '🐟',
        rarity: 'common',
        isEquippable: false,
        isConsumable: true,
      });
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
      };
    });

    set({ citizens: updated });
    await setUserPreference('citizens_state', citizenPrefs);
    return true;
  },
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
