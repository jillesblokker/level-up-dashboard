import { TileType } from '@/types/tiles';

export function getTileName(type: TileType): string {
  const tileNames: Record<TileType, string> = {
    empty: 'Empty',
    grass: 'Grass',
    water: 'Water',
    mountain: 'Mountain',
    forest: 'Forest',
    city: 'City',
    town: 'Town',
    dungeon: 'Dungeon',
    castle: 'Castle',
    road: 'Road',
    port: 'Port'
  };
  return tileNames[type] || 'Unknown';
}

export function getDefaultConnections(type: TileType): string[] {
  const defaultConnections: Record<TileType, string[]> = {
    empty: [],
    grass: ['grass', 'road', 'town', 'city', 'castle', 'dungeon'],
    water: ['water', 'port'],
    mountain: ['mountain', 'dungeon'],
    forest: ['forest', 'road', 'dungeon'],
    city: ['road', 'grass'],
    town: ['road', 'grass'],
    dungeon: ['mountain', 'forest', 'grass'],
    castle: ['road', 'grass'],
    road: ['road', 'grass', 'town', 'city', 'castle'],
    port: ['water', 'road']
  };
  return defaultConnections[type] || [];
} 