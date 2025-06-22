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
    special: 'Special',
    snow: 'Snow',
    desert: 'Desert',
    ice: 'Ice',
    lava: 'Lava',
    swamp: 'Swamp',
    mystery: 'Mystery',
    treasure: 'Treasure',
    monster: 'Monster',
    'portal-entrance': 'Portal Entrance',
    'portal-exit': 'Portal Exit',
    cave: 'Cave',
    volcano: 'Volcano',
    sheep: 'Sheep',
    horse: 'Horse',
  };
  return tileNames[type] || 'Unknown';
}

export function getDefaultConnections(type: TileType): string[] {
  const defaultConnections: Record<TileType, string[]> = {
    empty: [],
    grass: ['grass', 'town', 'city', 'castle', 'dungeon'],
    water: ['water'],
    mountain: ['mountain', 'dungeon'],
    forest: ['forest', 'dungeon'],
    city: ['grass'],
    town: ['grass'],
    dungeon: ['mountain', 'forest', 'grass'],
    castle: ['grass'],
    special: [],
    snow: [],
    desert: [],
    ice: [],
    lava: [],
    swamp: [],
    mystery: [],
    treasure: [],
    monster: [],
    'portal-entrance': [],
    'portal-exit': [],
    cave: ['mountain', 'grass'],
    volcano: ['lava', 'mountain'],
    sheep: ['grass'],
    horse: ['grass'],
  };
  return defaultConnections[type] || [];
} 