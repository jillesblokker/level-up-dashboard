export interface GridCell {
  x: number;
  y: number;
  type: string;
  rotation?: number;
  flip?: boolean;
}

export interface Grid {
  cells: GridCell[];
  width: number;
  height: number;
}

export interface RealmMapData {
  grid: Grid;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
} 