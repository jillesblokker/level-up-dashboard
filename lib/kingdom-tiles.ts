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
  image: string
  materialCost?: { itemId: string; quantity: number }[]
  tokenCost?: number
  cost?: number
  levelRequired?: number
}

import { TEXT_CONTENT } from './text-content'

export const KINGDOM_TILES: KingdomTile[] = [
  // Crafting & Resource Tiles
  {
    id: 'crossroad',
    name: TEXT_CONTENT.kingdomTiles.crossroad.name,
    timerMinutes: 0,
    normalGoldRange: [0, 0],
    luckyGoldAmount: 0,
    luckyChance: 0,
    clickMessage: TEXT_CONTENT.kingdomTiles.crossroad.clickMessage,
    possibleItems: [],
    itemType: 'none',
    rarity: 'common',
    image: '/images/kingdom-tiles/Crossroad.png',
    cost: 10
  },
  {
    id: 'straightroad',
    name: TEXT_CONTENT.kingdomTiles.straightroad.name,
    timerMinutes: 0,
    normalGoldRange: [0, 0],
    luckyGoldAmount: 0,
    luckyChance: 0,
    clickMessage: TEXT_CONTENT.kingdomTiles.straightroad.clickMessage,
    possibleItems: [],
    itemType: 'none',
    rarity: 'common',
    image: '/images/kingdom-tiles/Straightroad.png',
    cost: 10
  },
  {
    id: 'cornerroad',
    name: TEXT_CONTENT.kingdomTiles.cornerroad.name,
    timerMinutes: 0,
    normalGoldRange: [0, 0],
    luckyGoldAmount: 0,
    luckyChance: 0,
    clickMessage: TEXT_CONTENT.kingdomTiles.cornerroad.clickMessage,
    possibleItems: [],
    itemType: 'none',
    rarity: 'common',
    image: '/images/kingdom-tiles/Cornerroad.png',
    cost: 10
  },
  {
    id: 'tsplitroad',
    name: TEXT_CONTENT.kingdomTiles.tsplitroad.name,
    timerMinutes: 0,
    normalGoldRange: [0, 0],
    luckyGoldAmount: 0,
    luckyChance: 0,
    clickMessage: TEXT_CONTENT.kingdomTiles.tsplitroad.clickMessage,
    possibleItems: [],
    itemType: 'none',
    rarity: 'common',
    image: '/images/kingdom-tiles/Tsplitroad.png',
    cost: 10
  },
  {
    id: 'well',
    name: TEXT_CONTENT.kingdomTiles.well.name,
    timerMinutes: 10,
    normalGoldRange: [5, 15],
    luckyGoldAmount: 50,
    luckyChance: 0.15,
    clickMessage: TEXT_CONTENT.kingdomTiles.well.clickMessage,
    possibleItems: [
      '/images/items/materials/material-water.png'
    ],
    itemType: 'material',
    rarity: 'common',
    image: '/images/kingdom-tiles/Well.png',
    materialCost: [{ itemId: 'material-stone', quantity: 3 }],
    tokenCost: 1,
    cost: 100
  },
  {
    id: 'blacksmith',
    name: TEXT_CONTENT.kingdomTiles.blacksmith.name,
    timerMinutes: 30,
    normalGoldRange: [10, 25],
    luckyGoldAmount: 75,
    luckyChance: 0.10,
    clickMessage: TEXT_CONTENT.kingdomTiles.blacksmith.clickMessage,
    possibleItems: [
      '/images/items/sword/sword-twig.png',
      '/images/items/sword/sword-sunblade.png',
      '/images/items/sword/sword-irony.png',
      '/images/items/armor/armor-normalo.png',
      '/images/items/armor/armor-darko.png',
      '/images/items/armor/armor-blanko.png'
    ],
    itemType: 'weapon',
    rarity: 'uncommon',
    image: '/images/kingdom-tiles/Blacksmith.png',
    materialCost: [{ itemId: 'material-logs', quantity: 5 }, { itemId: 'material-stone', quantity: 5 }],
    tokenCost: 2,
    cost: 200
  },
  {
    id: 'sawmill',
    name: TEXT_CONTENT.kingdomTiles.sawmill.name,
    timerMinutes: 180, // Reduced from 240 to 180 minutes (3 hours)
    normalGoldRange: [15, 35], // Now produces gold alongside materials
    luckyGoldAmount: 100,
    luckyChance: 0.15,
    clickMessage: TEXT_CONTENT.kingdomTiles.sawmill.clickMessage,
    possibleItems: [
      '/images/items/materials/material-logs.png',
      '/images/items/materials/material-planks.png'
    ],
    itemType: 'material',
    rarity: 'common',
    image: '/images/kingdom-tiles/Sawmill.png',
    cost: 120
  },
  {
    id: 'stone-quarry',
    name: 'Stone Quarry',
    timerMinutes: 240,
    normalGoldRange: [20, 45],
    luckyGoldAmount: 120,
    luckyChance: 0.15,
    clickMessage: 'You quarried stone!',
    possibleItems: [
      '/images/items/materials/material-stone.png',
      '/images/items/materials/material-stone-block.png'
    ],
    itemType: 'material',
    rarity: 'common',
    image: '/images/kingdom-tiles/StoneQuarry.png',
    cost: 200
  },
  {
    id: 'fisherman',
    name: TEXT_CONTENT.kingdomTiles.fisherman.name,
    timerMinutes: 15,
    normalGoldRange: [5, 20],
    luckyGoldAmount: 60,
    luckyChance: 0.18,
    clickMessage: TEXT_CONTENT.kingdomTiles.fisherman.clickMessage,
    possibleItems: [
      '/images/items/food/fish-red.png',
      '/images/items/food/fish-blue.png',
      '/images/items/food/fish-silver.png',
      '/images/items/food/fish-golden.png',
      '/images/items/food/fish-rainbow.png'
    ],
    itemType: 'food',
    rarity: 'common',
    image: '/images/kingdom-tiles/Fisherman.png',
    cost: 120
  },
  {
    id: 'grocery',
    name: TEXT_CONTENT.kingdomTiles.grocery.name,
    timerMinutes: 5,
    normalGoldRange: [3, 15],
    luckyGoldAmount: 45,
    luckyChance: 0.20,
    clickMessage: TEXT_CONTENT.kingdomTiles.grocery.clickMessage,
    possibleItems: [
      '/images/items/food/fish-red.png',
      '/images/items/food/fish-blue.png',
      '/images/items/food/fish-silver.png'
    ],
    itemType: 'food',
    rarity: 'common',
    image: '/images/kingdom-tiles/Grocery.png',
    cost: 200
  },
  {
    id: 'foodcourt',
    name: TEXT_CONTENT.kingdomTiles.foodcourt.name,
    timerMinutes: 90,
    normalGoldRange: [8, 25],
    luckyGoldAmount: 70,
    luckyChance: 0.16,
    clickMessage: TEXT_CONTENT.kingdomTiles.foodcourt.clickMessage,
    possibleItems: [
      '/images/items/food/fish-red.png',
      '/images/items/food/fish-blue.png',
      '/images/items/food/fish-silver.png'
    ],
    itemType: 'food',
    rarity: 'uncommon',
    image: '/images/kingdom-tiles/Foodcourt.png',
    materialCost: [{ itemId: 'material-planks', quantity: 8 }],
    tokenCost: 2,
    cost: 250
  },
  {
    id: 'vegetables',
    name: TEXT_CONTENT.kingdomTiles.vegetables.name,
    timerMinutes: 120,
    normalGoldRange: [5, 20],
    luckyGoldAmount: 55,
    luckyChance: 0.14,
    clickMessage: TEXT_CONTENT.kingdomTiles.vegetables.clickMessage,
    possibleItems: [
      '/images/items/food/fish-red.png',
      '/images/items/food/fish-blue.png',
      '/images/items/food/fish-silver.png'
    ],
    itemType: 'food',
    rarity: 'common',
    image: '/images/kingdom-tiles/Vegetables.png',
    cost: 150
  },

  // Knowledge & Magic Tiles
  {
    id: 'wizard',
    name: TEXT_CONTENT.kingdomTiles.wizard.name,
    timerMinutes: 240, // Reduced from 360 to 240 minutes (4 hours)
    normalGoldRange: [60, 120], // Significantly increased (was 15-40)
    luckyGoldAmount: 300, // Increased (was 120)
    luckyChance: 0.12, // Increased (was 0.08)
    clickMessage: TEXT_CONTENT.kingdomTiles.wizard.clickMessage,
    possibleItems: [
      '/images/items/scroll/scroll-scrolly.png',
      '/images/items/scroll/scroll-perkamento.png',
      '/images/items/scroll/scroll-memento.png'
    ],
    itemType: 'scroll',
    rarity: 'rare',
    image: '/images/kingdom-tiles/Wizard.png',
    materialCost: [{ itemId: 'material-stone-block', quantity: 15 }, { itemId: 'material-crystal', quantity: 5 }],
    tokenCost: 3,
    cost: 2000
  },
  {
    id: 'temple',
    name: TEXT_CONTENT.kingdomTiles.temple.name,
    timerMinutes: 240,
    normalGoldRange: [10, 30],
    luckyGoldAmount: 100,
    luckyChance: 0.12,
    clickMessage: TEXT_CONTENT.kingdomTiles.temple.clickMessage,
    possibleItems: [
      '/images/items/potion/potion-health.png',
      '/images/items/potion/potion-gold.png',
      '/images/items/potion/potion-exp.png'
    ],
    itemType: 'potion',
    rarity: 'uncommon',
    image: '/images/kingdom-tiles/Temple.png',
    materialCost: [{ itemId: 'material-planks', quantity: 10 }],
    tokenCost: 2,
    cost: 300
  },
  {
    id: 'zen-garden',
    name: 'Zen Garden',
    timerMinutes: 120,
    normalGoldRange: [10, 25],
    luckyGoldAmount: 80,
    luckyChance: 0.20,
    clickMessage: 'You found peace in the garden.',
    possibleItems: [
      '/images/items/scroll/scroll-scrolly.png',
      '/images/items/potion/potion-exp.png'
    ],
    itemType: 'scroll',
    rarity: 'rare',
    image: '/images/kingdom-tiles/ZenGarden.png',
    materialCost: [{ itemId: 'material-stone', quantity: 5 }, { itemId: 'material-logs', quantity: 5 }],
    tokenCost: 2,
    cost: 350
  },
  {
    id: 'castle',
    name: TEXT_CONTENT.kingdomTiles.castle.name,
    timerMinutes: 0, // Converted to Navigation Hub (Realm)
    normalGoldRange: [0, 0],
    luckyGoldAmount: 0,
    luckyChance: 0,
    clickMessage: TEXT_CONTENT.kingdomTiles.castle.clickMessage,
    possibleItems: [
      '/images/items/artifact/crown/artifact-crowny.png',
      '/images/items/artifact/ring/artifact-ringo.png',
      '/images/items/artifact/scepter/artifact-staffy.png'
    ],
    itemType: 'artifact',
    rarity: 'legendary',
    image: '/images/kingdom-tiles/Castle.png',
    materialCost: [{ itemId: 'material-stone-block', quantity: 20 }, { itemId: 'material-steel', quantity: 10 }],
    tokenCost: 3,
    cost: 5000
  },
  {
    id: 'mansion',
    name: TEXT_CONTENT.kingdomTiles.mansion.name,
    timerMinutes: 300, // Reduced from 480 to 300 minutes (5 hours)
    normalGoldRange: [100, 200], // Significantly increased (was 20-50)
    luckyGoldAmount: 500, // Increased (was 200)
    luckyChance: 0.12, // Increased (was 0.10)
    clickMessage: TEXT_CONTENT.kingdomTiles.mansion.clickMessage,
    possibleItems: [
      '/images/items/artifact/crown/artifact-crowny.png',
      '/images/items/artifact/ring/artifact-ringo.png',
      '/images/items/artifact/scepter/artifact-staffy.png'
    ],
    itemType: 'artifact',
    rarity: 'epic',
    image: '/images/kingdom-tiles/Mansion.png',
    materialCost: [{ itemId: 'material-planks', quantity: 15 }, { itemId: 'material-stone-block', quantity: 8 }],
    tokenCost: 3,
    cost: 1500
  },
  {
    id: 'fountain',
    name: TEXT_CONTENT.kingdomTiles.fountain.name,
    timerMinutes: 180,
    normalGoldRange: [8, 25],
    luckyGoldAmount: 80,
    luckyChance: 0.15,
    clickMessage: TEXT_CONTENT.kingdomTiles.fountain.clickMessage,
    possibleItems: [
      '/images/items/potion/potion-health.png',
      '/images/items/potion/potion-gold.png',
      '/images/items/potion/potion-exp.png'
    ],
    itemType: 'potion',
    rarity: 'uncommon',
    image: '/images/kingdom-tiles/Fountain.png',
    materialCost: [{ itemId: 'material-logs', quantity: 5 }],
    tokenCost: 1,
    cost: 100
  },
  {
    id: 'mayor',
    name: TEXT_CONTENT.kingdomTiles.mayor.name,
    timerMinutes: 360,
    normalGoldRange: [15, 40],
    luckyGoldAmount: 150,
    luckyChance: 0.08,
    clickMessage: TEXT_CONTENT.kingdomTiles.mayor.clickMessage,
    possibleItems: [
      '/images/items/artifact/crown/artifact-crowny.png',
      '/images/items/artifact/ring/artifact-ringo.png',
      '/images/items/artifact/scepter/artifact-staffy.png'
    ],
    itemType: 'artifact',
    rarity: 'rare',
    image: '/images/kingdom-tiles/Mayor.png',
    materialCost: [{ itemId: 'material-planks', quantity: 12 }, { itemId: 'material-stone-block', quantity: 5 }],
    tokenCost: 3,
    cost: 800
  },
  {
    id: 'inn',
    name: TEXT_CONTENT.kingdomTiles.inn.name,
    timerMinutes: 120,
    normalGoldRange: [5, 20],
    luckyGoldAmount: 60,
    luckyChance: 0.18,
    clickMessage: TEXT_CONTENT.kingdomTiles.inn.clickMessage,
    possibleItems: [
      '/images/items/artifact/crown/artifact-crowny.png',
      '/images/items/artifact/ring/artifact-ringo.png',
      '/images/items/artifact/scepter/artifact-staffy.png'
    ],
    itemType: 'artifact',
    rarity: 'common',
    image: '/images/kingdom-tiles/Inn.png',
    materialCost: [{ itemId: 'material-logs', quantity: 40 }],
    tokenCost: 1,
    cost: 220
  },

  // Entertainment & Social Tiles
  {
    id: 'jousting',
    name: TEXT_CONTENT.kingdomTiles.jousting.name,
    timerMinutes: 480,
    normalGoldRange: [15, 35],
    luckyGoldAmount: 150,
    luckyChance: 0.10,
    clickMessage: TEXT_CONTENT.kingdomTiles.jousting.clickMessage,
    possibleItems: [
      '/images/items/sword/sword-twig.png',
      '/images/items/sword/sword-sunblade.png',
      '/images/items/sword/sword-irony.png',
      '/images/items/armor/armor-normalo.png',
      '/images/items/armor/armor-darko.png',
      '/images/items/armor/armor-blanko.png'
    ],
    itemType: 'weapon',
    rarity: 'rare',
    image: '/images/kingdom-tiles/Jousting.png',
    materialCost: [{ itemId: 'material-logs', quantity: 12 }],
    tokenCost: 2,
    cost: 400
  },
  {
    id: 'archery',
    name: TEXT_CONTENT.kingdomTiles.archery.name,
    timerMinutes: 180,
    normalGoldRange: [8, 25],
    luckyGoldAmount: 80,
    luckyChance: 0.15,
    clickMessage: TEXT_CONTENT.kingdomTiles.archery.clickMessage,
    possibleItems: [
      '/images/items/sword/sword-twig.png',
      '/images/items/sword/sword-sunblade.png',
      '/images/items/sword/sword-irony.png'
    ],
    itemType: 'weapon',
    rarity: 'uncommon',
    image: '/images/kingdom-tiles/Archery.png',
    materialCost: [{ itemId: 'material-logs', quantity: 40 }],
    tokenCost: 2,
    cost: 150
  },
  {
    id: 'watchtower',
    name: TEXT_CONTENT.kingdomTiles.watchtower.name,
    timerMinutes: 360,
    normalGoldRange: [10, 30],
    luckyGoldAmount: 120,
    luckyChance: 0.12,
    clickMessage: TEXT_CONTENT.kingdomTiles.watchtower.clickMessage,
    possibleItems: [
      '/images/items/artifact/crown/artifact-crowny.png',
      '/images/items/artifact/ring/artifact-ringo.png',
      '/images/items/artifact/scepter/artifact-staffy.png'
    ],
    itemType: 'artifact',
    rarity: 'rare',
    image: '/images/kingdom-tiles/Watchtower.png',
    materialCost: [{ itemId: 'material-planks', quantity: 6 }],
    tokenCost: 2,
    cost: 300
  },
  {
    id: 'pond',
    name: TEXT_CONTENT.kingdomTiles.pond.name,
    timerMinutes: 60,
    normalGoldRange: [3, 15],
    luckyGoldAmount: 50,
    luckyChance: 0.20,
    clickMessage: TEXT_CONTENT.kingdomTiles.pond.clickMessage,
    possibleItems: [
      '/images/items/food/fish-red.png',
      '/images/items/food/fish-blue.png',
      '/images/items/food/fish-silver.png'
    ],
    itemType: 'food',
    rarity: 'common',
    image: '/images/kingdom-tiles/Pond.png',
    materialCost: [],
    tokenCost: 1,
    cost: 100
  },
  {
    id: 'windmill',
    name: TEXT_CONTENT.kingdomTiles.windmill.name,
    timerMinutes: 240,
    normalGoldRange: [8, 25],
    luckyGoldAmount: 80,
    luckyChance: 0.14,
    clickMessage: TEXT_CONTENT.kingdomTiles.windmill.clickMessage,
    possibleItems: [
      '/images/items/food/fish-red.png',
      '/images/items/food/fish-blue.png',
      '/images/items/food/fish-silver.png'
    ],
    itemType: 'food',
    rarity: 'uncommon',
    image: '/images/kingdom-tiles/Windmill.png',
    materialCost: [{ itemId: 'material-logs', quantity: 6 }],
    tokenCost: 1,
    cost: 180
  },
  // --- Seasonal & Utility Tiles (new) ---
  {
    id: 'winter-fountain',
    name: TEXT_CONTENT.kingdomTiles['winter-fountain'].name,
    timerMinutes: 180,
    normalGoldRange: [10, 30],
    luckyGoldAmount: 120,
    luckyChance: 0.18,
    clickMessage: TEXT_CONTENT.kingdomTiles['winter-fountain'].clickMessage,
    possibleItems: [
      '/images/items/potion/potion-health.png',
      '/images/items/potion/potion-gold.png',
      '/images/items/potion/potion-exp.png'
    ],
    itemType: 'potion',
    rarity: 'rare',
    image: '/images/kingdom-tiles/WinterFountain.png',
    cost: 500
  },
  {
    id: 'snowy-inn',
    name: TEXT_CONTENT.kingdomTiles['snowy-inn'].name,
    timerMinutes: 120,
    normalGoldRange: [6, 22],
    luckyGoldAmount: 70,
    luckyChance: 0.18,
    clickMessage: TEXT_CONTENT.kingdomTiles['snowy-inn'].clickMessage,
    possibleItems: [
      '/images/items/food/fish-red.png',
      '/images/items/food/fish-blue.png',
      '/images/items/food/fish-silver.png'
    ],
    itemType: 'food',
    rarity: 'uncommon',
    image: '/images/kingdom-tiles/SnowyInn.png',
    cost: 400
  },
  {
    id: 'ice-sculpture',
    name: TEXT_CONTENT.kingdomTiles['ice-sculpture'].name,
    timerMinutes: 90,
    normalGoldRange: [5, 15],
    luckyGoldAmount: 60,
    luckyChance: 0.16,
    clickMessage: TEXT_CONTENT.kingdomTiles['ice-sculpture'].clickMessage,
    possibleItems: [
      '/images/items/potion/potion-health.png',
      '/images/items/potion/potion-gold.png',
      '/images/items/potion/potion-exp.png'
    ],
    itemType: 'potion',
    rarity: 'uncommon',
    image: '/images/kingdom-tiles/IceSculpture.png',
    cost: 300
  },
  {
    id: 'fireworks-stand',
    name: TEXT_CONTENT.kingdomTiles['fireworks-stand'].name,
    timerMinutes: 60,
    normalGoldRange: [8, 20],
    luckyGoldAmount: 100,
    luckyChance: 0.20,
    clickMessage: TEXT_CONTENT.kingdomTiles['fireworks-stand'].clickMessage,
    possibleItems: [
      '/images/items/scroll/scroll-scrolly.png',
      '/images/items/scroll/scroll-perkamento.png',
      '/images/items/scroll/scroll-memento.png'
    ],
    itemType: 'scroll',
    rarity: 'uncommon',
    image: '/images/kingdom-tiles/FireworksStand.png',
    cost: 350
  },
  {
    id: 'pumpkin-patch',
    name: TEXT_CONTENT.kingdomTiles['pumpkin-patch'].name,
    timerMinutes: 120,
    normalGoldRange: [6, 18],
    luckyGoldAmount: 65,
    luckyChance: 0.15,
    clickMessage: TEXT_CONTENT.kingdomTiles['pumpkin-patch'].clickMessage,
    possibleItems: [
      '/images/items/food/fish-red.png',
      '/images/items/food/fish-blue.png'
    ],
    itemType: 'food',
    rarity: 'common',
    image: '/images/kingdom-tiles/PumpkinPatch.png',
    cost: 200
  },
  {
    id: 'harvest-barn',
    name: TEXT_CONTENT.kingdomTiles['harvest-barn'].name,
    timerMinutes: 240,
    normalGoldRange: [10, 25],
    luckyGoldAmount: 90,
    luckyChance: 0.14,
    clickMessage: TEXT_CONTENT.kingdomTiles['harvest-barn'].clickMessage,
    possibleItems: [
      '/images/items/materials/material-logs.png',
      '/images/items/materials/material-planks.png'
    ],
    itemType: 'material',
    rarity: 'uncommon',
    image: '/images/kingdom-tiles/HarvestBarn.png',
    cost: 400
  },
  {
    id: 'bakery',
    name: TEXT_CONTENT.kingdomTiles.bakery.name,
    timerMinutes: 90,
    normalGoldRange: [8, 20],
    luckyGoldAmount: 70,
    luckyChance: 0.16,
    clickMessage: TEXT_CONTENT.kingdomTiles.bakery.clickMessage,
    possibleItems: [
      '/images/items/food/fish-silver.png',
      '/images/items/food/fish-red.png'
    ],
    itemType: 'food',
    rarity: 'common',
    image: '/images/kingdom-tiles/Bakery.png',
    cost: 250
  },
  {
    id: 'brewery',
    name: TEXT_CONTENT.kingdomTiles.brewery.name,
    timerMinutes: 150,
    normalGoldRange: [10, 22],
    luckyGoldAmount: 85,
    luckyChance: 0.15,
    clickMessage: TEXT_CONTENT.kingdomTiles.brewery.clickMessage,
    possibleItems: [
      '/images/items/potion/potion-gold.png',
      '/images/items/potion/potion-exp.png'
    ],
    itemType: 'potion',
    rarity: 'uncommon',
    image: '/images/kingdom-tiles/Brewery.png',
    cost: 300
  },
  {
    id: 'market-stalls',
    name: TEXT_CONTENT.kingdomTiles['market-stalls'].name,
    timerMinutes: 45,
    normalGoldRange: [5, 15],
    luckyGoldAmount: 60,
    luckyChance: 0.20,
    clickMessage: TEXT_CONTENT.kingdomTiles['market-stalls'].clickMessage,
    possibleItems: [
      '/images/items/materials/material-logs.png',
      '/images/items/materials/material-planks.png'
    ],
    itemType: 'material',
    rarity: 'uncommon',
    image: '/images/kingdom-tiles/MarketStalls.png',
    cost: 400
  },
  {
    id: 'library',
    name: TEXT_CONTENT.kingdomTiles.library.name,
    timerMinutes: 0, // Converted to Navigation Hub (Chronicle)
    normalGoldRange: [12, 30],
    luckyGoldAmount: 110,
    luckyChance: 0.12,
    clickMessage: TEXT_CONTENT.kingdomTiles.library.clickMessage,
    possibleItems: [
      '/images/items/scroll/scroll-scrolly.png',
      '/images/items/scroll/scroll-perkamento.png',
      '/images/items/scroll/scroll-memento.png'
    ],
    itemType: 'scroll',
    rarity: 'rare',
    image: '/images/kingdom-tiles/Library.png',
    materialCost: [{ itemId: 'material-planks', quantity: 12 }],
    tokenCost: 2,
    cost: 240
  },
  {
    id: 'training-grounds',
    name: TEXT_CONTENT.kingdomTiles['training-grounds'].name,
    timerMinutes: 0, // Converted to Navigation Hub (Character)
    normalGoldRange: [0, 0],
    luckyGoldAmount: 0,
    luckyChance: 0,
    clickMessage: TEXT_CONTENT.kingdomTiles['training-grounds'].clickMessage,
    possibleItems: [
      '/images/items/sword/sword-twig.png',
      '/images/items/sword/sword-sunblade.png',
      '/images/items/sword/sword-irony.png'
    ],
    itemType: 'weapon',
    rarity: 'uncommon',
    image: '/images/kingdom-tiles/TrainingGrounds.png',
    materialCost: [{ itemId: 'material-logs', quantity: 10 }],
    tokenCost: 2,
    cost: 200
  },
  {
    id: 'stable',
    name: TEXT_CONTENT.kingdomTiles.stable.name,
    timerMinutes: 120,
    normalGoldRange: [6, 18],
    luckyGoldAmount: 70,
    luckyChance: 0.16,
    clickMessage: TEXT_CONTENT.kingdomTiles.stable.clickMessage,
    possibleItems: [
      '/images/items/materials/material-logs.png'
    ],
    itemType: 'material',
    rarity: 'common',
    image: '/images/kingdom-tiles/Stable.png',
    materialCost: [{ itemId: 'material-logs', quantity: 8 }],
    tokenCost: 1,
    cost: 120
  },
  {
    id: 'house',
    name: TEXT_CONTENT.kingdomTiles.house.name,
    timerMinutes: 0, // Converted to Navigation Hub (Character)
    normalGoldRange: [8, 20],
    luckyGoldAmount: 80,
    luckyChance: 0.15,
    clickMessage: TEXT_CONTENT.kingdomTiles.house.clickMessage,
    possibleItems: [
      '/images/items/food/fish-red.png',
      '/images/items/food/fish-blue.png',
      '/images/items/materials/material-logs.png'
    ],
    itemType: 'food',
    rarity: 'common',
    image: '/images/kingdom-tiles/House.png',
    materialCost: [{ itemId: 'material-logs', quantity: 4 }],
    tokenCost: 1,
    cost: 100
  },
  // --- New Realm Tiles (High Level) ---
  // (Removed Realm tiles: farmland, jungle, graveyard, oasis, ruins, coral_reef)
  {
    id: 'crystal_cavern',
    name: TEXT_CONTENT.kingdomTiles.crystal_cavern.name,
    timerMinutes: 0, // Converted to Navigation Hub (Dungeon)
    normalGoldRange: [0, 0],
    luckyGoldAmount: 0,
    luckyChance: 0,
    clickMessage: TEXT_CONTENT.kingdomTiles.crystal_cavern.clickMessage,
    possibleItems: [
      '/images/items/scroll/scroll-perkamento.png'
    ],
    itemType: 'scroll',
    rarity: 'legendary',
    image: '/images/tiles/crystal_cavern-tile.png',
    levelRequired: 15,
    cost: 800
  },
  // (Removed floating_island)
  // Hub Tiles (Navigation)
  {
    id: 'quest-board',
    name: 'Quest Board',
    timerMinutes: 0,
    normalGoldRange: [0, 0],
    luckyGoldAmount: 0,
    luckyChance: 0,
    clickMessage: 'Check available quests!',
    possibleItems: [],
    itemType: 'none',
    rarity: 'common',
    image: '/images/kingdom-tiles/QuestBoard.png',
    cost: 50
  },
  {
    id: 'monument',
    name: 'Hall of Fame',
    timerMinutes: 0,
    normalGoldRange: [0, 0],
    luckyGoldAmount: 0,
    luckyChance: 0,
    clickMessage: 'View achievements and glory.',
    possibleItems: [],
    itemType: 'none',
    rarity: 'rare',
    image: '/images/kingdom-tiles/Monument.png',
    cost: 500
  },
  {
    id: 'tavern',
    name: 'Tavern',
    timerMinutes: 0,
    normalGoldRange: [0, 0],
    luckyGoldAmount: 0,
    luckyChance: 0,
    clickMessage: 'Socialize with other players.',
    possibleItems: [],
    itemType: 'none',
    rarity: 'uncommon',
    image: '/images/kingdom-tiles/Inn.png',
    cost: 200
  },
  {
    id: 'market',
    name: 'Market',
    timerMinutes: 0,
    normalGoldRange: [0, 0],
    luckyGoldAmount: 0,
    luckyChance: 0,
    clickMessage: 'Trade items and resources.',
    possibleItems: [],
    itemType: 'none',
    rarity: 'common',
    image: '/images/kingdom-tiles/MarketStalls.png',
    cost: 400
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