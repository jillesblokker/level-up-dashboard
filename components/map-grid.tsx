"use client";

import React, { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tile } from "@/types/tiles";
import { TileVisual } from "@/components/tile-visual";
import { cn } from "@/lib/utils";
import { generateMysteryEvent, MysteryEventOutcome } from '@/lib/mystery-events'
import { MapGridProps as BaseMapGridProps } from '@/types/tiles';
import Image from 'next/image';

interface MapGridProps extends BaseMapGridProps {
  onExperienceUpdate?: (amount: number) => void;
  onRotateTile?: (x: number, y: number) => void;
  setHoveredTile: (tile: { row: number; col: number } | null) => void;
  horsePos?: { x: number; y: number } | null;
  sheepPos?: { x: number; y: number } | null;
  eaglePos?: { x: number; y: number } | null;
  penguinPos?: { x: number; y: number } | null;
  isHorsePresent?: boolean;
  isPenguinPresent?: boolean;
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
  selectedTile = null,
  grid,
  character,
  onCharacterMove,
  onTileClick,
  onHover,
  onHoverEnd,
  isMovementMode = false,
  gridRotation,
  hoveredTile,
  setHoveredTile,
  horsePos = null,
  sheepPos = null,
  eaglePos = null,
  penguinPos = null,
  isHorsePresent = false,
  isPenguinPresent = false
}: MapGridProps) {
  const { toast } = useToast();
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);

  // Defensive fallback for character
  const safeCharacter = character && typeof character.x === 'number' && typeof character.y === 'number' ? character : { x: 0, y: 0 };

  const handleMysteryTile = () => {
    const event = generateMysteryEvent();
    setCurrentEvent({
      type: 'mystery',
      title: event.title,
      description: event.description,
      choices: event.choices,
      outcomes: event.outcomes
    });
  };

  const handleEventChoice = (choice: string) => {
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
    const originalCharacter = translateCoordinates(safeCharacter.x, safeCharacter.y, grid, -gridRotation);

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
        } else if (!isPathClear(safeCharacter.x, safeCharacter.y, originalTargetCheck.x, originalTargetCheck.y)) {
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
    
    if (movedToTile) {
      // Handle all special tile interactions
      switch (movedToTile.type) {
        case 'mystery':
          if (!movedToTile.isVisited) {
            handleMysteryTile();
          }
          break;
        case 'portal-entrance':
          toast({
            title: 'Portal',
            description: 'Would you like to enter the portal?',
            action: (
              <Button onClick={() => onTileClick?.(originalTarget.x, originalTarget.y)}>
                Enter
              </Button>
            )
          });
          break;
        case 'portal-exit':
          toast({
            title: 'Portal Exit',
            description: 'Would you like to exit the portal?',
            action: (
              <Button onClick={() => onTileClick?.(originalTarget.x, originalTarget.y)}>
                Exit
              </Button>
            )
          });
          break;
        case 'dungeon':
          toast({
            title: 'Enter Dungeon',
            description: 'Would you like to enter the dungeon?',
            action: (
              <Button onClick={() => onTileClick?.(originalTarget.x, originalTarget.y)}>
                Enter
              </Button>
            )
          });
          break;
        case 'cave':
          toast({
            title: 'Enter Cave',
            description: 'Would you like to enter the cave?',
            action: (
              <Button onClick={() => onTileClick?.(originalTarget.x, originalTarget.y)}>
                Enter
              </Button>
            )
          });
          break;
        case 'castle':
          toast({
            title: 'Enter Castle',
            description: 'Would you like to enter the castle?',
            action: (
              <Button onClick={() => onTileClick?.(originalTarget.x, originalTarget.y)}>
                Enter
              </Button>
            )
          });
          break;
      }
    }
  };

  const handleTileClick = (tile: Tile, x: number, y: number) => {
    if (isMovementMode) {
      handleMove({ tile, x, y });
    } else {
      onTileClick?.(x, y);
    }
  };

  if (grid.length === 0) {
    return <div>Loading map...</div>;
  }

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      role="grid"
      aria-label="map-grid"
    >
      <div 
        className="w-full h-full overflow-auto"
        aria-label="map-grid-scroll-area"
      >
        <div role="rowgroup" aria-label="map-rows">
          {grid.map((row: Tile[], y: number) => (
            <div
              key={y}
              className={`grid w-full`} 
              style={{ gridTemplateColumns: `repeat(${row.length}, minmax(32px, 1fr))` }}
              role="row"
              aria-label={`map-row-${y}`}
            >
              {row.map((tile: Tile, x: number) => {
                if (!tile) {
                  return (
                    <div key={`${x}-${y}`} className="relative w-full h-full aspect-square min-w-[32px] min-h-[32px] bg-gray-800" />
                  );
                }
                const isValidTarget = isMovementMode && isValidMovementTarget(x, y);
                return (
                  <div
                    key={`${x}-${y}`}
                    className={cn(
                      "relative w-full h-full aspect-square min-w-[32px] min-h-[32px]",
                      isValidTarget && "cursor-pointer hover:ring-2 hover:ring-white"
                    )}
                    role="gridcell"
                    aria-label={`tile-${tile.type}-${x}-${y}`}
                    onClick={() => handleTileClick(tile, x, y)}
                    onMouseEnter={() => handleTileHover(tile, x, y)}
                    onMouseLeave={handleTileLeave}
                  >
                    {/* Character image at character position, only on valid tiles */}
                    {safeCharacter.x === x && safeCharacter.y === y && !['mountain', 'water', 'lava', 'volcano', 'empty'].includes(tile.type) && (
                      <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                        <Image
                          src="/images/character/character.png"
                          alt="Character"
                          width={40}
                          height={40}
                          className="object-contain"
                          onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', '<span style=\'color:red;font-size:2rem;\'>⚠️</span>'); }}
                          priority
                        />
                      </div>
                    )}
                    {/* Animal overlays using block/flex approach for visibility */}
                    {/* Ensure the following PNGs exist in /public/images/Animals/ and are named exactly: horse.png, sheep.png, eagle.png, penguin.png */}
                    {horsePos && horsePos.x === x && horsePos.y === y && isHorsePresent && (
                      <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                        <Image
                          src="/images/Animals/horse.png"
                          alt="Horse"
                          width={40}
                          height={40}
                          className="object-contain"
                          onError={(e) => { console.error('Failed to load horse.png'); e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', '<span style=\'color:red;font-size:2rem;\'>🐴</span>'); }}
                          priority
                        />
                      </div>
                    )}
                    {sheepPos && sheepPos.x === x && sheepPos.y === y && (
                      <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                        <Image
                          src="/images/Animals/sheep.png"
                          alt="Sheep"
                          width={40}
                          height={40}
                          className="object-contain"
                          onError={(e) => { console.error('Failed to load sheep.png'); e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', '<span style=\'color:red;font-size:2rem;\'>🐑</span>'); }}
                          priority
                        />
                      </div>
                    )}
                    {eaglePos && eaglePos.x === x && eaglePos.y === y && (
                      <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                        <Image
                          src="/images/Animals/eagle.png"
                          alt="Eagle"
                          width={40}
                          height={40}
                          className="object-contain"
                          onError={(e) => { console.error('Failed to load eagle.png'); e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', '<span style=\'color:red;font-size:2rem;\'>🦅</span>'); }}
                          priority
                        />
                      </div>
                    )}
                    {penguinPos && penguinPos.x === x && penguinPos.y === y && isPenguinPresent && (
                      <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                        <Image
                          src="/images/Animals/penguin.png"
                          alt="Penguin"
                          width={40}
                          height={40}
                          className="object-contain"
                          onError={(e) => { console.error('Failed to load penguin.png'); e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', '<span style=\'color:red;font-size:2rem;\'>🐧</span>'); }}
                          priority
                        />
                      </div>
                    )}
                    <TileVisual
                      tile={tile}
                      isSelected={selectedTile?.x === x && selectedTile?.y === y}
                      isHovered={hoveredTile?.row === y && hoveredTile?.col === x}
                      isCharacterPresent={safeCharacter.x === x && safeCharacter.y === y}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {currentEvent && (
        <Dialog open={!!currentEvent} onOpenChange={() => setCurrentEvent(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{currentEvent.title}</DialogTitle>
              <DialogDescription>{currentEvent.description}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {currentEvent.choices.map((choice, index) => (
                <Button
                  key={index}
                  variant={index === 0 ? "default" : "secondary"}
                  onClick={() => handleEventChoice(choice)}
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