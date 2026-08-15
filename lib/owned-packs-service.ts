export interface OwnedPack {
  id: string;
  packTypeId: string;
  packTitle: string;
  shortLabel: string;
  purchasedAt: number;
  packData: any; // Generated pack data containing 9 cards
}

const STORAGE_KEY = 'thrivehaven_owned_packs';

export function getOwnedPacks(): OwnedPack[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOwnedPack(pack: OwnedPack): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getOwnedPacks();
    list.push(pack);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('owned-packs-changed', { detail: list }));
  } catch (err) {
    console.error('Failed to save owned pack:', err);
  }
}

export function removeOwnedPack(packId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getOwnedPacks().filter(p => p.id !== packId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('owned-packs-changed', { detail: list }));
  } catch (err) {
    console.error('Failed to remove owned pack:', err);
  }
}
