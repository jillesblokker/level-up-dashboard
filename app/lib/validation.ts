import { z } from 'zod';
import { Position } from '@/types/game';

export const positionSchema = z.object({
  x: z.number().int(),
  y: z.number().int(),
});

export const tilePlacementSchema = z.object({
  tileType: z.string(),
  position: positionSchema,
});

export interface TilePlacementValidationError {
  code: 'INVALID_POSITION' | 'TILE_EXISTS' | 'INSUFFICIENT_INVENTORY' | 'INVALID_TILE_TYPE';
  message: string;
}

export function validateTilePlacement(
  position: Position,
  tileType: string,
  inventory: Record<string, number>,
  existingTiles: Position[]
): TilePlacementValidationError | null {
  // Validate position bounds
  if (position.x < 0 || position.y < 0 || position.x > 100 || position.y > 100) {
    return {
      code: 'INVALID_POSITION',
      message: 'Position is out of bounds',
    };
  }

  // Check if tile already exists at position
  if (existingTiles.some(tile => tile.x === position.x && tile.y === position.y)) {
    return {
      code: 'TILE_EXISTS',
      message: 'A tile already exists at this position',
    };
  }

  // Check inventory
  if (!inventory[tileType] || inventory[tileType] <= 0) {
    return {
      code: 'INSUFFICIENT_INVENTORY',
      message: 'Not enough tiles in inventory',
    };
  }

  return null;
} 