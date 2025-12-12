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
        greetings: ["Hot stuff coming through!", "Watch the sparks, boss!", "Is it hot in here, or is it just me?"],
        scale: 0.8
    },
    '002': {
        id: '002',
        name: 'Embera',
        filename: 'Embera.png',
        type: 'fire',
        greetings: ["Finally, some room to breathe!", "Burn bright, little one.", "The fire rises."],
        scale: 0.9
    },
    '003': {
        id: '003',
        name: 'Vulcana',
        filename: 'Vulcana.png',
        type: 'fire',
        greetings: ["DESTRUCTION! I LOVE IT!", "My power overflows!", "Behold the inferno!"],
        scale: 1.1
    },

    // Water Creatures
    '004': {
        id: '004',
        name: 'Dolphio',
        filename: 'Dolphio.png',
        type: 'water',
        greetings: ["Splash! You found me!", "Wanna play tag?", "More water! More water!"],
        scale: 0.8
    },
    '005': {
        id: '005',
        name: 'Divero',
        filename: 'Divero.png',
        type: 'water',
        greetings: ["Nice flow you got there.", "Deep waters run still.", "Just keep swimming."],
        scale: 0.9
    },
    '006': {
        id: '006',
        name: 'Flippur',
        filename: 'Flippur.png',
        type: 'water',
        greetings: ["You have mastered the tides.", "The ocean bows to you.", "Ride the wave."],
        scale: 1.1
    },

    // Nature Creatures
    '007': {
        id: '007',
        name: 'Leaf',
        filename: 'Leaf.png',
        type: 'nature',
        greetings: ["Peek-a-boo!", "Yay! A new friend!", "Don't step on the flowers!"],
        scale: 0.7
    },
    '008': {
        id: '008',
        name: 'Oaky',
        filename: 'Oaky.png',
        type: 'nature',
        greetings: ["Growth... takes... time...", "Strong roots... strong kingdom...", "Patience..."],
        scale: 1.0
    },
    '009': {
        id: '009',
        name: 'Seqoio',
        filename: 'Seqoio.png',
        type: 'nature',
        greetings: ["You build a legacy for the ages.", "Stand tall, little one.", "The forest protects its own."],
        scale: 1.2
    },

    // Earth Creatures
    '010': {
        id: '010',
        name: 'Rockie',
        filename: 'Rockie.png',
        type: 'earth',
        greetings: ["Oof. Watch the toes.", "I was napping...", "Solid ground is best."],
        scale: 0.8
    },
    '011': {
        id: '011',
        name: 'Buldour',
        filename: 'Buldour.png',
        type: 'earth',
        greetings: ["Hmph. Good smash.", "Strong foundation.", "Rock solid."],
        scale: 1.0
    },
    '012': {
        id: '012',
        name: 'Montano',
        filename: 'Montano.png',
        type: 'earth',
        greetings: ["YOU MOVE MOUNTAINS LIKE PEBBLES.", "Stand firm.", "The earth shakes."],
        scale: 1.2
    },

    // Ice Creatures
    '013': {
        id: '013',
        name: 'Icey',
        filename: 'Icey.png',
        type: 'ice',
        greetings: ["Brrr! Close the door!", "Chilly today, isn't it?", "Stay cool."],
        scale: 0.8
    },
    '014': {
        id: '014',
        name: 'Hailey',
        filename: 'Hailey.png',
        type: 'ice',
        greetings: ["A precise strike.", "Cool and collected.", "Sharp as ice."],
        scale: 0.9
    },
    '015': {
        id: '015',
        name: 'Blizzey',
        filename: 'Blizzey.png',
        type: 'ice',
        greetings: ["The cold never bothered me anyway.", "Winter is coming.", "Frozen perfection."],
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
        greetings: ["Baaa...", "Munch munch."],
        scale: 1.0
    },
    '902': {
        id: '902',
        name: 'Wild Horse',
        filename: 'horse.png',
        type: 'nature',
        greetings: ["Neigh!", "Snort."],
        scale: 1.2
    },
    '903': {
        id: '903',
        name: 'Happy Penguin',
        filename: 'penguin.png',
        type: 'ice',
        greetings: ["Noot noot!", "Slide!"],
        scale: 0.8
    }
};
