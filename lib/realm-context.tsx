import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Tile, TileType } from '@/types/tiles';

interface RealmContextType {
  grid: Tile[][];
  setGrid: (grid: Tile[][]) => void;
  goldBalance: number;
  setGoldBalance: (balance: number) => void;
  selectedTile: { id: string; type: TileType; rotation: number; connections: string[] } | null;
  setSelectedTile: (tile: { id: string; type: TileType; rotation: number; connections: string[] } | null) => void;
}

const RealmContext = createContext<RealmContextType | undefined>(undefined);

export function RealmProvider({ children }: { children: ReactNode }) {
  const [grid, setGrid] = useState<Tile[][]>([]);
  const [goldBalance, setGoldBalance] = useState(1000);
  const [selectedTile, setSelectedTile] = useState<{ id: string; type: TileType; rotation: number; connections: string[] } | null>(null);

  return (
    <RealmContext.Provider
      value={{
        grid,
        setGrid,
        goldBalance,
        setGoldBalance,
        selectedTile,
        setSelectedTile,
      }}
    >
      {children}
    </RealmContext.Provider>
  );
}

export function useRealm() {
  const context = useContext(RealmContext);
  if (context === undefined) {
    throw new Error('useRealm must be used within a RealmProvider');
  }
  return context;
} 