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
        description: "The Realm of Valoreth lay dormant, its skies gray and its fields silent. For generations, the land had slept, waiting for a ruler whose daily actions could breathe life back into its soil. When you arrived, the Grand Citadel was little more than a memory carved in stone. But as you set your first goals and completed your first tasks, a spark of Essence materialized in the air. The journey to rebuild the Kingdom had begun.",
        levelRequirement: 1,
        image: "/images/chronicles/chronicle_image_1.png"
    },
    {
        id: 2,
        title: "The First Companion",
        description: "As the first golden sunbeams pierced the overcast sky, a brave creature emerged from the wild outskirts of Valoreth. Drawn by the growing momentum of your daily habits, they approached the Citadel. By designating them as your Partner, a deep bond was forged. You realized that the stronger you became in your own life, the more Essence you could share, helping your Partner grow alongside you.",
        levelRequirement: 10,
        image: "/images/chronicles/chronicle_image_2.png"
    },
    {
        id: 3,
        title: "Laying the Foundations",
        description: "With your Partner at your side, your ambitions grew. The gold earned from your daily quests began to fund the reconstruction of the Kingdom. Sturdy earth creatures, Rockie and Buldour, emerged from the crags to help you heave the heavy stones into place. The first tiles were laid: a humble farm, a bustling bakery, a sturdy blacksmith. Valoreth's heart began to beat once more.",
        levelRequirement: 20,
        image: "/images/chronicles/chronicle_image_3.png"
    },
    {
        id: 4,
        title: "A Gathering of Citizens",
        description: "Word of your flourishing Kingdom spread across the land. From the Crystal Caverns to the Endless Frost, ancient Mythic Packs were discovered. As you broke their seals, wondrous allies like the fiery Flamio and the playful Dolphio revealed themselves. Eager to join your cause, they wandered your lands, passively generating the resources needed to expand your empire.",
        levelRequirement: 30,
        image: "/images/chronicles/chronicle_image_4.png"
    },
    {
        id: 5,
        title: "The Weather's Will",
        description: "You soon learned that Valoreth was intrinsically tied to your inner state. When you held your focus and maintained a high streak, Icey and Blizzey would dance joyfully as radiant, gentle snow blanketed the realm. But on days when discipline faltered, the skies darkened, casting a stormy, overcast shadow—a reminder that the realm relied entirely on your momentum.",
        levelRequirement: 40,
        image: "/images/chronicles/chronicle_image_5.png"
    },
    {
        id: 6,
        title: "The Power of Evolution",
        description: "Having absorbed the Essence of countless completed habits, your faithful Partner underwent a brilliant transformation. With a surge of radiant energy, they evolved into a stronger, more majestic form. This evolution unlocked new abilities and passive perks, proving that your real-world growth fueled their power in beautiful synergy.",
        levelRequirement: 50,
        image: "/images/chronicles/chronicle_image_6.png"
    },
    {
        id: 7,
        title: "The Flourishing City",
        description: "The Kingdom was no longer a mere outpost; it was a sprawling, functional metropolis. The fierce Vulcana operated the Blacksmith's forge with endless, fiery energy, while the agile Flippur managed the kingdom's waterways. The grid was a testament to your strategic planning. Valoreth was alive, glowing with the prosperity of a well-maintained realm.",
        levelRequirement: 60,
        image: "/images/chronicles/chronicle_image_7.png"
    },
    {
        id: 8,
        title: "The Shadow's Edge",
        description: "But light casts a shadow. A dark threat rose from the forgotten corners of the realm—the ancient necromancer, Necrion. Feeding on the stagnant energy of missed habits and broken streaks, Necrion sought to plunge Valoreth back into eternal slumber. Only your unwavering daily dedication and glowing streak shields could keep his corrupting magic at bay.",
        levelRequirement: 70,
        image: "/images/chronicles/chronicle_image_8.png"
    },
    {
        id: 9,
        title: "The Mythic Horizon",
        description: "As the battle against stagnation intensified, the skies tore open. Drawn to your unparalleled discipline and the sheer force of your Essence, the legendary mythic dragon Drakon descended. With a roar that shook the Citadel, Drakon joined your cause, turning the tide against Necrion's encroaching shadows with blinding, holographic fire.",
        levelRequirement: 80,
        image: "/images/chronicles/chronicle_image_9.png"
    },
    {
        id: 10,
        title: "Master of the Realm",
        description: "You had become more than a ruler. You, Drakon, and your evolved Citizens united in perfect harmony. Your real-world actions flowed seamlessly into the digital realm, creating an unbreakable loop of positive reinforcement. Together, the Tripartite systems pushed Necrion's forces back into the abyss, restoring peace to the Kingdom.",
        levelRequirement: 90,
        image: "/images/chronicles/chronicle_image_10.png"
    },
    {
        id: 11,
        title: "Epilogue: The Eternal Kingdom",
        description: "Valoreth stands as a beacon of your unwavering resolve. Necrion's dark magic is subdued forever, banished by the light of your consistency. The skies are radiant, your Citizens thrive, and the Grand Citadel is the heart of a vibrant world. The story of its rebuilding is complete, but an Eternal Kingdom is maintained, day by day, through the magic of habit.",
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
