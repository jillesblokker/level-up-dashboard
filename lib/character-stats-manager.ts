/**
 * CHARACTER STATS MANAGER (DEPRECATED)
 * 
 * ⚠️ WARNING: This file is deprecated. Please use lib/character-stats-service.ts instead.
 * 
 * This file is kept for backward compatibility with legacy systems.
 * All functions here now delegate to the unified CharacterStatsService
 * to ensure a single source of truth across the application.
 */

import { characterStatsService, CharacterStats } from './character-stats-service';

export type { CharacterStats } from './character-stats-service';

/**
 * Loads character stats (delegates to new service)
 */
export async function loadCharacterStats(): Promise<CharacterStats> {
  console.warn('[CharacterStatsManager] loadCharacterStats is deprecated. Use fetchFreshCharacterStats from character-stats-service.ts');
  return await characterStatsService.fetchAndMerge();
}

/**
 * Saves character stats (delegates to new service)
 * ⚠️ DEPRECATED
 */
export async function saveCharacterStats(stats: Partial<CharacterStats>): Promise<boolean> {
  console.warn('[CharacterStatsManager] saveCharacterStats is deprecated. Use updateCharacterStats from character-stats-service.ts');
  characterStatsService.updateStats(stats, 'legacy-manager-save');
  return true;
}

/**
 * Updates a specific stat value (delegates to new service)
 */
export async function updateCharacterStat(stat: keyof CharacterStats, value: number): Promise<boolean> {
  characterStatsService.updateStats({ [stat]: value } as Partial<CharacterStats>, 'legacy-manager-update');
  return true;
}

/**
 * Updates a specific stat value synchronously (delegates to new service)
 */
export function updateCharacterStatSync(stat: keyof CharacterStats, value: number): void {
  characterStatsService.updateStats({ [stat]: value } as Partial<CharacterStats>, 'legacy-manager-update-sync');
}

/**
 * Adds to a specific stat value (delegates to new service)
 */
export async function addToCharacterStat(stat: keyof CharacterStats, amount: number): Promise<boolean> {
  characterStatsService.addToStat(stat, amount, 'legacy-manager-add');
  return true;
}

/**
 * Adds to a specific stat value synchronously (delegates to new service)
 */
export function addToCharacterStatSync(stat: keyof CharacterStats, amount: number): void {
  characterStatsService.addToStat(stat, amount, 'legacy-manager-add-sync');
}

/**
 * Gets character stats (delegates to new service)
 */
export function getCharacterStats(): CharacterStats {
  return characterStatsService.getStats();
}

/**
 * Sets character stats (delegates to new service)
 */
export function setCharacterStats(stats: Partial<CharacterStats>): void {
  characterStatsService.updateStats(stats, 'legacy-manager-set');
}

// Re-export constants or other secondary functions if needed...
// (Most other code in the old manager was for rate limiting which is now handled by the service)