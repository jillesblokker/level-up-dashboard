export interface CreatureDefinition {
    id: string; // Achievement ID (e.g., '001')
    name: string; // Display name (e.g., 'Flamio')
    filename: string; // Filename (e.g., 'Flamio.png')
    type: 'fire' | 'water' | 'earth' | 'nature' | 'ice' | 'monster' | 'special';
    greetings: string[]; // Random greetings
    scale: number; // Scale factor (default 1.0)
}

export const CREATURE_DEFINITIONS: Record<string, CreatureDefinition> = {
    // Fire Creatures
    '001': {
        id: '001',
        name: 'Flamio',
        filename: 'Flamio.png',
        type: 'fire',
        greetings: ["A habit is forged in the hottest fire. What are we hammering out today?", "Keep that streak burning, traveler! Stagnation is just cold ash.", "Let's melt away yesterday's failures. Fresh iron is ready for the anvil!"],
        scale: 0.8
    },
    '002': {
        id: '002',
        name: 'Embera',
        filename: 'Embera.png',
        type: 'fire',
        greetings: ["A habit is forged in the hottest fire. What are we hammering out today?", "Keep that streak burning, traveler! Stagnation is just cold ash.", "Let's melt away yesterday's failures. Fresh iron is ready for the anvil!"],
        scale: 0.9
    },
    '003': {
        id: '003',
        name: 'Vulcana',
        filename: 'Vulcana.png',
        type: 'fire',
        greetings: ["A habit is forged in the hottest fire. What are we hammering out today?", "Keep that streak burning, traveler! Stagnation is just cold ash.", "Let's melt away yesterday's failures. Fresh iron is ready for the anvil!"],
        scale: 1.1
    },

    // Water Creatures
    '004': {
        id: '004',
        name: 'Dolphio',
        filename: 'Dolphio.png',
        type: 'water',
        greetings: ["Discipline is like a river—it carves canyons through rock, drop by drop.", "Start your day with a clear flow. Have you drank a glass of fresh water yet?", "Let your daily routines wash away the noise. Just find your flow state."],
        scale: 0.8
    },
    '005': {
        id: '005',
        name: 'Divero',
        filename: 'Divero.png',
        type: 'water',
        greetings: ["Discipline is like a river—it carves canyons through rock, drop by drop.", "Start your day with a clear flow. Have you drank a glass of fresh water yet?", "Let your daily routines wash away the noise. Just find your flow state."],
        scale: 0.9
    },
    '006': {
        id: '006',
        name: 'Flippur',
        filename: 'Flippur.png',
        type: 'water',
        greetings: ["Discipline is like a river—it carves canyons through rock, drop by drop.", "Start your day with a clear flow. Have you drank a glass of fresh water yet?", "Let your daily routines wash away the noise. Just find your flow state."],
        scale: 1.1
    },

    // Nature Creatures
    '007': {
        id: '007',
        name: 'Leaf',
        filename: 'Leaf.png',
        type: 'nature',
        greetings: ["A giant oak grows from a tiny acorn. Plant one small habit today.", "Patience, traveler. You don't see the roots growing, but they are securing your foundation.", "Every daily checklist completed is fresh sunlight for our golden meadows."],
        scale: 0.7
    },
    '008': {
        id: '008',
        name: 'Oaky',
        filename: 'Oaky.png',
        type: 'nature',
        greetings: ["A giant oak grows from a tiny acorn. Plant one small habit today.", "Patience, traveler. You don't see the roots growing, but they are securing your foundation.", "Every daily checklist completed is fresh sunlight for our golden meadows."],
        scale: 1.0
    },
    '009': {
        id: '009',
        name: 'Seqoio',
        filename: 'Seqoio.png',
        type: 'nature',
        greetings: ["A giant oak grows from a tiny acorn. Plant one small habit today.", "Patience, traveler. You don't see the roots growing, but they are securing your foundation.", "Every daily checklist completed is fresh sunlight for our golden meadows."],
        scale: 1.2
    },

    // Earth Creatures
    '010': {
        id: '010',
        name: 'Rockie',
        filename: 'Rockie.png',
        type: 'earth',
        greetings: ["A fortress is built block by block. Your daily habit is today's stone.", "Steady feet, heavy tasks. Let's get the foundation solid before nightfall.", "Your streak is a granite wall. Don't let a single brick crumble."],
        scale: 0.8
    },
    '011': {
        id: '011',
        name: 'Buldour',
        filename: 'Buldour.png',
        type: 'earth',
        greetings: ["A fortress is built block by block. Your daily habit is today's stone.", "Steady feet, heavy tasks. Let's get the foundation solid before nightfall.", "Your streak is a granite wall. Don't let a single brick crumble."],
        scale: 1.0
    },
    '012': {
        id: '012',
        name: 'Montano',
        filename: 'Montano.png',
        type: 'earth',
        greetings: ["A fortress is built block by block. Your daily habit is today's stone.", "Steady feet, heavy tasks. Let's get the foundation solid before nightfall.", "Your streak is a granite wall. Don't let a single brick crumble."],
        scale: 1.2
    },

    // Ice Creatures
    '013': {
        id: '013',
        name: 'Icey',
        filename: 'Icey.png',
        type: 'ice',
        greetings: ["Freeze out the distractions. Absolute clarity is your greatest weapon.", "A cool head and a sharp schedule. That is how empires are built.", "Icy precision beats emotional chaos. Just follow the checklist."],
        scale: 0.8
    },
    '014': {
        id: '014',
        name: 'Hailey',
        filename: 'Hailey.png',
        type: 'ice',
        greetings: ["Freeze out the distractions. Absolute clarity is your greatest weapon.", "A cool head and a sharp schedule. That is how empires are built.", "Icy precision beats emotional chaos. Just follow the checklist."],
        scale: 0.9
    },
    '015': {
        id: '015',
        name: 'Blizzey',
        filename: 'Blizzey.png',
        type: 'ice',
        greetings: ["Freeze out the distractions. Absolute clarity is your greatest weapon.", "A cool head and a sharp schedule. That is how empires are built.", "Icy precision beats emotional chaos. Just follow the checklist."],
        scale: 1.1
    },

    // Special/Monster Creatures (Optional, if we have images)
    '201': {
        id: '201',
        name: 'Drakon',
        filename: 'Drakon.png', // Assuming this exists or will exist
        type: 'monster',
        greetings: ["I sleep... for now.", "You are worthy.", "The fire burns within."],
        scale: 1.3
    },
    '000': {
        id: '000',
        name: 'Necrion',
        filename: 'Necrion.png',
        type: 'special',
        greetings: ["The shadows whisper...", "I see all.", "Darkness falls."],
        scale: 1.0
    },
    // Animals
    '901': {
        id: '901',
        name: 'Wooly Sheep',
        filename: 'sheep.png',
        type: 'nature',
        greetings: ["Baaa... would you mind a trim?", "The grass is exceptionally green today!", "Munch munch... oh, hello traveler!"],
        scale: 1.0
    },
    '902': {
        id: '902',
        name: 'Wild Horse',
        filename: 'horse.png',
        type: 'nature',
        greetings: ["Neigh! The wind is perfect for a gallop.", "*Snort* Ready to explore the realm?", "I can carry you across the widest plains."],
        scale: 1.2
    },
    '903': {
        id: '903',
        name: 'Happy Penguin',
        filename: 'penguin.png',
        type: 'ice',
        greetings: ["Noot noot! Spare some fish?", "Slide! It's better than walking, trust me.", "Waddle you doing today? *Giggle*"],
        scale: 0.8
    }
};
