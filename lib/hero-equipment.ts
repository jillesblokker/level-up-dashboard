import { EquippedItem } from '@/components/character/PaperdollEquipmentGrid';

export interface BagEquippableItem {
  id: string;
  name: string;
  type: string;
  category?: string;
  stats?: Record<string, any>;
  rarity?: string;
  image: string;
  description?: string;
}

export type HeroEquipmentSlot = 'weapon' | 'offhand' | 'armor' | 'robe' | 'footwear' | 'mount' | 'relic';

export const HERO_EQUIPMENT_STORAGE_KEY = 'pref:equipped_gear';
export const HERO_EQUIPMENT_EVENT = 'hero-equipment-updated';

export const DEFAULT_HERO_EQUIPMENT: Record<HeroEquipmentSlot, EquippedItem | null> = {
  weapon: {
    id: 'sword-irony',
    name: 'Irony longsword',
    slot: 'weapon',
    stats: { atk: 25, spd: 5 },
    rarity: 'rare',
    image: '/images/items/sword/sword-irony.webp',
    description: 'Flamio heated the ingot and Vulcana tempered the blade using pure habit sparks.'
  },
  offhand: {
    id: 'shield-oak',
    name: 'Sturdy oak shield',
    slot: 'offhand',
    stats: { def: 18 },
    rarity: 'uncommon',
    image: '/images/items/shield/shield-blockado.webp',
    description: 'Carved by Shello from ancient riverbed stone to deflect heavy dungeon blows.'
  },
  armor: {
    id: 'armor-normalo',
    name: 'Vanguard cuirass',
    slot: 'armor',
    stats: { def: 35, atk: 10 },
    rarity: 'epic',
    image: '/images/items/armor/armor-normalo.webp',
    description: 'Forged by Buldour and fitted for champions who walk the realm.'
  },
  robe: {
    id: 'artifact-ropy',
    name: 'Robe of the Archmage',
    slot: 'robe',
    stats: { def: 8, atk: 15, spd: 5 },
    rarity: 'epic',
    image: '/images/items/robe/artifact-ropy.webp',
    description: 'A robe woven from starry threads that channels arcane habit power.'
  },
  footwear: {
    id: 'boots-traveler',
    name: 'Traveler boots',
    slot: 'footwear',
    stats: { spd: 15, def: 5 },
    rarity: 'uncommon',
    image: '/images/items/footwear/boots-traveler.webp',
    description: 'Reinforced leather boots that quicken airship journeys and overland march speed.'
  },
  mount: {
    id: 'mount-goldy',
    name: 'Golden warhorse',
    slot: 'mount',
    stats: { spd: 30, atk: 10 },
    rarity: 'epic',
    image: '/images/items/horse/horse-goldy.webp',
    description: 'A spirited wild horse reared in the green meadows, eager for long voyages.'
  },
  relic: {
    id: 'relic-astral',
    name: 'Astral crystal',
    slot: 'relic',
    stats: { atk: 15, def: 15, spd: 15 },
    rarity: 'legendary',
    image: '/images/items/materials/material-crystal.webp',
    description: 'Turtoisy found this crystal in an astral cavern, humming with virtue power.'
  }
};

export function getHeroEquipment(): Record<HeroEquipmentSlot, EquippedItem | null> {
  if (typeof window === 'undefined') return DEFAULT_HERO_EQUIPMENT;
  try {
    const saved = localStorage.getItem(HERO_EQUIPMENT_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_HERO_EQUIPMENT, ...JSON.parse(saved) };
    }
  } catch {}
  return DEFAULT_HERO_EQUIPMENT;
}

export function saveHeroEquipment(equipment: Record<HeroEquipmentSlot, EquippedItem | null>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HERO_EQUIPMENT_STORAGE_KEY, JSON.stringify(equipment));
    window.dispatchEvent(new CustomEvent(HERO_EQUIPMENT_EVENT, { detail: equipment }));
  } catch {}
}

export function getItemSlot(item: { type: string; category?: string; id?: string }): HeroEquipmentSlot | null {
  const type = (item.type || '').toLowerCase();
  const cat = (item.category || '').toLowerCase();
  const id = (item.id || '').toLowerCase();

  if (type === 'weapon' || cat === 'weapon' || id.startsWith('sword') || id.startsWith('bow') || id.startsWith('axe') || id.startsWith('flail') || id.startsWith('staff') || id.startsWith('crossbow') || id.startsWith('halberd')) {
    return 'weapon';
  }
  if (type === 'shield' || cat === 'shield' || id.startsWith('shield') || id.startsWith('quiver')) {
    return 'offhand';
  }
  if (type === 'robe' || type === 'robes' || cat === 'robe' || cat === 'robes' || id.startsWith('robe') || id.startsWith('artifact-ropy') || id.startsWith('cloak')) {
    return 'robe';
  }
  if (type === 'footwear' || cat === 'footwear' || type === 'boots' || cat === 'boots' || id.startsWith('boots') || id.startsWith('shoe') || id.startsWith('footwear')) {
    return 'footwear';
  }
  if (type === 'armor' || cat === 'armor' || id.startsWith('armor') || id.startsWith('cowl') || id.startsWith('gauntlets')) {
    return 'armor';
  }
  if (type === 'mount' || cat === 'mount' || id.startsWith('horse') || id.startsWith('mount')) {
    return 'mount';
  }
  if (type === 'artifact' || cat === 'artifact' || id.startsWith('ring') || id.startsWith('relic') || id.startsWith('pendant') || id.startsWith('medallion') || id.startsWith('talisman') || id.startsWith('crystal') || id.startsWith('tool')) {
    return 'relic';
  }
  return null;
}

export function equipItemOnHero(item: BagEquippableItem): boolean {
  const slot = getItemSlot(item);
  if (!slot) return false;

  const current = getHeroEquipment();
  const equippedItem: EquippedItem = {
    id: item.id,
    name: item.name,
    slot,
    stats: {
      atk: typeof (item.stats as any)?.attack === 'number' ? (item.stats as any).attack : (item.stats as any)?.atk,
      def: typeof (item.stats as any)?.defense === 'number' ? (item.stats as any).defense : (item.stats as any)?.def,
      spd: typeof (item.stats as any)?.movement === 'number' ? (item.stats as any).movement : ((item.stats as any)?.spd || (item.stats as any)?.speed)
    },
    rarity: (item.rarity as any) || 'common',
    image: item.image,
    description: item.description || ''
  };

  const updated = { ...current, [slot]: equippedItem };
  saveHeroEquipment(updated);
  return true;
}

export function unequipItemFromHero(slot: HeroEquipmentSlot) {
  const current = getHeroEquipment();
  const updated = { ...current, [slot]: null };
  saveHeroEquipment(updated);
}
