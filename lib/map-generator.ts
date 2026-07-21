import { Tile, TileType } from '@/types/core-interfaces'

// Seeded random number generator
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Generate a random number between 0 and 1
  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  // Generate a random integer between min (inclusive) and max (exclusive)
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min) + min);
  }
}

export interface MapGenerationConfig {
  width: number;
  mysteryTilesPerSection: number;
  sectionSize: number;
}

export class MapGenerator {
  private random: SeededRandom;
  private config: MapGenerationConfig;

  constructor(seed: number, config: MapGenerationConfig) {
    this.random = new SeededRandom(seed);
    this.config = config;
  }

  generateInitialSection(): Tile[][] {
    const grid: Tile[][] = [];
    const { width, sectionSize } = this.config;

    // Generate first 5 rows
    for (let y = 0; y < sectionSize; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < width; x++) {
        if (x === 0 || x === width - 1) {
          // Mountains on sides
          row.push(this.createTile(x, y, "mountain"));
        } else {
          // Grass in middle
          row.push(this.createTile(x, y, "grass"));
        }
      }
      grid.push(row);
    }

    return grid;
  }

  generateNewSection(startY: number, adjacentTiles: Tile[][]): Tile[][] {
    const grid: Tile[][] = [];
    const { width, sectionSize, mysteryTilesPerSection } = this.config;

    // Track placed mystery tiles
    let mysteryTilesPlaced = 0;
    const mysteryPositions = new Set<string>();

    // Pre-calculate mystery tile positions
    while (mysteryTilesPlaced < mysteryTilesPerSection) {
      const x = this.random.nextInt(1, width - 1);
      const y = this.random.nextInt(0, sectionSize);
      const pos = `${x},${y}`;
      if (!mysteryPositions.has(pos)) {
        mysteryPositions.add(pos);
        mysteryTilesPlaced++;
      }
    }

    // Generate new section
    for (let y = 0; y < sectionSize; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < width; x++) {
        // Force a castle 2 tiles below the bottom left water tile (assume water at (1, sectionSize-1))
        if (x === 1 && startY + y === sectionSize + 1) {
          row.push(this.createTile(x, startY + y, "castle"));
        } else if (x === 0 || x === width - 1) {
          // Mountains on sides
          row.push(this.createTile(x, startY + y, "mountain"));
        } else if (mysteryPositions.has(`${x},${y}`)) {
          // Mystery tiles in pre-calculated positions
          row.push(this.createTile(x, startY + y, "mystery"));
        } else {
          // Consider adjacent tiles for other positions
          const tileType = this.determineTerrainType(x, startY + y, adjacentTiles);
          row.push(this.createTile(x, startY + y, tileType));
        }
      }
      grid.push(row);
    }

    return grid;
  }

  private determineTerrainType(x: number, y: number, adjacentTiles: Tile[][]): TileType {
    // Get adjacent tiles
    const adjacent = this.getAdjacentTiles(x, y, adjacentTiles);

    // Count adjacent tile types
    const typeCounts = adjacent.reduce((counts, tile) => {
      if (tile && tile.type !== "empty") {
        counts[tile.type] = (counts[tile.type] || 0) + 1;
      }
      return counts;
    }, {} as Record<string, number>);

    // Determine most common adjacent type
    let mostCommonType: TileType = "grass";
    let maxCount = 0;

    for (const [type, count] of Object.entries(typeCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonType = type as TileType;
      }
    }

    // 70% chance to match most common adjacent type, 30% chance for grass
    return this.random.next() < 0.7 ? mostCommonType : "grass";
  }

  private getAdjacentTiles(x: number, y: number, grid: Tile[][]): (Tile | null)[] {
    const adjacent: (Tile | null)[] = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const [dx, dy] of directions) {
      const newX = x + (dx || 0);
      const newY = y + (dy || 0);
      if (newX >= 0 && newX < this.config.width && newY >= 0 && newY < grid.length) {
        if (grid[newY] && grid[newY][newX]) {
          adjacent.push(grid[newY][newX]);
        }
      } else {
        adjacent.push(null);
      }
    }

    return adjacent;
  }

  private createTile(x: number, y: number, type: TileType): Tile {
    const tileNames = {
      empty: 'Empty Tile',
      mountain: 'Mountain Tile',
      grass: 'Grass Tile',
      forest: 'Forest Tile',
      water: 'Water Tile',
      city: 'City Tile',
      town: 'Town Tile',
      mystery: 'Mystery Tile',
      portal: 'Portal Tile',
      'portal-entrance': 'Portal Entrance',
      'portal-exit': 'Portal Exit',
      snow: 'Snow Tile',
      cave: 'Cave Tile',
      dungeon: 'Dungeon Tile',
      castle: 'Castle Tile',
      ice: 'Ice Tile',
      desert: 'Desert Tile',
      lava: 'Lava Tile',
      volcano: 'Volcano Tile',
      sheep: 'Sheep Tile',
      horse: 'Horse Tile',
      special: 'Special Tile',
      swamp: 'Swamp Tile',
      treasure: 'Treasure Tile',
      monster: 'Monster Tile',
      vacant: 'Vacant Tile',
      // Property tiles
      archery: 'Archery Range',
      blacksmith: 'Blacksmith Forge',
      sawmill: 'Sawmill',
      fisherman: 'Fishing Dock',
      grocery: 'Grocery Store',
      foodcourt: 'Food Court',
      well: 'Water Well',
      windmill: 'Windmill',
      fountain: 'Fountain',
      house: 'House',
      inn: 'Inn',
      jousting: 'Jousting Arena',
      mansion: 'Mansion',
      mayor: 'Mayor\'s Office',
      'streak-scroll': 'Streak Freeze Scroll',
      farm: 'Farm',
      lumber_mill: 'Lumber Mill',
      market: 'Marketplace',
      cottage: 'Cottage',
      crossroad: 'Crossroad',
      straightroad: 'Straight Road',
      cornerroad: 'Corner Road',
      tsplitroad: 'T-Split Road',
      jungle: 'Jungle Tile',
      ruins: 'Ancient Ruins',
      graveyard: 'Graveyard',
      farmland: 'Farmland',
      oasis: 'Desert Oasis',
      coral_reef: 'Coral Reef',
      crystal_cavern: 'Crystal Cavern',
      floating_island: 'Floating Island',
      'zen-garden': 'Zen Garden',
      'quest-board': 'Quest Board',
      monument: 'Monument',
      'training-grounds': 'Training Grounds',
      tavern: 'Tavern',
      watchtower: 'Watchtower',
      library: 'Grand Library',
      wizard: 'Wizard Tower',
      temple: 'Ancient Temple',
      'market-stalls': 'Market Stalls',
      fortune_teller: 'Fortune Teller',
      'daily-hub': 'Daily Hub',
      pyramid: 'Monolith of Devotion',
      'whispering-well': 'Whispering Well',
      'sphinx-gates': "Sphinx's Gates",
      'whispering-canopy': 'Whispering Canopy',
      'frostfire-obelisk': 'Frostfire Obelisk',
      'fairy-ring': 'Fairy Ring',
      'settlement': 'Settlement',
      'megapolis': 'Megapolis',
      'mystic-obelisk': 'Mystic Obelisk',
      'golden-pantheon': 'Golden Pantheon',
      'plank-labyrinth': 'Plank Labyrinth',
      prison: 'Iron Citadel Prison',
      apotheca: 'Grand Apotheca',
      abbey: 'Silent Abbey'
    };

    const tileDescriptions = {
      empty: 'An empty space where a new tile can be placed',
      mountain: 'A towering mountain peak',
      grass: 'A lush grass tile',
      forest: 'A dense forest area',
      water: 'A body of water',
      city: 'A bustling city',
      town: 'A small town',
      mystery: 'A mysterious location',
      portal: 'A magical portal',
      'portal-entrance': 'An entrance to a portal',
      'portal-exit': 'An exit from a portal',
      snow: 'A snowy landscape',
      cave: 'A dark cave',
      dungeon: 'A dangerous dungeon',
      castle: 'A majestic castle',
      ice: 'A frozen ice tile',
      desert: 'A hot desert',
      lava: 'Molten lava',
      volcano: 'An active volcano',
      sheep: 'A sheep grazing area',
      horse: 'A horse stable',
      special: 'A special tile',
      swamp: 'A murky swamp',
      treasure: 'A treasure location',
      monster: 'A monster lair',
      vacant: 'A vacant plot of land',
      // Property tile descriptions
      archery: 'A training ground for archers',
      blacksmith: 'A forge where weapons and armor are crafted',
      sawmill: 'A mill for processing wood into planks',
      fisherman: 'A dock where fish are caught and sold',
      grocery: 'A store selling fresh produce and food',
      foodcourt: 'A collection of food vendors and restaurants',
      well: 'A source of fresh water for the community',
      windmill: 'A mill powered by wind for grinding grain',
      fountain: 'A decorative water feature',
      house: 'A comfortable home for residents',
      inn: 'A place for travelers to rest and eat',
      jousting: 'An arena for knightly tournaments',
      mansion: 'A luxurious residence for the wealthy',
      mayor: 'The administrative center of the town',
      'streak-scroll': 'A magical scroll that freezes your streak',
      farm: 'A fertile farm for growing crops',
      lumber_mill: 'A facility for processing timber',
      market: 'A bustling marketplace for trading',
      cottage: 'A cozy cottage for residents',
      crossroad: 'A busy crossroad connecting the kingdom',
      straightroad: 'A straight road connecting the kingdom',
      cornerroad: 'A curved road connecting the kingdom',
      tsplitroad: 'A T-shaped road split connecting three paths',
      jungle: 'A dense, overgrown jungle',
      ruins: 'Crumbling remains of an ancient structure',
      graveyard: 'A spooky graveyard',
      farmland: 'Fertile land for farming',
      oasis: 'A refreshing oasis in the desert',
      coral_reef: 'A vibrant coral reef',
      crystal_cavern: 'A cave filled with glowing crystals',
      floating_island: 'A magical island floating in the sky',
      'zen-garden': 'A peaceful sanctuary for meditation',
      'quest-board': 'A board listing the kingdom\'s tasks and quests',
      monument: 'A monument honoring the kingdom\'s achievements',
      'training-grounds': 'A place where heroes train and improve their skills',
      tavern: 'A lively place to socialize and meet other adventurers',
      watchtower: 'A tall tower to keep watch over the kingdom',
      library: 'A vast collection of knowledge and ancient texts',
      wizard: 'A mysterious tower where wizards practice arcane arts',
      temple: 'A sacred place for meditation and worship',
      'market-stalls': 'A busy marketplace with many trading stalls',
      fortune_teller: 'A mysterious entity offering fortunes and tasks',
      'daily-hub': 'A central hub to manage your habits and streak progress',
      pyramid: 'An ancient landmark checking daily habits completion',
      'whispering-well': 'A magical well for sealing daily focus pacts',
      'sphinx-gates': "An ancient gateway guarding passage based on daily discipline",
      'whispering-canopy': 'An ancient forest canopy where you can seal a focus pact of silence',
      'frostfire-obelisk': 'A frozen monument that can seal a daily streak freeze pact or award glacial shards',
      'fairy-ring': 'A mystical circle of toadstools where pixies trade resources and play luck games',
      'settlement': 'A small rustic settlement with a local marketplace shop',
      'megapolis': 'A grand megapolis protected by concentric walls containing six unique trade districts',
      'mystic-obelisk': 'A celestial spire that grants the Astral Fortune perk (+15% unowned scratch card chance)',
      'golden-pantheon': 'A magnificent golden temple yielding massive wealth and rare Crown card packs daily',
      'plank-labyrinth': 'A complex puzzle maze of wooden planks. Solve it to retrieve legendary treasures!',
      prison: 'A fortified dungeon for daily inmate trials and outlaw dilemmas',
      apotheca: 'A botanical glasshouse for daily mystery decoctions and botanical trades',
      abbey: 'A silent gothic monastery offering daily vows of focus and benedictions'
    };

    const tileImages = {
      empty: '/images/tiles/empty-tile.webp',
      mountain: '/images/tiles/mountain-tile.webp',
      grass: '/images/tiles/grass-tile.webp',
      forest: '/images/tiles/forest-tile.webp',
      water: '/images/tiles/water-tile.webp',
      city: '/images/tiles/city-tile.webp',
      town: '/images/tiles/town-tile.webp',
      mystery: '/images/tiles/mystery-tile.webp',
      portal: '/images/tiles/portal-tile.webp',
      'portal-entrance': '/images/tiles/portal-entrance-tile.webp',
      'portal-exit': '/images/tiles/portal-exit-tile.webp',
      snow: '/images/tiles/snow-tile.webp',
      cave: '/images/tiles/cave-tile.webp',
      dungeon: '/images/tiles/dungeon-tile.webp',
      castle: '/images/tiles/castle-tile.webp',
      ice: '/images/tiles/ice-tile.webp',
      desert: '/images/tiles/desert-tile.webp',
      lava: '/images/tiles/lava-tile.webp',
      volcano: '/images/tiles/volcano-tile.webp',
      sheep: '/images/tiles/sheep-tile.webp',
      horse: '/images/tiles/horse-tile.webp',
      special: '/images/tiles/special-tile.webp',
      swamp: '/images/tiles/swamp-tile.webp',
      treasure: '/images/tiles/treasure-tile.webp',
      monster: '/images/tiles/monster-tile.webp',
      vacant: '/images/kingdom-tiles/Vacant.webp',
      // Property tile images
      archery: '/images/kingdom-tiles/Archery.webp',
      blacksmith: '/images/kingdom-tiles/Blacksmith.webp',
      sawmill: '/images/kingdom-tiles/Sawmill.webp',
      fisherman: '/images/kingdom-tiles/Fisherman.webp',
      grocery: '/images/kingdom-tiles/Grocery.webp',
      foodcourt: '/images/kingdom-tiles/Foodcourt.webp',
      well: '/images/kingdom-tiles/Well.webp',
      windmill: '/images/kingdom-tiles/Windmill.webp',
      fountain: '/images/kingdom-tiles/Fountain.webp',
      house: '/images/kingdom-tiles/House.webp',
      inn: '/images/kingdom-tiles/Inn.webp',
      jousting: '/images/kingdom-tiles/Jousting.webp',
      mansion: '/images/kingdom-tiles/Mansion.webp',
      mayor: '/images/kingdom-tiles/Mayor.webp',
      'streak-scroll': '/images/tiles/streak-scroll-tile.webp',
      farm: '/images/kingdom-tiles/Farm.webp',
      lumber_mill: '/images/kingdom-tiles/LumberMill.webp',
      market: '/images/kingdom-tiles/Market.webp',
      cottage: '/images/kingdom-tiles/Cottage.webp',
      crossroad: '/images/kingdom-tiles/Crossroad.webp',
      straightroad: '/images/kingdom-tiles/Straightroad.webp',
      cornerroad: '/images/kingdom-tiles/Cornerroad.webp',
      tsplitroad: '/images/kingdom-tiles/Tsplitroad.webp',
      jungle: '/images/tiles/jungle-tile.webp',
      ruins: '/images/tiles/ruins-tile.webp',
      graveyard: '/images/tiles/graveyard-tile.webp',
      farmland: '/images/tiles/farmland-tile.webp',
      oasis: '/images/tiles/oasis-tile.webp',
      coral_reef: '/images/tiles/coral_reef-tile.webp',
      crystal_cavern: '/images/tiles/crystal_cavern-tile.webp',
      floating_island: '/images/tiles/floating_island-tile.webp',
       'zen-garden': '/images/kingdom-tiles/ZenGarden.webp',
      'quest-board': '/images/kingdom-tiles/QuestBoard.webp',
      'daily-hub': '/images/kingdom-tiles/Dailyhub.png',
      monument: '/images/kingdom-tiles/Monument.webp',
      'training-grounds': '/images/kingdom-tiles/TrainingGrounds.webp',
      tavern: '/images/kingdom-tiles/Inn.webp',
      watchtower: '/images/kingdom-tiles/Watchtower.webp',
      library: '/images/kingdom-tiles/Library.webp',
      wizard: '/images/kingdom-tiles/Wizard.webp',
      temple: '/images/kingdom-tiles/Temple.webp',
      'market-stalls': '/images/kingdom-tiles/MarketStalls.webp',
      fortune_teller: '/images/kingdom-tiles/fortune_teller.png',
      pyramid: '/images/tiles/pyramid-tile.png',
      'whispering-well': '/images/tiles/whispering-well-tile.png',
      'sphinx-gates': '/images/tiles/sphinx-gates-tile.png',
      'whispering-canopy': '/images/tiles/whispering-canopy-tile.png',
      'frostfire-obelisk': '/images/tiles/frostfire-obelisk-tile.png',
      'fairy-ring': '/images/tiles/fairy-ring-tile.png',
      'settlement': '/images/tiles/settlement-tile.webp',
      'megapolis': '/images/tiles/megapolis-tile.webp',
      'mystic-obelisk': '/images/tiles/mystic-obelisk-tile.webp',
      'golden-pantheon': '/images/tiles/golden-pantheon-tile.webp',
      'plank-labyrinth': '/images/tiles/plank-labyrinth-tile.webp',
      prison: '/images/tiles/prison-tile.webp',
      apotheca: '/images/tiles/apotheca-tile.webp',
      abbey: '/images/tiles/abbey-tile.webp'
    };

    return {
      id: `tile-${y}-${x}`,
      type: type,
      connections: [],
      rotation: 0,
      revealed: true,
      name: tileNames[type] || `${type} tile`,
      description: tileDescriptions[type] || `A ${type} tile`,
      isVisited: false,
      x,
      y,
      ariaLabel: `${tileNames[type] || type} at position ${x}, ${y}`,
      image: tileImages[type] || `/images/tiles/${type}-tile.webp`,
      cost: 0,
      quantity: 1
    };
  }
}

// Generate a unique seed for each user
export function generateUserSeed(): number {
  return Math.floor(Math.random() * 2147483647);
} 