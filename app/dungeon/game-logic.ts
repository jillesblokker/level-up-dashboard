export type CreatureType = 'Fire' | 'Water' | 'Grass' | 'Rock' | 'Ice';

export interface CreatureDef {
    id: string;
    name: string;
    type: CreatureType;
    level?: number;
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

export interface BossTelegraph {
    name: string;
    multiplier: number;
    type: 'heavy' | 'elemental' | 'guard';
    warningText: string;
}

export function getEnemyTelegraphAction(turnCount: number, enemyType: CreatureType): BossTelegraph {
    const cycle = turnCount % 3;
    if (cycle === 1) {
        return {
            name: `${enemyType} Blast`,
            multiplier: 1.5,
            type: 'elemental',
            warningText: `⚠️ Preparing ${enemyType} Surge (1.5x Dmg)! Use Counter Guard or swap fighter!`
        };
    } else if (cycle === 2) {
        return {
            name: 'Titan Slam',
            multiplier: 1.8,
            type: 'heavy',
            warningText: `💥 Winding up Titan Slam (1.8x Physical Dmg)! Mitigate with Counter Guard!`
        };
    } else {
        return {
            name: 'Standard Strike',
            multiplier: 1.0,
            type: 'guard',
            warningText: `⚔️ Preparing Basic Strike (1.0x Dmg).`
        };
    }
}

export function getElementalComboBuff(activeType: CreatureType, benchTypes: CreatureType[]): { name: string; bonusDmg: number; description: string } | null {
    if (activeType === 'Fire' && benchTypes.includes('Grass')) {
        return { name: '🔥🍃 Wildfire Combo', bonusDmg: 0.25, description: '+25% Burn Damage' };
    }
    if (activeType === 'Water' && benchTypes.includes('Ice')) {
        return { name: '💧❄️ Deep Freeze Combo', bonusDmg: 0.30, description: '+30% Frost Damage & Armor Piercing' };
    }
    if (activeType === 'Rock' && benchTypes.includes('Fire')) {
        return { name: '🪨🔥 Magma Smash Combo', bonusDmg: 0.25, description: '+25% Crushing Damage' };
    }
    if (activeType === 'Grass' && benchTypes.includes('Water')) {
        return { name: '🍃💧 Overgrowth Combo', bonusDmg: 0.20, description: '+20% Synergy & +5 HP Surge' };
    }
    return null;
}

export interface SignatureMove {
    name: string;
    emoji: string;
    multiplier: number;
    unlockedAtLevel: number;
    description: string;
}

export function getSignatureMoveForLevel(type: CreatureType, level: number = 1): SignatureMove {
    if (level >= 100) {
        switch (type) {
            case 'Fire': return { name: 'God-King Pyre', emoji: '🔱🔥', multiplier: 3.2, unlockedAtLevel: 100, description: 'Unleashes divine cataclysmic fire.' };
            case 'Water': return { name: 'Oceanic Overlord Strike', emoji: '🔱💧', multiplier: 3.2, unlockedAtLevel: 100, description: 'Summons tidal obliteration.' };
            case 'Grass': return { name: 'Primordial Gaia Wrath', emoji: '🔱🍃', multiplier: 3.2, unlockedAtLevel: 100, description: 'Crushes with primordial nature energy.' };
            case 'Rock': return { name: 'Titan Core Rupture', emoji: '🔱🪨', multiplier: 3.2, unlockedAtLevel: 100, description: 'Shatters tectonic core for heavy damage.' };
            case 'Ice': return { name: 'Ragnarok Frost Realm', emoji: '🔱❄️', multiplier: 3.2, unlockedAtLevel: 100, description: 'Freezes spacetime into absolute zero.' };
        }
    }
    if (level >= 50) {
        switch (type) {
            case 'Fire': return { name: 'Solar Flare Nova', emoji: '☀️', multiplier: 2.5, unlockedAtLevel: 50, description: 'Blasts enemy with concentrated solar beam.' };
            case 'Water': return { name: 'Leviathan Torrent', emoji: '🐋', multiplier: 2.5, unlockedAtLevel: 50, description: 'Crushes target in abyssal whirlpool.' };
            case 'Grass': return { name: 'Yggdrasil Bloom', emoji: '🌺', multiplier: 2.5, unlockedAtLevel: 50, description: 'Bursts with world-tree essence.' };
            case 'Rock': return { name: 'Adamantine Rupture', emoji: '💎', multiplier: 2.5, unlockedAtLevel: 50, description: 'Pierces through all defenses.' };
            case 'Ice': return { name: 'Absolute Zero Shatter', emoji: '🌌', multiplier: 2.5, unlockedAtLevel: 50, description: 'Deep freezes target armor.' };
        }
    }
    if (level >= 30) {
        switch (type) {
            case 'Fire': return { name: 'Inferno Cataclysm', emoji: '☄️', multiplier: 2.0, unlockedAtLevel: 30, description: 'Rain of molten meteors.' };
            case 'Water': return { name: 'Abyssal Maelstrom', emoji: '🌀', multiplier: 2.0, unlockedAtLevel: 30, description: 'Vortex of deep sea currents.' };
            case 'Grass': return { name: 'Ancient Timber Smash', emoji: '🌲', multiplier: 2.0, unlockedAtLevel: 30, description: 'Crushes with ancient trunk strikes.' };
            case 'Rock': return { name: 'Tectonic Avalanche', emoji: '🌋', multiplier: 2.0, unlockedAtLevel: 30, description: 'Quake that causes rockslides.' };
            case 'Ice': return { name: 'Glacial Avalanche', emoji: '🌨️', multiplier: 2.0, unlockedAtLevel: 30, description: 'Piercing ice spears.' };
        }
    }
    if (level >= 20) {
        switch (type) {
            case 'Fire': return { name: 'Ember Blast', emoji: '🌋', multiplier: 1.6, unlockedAtLevel: 20, description: 'Explosive ember wave.' };
            case 'Water': return { name: 'Tidal Surge', emoji: '🌊', multiplier: 1.6, unlockedAtLevel: 20, description: 'Crashing tidal wave.' };
            case 'Grass': return { name: 'Thorn Barrage', emoji: '🌿', multiplier: 1.6, unlockedAtLevel: 20, description: 'Volley of razor thorns.' };
            case 'Rock': return { name: 'Seismic Fracture', emoji: '⛰️', multiplier: 1.6, unlockedAtLevel: 20, description: 'Ground splitting shockwave.' };
            case 'Ice': return { name: 'Blizzard Nova', emoji: '🧊', multiplier: 1.6, unlockedAtLevel: 20, description: 'Swirling freezing blizzard.' };
        }
    }
    if (level >= 10) {
        switch (type) {
            case 'Fire': return { name: 'Flame Lash', emoji: '🔥', multiplier: 1.3, unlockedAtLevel: 10, description: 'Whip of scorching flames.' };
            case 'Water': return { name: 'Aqua Spike', emoji: '💧', multiplier: 1.3, unlockedAtLevel: 10, description: 'Pressurized water needle.' };
            case 'Grass': return { name: 'Vine Whip', emoji: '🍃', multiplier: 1.3, unlockedAtLevel: 10, description: 'Swift whip attack.' };
            case 'Rock': return { name: 'Boulderdash', emoji: '🪨', multiplier: 1.3, unlockedAtLevel: 10, description: 'Heavy rolling stone impact.' };
            case 'Ice': return { name: 'Frost Shard', emoji: '❄️', multiplier: 1.3, unlockedAtLevel: 10, description: 'Sharp icicle burst.' };
        }
    }

    // Default Level 1-9 Move
    switch (type) {
        case 'Fire': return { name: 'Spark Touch', emoji: '🔥', multiplier: 1.1, unlockedAtLevel: 1, description: 'Basic fire ember strike.' };
        case 'Water': return { name: 'Splash Impact', emoji: '💧', multiplier: 1.1, unlockedAtLevel: 1, description: 'Basic water burst.' };
        case 'Grass': return { name: 'Leaf Flick', emoji: '🍃', multiplier: 1.1, unlockedAtLevel: 1, description: 'Basic leaf strike.' };
        case 'Rock': return { name: 'Pebble Toss', emoji: '🪨', multiplier: 1.1, unlockedAtLevel: 1, description: 'Basic rock throwing.' };
        case 'Ice': return { name: 'Chilling Gust', emoji: '❄️', multiplier: 1.1, unlockedAtLevel: 1, description: 'Basic cold gust.' };
    }
}

export function calculateSmartEnemyAction(
    enemyLevel: number,
    enemyType: CreatureType,
    playerHp: number,
    playerMaxHp: number,
    turnCount: number,
    playerElement: CreatureType
): { actionType: 'strike' | 'elemental' | 'signature' | 'guard'; moveName: string; multiplier: number } {
    const signatureMove = getSignatureMoveForLevel(enemyType, enemyLevel);
    const matchup = getMatchupMultiplier(enemyType, playerElement);

    // 1. Low Level AI (Levels 1 - 15): Simple & predictable
    if (enemyLevel < 16) {
        if (turnCount % 3 === 0 && enemyLevel >= 10) {
            return { actionType: 'signature', moveName: signatureMove.name, multiplier: signatureMove.multiplier };
        }
        if (Math.random() < 0.25) {
            return { actionType: 'elemental', moveName: `${enemyType} Blast`, multiplier: 1.4 };
        }
        return { actionType: 'strike', moveName: 'Heavy Strike', multiplier: 1.0 };
    }

    // 2. Mid Level AI (Levels 16 - 49): Tactical awareness
    if (enemyLevel < 50) {
        if (turnCount % 2 === 0) {
            return { actionType: 'signature', moveName: signatureMove.name, multiplier: signatureMove.multiplier };
        }
        const playerAdvantage = getMatchupMultiplier(playerElement, enemyType) > 1;
        if (playerAdvantage && Math.random() < 0.4) {
            return { actionType: 'guard', moveName: 'Counter Guard Stance', multiplier: 0.8 };
        }
        if (matchup > 1) {
            return { actionType: 'elemental', moveName: `Super Effective ${enemyType} Burst`, multiplier: 1.8 };
        }
        return { actionType: 'strike', moveName: 'Heavy Strike', multiplier: 1.2 };
    }

    // 3. High Level & Boss AI (Levels 50 - 100+): Master Class
    const playerLowHp = (playerHp / playerMaxHp) < 0.35;
    if (playerLowHp) {
        return { actionType: 'signature', moveName: `🔥 EXECUTION: ${signatureMove.name}`, multiplier: signatureMove.multiplier * 1.2 };
    }

    if (turnCount % 2 === 1) {
        return { actionType: 'signature', moveName: signatureMove.name, multiplier: signatureMove.multiplier };
    }

    const playerAdvantage = getMatchupMultiplier(playerElement, enemyType) > 1;
    if (playerAdvantage && Math.random() < 0.6) {
        return { actionType: 'guard', moveName: '🛡️ Master Counter Guard', multiplier: 0.6 };
    }

    return { actionType: 'elemental', moveName: `🌌 Master ${enemyType} Surge`, multiplier: 2.0 };
}
