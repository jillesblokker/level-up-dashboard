export interface Chapter {
    id: number;
    title: string;
    description: string;
    levelRequirement: number; // User level required to unlock
    image?: string; // Placeholder for future images
}

export const CHRONICLES_DATA: Chapter[] = [
    {
        id: 1,
        title: "The Awakening",
        description: "The Kingdom of Thrivehaven lay dormant, shrouded in the grey mists of the Void Drift. For generations, Castle Valoreth was little more than ruins. But as you set your first daily habits, Ether Sparks flared into existence. Archmage Silvo recognized the ancient magic: your real-world discipline was restoring the realm stone by stone.",
        levelRequirement: 1,
        image: "/images/chronicles/chronicle_image_1.png"
    },
    {
        id: 2,
        title: "The First Companion",
        description: "As sunrays broke through the clouds over Thrivehaven, an elemental spirit—Ember Drake, Sage Owl, or Spirit Sprite—emerged from the outskirts. Drawn by your daily momentum, a sacred bond was forged. You realized that as your habits strengthened your own life, your companion absorbed your Ether to grow beside you.",
        levelRequirement: 10,
        image: "/images/chronicles/chronicle_image_2.png"
    },
    {
        id: 3,
        title: "Laying the Foundations",
        description: "With your companion at your side, gold earned from completed habits funded the reconstruction of Castle Valoreth. Sturdy citizens, Rockie and Buldour, emerged from the crags to heave granite into place. Farms, sawmills, and forge hearths took shape—the heart of Thrivehaven was beating again.",
        levelRequirement: 20,
        image: "/images/chronicles/chronicle_image_3.png"
    },
    {
        id: 4,
        title: "A Gathering of Citizens",
        description: "Word of Thrivehaven's revival reached distant biomes. Archmage Silvo unsealed ancient Mythic Packs, summoning elemental citizens from Leafio to Seqoio. Eager to rebuild their ancestral home, they settled in your kingdom, harvesting crops and materials as you maintained your routines.",
        levelRequirement: 30,
        image: "/images/chronicles/chronicle_image_4.png"
    },
    {
        id: 5,
        title: "The Weather's Will",
        description: "The skies of Thrivehaven reflect your inner state. When you maintain a strong streak, Icey and Blizzey dance beneath radiant, gentle snows. But on days when discipline falters, dark stormclouds gather—a reminder that the realm's vitality depends entirely on your daily momentum.",
        levelRequirement: 40,
        image: "/images/chronicles/chronicle_image_5.png"
    },
    {
        id: 6,
        title: "The Sunspire Alliance",
        description: "Impressed by your growing citadel, Queen Beatrice of the Sunspire Empire arrived with royal envoys. Seeing your companion evolve into a majestic form powered by discipline, she pledged an alliance, opening regional trade routes and legendary Alchemist Cauldron recipes.",
        levelRequirement: 50,
        image: "/images/chronicles/chronicle_image_6.png"
    },
    {
        id: 7,
        title: "The Flourishing City",
        description: "Thrivehaven was no longer a mere outpost; it was a grand medieval metropolis. Vulcana stoked the Blacksmith forge with fiery passion, while Flippur managed the crystal waterways. Castle Valoreth stood tall, glowing with the prosperity of a masterfully rebuilt world.",
        levelRequirement: 60,
        image: "/images/chronicles/chronicle_image_7.png"
    },
    {
        id: 8,
        title: "The Shadow's Edge",
        description: "Light casts a shadow. From the abyss of broken habits rose Necrion, an ancient avatar of apathy seeking to plunge Thrivehaven into eternal decay. Only your unwavering daily discipline and glowing Streak Pyres keep Necrion's corrupting mists at bay.",
        levelRequirement: 70,
        image: "/images/chronicles/chronicle_image_8.png"
    },
    {
        id: 9,
        title: "The Mythic Horizon",
        description: "As the battle against apathy intensified, the heavens parted. Drawn by the sheer force of your Ether Sparks, the legendary dragon Drakon descended. With a roar that echoed across Castle Valoreth, Drakon joined your cause, pushing back Necrion's shadows with intense dragonfire.",
        levelRequirement: 80,
        image: "/images/chronicles/chronicle_image_9.png"
    },
    {
        id: 10,
        title: "Master of the Realm",
        description: "You had become more than a builder—you were the Sovereign of Thrivehaven. Your real-world actions and digital kingdom united in perfect harmony, banishing Necrion's shadow beasts back into the Void Drift and restoring lasting peace to the realm.",
        levelRequirement: 90,
        image: "/images/chronicles/chronicle_image_10.png"
    },
    {
        id: 11,
        title: "Epilogue: The Eternal Kingdom",
        description: "Thrivehaven stands as an eternal beacon of your resolve. Necrion's dark magic is subdued forever by the light of your consistency. The skies are radiant, your citizens flourish, and Castle Valoreth shines as a monument to what daily discipline can achieve.",
        levelRequirement: 100,
        image: "/images/chronicles/chronicle_image_11.png"
    }
];

export function getCurrentChapter(level: number): Chapter {
    // Find the highest chapter whose requirement is met
    const chapter = CHRONICLES_DATA.slice().reverse().find(chapter => level >= chapter.levelRequirement);
    return chapter || CHRONICLES_DATA[0] as Chapter;
}

export function getNextChapter(level: number): Chapter | null {
    return CHRONICLES_DATA.find(chapter => chapter.levelRequirement > level) || null;
}
