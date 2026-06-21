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
    evolutionRequirement?: {
        essenceType: 'ember_essence' | 'frost_essence' | 'tide_essence' | 'verdant_essence';
        amount: number;
        evolvesTo: string;
    };
}

export const CREATURE_DATA: Record<string, CreatureDef> = {
    // Fire
    '001': { id: '001', name: 'Flamio', type: 'Fire', stats: { atk: 12, def: 8, spd: 10 }, description: 'A fiery spirit.', evolutionRequirement: { essenceType: 'ember_essence', amount: 100, evolvesTo: '002' } },
    '002': { id: '002', name: 'Embera', type: 'Fire', stats: { atk: 15, def: 10, spd: 12 }, description: 'Burning with intensity.', evolutionRequirement: { essenceType: 'ember_essence', amount: 300, evolvesTo: '003' } },
    '003': { id: '003', name: 'Vulcana', type: 'Fire', stats: { atk: 20, def: 15, spd: 15 }, description: 'Master of volcanoes.' },

    // Water
    '004': { id: '004', name: 'Dolphio', type: 'Water', stats: { atk: 10, def: 10, spd: 12 }, description: 'Playful water guide.', evolutionRequirement: { essenceType: 'tide_essence', amount: 100, evolvesTo: '005' } },
    '005': { id: '005', name: 'Divero', type: 'Water', stats: { atk: 12, def: 12, spd: 14 }, description: 'Deep sea diver.', evolutionRequirement: { essenceType: 'tide_essence', amount: 300, evolvesTo: '006' } },
    '006': { id: '006', name: 'Flippur', type: 'Water', stats: { atk: 18, def: 18, spd: 16 }, description: 'Ocean master.' },

    // Grass
    '007': { id: '007', name: 'Leaf', type: 'Grass', stats: { atk: 8, def: 12, spd: 10 }, description: 'Small leaf spirit.', evolutionRequirement: { essenceType: 'verdant_essence', amount: 100, evolvesTo: '008' } },
    '008': { id: '008', name: 'Oaky', type: 'Grass', stats: { atk: 10, def: 15, spd: 12 }, description: 'Sturdy oak guardian.', evolutionRequirement: { essenceType: 'verdant_essence', amount: 300, evolvesTo: '009' } },
    '009': { id: '009', name: 'Seqoio', type: 'Grass', stats: { atk: 14, def: 22, spd: 14 }, description: 'Ancient giant.' },

    // Rock
    '010': { id: '010', name: 'Rockie', type: 'Rock', stats: { atk: 14, def: 14, spd: 6 }, description: 'Solid rock.', evolutionRequirement: { essenceType: 'verdant_essence', amount: 100, evolvesTo: '011' } },
    '011': { id: '011', name: 'Buldour', type: 'Rock', stats: { atk: 18, def: 18, spd: 8 }, description: 'Rolling stone.', evolutionRequirement: { essenceType: 'verdant_essence', amount: 300, evolvesTo: '012' } },
    '012': { id: '012', name: 'Montano', type: 'Rock', stats: { atk: 24, def: 24, spd: 10 }, description: 'Mountain peak.' },

    // Ice
    '013': { id: '013', name: 'IceCube', type: 'Ice', stats: { atk: 12, def: 8, spd: 14 }, description: 'Cold and sharp.', evolutionRequirement: { essenceType: 'frost_essence', amount: 100, evolvesTo: '014' } },
    '014': { id: '014', name: 'Iciclo', type: 'Ice', stats: { atk: 15, def: 10, spd: 16 }, description: 'Piercing cold.', evolutionRequirement: { essenceType: 'frost_essence', amount: 300, evolvesTo: '015' } },
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
        case 'Rock': return 'text-zinc-500 border-zinc-500 bg-zinc-950/30';
        case 'Ice': return 'text-cyan-400 border-cyan-400 bg-cyan-950/30';
        default: return 'text-zinc-500 border-zinc-500 bg-zinc-950/30';
    }
}

// Map habit categories to creature elements
export function getHabitElementMapping(category: string): CreatureType {
    switch (category.toLowerCase()) {
        case 'might':
        case 'vitality':
            return 'Fire';
        case 'wellness':
        case 'exploration':
            return 'Water';
        case 'castle':
        case 'honor':
            return 'Rock';
        case 'knowledge':
            return 'Ice';
        case 'craft':
            return 'Grass';
        default:
            return 'Rock'; // fallback
    }
}
