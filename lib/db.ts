"use client";

import Dexie, { Table } from 'dexie';

// Define interfaces for our database tables
export interface Character {
  id?: number;
  name: string;
  level: number;
  experience: number;
  gold: number;
  might: number;
  knowledge: number;
  honor: number;
  craft: number;
  vitality: number;
  created: string;
  lastUpdated: string;
}

export interface Image {
  id: string;
  dataUrl: string;
  dateModified: string;
}

export interface Quest {
  id?: number;
  title: string;
  description: string;
  category: string;
  reward: number;
  rewardType: 'gold' | 'experience' | 'item';
  completed: boolean;
  dateCreated: string;
  dateCompleted?: string;
}

export interface InventoryItem {
  id?: number;
  name: string;
  type: string;
  imageId?: string;
  description: string;
  quantity: number;
  acquired: string;
}

interface TileItem {
  id: string;
  name: string;
  description: string;
  type: string;
  connections: string[];
  rotation: number;
  quantity: number;
  cost: number;
}

export interface MapTile {
  id?: number;
  x: number;
  y: number;
  type: string;
  discovered: boolean;
  hasMystery: boolean;
  hasTreasure: boolean;
  cityName?: string;
  dateDiscovered?: string;
}

export interface City {
  id?: number;
  name: string;
  description: string;
  imageId?: string;
  population: number;
  wealth: number;
  locations: CityLocation[];
  dateDiscovered: string;
}

export interface CityLocation {
  id?: number;
  name: string;
  type: string;
  description: string;
  imageId?: string;
  unlocked: boolean;
}

export interface DailyActivity {
  date: string;
  questsCompleted: number;
  goldEarned: number;
  experienceGained: number;
}

// Define the database
class LevelUpDatabase extends Dexie {
  characters!: Table<Character>;
  images!: Table<Image>;
  quests!: Table<Quest>;
  inventory!: Table<InventoryItem>;
  tileInventory!: Table<TileItem>;
  mapTiles!: Table<MapTile>;
  cities!: Table<City>;
  cityLocations!: Table<CityLocation>;
  activities!: Table<DailyActivity>;

  constructor() {
    super('levelUpDashboard');
    
    this.version(1).stores({
      characters: '++id, name',
      images: 'id, dateModified',
      quests: '++id, category, completed',
      inventory: '++id, type',
      tileInventory: 'id, type',
      mapTiles: '++id, [x+y], discovered',
      cities: '++id, name',
      cityLocations: '++id, name, type',
      activities: 'date'
    });
  }
}

// Create and export a single instance of the database
// Wrap the database creation in a try-catch to prevent critical errors
let db: LevelUpDatabase;

try {
  db = new LevelUpDatabase();
} catch (error) {
  console.error("Failed to initialize database:", error);
  // Create a fallback database instance that won't crash the app
  db = new Dexie('levelUpDashboard') as LevelUpDatabase;
  // We'll initialize the schema again when possible
  db.version(1).stores({
    characters: '++id, name',
    images: 'id, dateModified',
    quests: '++id, category, completed',
    inventory: '++id, type',
    tileInventory: 'id, type',
    mapTiles: '++id, [x+y], discovered',
    cities: '++id, name',
    cityLocations: '++id, name, type',
    activities: 'date'
  });
}

export { db };

// Helper functions for common database operations

// Get all items from a table
export async function getAll<T>(table: Table<T>): Promise<T[]> {
  return await table.toArray();
}

// Get an item by id
export async function getById<T>(table: Table<T>, id: number | string): Promise<T | undefined> {
  return await table.get(id);
}

// Add an item to a table
export async function add<T>(table: Table<T>, item: T): Promise<number | string> {
  return await table.add(item);
}

// Update an item in a table
export async function update<T>(table: Table<T>, id: number | string, changes: Partial<T>): Promise<number> {
  return await table.update(id, changes as any);
}

// Delete an item from a table
export async function remove<T>(table: Table<T>, id: number | string): Promise<void> {
  await table.delete(id);
}

// Initialize database with default data if empty
export async function initializeDatabase() {
  const characterCount = await db.characters.count();
  
  if (characterCount === 0) {
    const now = new Date().toISOString();
    
    // Initialize tiles with costs
    const initialTiles = [
      { id: "grass", name: "Grass", description: "Basic terrain", cost: 5, type: "grass", connections: [], rotation: 0, quantity: 50 },
      { id: "forest", name: "Forest", description: "Dense woodland", cost: 15, type: "forest", connections: [], rotation: 0, quantity: 30 },
      { id: "water", name: "Water", description: "Water body", cost: 20, type: "water", connections: [], rotation: 0, quantity: 20 },
      { id: "desert", name: "Desert", description: "Arid terrain", cost: 10, type: "desert", connections: [], rotation: 0, quantity: 25 },
      { id: "road", name: "Road", description: "Straight road", cost: 8, type: "road", connections: ["left", "right"], rotation: 0, quantity: 40 },
      { id: "corner-road", name: "Corner Road", description: "Corner road", cost: 12, type: "corner-road", connections: ["left", "up"], rotation: 0, quantity: 30 },
      { id: "crossroad", name: "Crossroad", description: "Four-way road", cost: 25, type: "crossroad", connections: ["left", "right", "up", "down"], rotation: 0, quantity: 20 },
    ];

    // Add tiles to inventory
    for (const tile of initialTiles) {
      await db.tileInventory.add({
        ...tile,
        type: 'tile'
      });
    }
    
    // Add starter city
    await db.cities.add({
      name: "Starterton",
      description: "A small town where your adventure begins.",
      population: 100,
      wealth: 50,
      locations: [],
      dateDiscovered: now
    });
    
    // Add starter city locations
    const locationTypes = ['tavern', 'blacksmith', 'market', 'academy'];
    const locationNames = ['The Drunken Dragon', 'Ironforge Smithy', 'Market Square', 'Wizard\'s Academy'];
    
    for (let i = 0; i < locationTypes.length; i++) {
      await db.cityLocations.add({
        name: locationNames[i],
        type: locationTypes[i],
        description: `A ${locationTypes[i]} in Starterton.`,
        unlocked: i < 2 // Only first two locations unlocked initially
      });
    }
  }
}

// Helper function to determine initial tile type based on position
function determineInitialTileType(x: number, y: number): string {
  // Create a natural-looking map with mountains, water, and grassland
  if (x === 0 || y === 0 || x === 9 || y === 9) {
    return 'mountain'; // Border mountains
  }
  
  if ((x === 3 || x === 4) && (y === 3 || y === 4)) {
    return 'water'; // Small lake
  }
  
  if (x === 5 && y === 5) {
    return 'castle'; // Center is the castle
  }
  
  // Random distribution of other terrain types
  const rand = Math.random();
  if (rand < 0.6) return 'grass';
  if (rand < 0.8) return 'forest';
  return 'mountain';
}

export async function getTileInventory() {
  try {
    const tiles = await db.tileInventory.toArray();
    return tiles.map(tile => ({
      id: tile.id,
      name: tile.name,
      description: tile.description,
      type: tile.type,
      connections: tile.connections || [],
      rotation: tile.rotation || 0,
      quantity: tile.quantity || 0,
      cost: tile.cost || 0
    }));
  } catch (error) {
    console.error("Error getting tile inventory:", error);
    return [];
  }
}

export async function saveTileInventory(tiles: TileItem[]) {
  try {
    // Clear existing inventory
    await db.tileInventory.clear();
    
    // Add new tiles
    for (const tile of tiles) {
      await db.tileInventory.add({
        ...tile,
        type: 'tile',
        cost: tile.cost || 0
      });
    }
    return true;
  } catch (error) {
    console.error("Error saving tile inventory:", error);
    return false;
  }
} 