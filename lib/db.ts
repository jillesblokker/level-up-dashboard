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

export interface TileItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: string;
  connections: string[];
  rotation: number;
  quantity: number;
  version?: number;
  lastUpdated?: string;
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
  version?: number;
}

export interface CityLocation {
  id?: number;
  name: string;
  type: string;
  description: string;
  imageId?: string;
  unlocked: boolean;
  version?: number;
  lastUpdated?: string;
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

// Conditionally define and export db based on environment
let db: LevelUpDatabase | undefined = undefined;
if (typeof window !== "undefined") {
  db = new LevelUpDatabase();
  db.open().catch((error) => {
    console.error("Failed to open database:", error);
  });
} else {
  // On the server, export a dummy db object to silence errors
  db = {
    characters: {} as Table<Character>,
    images: {} as Table<Image>,
    quests: {} as Table<Quest>,
    inventory: {} as Table<InventoryItem>,
    tileInventory: {} as Table<TileItem>,
    mapTiles: {} as Table<MapTile>,
    cities: {} as Table<City>,
    cityLocations: {} as Table<CityLocation>,
    activities: {} as Table<DailyActivity>,
    open: async () => {},
    delete: async () => {}
  } as unknown as LevelUpDatabase;
}

export { db };

// Helper functions for common database operations

// Get all items from a table
export async function getAll<T>(table: Table<T>): Promise<T[]> {
  if (!db) return [];
  try {
    return await table.toArray();
  } catch (error) {
    console.error(`Failed to get all items from table:`, error);
    return [];
  }
}

// Get an item by id
export async function getById<T>(table: Table<T>, id: number | string): Promise<T | undefined> {
  if (!db) return undefined;
  try {
    return await table.get(id);
  } catch (error) {
    console.error(`Failed to get item by id ${id}:`, error);
    return undefined;
  }
}

// Add an item to a table
export async function add<T>(table: Table<T>, item: T): Promise<number | string> {
  if (!db) throw new Error('Database not initialized');
  try {
    return await table.add(item);
  } catch (error) {
    console.error(`Failed to add item:`, error);
    throw error;
  }
}

// Update an item in a table
export async function update<T>(
  table: Table<T>,
  id: number | string,
  changes: Partial<T>
): Promise<number> {
  if (!db) throw new Error('Database not initialized');
  try {
    return await table.update(id, changes);
  } catch (error) {
    console.error(`Failed to update item ${id}:`, error);
    throw error;
  }
}

// Delete an item from a table
export async function remove<T>(table: Table<T>, id: number | string): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  try {
    await table.delete(id);
  } catch (error) {
    console.error(`Failed to delete item ${id}:`, error);
    throw error;
  }
}

// Initialize database with default data if empty
export async function initializeDatabase() {
  if (!db) throw new Error('Database not initialized');
  try {
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

      // Clear existing data first
      await db.tileInventory.clear();
      await db.cities.clear();
      await db.cityLocations.clear();

      // Add tiles to inventory using put instead of add
      for (const tile of initialTiles) {
        await db.tileInventory.put({
          ...tile,
          type: 'tile',
          version: 1,
          lastUpdated: now
        });
      }
      
      // Add starter city using put
      await db.cities.put({
        id: 1,
        name: "Starterton",
        description: "A small town where your adventure begins.",
        population: 100,
        wealth: 50,
        locations: [],
        dateDiscovered: new Date().toISOString(),
        version: 1
      });
    
      // Add starter city locations using put
      const locationTypes = ['tavern', 'blacksmith', 'market', 'academy'];
      const locationNames = ['The Drunken Dragon', 'Ironforge Smithy', 'Market Square', 'Wizard\'s Academy'];
      
      for (let i = 0; i < locationTypes.length; i++) {
        await db.cityLocations.put({
          id: i + 1,
          name: locationNames[i] ?? "",
          type: locationTypes[i] ?? "",
          description: `A ${locationTypes[i] ?? ""} in Starterton.`,
          unlocked: i < 2, // Only first two locations unlocked initially
          version: 1,
          lastUpdated: now
        });
      }
    }
  } catch (error) {
    console.error("Error initializing database:", error);
    // If we get a constraint error, try to recover by clearing and reinitializing
    if (error instanceof Dexie.ConstraintError) {
      try {
        await db.delete();
        db = new LevelUpDatabase();
        await initializeDatabase();
      } catch (retryError) {
        console.error("Failed to recover from database error:", retryError);
      }
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
  if (!db) return [];
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
  if (!db) return false;
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

// Example usage of db with fallback for possibly undefined
export function getDbInstance(): LevelUpDatabase | undefined {
  return db;
} 