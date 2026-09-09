export interface CreatureDefinition {
    id: string; // Achievement ID (e.g., '001')
    name: string; // Display name (e.g., 'Flamio')
    filename: string; // Filename (e.g., 'Flamio.png')
    type: 'fire' | 'water' | 'earth' | 'nature' | 'ice' | 'monster' | 'special';
    greetings: string[]; // Random greetings
    scale: number; // Scale factor (default 1.0)
    loreTitle?: string; // Honorary job/role title (e.g. 'Sewer master', 'Fortress builder')
    defaultClass?: 'Tank' | 'Mage' | 'Alchemist' | 'Scout'; // Default specialization
}

export const CREATURE_DEFINITIONS: Record<string, CreatureDefinition> = {
    // Fire Creatures
    '001': {
        id: '001',
        name: 'Flamio',
        filename: 'Flamio.webp',
        type: 'fire',
        loreTitle: 'Forge apprentice',
        defaultClass: 'Tank',
        greetings: [
            "Clang, clang! Strike while the habit is white-hot! What are we forging today?",
            "Keep that streak blazing, traveler! Cold iron just shatters on the anvil.",
            "Yesterday's rust melts away in morning heat. Let's hammer out five quests!"
        ],
        scale: 0.8
    },
    '002': {
        id: '002',
        name: 'Embera',
        filename: 'Embera.webp',
        type: 'fire',
        loreTitle: 'Hearth keeper',
        defaultClass: 'Alchemist',
        greetings: [
            "Come sit by the hearth, weary traveler. I’ve steeped fresh ginger tea for your journey.",
            "Gentle heat keeps the soul warm. Don't burn yourself out—steady habits simmer best.",
            "A cozy fire and a clean checklist: that's how we keep the winter chills away."
        ],
        scale: 0.9
    },
    '003': {
        id: '003',
        name: 'Vulcana',
        filename: 'Vulcana.webp',
        type: 'fire',
        loreTitle: 'Pyromancer',
        defaultClass: 'Mage',
        greetings: [
            "The subterranean magma pulses with prophecy! Great victories await your squad.",
            "Channel your inner flame into focused study. Let your magic burn through doubts.",
            "I see sparks of greatness in your daily routines. Ignite the dungeon keep!"
        ],
        scale: 1.1
    },

    // Water Creatures
    '004': {
        id: '004',
        name: 'Dolphio',
        filename: 'Dolphio.webp',
        type: 'water',
        loreTitle: 'River courier',
        defaultClass: 'Scout',
        greetings: [
            "Splash! Have you drank your morning water yet? Clear hydration fuels clear minds!",
            "Catch the river current! Flow state is reached one stroke at a time.",
            "Race you across the canal! Keep your momentum flowing all afternoon."
        ],
        scale: 0.8
    },
    '005': {
        id: '005',
        name: 'Divero',
        filename: 'Divero.webp',
        type: 'water',
        loreTitle: 'Deep alchemist',
        defaultClass: 'Alchemist',
        greetings: [
            "The deep trenches hold quiet secrets. Calm, uninterrupted focus discovers the rarest pearls.",
            "I gathered luminous moon-kelp for the Apotheca today. Brew carefully, friend.",
            "Surface noise fades when you dive deep into your work. Find your depth."
        ],
        scale: 0.9
    },
    '006': {
        id: '006',
        name: 'Flippur',
        filename: 'Flippur.webp',
        type: 'water',
        loreTitle: 'Reef warden',
        defaultClass: 'Tank',
        greetings: [
            "Crashing waves can't break a living reef! We take the hits and smile right through them.",
            "Acrobatic defense is my specialty. Keep your guard up and your spirits high!",
            "The tide always rises again. Even if yesterday was rough, today is a fresh wave."
        ],
        scale: 1.1
    },

    // Nature Creatures
    '007': {
        id: '007',
        name: 'Leaf',
        filename: 'Leaf.webp',
        type: 'nature',
        loreTitle: 'Botanical alchemist',
        defaultClass: 'Alchemist',
        greetings: [
            "Tiny acorns become mighty canopy oaks. Celebrate your smallest habits today!",
            "Roots grow in the quiet dark before flowers bloom. Trust your silent progress.",
            "I've been tending the greenhouse honeysuckle. One droplet of care changes everything."
        ],
        scale: 0.7
    },
    '008': {
        id: '008',
        name: 'Oaky',
        filename: 'Oaky.webp',
        type: 'nature',
        loreTitle: 'Grove sentinel',
        defaultClass: 'Tank',
        greetings: [
            "Hrummm... Deep roots weather any gale. Stand firm in your commitments.",
            "Take your time, little hero. A forest isn't grown in an hour, but it lasts for centuries.",
            "My heavy boughs will shelter you from fatigue. Rest when you must, then stand tall."
        ],
        scale: 1.0
    },
    '009': {
        id: '009',
        name: 'Seqoio',
        filename: 'Seqoio.webp',
        type: 'nature',
        loreTitle: 'Druid archmage',
        defaultClass: 'Mage',
        greetings: [
            "The ancient forest hums with wisdom. Knowledge gathered daily becomes a crown of stars.",
            "My rings record three hundred seasons of travelers. The consistent ones always reach the peak.",
            "Channel the vitality of the woods into your tasks. Nature wastes nothing."
        ],
        scale: 1.2
    },

    // Earth Creatures
    '010': {
        id: '010',
        name: 'Rockie',
        filename: 'Rockie.webp',
        type: 'earth',
        loreTitle: 'Daisy gardener',
        defaultClass: 'Scout',
        greetings: [
            "Clink-clank! Look at this pretty pink daisy I tucked into my stone shoulder!",
            "Rocks are strong, but gentle flowers make the kingdom smile. I like planting both.",
            "Step by step, pebble by pebble. I'll help pave the garden paths today!"
        ],
        scale: 0.8
    },
    '011': {
        id: '011',
        name: 'Buldour',
        filename: 'Buldour.webp',
        type: 'earth',
        loreTitle: 'Fortress builder',
        defaultClass: 'Tank',
        greetings: [
            "A fortress is built block by block. Today's checklist is the cornerstone.",
            "Square your shoulders! Loose habits make shaky walls. Mortar it in tight.",
            "If your foundation is solid before sundown, no dungeon beast can topple you."
        ],
        scale: 1.0
    },
    '012': {
        id: '012',
        name: 'Montano',
        filename: 'Montano.webp',
        type: 'earth',
        loreTitle: 'Mountain vanguard',
        defaultClass: 'Tank',
        greetings: [
            "The mountain does not flinch when the wind howls. Stand like stone.",
            "I caught three boulders falling from the catapults this morning. Just another workout.",
            "Heavy loads make strong backs. Carry your duties with honor."
        ],
        scale: 1.2
    },

    // Ice Creatures
    '013': {
        id: '013',
        name: 'Icey',
        filename: 'Icey.webp',
        type: 'ice',
        loreTitle: 'Glacier scout',
        defaultClass: 'Scout',
        greetings: [
            "Freeze the excuses. Clean schedules cut through clutter like diamond frost.",
            "Glacial discipline: precise, unmelted, and unstoppable.",
            "A sharp mind requires zero fluff. Mark today's quests and move out."
        ],
        scale: 0.8
    },
    '014': {
        id: '014',
        name: 'Hailey',
        filename: 'Hailey.webp',
        type: 'ice',
        loreTitle: 'Frostweaver',
        defaultClass: 'Mage',
        greetings: [
            "Starlight refracted through ice prisms reveals the clearest paths forward.",
            "Crystallize your thoughts into structured daily goals. Elegance in discipline.",
            "The winter air cools the mind. Study quietly and weave your spells with care."
        ],
        scale: 0.9
    },
    '015': {
        id: '015',
        name: 'Blizzey',
        filename: 'Blizzey.webp',
        type: 'ice',
        loreTitle: 'Polar guardian',
        defaultClass: 'Tank',
        greetings: [
            "Brrr! Big fur coat, bigger shield! No freezing blizzard gets through my watch.",
            "Huddle close if the dungeon gets chilly. We advance together as a team!",
            "Warm hearts conquer cold mountains. Let's tackle today's challenges!"
        ],
        scale: 1.1
    },

    // Electric Creatures
    '016': {
        id: '016',
        name: 'Sparky',
        filename: 'Sparky.webp',
        type: 'special',
        loreTitle: 'Ether dynamo',
        defaultClass: 'Scout',
        greetings: [
            "Zzzt! Static charge at maximum! Let's power up the airship harbor!",
            "Speed, speed, speed! Momentum turns habits into a humming electric grid!",
            "Don't wait around—zap those daily quests right now before the spark fades!"
        ],
        scale: 0.8
    },
    '017': {
        id: '017',
        name: 'Boulty',
        filename: 'Boulty.webp',
        type: 'special',
        loreTitle: 'Storm striker',
        defaultClass: 'Tank',
        greetings: [
            "Hahaha! Thunder rolls when we enter the battlefield! Ready to strike?",
            "A sudden strike breaks any stalemate. Smash through your toughest habit first!",
            "The storm clears the air. Charge straight into the challenge!"
        ],
        scale: 1.0
    },
    '018': {
        id: '018',
        name: 'Voulty',
        filename: 'Voulty.webp',
        type: 'special',
        loreTitle: 'Arcane engineer',
        defaultClass: 'Mage',
        greetings: [
            "Ether current measured at 240 volts of disciplined energy. Splendid.",
            "Engineering an empire requires exact schematics and repeatable daily actions.",
            "My coils hum in harmony with your streak. Efficiency is the truest art."
        ],
        scale: 1.2
    },

    // Dragon Achievements (101-103)
    '101': {
        id: '101',
        name: 'Drakon',
        filename: 'Drakon.webp',
        type: 'fire',
        loreTitle: 'Sky scout',
        defaultClass: 'Scout',
        greetings: [
            "The high winds call my name! I patrol the clouds for approaching Titan Wyrms.",
            "Spread your wings early, traveler. The dawn horizon belongs to those who wake.",
            "A dragon's roar starts with a single ember. Feed your ambition today."
        ],
        scale: 1.2
    },
    '102': {
        id: '102',
        name: 'Fireon',
        filename: 'Fireon.webp',
        type: 'fire',
        loreTitle: 'Citadel warmage',
        defaultClass: 'Mage',
        greetings: [
            "The inner sanctum braziers burn eternally, fueled by your quest milestones.",
            "Sacred fire purges apathy and doubt. Step into the light of achievement.",
            "Ancient dragon magic courses through Valoreth. Wield it with honor."
        ],
        scale: 1.2
    },
    '103': {
        id: '103',
        name: 'Valerion',
        filename: 'Valerion.webp',
        type: 'fire',
        loreTitle: 'Sewer master',
        defaultClass: 'Tank',
        greetings: [
            "I am Valerion! Dragon Lord of Valoreth and overseer of the realm aqueducts.",
            "A kingdom cannot stand if its sewers flood. True sovereignty tends to the plumbing!",
            "Your persistence shakes the mountains, but make sure your pipe pressure is balanced!"
        ],
        scale: 1.3
    },

    // Turtle Milestones (104-106)
    '104': {
        id: '104',
        name: 'Shello',
        filename: 'Shello.webp',
        type: 'water',
        loreTitle: 'Harbor scout',
        defaultClass: 'Scout',
        greetings: [
            "Tide's in! The harbor docks are bustling with trading caravels from distant ports.",
            "Keep your shell polished and your eyes on the horizon. Opportunity docks daily.",
            "A steady glide beats a frantic splash every time."
        ],
        scale: 0.9
    },
    '105': {
        id: '105',
        name: 'Turtlo',
        filename: 'Turtlo.webp',
        type: 'water',
        loreTitle: 'Aegis defender',
        defaultClass: 'Tank',
        greetings: [
            "Rest now, hero. Build your strength with today's habits and try again.",
            "Under my shell, you are safe from any storm. Slow and steady wins the race.",
            "Patience, young champion. Great realms are protected by gentle persistence."
        ],
        scale: 1.0
    },
    '106': {
        id: '106',
        name: 'Turtoisy',
        filename: 'Turtoisy.webp',
        type: 'water',
        loreTitle: 'Ancient sage',
        defaultClass: 'Mage',
        greetings: [
            "Three hundred years of walking taught me: moving 0.01 mph is still moving forward.",
            "Ancient waters hold ancient wisdom. Read your scrolls, log your thoughts.",
            "Do not rush the sunrise. Complete each habit with mindful grace."
        ],
        scale: 1.2
    },

    // Special/Monster Creatures
    '201': {
        id: '201',
        name: 'Drakon',
        filename: 'Drakon.webp',
        type: 'monster',
        loreTitle: 'Abyssal drake',
        defaultClass: 'Tank',
        greetings: ["I sleep... for now.", "You are worthy of my flames.", "The fire burns deep within."],
        scale: 1.3
    },
    '000': {
        id: '000',
        name: 'Necrion',
        filename: 'Necrion.webp',
        type: 'special',
        loreTitle: 'Shadow scholar',
        defaultClass: 'Mage',
        greetings: [
            "The shadows whisper ancient formulas. Focus is the master key.",
            "Repetition hones the sharpest spells. Keep practicing.",
            "Darkness falls, but knowledge illuminates the path."
        ],
        scale: 1.0
    },

    // Animals
    '901': {
        id: '901',
        name: 'Wooly Sheep',
        filename: 'sheep.webp',
        type: 'nature',
        loreTitle: 'Meadow artisan',
        defaultClass: 'Alchemist',
        greetings: [
            "Baaa... the clover is so sweet today! Care for a handful of golden wool?",
            "No hurry, no fuss. Munching grass and weaving banners one thread at a time.",
            "Gentle meadows breed gentle hearts. Take a deep breath with me... baaa."
        ],
        scale: 0.65
    },
    '902': {
        id: '902',
        name: 'Wild Horse',
        filename: 'horse.webp',
        type: 'nature',
        loreTitle: 'Realm courier',
        defaultClass: 'Scout',
        greetings: [
            "Neigh! The open steppe stretches before us! Let's gallop across the horizon!",
            "Snort! Free spirit, wild wind, and unstoppable momentum! Ready to ride?",
            "I can carry your message across the widest valley in the blink of an eye."
        ],
        scale: 1.15
    },
    '903': {
        id: '903',
        name: 'Happy Penguin',
        filename: 'penguin.webp',
        type: 'ice',
        loreTitle: 'Slide master',
        defaultClass: 'Scout',
        greetings: [
            "Noot noot! Belly-sliding is the only true way to travel! Spare a fish?",
            "Waddle, waddle, zooooom! Turn obstacles into clean ice glides!",
            "Why walk when you can slide at top speed? Come race me across the pond!"
        ],
        scale: 0.55
    }
};
