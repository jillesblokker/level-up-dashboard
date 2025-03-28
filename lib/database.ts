"use client";

// A simple database implementation using IndexedDB
// This provides persistence beyond localStorage limits

import { InventoryTile, TileType } from "@/types/tiles";

class Database {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private readonly DB_NAME = "realm-builder";
  private readonly DB_VERSION = 3; // Increment version to force schema update
  private readonly STORES = {
    TILES: "tiles",
    DISCOVERIES: "discoveries",
    GRID: "grid",
    CHARACTER: "character",
    STATS: "stats"
  };

  // Public init function that components can call
  async init(): Promise<void> {
    try {
      await this.getDb();
    } catch (error) {
      await this.handleDatabaseError(error);
    }
  }

  private async getDb(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
          // Create or update tiles store with indexes
          if (!db.objectStoreNames.contains(this.STORES.TILES)) {
            const tileStore = db.createObjectStore(this.STORES.TILES, { keyPath: "id" });
            // Add indexes for better querying
            tileStore.createIndex("type", "type", { unique: false });
            tileStore.createIndex("lastUpdated", "lastUpdated", { unique: false });
            tileStore.createIndex("version", "version", { unique: false });
          } else if (event.target instanceof IDBOpenDBRequest && event.target.transaction) {
            // Add indexes to existing store if upgrading
            const tileStore = event.target.transaction.objectStore(this.STORES.TILES);
            if (tileStore && !tileStore.indexNames.contains("type")) {
              tileStore.createIndex("type", "type", { unique: false });
            }
            if (tileStore && !tileStore.indexNames.contains("lastUpdated")) {
              tileStore.createIndex("lastUpdated", "lastUpdated", { unique: false });
            }
            if (tileStore && !tileStore.indexNames.contains("version")) {
              tileStore.createIndex("version", "version", { unique: false });
            }
          }
          
          // Create or update other stores
          if (!db.objectStoreNames.contains(this.STORES.DISCOVERIES)) {
            db.createObjectStore(this.STORES.DISCOVERIES, { keyPath: "id" });
          }
          
          if (!db.objectStoreNames.contains(this.STORES.GRID)) {
            db.createObjectStore(this.STORES.GRID, { keyPath: "id" });
          }
          
          if (!db.objectStoreNames.contains(this.STORES.CHARACTER)) {
            db.createObjectStore(this.STORES.CHARACTER, { keyPath: "id" });
          }
      };
    });
  }
    return this.dbPromise;
  }

  async saveTileInventory(tiles: InventoryTile[]): Promise<void> {
    try {
      const db = await this.getDb();
      
      // First, get existing tiles
      const existingTiles = await this.getTileInventory();
      const existingIds = new Set(existingTiles.map(t => t.id));

      // Create a single transaction for all operations
      const tx = db.transaction(this.STORES.TILES, "readwrite");
      const store = tx.objectStore(this.STORES.TILES);

      // Process all tiles
      for (const tile of tiles) {
        // Generate a unique ID if one doesn't exist
        const tileId = tile.id || `tile-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        
        // Add timestamp and version for tracking changes
        const tileData = {
          ...tile,
          id: tileId,
          type: tile.type as TileType,
          quantity: typeof tile.quantity === 'number' ? tile.quantity : 0,
          cost: typeof tile.cost === 'number' ? tile.cost : 0,
          connections: Array.isArray(tile.connections) ? tile.connections : [],
          rotation: typeof tile.rotation === 'number' ? tile.rotation : 0,
          lastUpdated: Date.now(),
          version: (tile as any).version ? ((tile as any).version + 1) : 1
        };

        // Use put instead of add to handle both updates and inserts
        store.put(tileData);
        existingIds.delete(tileId);
      }

      // Remove tiles that no longer exist
      for (const oldId of existingIds) {
        store.delete(oldId);
      }

      // Wait for the transaction to complete
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => {
          // Update localStorage backup after successful save
          localStorage.setItem("tile-inventory", JSON.stringify(tiles));
          resolve();
        };
        tx.onerror = () => {
          console.error("Transaction error:", tx.error);
          reject(tx.error);
        };
      });
    } catch (error) {
      console.error("Error saving tile inventory:", error);
      // Always save to localStorage as backup
      localStorage.setItem("tile-inventory", JSON.stringify(tiles));
      throw error; // Re-throw to allow caller to handle
    }
  }

  async getTileInventory(): Promise<InventoryTile[]> {
    try {
      const db = await this.getDb();
      const tx = db.transaction(this.STORES.TILES, "readonly");
      const store = tx.objectStore(this.STORES.TILES);

    return new Promise((resolve, reject) => {
        const request = store.getAll();
      request.onsuccess = () => {
          const tiles = request.result || [];
          // Also update localStorage backup
          localStorage.setItem("tile-inventory", JSON.stringify(tiles));
          resolve(tiles);
      };
      request.onerror = () => {
          const savedTiles = localStorage.getItem("tile-inventory");
          resolve(savedTiles ? JSON.parse(savedTiles) : []);
      };
    });
    } catch (error) {
      await this.handleDatabaseError(error);
      const savedTiles = localStorage.getItem("tile-inventory");
      return savedTiles ? JSON.parse(savedTiles) : [];
    }
  }

  async updateTileQuantity(tileId: string, newQuantity: number): Promise<void> {
    try {
      const db = await this.getDb();
      const tx = db.transaction(this.STORES.TILES, "readwrite");
      const store = tx.objectStore(this.STORES.TILES);

      const tile = await new Promise<InventoryTile | undefined>((resolve, reject) => {
        const request = store.get(tileId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (tile) {
        const updatedTile = { ...tile, quantity: newQuantity };
        await new Promise<void>((resolve, reject) => {
          const request = store.put(updatedTile);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
    } catch (error) {
      console.error("Error updating tile quantity:", error);
    }
  }

  // Discoveries functionality
  async saveDiscoveries(discoveries: string[]): Promise<void> {
    try {
      const db = await this.getDb();
      const tx = db.transaction(this.STORES.DISCOVERIES, "readwrite");
      const store = tx.objectStore(this.STORES.DISCOVERIES);

      await new Promise<void>((resolve, reject) => {
        const request = store.put({ id: "discoveries", data: discoveries });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      localStorage.setItem("discoveries", JSON.stringify(discoveries));
    } catch (error) {
      console.error("Error saving discoveries:", error);
      localStorage.setItem("discoveries", JSON.stringify(discoveries));
    }
  }

  async getDiscoveries(): Promise<string[]> {
    try {
      const db = await this.getDb();
      const tx = db.transaction(this.STORES.DISCOVERIES, "readonly");
      const store = tx.objectStore(this.STORES.DISCOVERIES);

      return new Promise((resolve, reject) => {
        const request = store.get("discoveries");
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.data : []);
        };
        request.onerror = () => {
          const saved = localStorage.getItem("discoveries");
          resolve(saved ? JSON.parse(saved) : []);
        };
      });
      } catch (error) {
      console.error("Error getting discoveries:", error);
      const saved = localStorage.getItem("discoveries");
      return saved ? JSON.parse(saved) : [];
    }
  }

  // Add error recovery method
  private async handleDatabaseError(error: any): Promise<void> {
    console.error("Database error:", error);
    
    // If database is corrupted, try to delete and recreate
    if (error.name === "InvalidStateError" || error.name === "ConstraintError") {
      try {
        // Delete the database
        await new Promise<void>((resolve, reject) => {
          const deleteRequest = indexedDB.deleteDatabase(this.DB_NAME);
          deleteRequest.onsuccess = () => resolve();
          deleteRequest.onerror = () => reject(deleteRequest.error);
        });
        
        // Reset the promise so a new database will be created
        this.dbPromise = null;
        
        // Try to reinitialize
        await this.getDb();
        
        console.log("Database successfully reset");
      } catch (resetError) {
        console.error("Failed to reset database:", resetError);
        // Fall back to localStorage
        this.useLocalStorageFallback();
      }
    }
  }

  // Add localStorage fallback
  private useLocalStorageFallback(): void {
    console.log("Falling back to localStorage");
    // Clear IndexedDB reference
    this.dbPromise = null;
  }

  async getQuestStats() {
    try {
      const savedStats = localStorage.getItem("quest-stats");
      return savedStats ? JSON.parse(savedStats) : null;
    } catch (error) {
      console.error("Error getting quest stats:", error);
      return null;
    }
  }

  async saveQuestStats(stats: any) {
    try {
      localStorage.setItem("quest-stats", JSON.stringify(stats));
    } catch (error) {
      console.error("Error saving quest stats:", error);
    }
  }
}

// Export a singleton instance
export const db = new Database(); 