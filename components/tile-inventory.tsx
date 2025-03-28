"use client";

import { useState, useEffect } from "react"
import { db } from "@/lib/database"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { TileType, InventoryTile, TileItem } from "@/types/tiles"

interface TileInventoryProps {
  onSelectTile?: (tile: TileItem) => void;
}

function convertToTileItem(inventoryTile: InventoryTile): TileItem {
  return {
    id: inventoryTile.id,
    type: inventoryTile.type,
    name: inventoryTile.name,
    description: inventoryTile.description,
    connections: inventoryTile.connections,
    rotation: inventoryTile.rotation,
    cost: inventoryTile.cost,
    quantity: inventoryTile.quantity ?? 0
  };
}

function convertToInventoryTile(tileItem: TileItem): InventoryTile {
  return {
    id: tileItem.id,
    type: tileItem.type,
    name: tileItem.name,
    description: tileItem.description,
    connections: tileItem.connections,
    rotation: tileItem.rotation ?? 0,
    cost: tileItem.cost,
    quantity: tileItem.quantity,
    revealed: false
  };
}

export function TileInventory({ onSelectTile }: TileInventoryProps) {
  const { toast } = useToast()
  const [tiles, setTiles] = useState<TileItem[]>([])

  // Load tiles from database
  useEffect(() => {
    const loadTiles = async () => {
      try {
        const savedTiles = await db.getTileInventory();
        if (savedTiles && savedTiles.length > 0) {
          setTiles(savedTiles.map(convertToTileItem));
        }
      } catch (error) {
        console.error("Failed to load tile inventory:", error);
      }
    };

    loadTiles();
  }, []);

  // Save tiles when they change
  useEffect(() => {
    const saveTiles = async () => {
      if (tiles.length > 0) {
        try {
          await db.saveTileInventory(tiles.map(convertToInventoryTile));
        } catch (error) {
          console.error("Failed to save tile inventory:", error);
        }
      }
    };

    saveTiles();
  }, [tiles]);

  const handleSelectTile = (tile: TileItem) => {
    if (tile.quantity <= 0) {
      toast({
        title: "Out of Stock",
        description: `You don't have any ${tile.name} tiles left.`,
        variant: "destructive",
      });
      return;
    }

    if (onSelectTile) {
      onSelectTile(tile);
    }

    // Reduce quantity
    setTiles(prevTiles => 
      prevTiles.map(t => 
        t.id === tile.id 
          ? { ...t, quantity: t.quantity - 1 } 
          : t
      )
    );

    toast({
      title: "Tile Selected",
      description: `${tile.name} tile selected for placement.`,
      variant: "default",
    });
  };

  // Render tile inventory
  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold">Tile Inventory</h2>
      <div className="grid grid-cols-2 gap-4">
        {tiles.map((tile, index) => (
          <button
            key={index}
            onClick={() => handleSelectTile(tile)}
            className="flex flex-col items-center p-2 border rounded hover:bg-gray-100"
            disabled={tile.quantity === 0}
          >
            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
              {renderTilePreview(tile.type)}
            </div>
            <div className="mt-2 text-sm font-medium">{tile.name || tile.type}</div>
            <div className="text-xs text-gray-600">
              Quantity: {tile.quantity}
            </div>
            <div className="text-xs text-yellow-600">
              Cost: {tile.cost || 0} gold
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Function to render tile previews
function renderTilePreview(type: string) {
  switch (type) {
    case 'grass':
      return (
        <div className="w-full h-full bg-green-700">
          <svg viewBox="0 0 32 32" className="w-full h-full">
            <rect width="32" height="32" fill="#4CAF50" />
            <g fill="#388E3C" opacity="0.7">
              <path d="M5,10 C7,5 10,8 8,12 C13,10 15,15 10,17" />
              <path d="M20,15 C22,10 25,13 23,17 C28,15 30,20 25,22" />
            </g>
          </svg>
        </div>
      );
      
    case 'water':
      return (
        <div className="w-full h-full bg-blue-600">
          <svg viewBox="0 0 32 32" className="w-full h-full">
            <rect width="32" height="32" fill="#2196F3" />
            <g fill="#1E88E5" opacity="0.7">
              <path d="M0,20 Q16,10 32,20 L32,32 L0,32 Z" />
            </g>
          </svg>
        </div>
      );
      
    case 'mountain':
      return (
        <div className="w-full h-full bg-gray-600">
          <svg viewBox="0 0 32 32" className="w-full h-full">
            <rect width="32" height="32" fill="#795548" />
            <path d="M8,26 L16,10 L24,26 Z" fill="#5D4037" />
          </svg>
        </div>
      );
      
    case 'forest':
      return (
        <div className="w-full h-full bg-green-800">
          <svg viewBox="0 0 32 32" className="w-full h-full">
            <rect width="32" height="32" fill="#33691E" />
            <path d="M8,26 L16,8 L24,26 Z" fill="#2E7D32" />
          </svg>
        </div>
      );

    case 'mystery':
    case 'big-mystery':
      return (
        <div className="w-full h-full bg-purple-700">
          <svg viewBox="0 0 32 32" className="w-full h-full">
            <rect width="32" height="32" fill="#7E57C2" />
            <g fill="#5E35B1" opacity="0.7">
              <path d="M16,8 L24,16 L16,24 L8,16 Z" />
              <circle cx="16" cy="16" r="4" />
            </g>
          </svg>
        </div>
      );
      
    default:
      return <div className="w-full h-full bg-gray-500"></div>;
  }
} 