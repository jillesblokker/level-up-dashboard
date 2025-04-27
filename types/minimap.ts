export interface MinimapEntity {
  id: string;
  type: 'npc' | 'enemy' | 'landmark';
  position: { x: number; y: number };
  icon?: string; // emoji or icon path
  color?: string;
}

export type MinimapRotationMode = 'static' | 'player';

export interface MinimapProps {
  grid: any[][]; // Tile[][], but generic for now
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