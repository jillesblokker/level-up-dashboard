import { Tile } from '@/types/tiles';
import { logger } from '@/lib/logger';

export const SIEGE_ENGINE_TYPES = [
  'siege_catapult',
  'siege_scorpion',
  'siege_battering_ram',
  'siege_trebuchet',
  'siege_tower',
  'siege_flame_ballista',
  'siege_spring_cannon',
  'siege_ether_mortar',
  'siege_dragon_mortar',
  'siege_astral_projector'
] as const;

export const SIEGE_ENGINE_NAMES: Record<string, string> = {
  siege_catapult: 'Catapult',
  siege_scorpion: 'Scorpion',
  siege_battering_ram: 'Battering ram',
  siege_trebuchet: 'Trebuchet',
  siege_tower: 'Siegetower',
  siege_flame_ballista: 'Balista',
  siege_spring_cannon: 'Canon',
  siege_ether_mortar: 'Flaming catapult',
  siege_dragon_mortar: 'Flaming scorpion',
  siege_astral_projector: 'Flaming trebuchet',
};

/**
  * Checks if the calendar month has changed.
  * If a new month has started:
  * 1. Removes all placed siege engines from the realm map ("after each month the ones on the realm map dissapear").
  * 2. Grants 1 placement allowance per claimed siege engine for the new month.
  */
export const checkMonthlySiegeReset = (currentGrid?: Tile[][]): { gridUpdated: boolean; newGrid?: Tile[][] } => {
  if (typeof window === 'undefined') return { gridUpdated: false };

  try {
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastActiveMonth = localStorage.getItem('siege-active-month');

    if (!lastActiveMonth) {
      localStorage.setItem('siege-active-month', currentMonthStr);
      return { gridUpdated: false };
    }

    if (lastActiveMonth !== currentMonthStr) {
      logger.info(`[SiegeEngine] New month detected (${currentMonthStr} vs ${lastActiveMonth}). Resetting monthly siege placements.`);
      localStorage.setItem('siege-active-month', currentMonthStr);

      // Reset sandbox inventory for claimed siege weapons (1/month each)
      const claimedWeapons = (() => {
        try { return JSON.parse(localStorage.getItem('claimed-siege-weapons') || '[]'); }
        catch { return []; }
      })();

      const freshSandbox: Record<string, number> = {};
      claimedWeapons.forEach((wId: string) => {
        freshSandbox[wId] = 1;
      });
      localStorage.setItem('sandbox-inventory', JSON.stringify(freshSandbox));

      // Clear placed siege engines from grid
      let gridToClean = currentGrid;
      if (!gridToClean) {
        try {
          const stored = localStorage.getItem('kingdom-grid');
          if (stored) gridToClean = JSON.parse(stored);
        } catch {
          gridToClean = undefined;
        }
      }

      if (Array.isArray(gridToClean)) {
        const cleanedGrid = gridToClean.map(row =>
          Array.isArray(row)
            ? row.map(tile => {
                if (tile && tile.placedSiegeEngine) {
                  const { placedSiegeEngine, ...restTile } = tile;
                  return restTile as Tile;
                }
                return tile;
              })
            : row
        );
        localStorage.setItem('kingdom-grid', JSON.stringify(cleanedGrid));
        window.dispatchEvent(new Event('inventory-updated'));
        window.dispatchEvent(new Event('tile-inventory-update'));
        return { gridUpdated: true, newGrid: cleanedGrid };
      }
    }
  } catch (err) {
    logger.error('[SiegeEngine] Failed to process monthly siege reset', err);
  }

  return { gridUpdated: false };
};
