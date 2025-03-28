// Interfaces for different item types
export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
}

export interface WeaponItem extends StoreItem {
  stats: {
    attack: number;
  };
}

export interface ArmorItem extends StoreItem {
  stats: {
    defense: number;
  };
}

export interface PotionItem extends StoreItem {
  stats: {
    health?: number;
    mana?: number;
    stamina?: number;
  };
}

export interface FoodItem extends StoreItem {
  effect: string;
}

export interface MountItem extends StoreItem {
  speed: number;
  stamina: number;
}

export interface MagicItem extends StoreItem {
  power: number;
  element?: string;
}

// City Item Manager Class
export class CityItemManager {
  // Shop items (Blacksmith & General Store)
  static getShopItems(): WeaponItem[] {
    return [
      {
        id: "iron-sword",
        name: "Iron Sword",
        description: "A sturdy iron sword for combat.",
        price: 150,
        category: "weapon",
        stats: {
          attack: 10,
        },
        image: "item-sword-1"
      },
      {
        id: "steel-dagger",
        name: "Steel Dagger",
        description: "Fast and deadly at close range.",
        price: 125,
        category: "weapon",
        stats: {
          attack: 8,
        },
        image: "item-dagger-1"
      },
      {
        id: "hunters-bow",
        name: "Hunter's Bow",
        description: "Accurate and powerful ranged weapon.",
        price: 180,
        category: "weapon",
        stats: {
          attack: 12,
        },
        image: "item-bow-1"
      }
    ];
  }

  // Tavern items
  static getTavernItems(): FoodItem[] {
    return [
      {
        id: "hearty-stew",
        name: "Hearty Stew",
        description: "A filling stew that warms the soul.",
        price: 12,
        category: "food",
        effect: "Restores 15 health points",
        image: "item-food-1"
      },
      {
        id: "dwarven-ale",
        name: "Dwarven Ale",
        description: "Strong brew from the mountains.",
        price: 8,
        category: "drink",
        effect: "Temporarily increases strength by 5",
        image: "item-drink-1"
      },
      {
        id: "elven-wine",
        name: "Elven Wine",
        description: "Delicate, sweet wine from ancient vineyards.",
        price: 15,
        category: "drink",
        effect: "Temporarily increases intelligence by 5",
        image: "item-drink-2"
      }
    ];
  }

  // Temple items
  static getTempleItems(): MagicItem[] {
    return [
      {
        id: "healing-scroll",
        name: "Healing Scroll",
        description: "Ancient scroll with healing incantations.",
        price: 75,
        category: "scroll",
        power: 20,
        element: "light",
        image: "item-scroll-1"
      },
      {
        id: "blessed-amulet",
        name: "Blessed Amulet",
        description: "Provides divine protection to the wearer.",
        price: 250,
        category: "amulet",
        power: 15,
        element: "holy",
        image: "item-amulet-1"
      },
      {
        id: "prayer-beads",
        name: "Prayer Beads",
        description: "Sacred beads that focus spiritual energy.",
        price: 120,
        category: "artifact",
        power: 10,
        element: "spirit",
        image: "item-beads-1"
      }
    ];
  }

  // Stables items
  static getStablesItems(): MountItem[] {
    return [
      {
        id: "bay-horse",
        name: "Bay Horse",
        description: "A reliable and sturdy steed.",
        price: 500,
        category: "mount",
        speed: 15,
        stamina: 20,
        image: "item-horse-1"
      },
      {
        id: "black-stallion",
        name: "Black Stallion",
        description: "A swift and powerful mount.",
        price: 850,
        category: "mount",
        speed: 25,
        stamina: 18,
        image: "item-horse-2"
      },
      {
        id: "mountain-pony",
        name: "Mountain Pony",
        description: "Small but exceptionally hardy.",
        price: 300,
        category: "mount",
        speed: 10,
        stamina: 30,
        image: "item-pony-1"
      }
    ];
  }

  // Castle items
  static getCastleItems(): StoreItem[] {
    return [
      {
        id: "royal-insignia",
        name: "Royal Insignia",
        description: "Symbol of allegiance to the crown.",
        price: 200,
        category: "artifact",
        image: "item-insignia-1"
      },
      {
        id: "nobility-seal",
        name: "Nobility Seal",
        description: "Grants access to nobility quarters.",
        price: 500,
        category: "artifact",
        image: "item-seal-1"
      },
      {
        id: "knight-commission",
        name: "Knight Commission",
        description: "Official document recognizing knighthood.",
        price: 1000,
        category: "document",
        image: "item-document-1"
      }
    ];
  }
} 