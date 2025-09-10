// Achievement message mappings based on improved-achievement-toast-messages.md

export interface AchievementMessage {
  title: string;
  description: string;
}

export const achievementMessages: Record<string, AchievementMessage> = {
  // Destruction Achievements (001-015)
  '001': {
    title: "🔥 Flamio Emerges!",
    description: "While clearing a path by destroying 1 forest tile, you discover the fiery creature Flamio and 25 gold for your treasure pile!"
  },
  '002': {
    title: "🔥 Embera Awakens!",
    description: "While clearing a path by destroying 5 forest tiles, you find the fierce Embera and 50 gold for your treasure pile!"
  },
  '003': {
    title: "🔥 Vulcana Rises!",
    description: "While clearing a path by destroying 10 forest tiles, you awaken the ultimate fire creature Vulcana and 100 gold for your treasure pile!"
  },
  '004': {
    title: "💧 Dolpio Emerges!",
    description: "While clearing a path by destroying 1 water tile, you discover the playful water creature Dolpio and 25 gold for your treasure pile!"
  },
  '005': {
    title: "💧 Divero Awakens!",
    description: "While clearing a path by destroying 5 water tiles, you find the experienced water dweller Divero and 50 gold for your treasure pile!"
  },
  '006': {
    title: "💧 Flippur Rises!",
    description: "While clearing a path by destroying 10 water tiles, you awaken the supreme water creature Flippur and 100 gold for your treasure pile!"
  },
  '007': {
    title: "🌿 Leaf Discovered!",
    description: "While planting your first forest, you discover the small grass creature Leaf and 25 gold for your treasure pile!"
  },
  '008': {
    title: "🌿 Oaky Awakens!",
    description: "While creating a lush forest, you find the wise tree spirit Oaky and 50 gold for your treasure pile!"
  },
  '009': {
    title: "🌿 Seqoio Rises!",
    description: "While creating a magnificent forest realm, you awaken the supreme forest guardian Seqoio and 100 gold for your treasure pile!"
  },
  '010': {
    title: "⛰️ Rockie Emerges!",
    description: "While clearing a path by destroying 1 mountain tile, you discover the mountain spirit Rockie and 25 gold for your treasure pile!"
  },
  '011': {
    title: "⛰️ Buldour Awakens!",
    description: "While clearing a path by destroying 5 mountain tiles, you find the stronger mountain spirit Buldour and 50 gold for your treasure pile!"
  },
  '012': {
    title: "⛰️ Montano Rises!",
    description: "While clearing a path by destroying 10 mountain tiles, you awaken the ultimate mountain creature Montano and 100 gold for your treasure pile!"
  },
  '013': {
    title: "❄️ Icey Emerges!",
    description: "While clearing a path by destroying 1 ice tile, you discover the small ice creature Icey and 25 gold for your treasure pile!"
  },
  '014': {
    title: "❄️ Hailey Awakens!",
    description: "While clearing a path by destroying 5 ice tiles, you find the powerful ice spirit Hailey and 50 gold for your treasure pile!"
  },
  '015': {
    title: "❄️ Blizzey Rises!",
    description: "While clearing a path by destroying 10 ice tiles, you awaken the supreme ice creature Blizzey and 100 gold for your treasure pile!"
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
  return match ? match[1] : null;
}
