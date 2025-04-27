export interface Position {
  x: number;
  y: number;
}

export interface GameState {
  position: Position;
  mode: 'build' | 'move';
  inventory: Record<string, number>;
  selectedTile: string | null;
}

export type GameMode = 'build' | 'move'; 