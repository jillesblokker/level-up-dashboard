import { Tile } from './tiles';

export type MinimapRotationMode = 'fixed' | 'dynamic' | 'static';

export interface MinimapEntity {
  type: string;
  x: number;
  y: number;
  color?: string;
}

export interface MinimapProps {
  grid: Tile[][];
  playerPosition: { x: number; y: number };
  playerDirection?: number; // degrees, 0 = north
  entities: MinimapEntity[];
  zoom: number;
  onZoomChange: (zoom: number) => void;
  rotationMode: MinimapRotationMode;
  onRotationModeChange: (mode: MinimapRotationMode) => void;
  className?: string;
  onClose: () => void;
} 