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
        description: "You wake up in a small, dusty room. The sun peeks through the cracks in the wooden shutters. You feel a strange energy in the air. It is time to leave your old life behind and forge a new destiny.",
        dayRequirement: 0
    },
    {
        id: 2,
        title: "The Call to Adventure",
        description: "You have stepped out of your comfort zone. The village elder notices your determination and gifts you a rusty sword. 'The world is vast,' he says, 'and dangerous. But you are ready.'",
        dayRequirement: 7
    },
    {
        id: 3,
        title: "The First Trial",
        description: "The path leads you into the Darkwood. Shadows dance between the trees, and you hear the growl of wolves. Your resolve is tested. Will you turn back, or press on?",
        dayRequirement: 14
    },
    {
        id: 4,
        title: "The Shadow Rising",
        description: "You have survived the forest, but a greater threat looms. Rumors of a dark sorcerer gathering power in the north reach your ears. The kingdom needs a hero.",
        dayRequirement: 21
    },
    {
        id: 5,
        title: "The Knight's Oath",
        description: "Your deeds have not gone unnoticed. The King himself summons you to the capital. Kneeling before the throne, you swear an oath to protect the realm. You are no longer a wanderer; you are a Knight.",
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
