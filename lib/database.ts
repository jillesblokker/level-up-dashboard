"use client";

// A simple database implementation using IndexedDB
// This provides persistence beyond localStorage limits

import { InventoryItem, TileType } from "@/types/tiles";
import { QuestStats } from "@/types/game";

// Database is now deprecated. All persistence is handled by Supabase.
export class Database {
  async init() {}
  async saveTileInventory() {}
  async getTileInventory() { return []; }
  async saveQuestStats() {}
  useLocalStorageFallback() {}
}

// Export a singleton instance
export const db = new Database(); 