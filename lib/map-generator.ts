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
        if (x === 0 || x === width - 1) {
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
    return {
      id: `tile-${y}-${x}`,
      type: type || 'default',
      connections: [],
      rotation: 0,
      revealed: true,
      name: '',
      description: '',
      isVisited: false,
      x,
      y
    };
  }
}

// Generate a unique seed for each user
export function generateUserSeed(): number {
  return Math.floor(Math.random() * 2147483647);
} 