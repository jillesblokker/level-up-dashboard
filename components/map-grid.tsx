"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { User, Building, RotateCw, Trash } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Tile } from "@/types/tiles";
import { TileVisual } from "@/components/tile-visual";
import { cn } from "@/lib/utils";
import { BattleMinigame } from "@/components/battle-minigame";
import { generateMysteryEvent, handleEventOutcome, MysteryEvent, MysteryEventOutcome, MysteryEventReward, MysteryEventType } from '@/lib/mystery-events'
import { BattleModal } from "@/components/battle-modal"
import { Battle } from "@/types/battle";
import { MapGridProps as BaseMapGridProps, SelectedInventoryItem } from '@/types/tiles';

interface CityData {
  name: string;
  type: string;
}

interface Event {
  type: 'mystery' | 'battle';
  title: string;
  description: string;
  choices: string[];
  enemyName?: string;
  enemyLevel?: number;
}

interface BattleEvent extends Event {
  type: 'battle';
  enemyName: string;
  enemyLevel: number;
}

interface MapGridProps extends BaseMapGridProps {
  onExperienceUpdate?: (amount: number) => void;
  onRotateTile?: (x: number, y: number) => void;
  setHoveredTile: (tile: { row: number; col: number } | null) => void;
}

interface HoveredTile {
  tile: Tile;
  x: number;
  y: number;
}

interface GameEvent {
  type: 'mystery' | 'battle';
  title: string;
  description: string;
  choices: string[];
  enemyName?: string;
  enemyLevel?: number;
  outcomes?: Record<string, MysteryEventOutcome>;
  requiredItems?: string[];
}

export function MapGrid({ 
  onDiscovery, 
  selectedTile = null,
  onTilePlaced,
  grid,
  character,
  onCharacterMove,
  onTileClick,
  onGridUpdate,
  onGoldUpdate,
  onExperienceUpdate,
  onHover,
  onHoverEnd,
  onRotateTile,
  onDeleteTile,
  isMovementMode = false,
  gridRotation,
  hoveredTile,
  setHoveredTile
}: MapGridProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [currentBattle, setCurrentBattle] = useState<Battle | null>(null);
  const [showBattleModal, setShowBattleModal] = useState(false);
  const [battlePosition, setBattlePosition] = useState<{ x: number; y: number } | null>(null);

  const handleMysteryTile = (tile: Tile) => {
    const event = generateMysteryEvent();
    setCurrentEvent({
      type: 'mystery',
      title: event.title,
      description: event.description,
      choices: event.choices,
      outcomes: event.outcomes
    });
  };

  const handleEventChoice = (choice: string, index: number) => {
    if (!currentEvent) return;

    if (currentEvent.type === 'mystery') {
      console.log(`Chose: ${choice}. Outcome:`, currentEvent.outcomes?.[choice]);
      const outcome = currentEvent.outcomes?.[choice];
      if (outcome && outcome.reward) {
        console.log('Handling mystery event reward:', outcome.reward);
      }
    }

    setCurrentEvent(null);
  };

  const translateCoordinates = (x: number, y: number, currentGrid: Tile[][], rotation: number) => {
    const rows = currentGrid.length;
    const cols = currentGrid[0]?.length || 0;

    switch (rotation) {
      case 0: return { x, y };
      case 90: return { x: y, y: cols - 1 - x };
      case 180: return { x: cols - 1 - x, y: rows - 1 - y };
      case 270: return { x: rows - 1 - y, y: x };
      default: return { x, y };
    }
  };

  const handleTileHover = useCallback((tile: Tile, x: number, y: number) => {
    if (!tile) {
      setHoveredTile(null);
      onHoverEnd?.();
      return;
    }
    const translated = translateCoordinates(x, y, grid, gridRotation);
    setHoveredTile({ row: translated.y, col: translated.x });
    onHover?.(translated.x, translated.y);
  }, [onHover, onHoverEnd, grid, gridRotation, setHoveredTile]);

  const handleTileLeave = useCallback(() => {
    setHoveredTile(null);
    onHoverEnd?.();
  }, [onHoverEnd, setHoveredTile]);

  const isPathClear = (startX: number, startY: number, endX: number, endY: number) => {
    const path: { x: number; y: number }[] = [];
    const dx = endX - startX;
    const dy = endY - startY;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      const step = dx > 0 ? 1 : -1;
      for (let x = startX; x !== endX + step; x += step) {
        path.push({ x, y: startY });
      }
    } else {
      const step = dy > 0 ? 1 : -1;
      for (let y = startY; y !== endY + step; y += step) {
        path.push({ x: startX, y });
      }
    }
    
    return path.every(pos => {
      const originalPos = translateCoordinates(pos.x, pos.y, grid, -gridRotation);
      if (originalPos.x < 0 || originalPos.y < 0 || originalPos.y >= grid.length || !grid[0] || originalPos.x >= grid[0].length) return false;
      const tile = grid[originalPos.y]?.[originalPos.x];
      return tile && tile.type && !['mountain', 'water', 'lava', 'volcano', 'empty', undefined, null].includes(tile.type);
    });
  };

  const isValidMovementTarget = (x: number, y: number) => {
    const originalTarget = translateCoordinates(x, y, grid, -gridRotation);
    const originalCharacter = translateCoordinates(character.x, character.y, grid, -gridRotation);

    if (originalTarget.x < 0 || originalTarget.y < 0 || originalTarget.y >= grid.length || !grid[0] || originalTarget.x >= grid[0].length) {
      console.log('Invalid: Out of bounds after translation', { x, y, originalTarget, gridSize: { rows: grid.length, cols: grid[0]?.length ?? 0 } });
      return false;
    }

    const targetTile = grid[originalTarget.y]?.[originalTarget.x];

    if (!targetTile || !targetTile.type) {
      console.log('Invalid: No tile or type at original position', { originalTarget, targetTile });
      return false;
    }

    const isValidTileType = !['mountain', 'water', 'lava', 'volcano', 'empty'].includes(targetTile.type);

    if (!isValidTileType) {
      console.log('Invalid: Invalid tile type at original position', { originalTarget, tileType: targetTile.type });
      return false;
    }

    if (!isPathClear(originalCharacter.x, originalCharacter.y, originalTarget.x, originalTarget.y)) {
      console.log('Invalid: Path is blocked in original grid');
      return false;
    }

    console.log('Valid movement target after translation', { x, y, originalTarget, tileType: targetTile.type });
    return true;
  };

  const handleMove = (targetTileInfo: { tile: Tile; x: number; y: number }) => {
    const { x, y } = targetTileInfo;
    const originalTarget = translateCoordinates(x, y, grid, -gridRotation);

    const isValid = isValidMovementTarget(x, y);

    if (!isValid) {
      const originalTargetCheck = translateCoordinates(x, y, grid, -gridRotation);

      if (originalTargetCheck.x < 0 || originalTargetCheck.y < 0 || originalTargetCheck.y >= grid.length || !grid[0] || originalTargetCheck.x >= grid[0].length) {
        toast({
          title: 'Invalid Move',
          description: 'Cannot move outside the map boundaries.',
          variant: 'destructive'
        });
      } else {
        const targetTile = grid[originalTargetCheck.y]?.[originalTargetCheck.x];
        if (!targetTile || targetTile.type === 'empty') {
          toast({
            title: 'Invalid Move',
            description: 'Cannot move to an empty space.',
            variant: 'destructive'
          });
        } else if (['mountain', 'water', 'lava', 'volcano'].includes(targetTile.type)) {
          toast({
            title: 'Invalid Move',
            description: `Cannot move to ${targetTile.type} tiles.`,
            variant: 'destructive'
          });
        } else if (!isPathClear(character.x, character.y, originalTargetCheck.x, originalTargetCheck.y)) {
          toast({
            title: 'Invalid Move',
            description: 'Path is blocked in original grid',
            variant: 'destructive'
          });
        }
      }
      return;
    }

    onCharacterMove(originalTarget.x, originalTarget.y);
    const movedToTile = grid[originalTarget.y]?.[originalTarget.x];
    if (movedToTile && movedToTile.type === 'mystery' && !movedToTile.isVisited) {
      handleMysteryTile(movedToTile);
    }
  };

  const handleTileClick = (tile: Tile, x: number, y: number) => {
    if (!tile) return;
    
    if (isMovementMode) {
      handleMove({ tile, x, y });
    } else {
      if (tile.type === 'mystery') {
        handleMysteryTile(tile);
      } else {
        onTileClick(x, y);
      }
    }
  };

  if (grid.length === 0) {
    return <div>Loading map...</div>;
  }

  return (
    <div className="relative" aria-label="map-container">
      <div 
        className="grid w-full" 
        style={{ gridTemplateColumns: `repeat(${grid[0]?.length ?? 0}, minmax(0, 1fr))` }}
        role="grid"
        aria-label="map-grid"
      >
        {grid.map((row, y) => 
          row.map((tile, x) => {
            const isCurrentHovered = hoveredTile?.row === y && hoveredTile?.col === x;
            const isValidMove = isMovementMode && isValidMovementTarget(x, y);
            const isVisited = tile.revealed || false;

            return (
              <div
                key={`${y}-${x}`}
                className={cn(
                  "relative aspect-square group",
                  isMovementMode && isValidMove && isCurrentHovered && "shadow-[0_0_15px_rgba(34,197,94,0.2)]",
                  "transition-all duration-200",
                  "cursor-pointer"
                )}
                onClick={(e) => {
                  console.log('Tile clicked:', { x, y, isMovementMode, isValidMove });
                  e.stopPropagation();
                  handleTileClick(tile, x, y);
                }}
                onMouseEnter={() => handleTileHover(tile, x, y)}
                onMouseLeave={handleTileLeave}
                role="gridcell"
                aria-label={`map-tile-${x}-${y}`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    if (isMovementMode) {
                      handleMove({ tile, x, y });
                    } else {
                      onTileClick(x, y);
                    }
                  }
                }}
              >
                <div className="absolute inset-0">
                  <TileVisual
                    tile={tile}
                    isSelected={selectedTile?.x === x && selectedTile?.y === y}
                    isHovered={isCurrentHovered}
                    isCharacterPresent={character.x === x && character.y === y}
                  />
                </div>

                {!isMovementMode && tile.type !== 'empty' && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                       <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTile?.(x, y);
                      }}
                      className="p-1 bg-red-500 hover:bg-red-600 rounded-full text-white"
                      aria-label="Delete Tile"
                      title="Delete Tile"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {character.x === x && character.y === y && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-amber-900" />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {currentEvent && (
        <Dialog open={true} onOpenChange={() => setCurrentEvent(null)}>
          <DialogContent>
          <DialogHeader>
              <DialogTitle>{currentEvent.title}</DialogTitle>
              <DialogDescription>{currentEvent.description}</DialogDescription>
          </DialogHeader>
            <div className="grid gap-4">
              {currentEvent.choices.map((choice, index) => (
                <Button
                  key={index}
                  variant={index === 0 ? "default" : "secondary"}
                  onClick={() => handleEventChoice(choice, index)}
                >
                  {choice}
                </Button>
              ))}
            </div>
        </DialogContent>
      </Dialog>
      )}
    </div>
  );
} 