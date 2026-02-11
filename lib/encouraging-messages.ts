/**
 * Encouraging messages from characters triggered by productivity milestones.
 */

export interface EncouragingMessage {
    character: string;
    message: string;
}

type MilestoneMessages = {
    [key: string]: {
        [character: string]: string[];
    };
};

export const MILESTONE_POOL: MilestoneMessages = {
    // Today's Quest Count Milestones
    "quests_3": {
        "Flamio": [
            "Little sparks lead to big blazes! Nice start!",
            "You're warming up! I can feel the heat from here!"
        ],
        "Rockie": [
            "Three stones down. A decent start, I suppose...",
            "Hmph. At least you're not just sitting around like a pebble."
        ],
        "Leaf": [
            "Yay! Three things done! You're a busy bee today!",
            "Look at you sprout! Three whole seeds planted already!"
        ]
    },
    "quests_5": {
        "Embera": [
            "The fire is rising. Five tasks consumed by your will!",
            "You're glowing with purpose! Keep that flame fed!"
        ],
        "Dolphio": [
            "Five in a row! You're making a huge splash today!",
            "High five! You're swimming through these like a pro!"
        ],
        "Icey": [
            "Five tasks? Cool. Very cool. Stay frosty, boss.",
            "You're on a roll. Don't let your momentum melt away!"
        ]
    },
    "quests_10": {
        "Flamio": [
            "BOOM! Ten quests! You're an absolute supernova today!",
            "You're ON FIRE! Someone call the guards, we've got a legend here!"
        ],
        "Vulcana": [
            "TOTAL DOMINATION! Ten tasks crushed! THE INFERNO CONSUMES!",
            "UNSTOPPABLE! Your power overflows with every completed quest!"
        ],
        "Necrion": [
            "Ten shadows vanquished. Your mortal spirit is... persistent.",
            "A decade of deeds. The darkness is impressed by your light."
        ],
        "Seqoio": [
            "Ten rings added to your legacy. You stand tall among men.",
            "A forest of achievements. You are a giant in this realm."
        ]
    },
    // Streak Milestones
    "streak_3": {
        "Oaky": [
            "Three... days... of... growth... I... approve...",
            "Roots... taking... hold... keep... growing... little... one..."
        ],
        "Divero": [
            "Three days. You've found the current. Just ride the wave.",
            "Consistency is the deepest water. Three days of perfect flow."
        ],
        "Rockie": [
            "Three days? Solid as a mountain. Don't crumble now.",
            "You're building something heavy. Three layers deep."
        ]
    },
    "streak_7": {
        "Montano": [
            "SEVEN DAYS OF IRON! YOU ARE UNYIELDING AS THE PEAK!",
            "A WEEK OF STRENGTH! THE EARTH RECOGNIZES YOUR WILL!"
        ],
        "Drakon": [
            "You have the heart of a dragon. A week of fire and fury!",
            "Seven suns, seven victories. You are becoming a legend."
        ],
        "Necrion": [
            "A full cycle of a week. Not even the void can break your habit.",
            "Seven days... I have been watching, and I am surprised by your resolve."
        ]
    }
};

/**
 * Picks a random character and random message for a specific milestone key.
 */
export function getMilestoneMessage(milestoneKey: string): EncouragingMessage | null {
    const milestone = MILESTONE_POOL[milestoneKey];
    if (!milestone) return null;

    const characters = Object.keys(milestone);
    const randomCharacter = characters[Math.floor(Math.random() * characters.length)];
    if (!randomCharacter) return null;

    const messages = milestone[randomCharacter];
    if (!messages) return null;

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    if (!randomMessage) return null;

    return {
        character: randomCharacter,
        message: randomMessage
    };
}
