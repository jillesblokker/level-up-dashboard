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
        description: "The Kingdom of Thrivehaven was covered in dark mist. Castle Valoreth lay in ruins, its courtyard overgrown and its gates broken. But when you finished your first daily task, a bright spark of magic lit up the air. Archmage Turtoisy saw it happen: every good habit you complete gives off real energy, letting you clean up the rubble of the north tower and rebuild the kingdom stone by stone.",
        levelRequirement: 1,
        image: "/images/chronicles/chronicle_image_1.webp"
    },
    {
        id: 2,
        title: "The First Companion",
        description: "As the sun broke through the grey clouds, an Elemental Spirit stepped out from the woods. Drawn by your daily momentum, it joined your side as your pet. You learned the first rule of Thrivehaven magic: as your own real-life habits make you stronger, your companion absorbs your power to grow right alongside you.",
        levelRequirement: 10,
        image: "/images/chronicles/chronicle_image_2.webp"
    },
    {
        id: 3,
        title: "Laying the Foundations",
        description: "With your companion helping, gold earned from your tasks funded the repair work. Rockie and Buldour helped haul heavy granite to patch the broken city gate. You dusted off the dungeon floor, fixed up the old bakery, and swept the ash from the blacksmith forge. Life was returning to Thrivehaven.",
        levelRequirement: 20,
        image: "/images/chronicles/chronicle_image_3.webp"
    },
    {
        id: 4,
        title: "A Gathering of Citizens",
        description: "News of your rebuilt town spread fast. Archmage Turtoisy opened ancient mythic cards, calling elemental mythics like Minotaur and Cyclops back home. They moved into your town, harvesting crops and collecting timber whenever you finished your daily routines.",
        levelRequirement: 30,
        image: "/images/chronicles/chronicle_image_4.webp"
    },
    {
        id: 5,
        title: "The Frost Season",
        description: "When cold winter days arrive over the kingdom, Icey and Blizzey gather near the warm hearth. During chilly seasons, you rebuild Thrivehaven through focused home habit tasks, keeping the fortress cozy while frosty winds blow across the peaks.",
        levelRequirement: 40,
        image: "/images/chronicles/chronicle_image_5.webp"
    },
    {
        id: 6,
        title: "The Iron Peaks Alliance",
        description: "Queen Valandriel of Iron Peaks rode through your gates with royal guards. Seeing your creatures evolve into mighty forms like Oaky and Seqoio powered by your daily habits, she offered a trade alliance, opening new mountain roads and secret potion recipes in the Alchemist Cauldron.",
        levelRequirement: 50,
        image: "/images/chronicles/chronicle_image_6.webp"
    },
    {
        id: 7,
        title: "The Flourishing City",
        description: "Thrivehaven was no longer a ruined outpost. Ignisio and Vulcana kept the Blacksmith forge burning day and night, while Flippur kept the water mills spinning. You replaced the old cobblestones, rebuilt the watchtowers, and turned Castle Valoreth into a safe stronghold.",
        levelRequirement: 60,
        image: "/images/chronicles/chronicle_image_7.webp"
    },
    {
        id: 8,
        title: "The Shadow's Edge",
        description: "Every bright fire casts a shadow. Deep under the earth, an ancient enemy named Necrion woke up. Necrion grows stronger whenever people break their promises or give up on their habits. Only your daily streak pyres keep his dark mist from creeping back into town.",
        levelRequirement: 70,
        image: "/images/chronicles/chronicle_image_8.webp"
    },
    {
        id: 9,
        title: "The Mythic Horizon",
        description: "As Necrion's dark creatures attacked the gates, the sky opened up. Drawn by the sheer energy of your daily habits, the legendary dragon Drakon flew down and landed on the castle wall. With a blast of bright fire, Drakon joined your fight against the shadow army.",
        levelRequirement: 80,
        image: "/images/chronicles/chronicle_image_9.webp"
    },
    {
        id: 10,
        title: "Master of the Realm",
        description: "You weren't just fixing old walls anymore, you were a true Leader. Your daily habits in the real world gave your kingdom the strength it needed to push Necrion's shadow beasts back into the dark pit.",
        levelRequirement: 90,
        image: "/images/chronicles/chronicle_image_10.webp"
    },
    {
        id: 11,
        title: "Epilogue: The Eternal Kingdom",
        description: "Thrivehaven stands strong against the sky. Necrion's dark magic is gone, beaten by your daily consistency. The streets are clean, the citizens are safe, and Castle Valoreth is a proud fortress built one good habit at a time.",
        levelRequirement: 100,
        image: "/images/chronicles/chronicle_image_11.webp"
    }
];

export function getCurrentChapter(level: number): Chapter {
    const chapter = CHRONICLES_DATA.slice().reverse().find(chapter => level >= chapter.levelRequirement);
    return chapter || CHRONICLES_DATA[0] as Chapter;
}

export function getNextChapter(level: number): Chapter | null {
    return CHRONICLES_DATA.find(chapter => chapter.levelRequirement > level) || null;
}
