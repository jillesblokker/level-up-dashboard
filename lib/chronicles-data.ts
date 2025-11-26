export interface Chapter {
    id: number;
    title: string;
    description: string;
    dayRequirement: number; // Days of streak required to unlock
    image?: string; // Placeholder for future images
}

export const CHRONICLES_DATA: Chapter[] = [
    {
        id: 1,
        title: "The Awakening",
        description: "Awakening in the humble stone cell of the Abbey of Dawn, you spot Dolpio splashing happily in the holy font and Flamio grumbling in the hearth. The ancient sigil of Sir Valor glimmers, urging you to rise. A whisper of the Goblin Scouts brushes past, heralding the adventure that beckons beyond the iron gates.",
        dayRequirement: 0
    },
    {
        id: 2,
        title: "The Call to Adventure",
        description: "Venturing beyond the thatched roofs of Willowbrook, Lady Lore bestows upon you the Blade of the First Dawn. In the wild foothills, the earth grumbles with Rockie's rude awakening and Embera's impatient fire, testing your mettle. Lady Lore speaks of the looming Shadow Sorcerer and the brave knights who fell, yet your heart burns with resolve.",
        dayRequirement: 7
    },
    {
        id: 3,
        title: "The First Trial",
        description: "The winding trail leads into the foreboding Darkwood, where the cackling goblin Orci and the lumbering troll Trollie lay in wait. The dreaded Wraiths stalk the underbrush, but the rising power of Vulcana and Montano shields you as the banner of the Champion flutters in the cold wind.",
        dayRequirement: 14
    },
    {
        id: 4,
        title: "The Shadow Rising",
        description: "Emerging from the cursed forest, you hear the drums of Sorcero, the Dark Wizard. His legion marches, led by the roaring Dragoni and the cold-hearted Blizzey. Heralds of Thrivehaven speak of fallen heroes, calling for a new champion to rally the kingdom's banners against this gathering storm.",
        dayRequirement: 21
    },
    {
        id: 5,
        title: "The Knight's Oath",
        description: "Your valor echoes through the Golden Citadel. The majestic Peggie and the giggling Fairiel grace your arrival at the Sunforge throne. Before the King, you take the Oath of the Silver Shield, joining the Knights of Thrivehaven to banish the poisonous shadow of Necrion forever.",
        dayRequirement: 30
    }
];

export function getCurrentChapter(streak: number): Chapter {
    // Find the highest chapter whose requirement is met
    const chapter = CHRONICLES_DATA.slice().reverse().find(chapter => streak >= chapter.dayRequirement);
    return chapter || CHRONICLES_DATA[0] as Chapter;
}

export function getNextChapter(streak: number): Chapter | null {
    return CHRONICLES_DATA.find(chapter => chapter.dayRequirement > streak) || null;
}
