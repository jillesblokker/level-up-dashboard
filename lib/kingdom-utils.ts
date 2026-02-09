
import { Tile, TileType } from '@/types/tiles';

export interface KingdomBonuses {
    strength: number;
    intelligence: number;
    vitality: number;
    xpBonusPercent: number;
    goldBonusPercent: number;
}

const TILE_BONUSES: Record<string, Partial<KingdomBonuses>> = {
    'blacksmith': { strength: 2 },
    'wizard': { intelligence: 2 },
    'temple': { vitality: 2 },
    'library': { xpBonusPercent: 5 },
    'market': { goldBonusPercent: 5 },
    'training-grounds': { strength: 1 },
    'archery': { strength: 1 },
    'watchtower': { vitality: 1 },
    'castle': { strength: 1, intelligence: 1, vitality: 1, goldBonusPercent: 5 },
    'mansion': { goldBonusPercent: 2 },
    'mill': { xpBonusPercent: 2 },
    'windmill': { xpBonusPercent: 2 },
    'sawmill': { strength: 1 },
    'fountain': { vitality: 1 },
};

export function calculateKingdomBonuses(grid: Tile[][] | any[][]): KingdomBonuses {
    const bonuses: KingdomBonuses = {
        strength: 0,
        intelligence: 0,
        vitality: 0,
        xpBonusPercent: 0,
        goldBonusPercent: 0
    };

    if (!grid || !Array.isArray(grid)) return bonuses;

    grid.flat().forEach(tile => {
        if (tile && tile.type && tile.type !== 'vacant') {
            const bonus = TILE_BONUSES[tile.type];
            if (bonus) {
                if (bonus.strength) bonuses.strength += bonus.strength;
                if (bonus.intelligence) bonuses.intelligence += bonus.intelligence;
                if (bonus.vitality) bonuses.vitality += bonus.vitality;
                if (bonus.xpBonusPercent) bonuses.xpBonusPercent += bonus.xpBonusPercent;
                if (bonus.goldBonusPercent) bonuses.goldBonusPercent += bonus.goldBonusPercent;
            }
        }
    });

    return bonuses;
}
