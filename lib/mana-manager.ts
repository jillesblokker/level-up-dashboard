/**
 * Mana & Arcane Willpower Engine
 * Connects focus habits to Realm Spellcasting (Chrono-Accelerate, Streak Shield, Tax Surges).
 */

import { logger } from "@/lib/logger";

export interface ManaState {
  mana: number; // 0 to 100
  lastUpdated: string;
}

const STORAGE_KEY = 'thrivehaven_mana_state';
const MAX_MANA = 100;

export function getManaSync(): number {
  if (typeof window === 'undefined') return 100;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 100;
    const data: ManaState = JSON.parse(raw);
    return typeof data.mana === 'number' ? Math.max(0, Math.min(MAX_MANA, data.mana)) : 100;
  } catch (e) {
    logger.error('Failed to read mana sync:', e);
    return 100;
  }
}

export function setMana(amount: number): number {
  const clamped = Math.max(0, Math.min(MAX_MANA, Math.round(amount)));
  if (typeof window !== 'undefined') {
    try {
      const state: ManaState = {
        mana: clamped,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      window.dispatchEvent(new CustomEvent('mana-changed', { detail: { mana: clamped } }));
    } catch (e) {
      logger.error('Failed to save mana state:', e);
    }
  }
  return clamped;
}

export function gainMana(amount: number): number {
  const current = getManaSync();
  return setMana(current + amount);
}

export function spendMana(amount: number): boolean {
  const current = getManaSync();
  if (current < amount) return false;
  setMana(current - amount);
  return true;
}
