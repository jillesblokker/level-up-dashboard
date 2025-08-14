import { Tile, TileType } from "@/types/tiles"

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
      mayor: 'Mayor\'s Office'
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
      mayor: 'The administrative center of the town'
    };

    const tileImages = {
      empty: '/images/tiles/empty-tile.png',
      mountain: '/images/tiles/mountain-tile.png',
      grass: '/images/tiles/grass-tile.png',
      forest: '/images/tiles/forest-tile.png',
      water: '/images/tiles/water-tile.png',
      city: '/images/tiles/city-tile.png',
      town: '/images/tiles/town-tile.png',
      mystery: '/images/tiles/mystery-tile.png',
      portal: '/images/tiles/portal-tile.png',
      'portal-entrance': '/images/tiles/portal-entrance-tile.png',
      'portal-exit': '/images/tiles/portal-exit-tile.png',
      snow: '/images/tiles/snow-tile.png',
      cave: '/images/tiles/cave-tile.png',
      dungeon: '/images/tiles/dungeon-tile.png',
      castle: '/images/tiles/castle-tile.png',
      ice: '/images/tiles/ice-tile.png',
      desert: '/images/tiles/desert-tile.png',
      lava: '/images/tiles/lava-tile.png',
      volcano: '/images/tiles/volcano-tile.png',
      sheep: '/images/tiles/sheep-tile.png',
      horse: '/images/tiles/horse-tile.png',
      special: '/images/tiles/special-tile.png',
      swamp: '/images/tiles/swamp-tile.png',
      treasure: '/images/tiles/treasure-tile.png',
      monster: '/images/tiles/monster-tile.png',
      vacant: '/images/kingdom-tiles/Vacant.png',
      // Property tile images
      archery: '/images/kingdom-tiles/Archery.png',
      blacksmith: '/images/kingdom-tiles/Blacksmith.png',
      sawmill: '/images/kingdom-tiles/Sawmill.png',
      fisherman: '/images/kingdom-tiles/Fisherman.png',
      grocery: '/images/kingdom-tiles/Grocery.png',
      foodcourt: '/images/kingdom-tiles/Foodcourt.png',
      well: '/images/kingdom-tiles/Well.png',
      windmill: '/images/kingdom-tiles/Windmill.png',
      fountain: '/images/kingdom-tiles/Fountain.png',
      house: '/images/kingdom-tiles/House.png',
      inn: '/images/kingdom-tiles/Inn.png',
      jousting: '/images/kingdom-tiles/Jousting.png',
      mansion: '/images/kingdom-tiles/Mansion.png',
      mayor: '/images/kingdom-tiles/Mayor.png'
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
      image: tileImages[type] || `/images/tiles/${type}-tile.png`,
      cost: 0,
      quantity: 1
    };
  }
}

// Generate a unique seed for each user
export function generateUserSeed(): number {
  return Math.floor(Math.random() * 2147483647);
} 