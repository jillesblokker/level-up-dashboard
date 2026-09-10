import { getUserPreference, setUserPreference } from './user-preferences-manager';

export interface RuneDefinition {
  id: string;
  symbol: string;
  name: string;
  phonetic: string;
  meaning: string;
  description: string;
  hint: string;
  placements: { id: string; label: string; page: string }[];
}

export const ALL_RUNES: RuneDefinition[] = [
  {
    id: 'raidho',
    symbol: 'ᚱ',
    name: 'Raidho',
    phonetic: '[r]',
    meaning: 'Journey, rhythm & momentum',
    description: 'The ancient Norse rune of the noble wagon, celestial rhythm, and purposeful travel. In Thrivehaven, it governs the disciplined momentum of your daily habits and long voyages.',
    hint: 'Seek where daily habits measure the unbroken rhythm of your journey.',
    placements: [
      { id: 'raidho_momentum', label: 'Daily momentum card', page: '/daily-hub' },
      { id: 'raidho_journey', label: 'Journey drawer tab', page: '/kingdom' },
    ],
  },
  {
    id: 'dagaz',
    symbol: 'ᛞ',
    name: 'Dagaz',
    phonetic: '[d]',
    meaning: 'Dawn, day & breakthrough',
    description: 'The rune of daylight, sudden clarity, and the fresh start of a new dawn. In Thrivehaven, it heralds each morning with a fresh batch of daily quests.',
    hint: 'Seek where each morning brings a fresh awakening of daily quests.',
    placements: [
      { id: 'dagaz_quests', label: 'Daily quests tab', page: '/quests' },
      { id: 'dagaz_momentum', label: 'Daily momentum legend', page: '/daily-hub' },
    ],
  },
  {
    id: 'gebo',
    symbol: 'ᚷ',
    name: 'Gebo',
    phonetic: '[g]',
    meaning: 'Gift, partnership & mutual honor',
    description: 'The gift that binds giver and receiver in equal honor. In Thrivehaven, it represents the sacred alliance between companions walking the path together.',
    hint: 'Seek where allies share vows of fellowship and mutual support.',
    placements: [
      { id: 'gebo_allies', label: 'My allies tab', page: '/social' },
    ],
  },
  {
    id: 'wunjo',
    symbol: 'ᚹ',
    name: 'Wunjo',
    phonetic: '[w]',
    meaning: 'Joy, fellowship & celebration',
    description: 'The rune of joyous culmination, shared delight, and inner peace. In Thrivehaven, it welcomes travelers to join the circle of companions.',
    hint: 'Seek where new companions are welcomed into your circle.',
    placements: [
      { id: 'wunjo_recruit', label: 'Recruit allies tab', page: '/social' },
    ],
  },
  {
    id: 'jera',
    symbol: 'ᛃ',
    name: 'Jera',
    phonetic: '[j]',
    meaning: 'Fruitful harvest & earned reward',
    description: 'The golden turn of the seasons when honest labor bears fruit. In Thrivehaven, it yields royal taxes from kingdom settlements and market trades.',
    hint: 'Seek where the royal treasury gathers the golden fruits of kingdom labor.',
    placements: [
      { id: 'jera_taxes', label: 'Collect taxes header button', page: '/kingdom' },
      { id: 'jera_sell', label: 'Sell resources tab', page: '/market' },
    ],
  },
  {
    id: 'othala',
    symbol: 'ᛟ',
    name: 'Othala',
    phonetic: '[o]',
    meaning: 'Domain, ancestral realm & sanctuary',
    description: 'The ancestral sanctuary, permanent domain, and sovereign realm. In Thrivehaven, it anchors your personal sandbox building grounds.',
    hint: 'Seek where the sovereign boundaries of your realm are shaped upon the grid.',
    placements: [
      { id: 'othala_realm', label: 'Realm grid drawer tab', page: '/kingdom' },
    ],
  },
  {
    id: 'mannaz',
    symbol: 'ᛗ',
    name: 'Mannaz',
    phonetic: '[m]',
    meaning: 'Humanity, community & potential',
    description: 'The spark of human intellect, cooperation, and social growth. In Thrivehaven, it empowers the loyal citizens who build and defend your towns.',
    hint: 'Seek where the townsfolk and citizens of the realm are gathered.',
    placements: [
      { id: 'mannaz_citizens', label: 'Citizens drawer tab', page: '/kingdom' },
    ],
  },
  {
    id: 'tiwaz',
    symbol: 'ᛏ',
    name: 'Tiwaz',
    phonetic: '[t]',
    meaning: 'Martial honor, justice & courage',
    description: 'The spear of Tyr, god of justice and single-handed sacrifice for the greater good. In Thrivehaven, it steels the barracks defenders and lifetime milestones.',
    hint: 'Seek where martial honor prepares the garrison and tests lifetime discipline.',
    placements: [
      { id: 'tiwaz_barracks', label: 'Barracks drawer tab', page: '/kingdom' },
      { id: 'tiwaz_milestones', label: 'Milestones tab', page: '/quests' },
    ],
  },
  {
    id: 'uruz',
    symbol: 'ᚢ',
    name: 'Uruz',
    phonetic: '[u]',
    meaning: 'Physical endurance & vital strength',
    description: 'The mighty wild aurochs, signifying physical resilience and raw vigor. In Thrivehaven, it pushes your stamina through weekly challenge trials.',
    hint: 'Seek where rigorous weekly trials test physical endurance.',
    placements: [
      { id: 'uruz_challenges', label: 'Weekly challenges tab', page: '/quests' },
    ],
  },
  {
    id: 'ansuz',
    symbol: 'ᚨ',
    name: 'Ansuz',
    phonetic: '[a]',
    meaning: 'Wisdom, contemplation & voice',
    description: 'The rune of Odin, divine inspiration, spoken truth, and contemplative insight. In Thrivehaven, it watches over citizen petitions and the Chronicle.',
    hint: 'Seek where wisdom is spoken in citizen petitions and tales of the realm.',
    placements: [
      { id: 'ansuz_petitions', label: 'Petitions tab', page: '/quests' },
      { id: 'ansuz_chronicle', label: 'Tales of the realm header', page: '/chronicle' },
    ],
  },
  {
    id: 'eihwaz',
    symbol: 'ᛇ',
    name: 'Eihwaz',
    phonetic: '[ei]',
    meaning: 'Resilience, endurance & protection',
    description: 'The sacred yew tree that bridges life and death, standing firm through storms. In Thrivehaven, it protects expeditions into the deepest Dungeon Keep.',
    hint: 'Seek where brave squads venture into deep subterranean chambers.',
    placements: [
      { id: 'eihwaz_dungeon', label: 'Dungeon Keep expedition header', page: '/dungeon' },
    ],
  },
  {
    id: 'fehu',
    symbol: 'ᚠ',
    name: 'Fehu',
    phonetic: '[f]',
    meaning: 'Wealth, prosperity & trade',
    description: 'The ancient measure of wealth, moving goods, and prosperity. In Thrivehaven, it fuels merchants buying materials at the Royal Exchange.',
    hint: 'Seek where merchants trade gold for raw building materials.',
    placements: [
      { id: 'fehu_buy', label: 'Buy materials tab', page: '/market' },
    ],
  },
  {
    id: 'perthro',
    symbol: 'ᛈ',
    name: 'Perthro',
    phonetic: '[p]',
    meaning: 'Mystery, fate & hidden chance',
    description: 'The cosmic cup of fate from which destiny is drawn. In Thrivehaven, it opens the Cards of Fate and mystery packs in the Mystic Bazaar.',
    hint: 'Seek where the cards of fate reveal mystical card packs and hidden fortune.',
    placements: [
      { id: 'perthro_mystic', label: 'Mystic bazaar tab', page: '/market' },
    ],
  },
];

const STORAGE_KEY = 'thrivehaven_collected_rune_placements';
export const RUNE_COLLECTED_EVENT = 'thrivehaven-rune-collected';

export function getCollectedPlacements(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isPlacementCollected(placementId: string): boolean {
  if (typeof window === 'undefined') return false;
  return getCollectedPlacements().includes(placementId);
}

export function getCollectedRuneIds(): string[] {
  const placements = getCollectedPlacements();
  const unlocked = new Set<string>();

  for (const rune of ALL_RUNES) {
    if (rune.placements.some((p) => placements.includes(p.id))) {
      unlocked.add(rune.id);
    }
  }

  return Array.from(unlocked);
}

export function isRuneUnlocked(runeId: string): boolean {
  return getCollectedRuneIds().includes(runeId);
}

export function hasCollectedAnyRune(): boolean {
  return getCollectedPlacements().length > 0;
}

export async function collectRune(placementId: string, runeId: string): Promise<{
  success: boolean;
  isFirstRune: boolean;
  isRuneNewlyUnlocked: boolean;
  totalCollectedPlacements: number;
  unlockedRunesCount: number;
  totalRunes: number;
  rune: RuneDefinition | undefined;
}> {
  if (typeof window === 'undefined') {
    return {
      success: false,
      isFirstRune: false,
      isRuneNewlyUnlocked: false,
      totalCollectedPlacements: 0,
      unlockedRunesCount: 0,
      totalRunes: ALL_RUNES.length,
      rune: ALL_RUNES.find((r) => r.id === runeId),
    };
  }

  const current = getCollectedPlacements();
  const wasEmpty = current.length === 0;
  const previouslyUnlockedRuneIds = getCollectedRuneIds();
  const isRuneNewlyUnlocked = !previouslyUnlockedRuneIds.includes(runeId);

  if (!current.includes(placementId)) {
    const updated = [...current, placementId];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    // Cloud sync
    setUserPreference(STORAGE_KEY, updated).catch(() => {});

    // Dispatch event for instant multi-component reactivity
    window.dispatchEvent(
      new CustomEvent(RUNE_COLLECTED_EVENT, {
        detail: { placementId, runeId, isFirstRune: wasEmpty },
      })
    );

    const runeDef = ALL_RUNES.find((r) => r.id === runeId);
    const newUnlockedCount = getCollectedRuneIds().length;

    return {
      success: true,
      isFirstRune: wasEmpty,
      isRuneNewlyUnlocked,
      totalCollectedPlacements: updated.length,
      unlockedRunesCount: newUnlockedCount,
      totalRunes: ALL_RUNES.length,
      rune: runeDef,
    };
  }

  return {
    success: false,
    isFirstRune: false,
    isRuneNewlyUnlocked: false,
    totalCollectedPlacements: current.length,
    unlockedRunesCount: previouslyUnlockedRuneIds.length,
    totalRunes: ALL_RUNES.length,
    rune: ALL_RUNES.find((r) => r.id === runeId),
  };
}

/**
 * Initializes/syncs rune state from cloud preferences on load.
 */
export async function syncRunesFromCloud(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const cloudValue = await getUserPreference(STORAGE_KEY);
    if (Array.isArray(cloudValue)) {
      const local = getCollectedPlacements();
      const merged = Array.from(new Set([...local, ...cloudValue]));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent(RUNE_COLLECTED_EVENT, { detail: { synced: true } }));
    }
  } catch {}
}
