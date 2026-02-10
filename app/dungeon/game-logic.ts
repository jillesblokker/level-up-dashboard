export type CreatureType = 'Fire' | 'Water' | 'Grass' | 'Rock' | 'Ice';

export interface CreatureDef {
    id: string;
    name: string;
    type: CreatureType;
    stats: {
        atk: number;
        def: number;
        spd: number;
    };
    description?: string;
}

export const CREATURE_DATA: Record<string, CreatureDef> = {
    // Fire
    '001': { id: '001', name: 'Flamio', type: 'Fire', stats: { atk: 12, def: 8, spd: 10 }, description: 'A fiery spirit.' },
    '002': { id: '002', name: 'Embera', type: 'Fire', stats: { atk: 15, def: 10, spd: 12 }, description: 'Burning with intensity.' },
    '003': { id: '003', name: 'Vulcana', type: 'Fire', stats: { atk: 20, def: 15, spd: 15 }, description: 'Master of volcanoes.' },

    // Water
    '004': { id: '004', name: 'Dolphio', type: 'Water', stats: { atk: 10, def: 10, spd: 12 }, description: 'Playful water guide.' },
    '005': { id: '005', name: 'Divero', type: 'Water', stats: { atk: 12, def: 12, spd: 14 }, description: 'Deep sea diver.' },
    '006': { id: '006', name: 'Flippur', type: 'Water', stats: { atk: 18, def: 18, spd: 16 }, description: 'Ocean master.' },

    // Grass
    '007': { id: '007', name: 'Leaf', type: 'Grass', stats: { atk: 8, def: 12, spd: 10 }, description: 'Small leaf spirit.' },
    '008': { id: '008', name: 'Oaky', type: 'Grass', stats: { atk: 10, def: 15, spd: 12 }, description: 'Sturdy oak guardian.' },
    '009': { id: '009', name: 'Seqoio', type: 'Grass', stats: { atk: 14, def: 22, spd: 14 }, description: 'Ancient giant.' },

    // Rock
    '010': { id: '010', name: 'Rockie', type: 'Rock', stats: { atk: 14, def: 14, spd: 6 }, description: 'Solid rock.' },
    '011': { id: '011', name: 'Buldour', type: 'Rock', stats: { atk: 18, def: 18, spd: 8 }, description: 'Rolling stone.' },
    '012': { id: '012', name: 'Montano', type: 'Rock', stats: { atk: 24, def: 24, spd: 10 }, description: 'Mountain peak.' },

    // Ice
    '013': { id: '013', name: 'IceCube', type: 'Ice', stats: { atk: 12, def: 8, spd: 14 }, description: 'Cold and sharp.' },
    '014': { id: '014', name: 'Iciclo', type: 'Ice', stats: { atk: 15, def: 10, spd: 16 }, description: 'Piercing cold.' },
    '015': { id: '015', name: 'Glacior', type: 'Ice', stats: { atk: 22, def: 15, spd: 20 }, description: 'Frozen wasteland ruler.' },
};

export const CREATURE_IDS = Object.keys(CREATURE_DATA);

export function getMatchupMultiplier(attacker: CreatureType, defender: CreatureType): number {
    if (attacker === defender) return 1;

    switch (attacker) {
        case 'Fire':
            if (['Grass', 'Ice'].includes(defender)) return 2;
            if (['Water', 'Rock'].includes(defender)) return 0.5;
            return 1;
        case 'Water':
            if (['Fire', 'Rock'].includes(defender)) return 2;
            if (['Grass'].includes(defender)) return 0.5;
            return 1;
        case 'Grass':
            if (['Water', 'Rock'].includes(defender)) return 2;
            if (['Fire', 'Ice'].includes(defender)) return 0.5;
            return 1;
        case 'Rock':
            if (['Fire', 'Ice'].includes(defender)) return 2;
            if (['Water', 'Grass', 'Rock'].includes(defender)) return 0.5;
            return 1;
        case 'Ice':
            if (['Grass'].includes(defender)) return 2;
            if (['Fire', 'Rock'].includes(defender)) return 0.5;
            return 1;
        default:
            return 1;
    }
}

export function getTypeEmoji(type: CreatureType): string {
    switch (type) {
        case 'Fire': return '🔥';
        case 'Water': return '💧';
        case 'Grass': return '🍃';
        case 'Rock': return '🪨';
        case 'Ice': return '❄️';
        default: return '❓';
    }
}

// Colors for UI
export function getTypeColor(type: CreatureType): string {
    switch (type) {
        case 'Fire': return 'text-orange-500 border-orange-500 bg-orange-950/30';
        case 'Water': return 'text-blue-500 border-blue-500 bg-blue-950/30';
        case 'Grass': return 'text-green-500 border-green-500 bg-green-950/30';
        case 'Rock': return 'text-stone-500 border-stone-500 bg-stone-950/30';
        case 'Ice': return 'text-cyan-400 border-cyan-400 bg-cyan-950/30';
        default: return 'text-gray-500 border-gray-500 bg-gray-950/30';
    }
}
