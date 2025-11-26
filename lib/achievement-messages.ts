// Achievement message mappings based on improved-achievement-toast-messages.md

export interface AchievementMessage {
  title: string;
  description: string;
}

export const achievementMessages: Record<string, AchievementMessage> = {
  // Destruction Achievements (001-015)
  '001': {
    title: "🔥 Flamio Emerges!",
    description: "You smashed a tree and out popped Flamio! 'Hey! Watch it!' he sputters, sparks flying. He tosses you 25 gold to leave him alone."
  },
  '002': {
    title: "🔥 Embera Awakens!",
    description: "The smoke clears to reveal Embera. 'Finally, some room to breathe!' she roars, her flames dancing. She grants you 50 gold for clearing the clutter."
  },
  '003': {
    title: "🔥 Vulcana Rises!",
    description: "Vulcana erupts from the ashes! 'DESTRUCTION! I LOVE IT!' The ultimate fire spirit is impressed by your chaos and awards you 100 gold."
  },
  '004': {
    title: "💧 Dolpio Emerges!",
    description: "Splish splash! You found Dolpio playing in a puddle. 'Wanna play tag?' he chirps, handing you a wet pouch of 25 gold."
  },
  '005': {
    title: "💧 Divero Awakens!",
    description: "Divero surfaces with a cool nod. 'Nice flow you got there, kid.' He slides 50 gold your way before diving back into the deep."
  },
  '006': {
    title: "💧 Flippur Rises!",
    description: "The supreme Flippur rises on a wave. 'You have mastered the tides,' he bubbles. He bestows upon you 100 gold and a splash of respect."
  },
  '007': {
    title: "🌿 Leaf Discovered!",
    description: "A tiny sprout pops up—it's Leaf! 'Yay! A new friend!' He giggles and gives you 25 gold he found in the dirt."
  },
  '008': {
    title: "🌿 Oaky Awakens!",
    description: "Oaky stretches his wooden limbs. 'Growth... takes... time...' he rumbles slowly. 'Here... is... 50 gold... for... your... patience.'"
  },
  '009': {
    title: "🌿 Seqoio Rises!",
    description: "The ancient Seqoio towers over you. 'You build a legacy for the ages.' The guardian blesses your realm with 100 gold and eternal shade."
  },
  '010': {
    title: "⛰️ Rockie Emerges!",
    description: "You chip away a rock and find... Rockie. He stares at you. 'I was napping,' he grumbles, handing over 25 gold so you'll stop making noise."
  },
  '011': {
    title: "⛰️ Buldour Awakens!",
    description: "Buldour rumbles into view. 'Hmph. Good smash.' The strong spirit respects your strength and leaves a heavy sack of 50 gold."
  },
  '012': {
    title: "⛰️ Montano Rises!",
    description: "The ground shakes as Montano stands tall. 'YOU MOVE MOUNTAINS LIKE PEBBLES.' The ancient giant honors your power with 100 gold."
  },
  '013': {
    title: "❄️ Icey Emerges!",
    description: "Brrr! Icey shivers into existence. 'Close the door, you're letting the heat in!' He tosses 25 gold at you with a cold shoulder."
  },
  '014': {
    title: "❄️ Hailey Awakens!",
    description: "Hailey glides forward, elegant and sharp. 'A precise strike,' she observes coolly. She awards you 50 gold, frosted with approval."
  },
  '015': {
    title: "❄️ Blizzey Rises!",
    description: "A blizzard swirls, revealing Blizzey. 'The cold never bothered you anyway,' he intones. The supreme ice spirit grants you 100 gold for your frozen heart."
  },

  // Monster Battle Achievements (201-206)
  '201': {
    title: "🐉 Dragon Slayer!",
    description: "After an epic Simon Says battle, you have vanquished the Ancient Dragon Dragoni and earned 100 gold and 100 XP for your legendary victory!"
  },
  '202': {
    title: "👹 Goblin Hunter!",
    description: "After a quick Simon Says battle, you have defeated the Crafty Goblin Orci and earned 100 gold and 100 XP for your swift victory!"
  },
  '203': {
    title: "🧌 Troll Crusher!",
    description: "After a challenging Simon Says battle, you have crushed the Mountain Troll Trollie and earned 100 gold and 100 XP for your mighty victory!"
  },
  '204': {
    title: "🧙 Dark Wizard Vanquished!",
    description: "After an intense Simon Says battle, you have vanquished the Dark Wizard Sorcero and earned 100 gold and 100 XP for your magical victory!"
  },
  '205': {
    title: "🦄 Pegasus Tamed!",
    description: "After a mystical Simon Says battle, you have tamed the Mystical Pegasus Peggie and earned 100 gold and 100 XP for your enchanting victory!"
  },
  '206': {
    title: "🧚 Fairy Friend!",
    description: "After a delightful Simon Says battle, you have befriended the Enchanted Fairy Fairiel and earned 100 gold and 100 XP for your charming victory!"
  },

  // Special Achievements
  '000': {
    title: "☠️ Necrion Discovered!",
    description: "As you navigate to the realm map, you discover the mysterious poisonous creature Necrion and 25 gold for your treasure pile!"
  }
};

export function getAchievementMessage(achievementId: string): AchievementMessage | null {
  return achievementMessages[achievementId] || null;
}

export function getAchievementIdFromSource(source: string): string | null {
  // Extract achievement ID from source strings like "achievement-015"
  const match = source.match(/achievement-(\d+)/);
  return match?.[1] ?? null;
}
