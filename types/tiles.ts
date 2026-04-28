// types/tiles.ts
import { Tile, TileType, ConnectionDirection } from './core-interfaces';

export type { Tile, TileType, ConnectionDirection };

export interface MinimapEntity {
  id: string;
  type: TileType;
  x: number;
  y: number;
  name: string;
  revealed: boolean;
  isMainTile?: boolean;
}

export type MinimapRotationMode = 'fixed' | 'player';

export interface MapGridProps {
  grid: Tile[][];
  onTileClick: (x: number, y: number) => void;
  playerPos: { x: number; y: number };
  visibleRange?: number;
  revealedTiles: Set<string>;
  zoomLevel?: number;
}