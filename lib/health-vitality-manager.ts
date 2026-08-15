/**
 * Health Vitality & Kingdom Tax Economy Manager
 * Connects real-life habit completions to Kingdom Building Tax Yields.
 */

import { logger } from "@/lib/logger";

export interface HealthVitalityState {
  health: number; // 0 to 100
  lastUpdated: string;
}

const STORAGE_KEY = 'thrivehaven_health_vitality';

export function getHealthVitalitySync(): number {
  if (typeof window === 'undefined') return 100;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 100;
    const data: HealthVitalityState = JSON.parse(raw);
    return typeof data.health === 'number' ? Math.max(0, Math.min(100, data.health)) : 100;
  } catch (e) {
    logger.error('Failed to read health vitality sync:', e);
    return 100;
  }
}

export function setHealthVitality(health: number): number {
  const clamped = Math.max(0, Math.min(100, Math.round(health)));
  if (typeof window !== 'undefined') {
    try {
      const state: HealthVitalityState = {
        health: clamped,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      window.dispatchEvent(new CustomEvent('health-vitality-changed', { detail: { health: clamped } }));
    } catch (e) {
      logger.error('Failed to save health vitality:', e);
    }
  }
  return clamped;
}

/**
 * Calculates Tax Multiplier based on Health Vitality:
 * - 100% Health: 1.10x (+10% Bonus Taxes)
 * - 50% - 99% Health: 1.00x (Normal)
 * - 10% - 49% Health: 0.75x (-25% Sluggish)
 * - < 10% Health: 0.25x (-75% Critical Weakness Penalty)
 */
export function getTaxMultiplier(health: number): number {
  if (health >= 100) return 1.10;
  if (health >= 50) return 1.00;
  if (health >= 10) return 0.75;
  return 0.25; // Under 10% Health = -75% Tax Penalty
}

/**
 * Drink Health Potion (+30% Health Vitality)
 */
export function drinkHealthPotion(): { success: boolean; newHealth: number } {
  const current = getHealthVitalitySync();
  if (current >= 100) {
    return { success: false, newHealth: current };
  }
  const next = setHealthVitality(current + 30);
  return { success: true, newHealth: next };
}
