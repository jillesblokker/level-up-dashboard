export interface KingdomTile {
  id: string
  name: string
  timerMinutes: number
  normalGoldRange: [number, number]
  luckyGoldAmount: number
  luckyChance: number
  clickMessage: string
  possibleItems: string[]
  itemType: 'weapon' | 'armor' | 'scroll' | 'potion' | 'food' | 'material' | 'artifact' | 'none'
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
}

export const KINGDOM_TILES: KingdomTile[] = [
  // Crafting & Resource Tiles
  {
    id: 'well',
    name: 'Well',
    timerMinutes: 30,
    normalGoldRange: [1, 25],
    luckyGoldAmount: 100,
    luckyChance: 0.15,
    clickMessage: "With a big throw your bucket lands with a splash in the water. You start pulling it up and there are 5 gold coins shining on the bottom of the bucket!",
    possibleItems: [],
    itemType: 'none',
    rarity: 'common'
  },
  {
    id: 'blacksmith',
    name: 'Blacksmith',
    timerMinutes: 120,
    normalGoldRange: [10, 50],
    luckyGoldAmount: 150,
    luckyChance: 0.10,
    clickMessage: "The blacksmith's forge glows with heat as you approach. He hands you a freshly crafted iron sword and a pouch of gold for your patronage.",
    possibleItems: [
      '/images/items/sword/sword-twig.png',
      '/images/items/sword/sword-sunblade.png',
      '/images/items/sword/sword-irony.png',
      '/images/items/armor/armor-normalo.png',
      '/images/items/armor/armor-darko.png',
      '/images/items/armor/armor-blanko.png'
    ],
    itemType: 'weapon',
    rarity: 'uncommon'
  },
  {
    id: 'sawmill',
    name: 'Sawmill',
    timerMinutes: 240,
    normalGoldRange: [15, 40],
    luckyGoldAmount: 120,
    luckyChance: 0.12,
    clickMessage: "The sawmill's blades whir as you collect freshly cut timber. Among the wood, you find some gold coins that must have been hidden in the logs.",
    possibleItems: [
      '/images/items/materials/logs.png',
      '/images/items/materials/planks.png'
    ],
    itemType: 'material',
    rarity: 'common'
  },
  {
    id: 'fisherman',
    name: 'Fisherman',
    timerMinutes: 60,
    normalGoldRange: [5, 30],
    luckyGoldAmount: 80,
    luckyChance: 0.18,
    clickMessage: "You cast your line into the water and feel a tug. Reeling it in, you catch a fish with gold coins in its mouth!",
    possibleItems: ['/images/items/food/goldenfish.png'],
    itemType: 'food',
    rarity: 'common'
  },
  {
    id: 'grocery',
    name: 'Grocery',
    timerMinutes: 45,
    normalGoldRange: [3, 20],
    luckyGoldAmount: 60,
    luckyChance: 0.20,
    clickMessage: "The grocer greets you warmly and shows you today's fresh produce. Hidden among the vegetables, you discover some gold coins!",
    possibleItems: ['/images/items/food/goldenfish.png'],
    itemType: 'food',
    rarity: 'common'
  },
  {
    id: 'foodcourt',
    name: 'Foodcourt',
    timerMinutes: 90,
    normalGoldRange: [8, 35],
    luckyGoldAmount: 90,
    luckyChance: 0.16,
    clickMessage: "The aroma of freshly cooked meals fills the air. As you enjoy your meal, you find gold coins hidden under your plate!",
    possibleItems: ['/images/items/food/goldenfish.png'],
    itemType: 'food',
    rarity: 'uncommon'
  },
  {
    id: 'vegetables',
    name: 'Vegetables',
    timerMinutes: 120,
    normalGoldRange: [5, 25],
    luckyGoldAmount: 70,
    luckyChance: 0.14,
    clickMessage: "You tend to the vegetable garden, pulling up carrots and potatoes. Among the roots, you discover gold coins buried in the soil!",
    possibleItems: ['/images/items/food/goldenfish.png'],
    itemType: 'food',
    rarity: 'common'
  },

  // Knowledge & Magic Tiles
  {
    id: 'wizard',
    name: 'Wizard',
    timerMinutes: 360,
    normalGoldRange: [20, 60],
    luckyGoldAmount: 200,
    luckyChance: 0.08,
    clickMessage: "The wizard's tower hums with magical energy. He shares ancient knowledge and hands you a scroll, along with gold for your wisdom.",
    possibleItems: [
      '/images/items/scroll/scroll-scrolly.png',
      '/images/items/scroll/scroll-perkamento.png',
      '/images/items/scroll/scroll-memento.png'
    ],
    itemType: 'scroll',
    rarity: 'rare'
  },
  {
    id: 'temple',
    name: 'Temple',
    timerMinutes: 240,
    normalGoldRange: [15, 45],
    luckyGoldAmount: 150,
    luckyChance: 0.12,
    clickMessage: "The temple's peaceful atmosphere surrounds you. The priest blesses you with a health potion and offers gold for your devotion.",
    possibleItems: [
      '/images/items/potion/potion-health.png',
      '/images/items/potion/potion-gold.png',
      '/images/items/potion/potion-exp.png'
    ],
    itemType: 'potion',
    rarity: 'uncommon'
  },
  {
    id: 'castle',
    name: 'Castle',
    timerMinutes: 720,
    normalGoldRange: [50, 100],
    luckyGoldAmount: 500,
    luckyChance: 0.05,
    clickMessage: "The castle's grandeur impresses you. The royal treasurer rewards your loyalty with gold and a valuable item from the royal vault.",
    possibleItems: [
      '/images/items/artifact/crown/crown.png',
      '/images/items/artifact/ring/ring.png',
      '/images/items/artifact/scepter/scepter.png'
    ],
    itemType: 'artifact',
    rarity: 'legendary'
  },
  {
    id: 'mansion',
    name: 'Mansion',
    timerMinutes: 480,
    normalGoldRange: [30, 80],
    luckyGoldAmount: 300,
    luckyChance: 0.10,
    clickMessage: "The mansion's elegant halls welcome you. The noble owner appreciates your visit and rewards you with gold and a fine item.",
    possibleItems: [
      '/images/items/artifact/crown/crown.png',
      '/images/items/artifact/ring/ring.png',
      '/images/items/artifact/scepter/scepter.png'
    ],
    itemType: 'artifact',
    rarity: 'epic'
  },
  {
    id: 'fountain',
    name: 'Fountain',
    timerMinutes: 180,
    normalGoldRange: [10, 40],
    luckyGoldAmount: 120,
    luckyChance: 0.15,
    clickMessage: "The fountain's waters sparkle with magical energy. As you drink from it, you find gold coins at the bottom!",
    possibleItems: [
      '/images/items/potion/potion-health.png',
      '/images/items/potion/potion-gold.png',
      '/images/items/potion/potion-exp.png'
    ],
    itemType: 'potion',
    rarity: 'uncommon'
  },
  {
    id: 'mayor',
    name: 'Mayor',
    timerMinutes: 360,
    normalGoldRange: [25, 70],
    luckyGoldAmount: 250,
    luckyChance: 0.08,
    clickMessage: "The mayor greets you warmly in his office. He appreciates your service to the town and rewards you with gold and influence.",
    possibleItems: [
      '/images/items/artifact/crown/crown.png',
      '/images/items/artifact/ring/ring.png',
      '/images/items/artifact/scepter/scepter.png'
    ],
    itemType: 'artifact',
    rarity: 'rare'
  },
  {
    id: 'inn',
    name: 'Inn',
    timerMinutes: 120,
    normalGoldRange: [8, 30],
    luckyGoldAmount: 80,
    luckyChance: 0.18,
    clickMessage: "The inn's warm atmosphere welcomes you. The innkeeper shares local gossip and rewards you with gold and useful items.",
    possibleItems: [
      '/images/items/artifact/crown/crown.png',
      '/images/items/artifact/ring/ring.png',
      '/images/items/artifact/scepter/scepter.png'
    ],
    itemType: 'artifact',
    rarity: 'common'
  },

  // Entertainment & Social Tiles
  {
    id: 'jousting',
    name: 'Jousting',
    timerMinutes: 480,
    normalGoldRange: [20, 60],
    luckyGoldAmount: 200,
    luckyChance: 0.10,
    clickMessage: "The jousting arena echoes with the clash of lances. You participate in a tournament and win gold along with combat equipment.",
    possibleItems: [
      '/images/items/sword/sword-twig.png',
      '/images/items/sword/sword-sunblade.png',
      '/images/items/sword/sword-irony.png',
      '/images/items/armor/armor-normalo.png',
      '/images/items/armor/armor-darko.png',
      '/images/items/armor/armor-blanko.png'
    ],
    itemType: 'weapon',
    rarity: 'rare'
  },
  {
    id: 'archery',
    name: 'Archery',
    timerMinutes: 180,
    normalGoldRange: [10, 35],
    luckyGoldAmount: 100,
    luckyChance: 0.15,
    clickMessage: "The archery range tests your skill. You hit the target and find gold coins hidden behind the bullseye!",
    possibleItems: [
      '/images/items/sword/sword-twig.png',
      '/images/items/sword/sword-sunblade.png',
      '/images/items/sword/sword-irony.png'
    ],
    itemType: 'weapon',
    rarity: 'uncommon'
  },
  {
    id: 'watchtower',
    name: 'Watchtower',
    timerMinutes: 360,
    normalGoldRange: [15, 50],
    luckyGoldAmount: 180,
    luckyChance: 0.12,
    clickMessage: "From the watchtower's height, you spot something glinting in the distance. Investigating, you find gold and valuable information.",
    possibleItems: [
      '/images/items/artifact/crown/crown.png',
      '/images/items/artifact/ring/ring.png',
      '/images/items/artifact/scepter/scepter.png'
    ],
    itemType: 'artifact',
    rarity: 'rare'
  },
  {
    id: 'pond',
    name: 'Pond',
    timerMinutes: 60,
    normalGoldRange: [5, 25],
    luckyGoldAmount: 70,
    luckyChance: 0.20,
    clickMessage: "The pond's surface ripples as you approach. You spot gold coins glinting at the bottom and fish them out!",
    possibleItems: ['/images/items/food/goldenfish.png'],
    itemType: 'food',
    rarity: 'common'
  },
  {
    id: 'windmill',
    name: 'Windmill',
    timerMinutes: 240,
    normalGoldRange: [12, 40],
    luckyGoldAmount: 120,
    luckyChance: 0.14,
    clickMessage: "The windmill's sails turn steadily. You collect freshly ground flour and discover gold coins mixed in with the grain!",
    possibleItems: ['/images/items/food/goldenfish.png'],
    itemType: 'food',
    rarity: 'uncommon'
  }
]

export function getRandomItem(items: string[]): string | null {
  if (items.length === 0) return null
  const randomIndex = Math.floor(Math.random() * items.length)
  return items[randomIndex] || null
}

export function getRandomGold(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function isLucky(chance: number): boolean {
  return Math.random() < chance
}

export function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'common': return 'bg-gray-500 text-white'
    case 'uncommon': return 'bg-green-500 text-white'
    case 'rare': return 'bg-blue-500 text-white'
    case 'epic': return 'bg-purple-500 text-white'
    case 'legendary': return 'bg-amber-500 text-white'
    default: return 'bg-gray-500 text-white'
  }
} 