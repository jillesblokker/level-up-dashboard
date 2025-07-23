"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tile } from "@/types/tiles";
import { TileVisual } from "@/components/tile-visual";
import { cn } from "@/lib/utils";
import { generateMysteryEvent, MysteryEvent, MysteryEventOutcome } from '@/lib/mystery-events'
import { MapGridProps as BaseMapGridProps } from '@/types/tiles';
import Image from 'next/image';
import { showScrollToast } from "@/lib/toast-utils"
import { getCharacterStats, updateCharacterStats } from '@/lib/character-stats-manager';
import { TileType } from '@/types/tiles';
import { addToKingdomInventory } from '@/lib/inventory-manager';
import { Trash2 } from 'lucide-react';

// Function to get monster image name - using achievement images
function getMonsterImageName(monsterType: string): string {
  const monsterImageMap: Record<string, string> = {
    'dragon': '201.png?v=1',
    'goblin': '202.png?v=1',
    'troll': '203.png?v=1',
    'wizard': '204.png?v=1',
    'pegasus': '205.png?v=1',
    'fairy': '206.png?v=1'
  };
  
  return monsterImageMap[monsterType] || '201.png?v=1';
}

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
  onHover?: (x: number, y: number) => void;
  onHoverEnd?: () => void;
  onTileDelete?: (x: number, y: number) => void;
}

function isTile(tile: Tile | undefined): tile is Tile {
  return !!tile;
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
  gridRotation = 0,
  hoveredTile: externalHoveredTile,
  setHoveredTile,
  horsePos = null,
  sheepPos = null,
  eaglePos = null,
  penguinPos = null,
  isHorsePresent = false,
  isPenguinPresent = false,
  onTileDelete
}: MapGridProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const [localCurrentEvent, setLocalCurrentEvent] = useState<MysteryEvent | null>(null);
  const [eventOutcome, setEventOutcome] = useState<MysteryEventOutcome | null>(null);
  // Track last triggered mystery tile position
  const [lastMysteryTile, setLastMysteryTile] = useState<{ x: number; y: number } | null>(null);
  // Add hoveredTile state for delete icon
  const [hoveredTile, setHoveredTileLocal] = useState<{x: number, y: number} | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);

  // Detect mobile portrait mode
  useEffect(() => {
    function handleResize() {
      const isPortrait = window.innerHeight > window.innerWidth;
      const isMobile = window.innerWidth <= 768;
      setIsMobilePortrait(isMobile && isPortrait);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Defensive fallback for character
  const safeCharacter = character && typeof character.x === 'number' && typeof character.y === 'number' ? character : { x: 0, y: 0 };

  const handleMysteryTile = () => {
    const event = generateMysteryEvent();
    setLocalCurrentEvent(event);
    // Save the current character position as the last triggered mystery tile
    setLastMysteryTile({ x: safeCharacter.x, y: safeCharacter.y });
  };

  const handleEventChoice = (choice: string) => {
    if (!localCurrentEvent) return;

    const outcome = localCurrentEvent.outcomes?.[choice];
    if (outcome) {
      setEventOutcome(outcome);
    }
  };

  const handleAcknowledgeOutcome = () => {
    // If the outcome is an artifact, add it to the kingdom inventory
    if (eventOutcome && eventOutcome.reward && eventOutcome.reward.type === 'item' && eventOutcome.reward.item) {
      const artifact = eventOutcome.reward.item.find(i => i.type === 'artifact');
      if (artifact && user?.id) {
        addToKingdomInventory(user.id, artifact);
      }
    }
    setLocalCurrentEvent(null);
    setEventOutcome(null);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mystery-event-completed'));
    }
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
      // Handle monster interaction first
      if (movedToTile.hasMonster) {
        // Trigger monster battle - this should be handled by the parent component
        onTileClick?.(originalTarget.x, originalTarget.y);
        return;
      }
      
      // Handle special tile interactions that should be handled locally
      switch (movedToTile.type) {
        case 'mystery':
          if (!movedToTile.isVisited) {
            handleMysteryTile();
          }
          break;
        case 'portal-entrance':
        case 'portal-exit':
        case 'dungeon':
        case 'cave':
        case 'castle':
          // These interactions are handled by the parent component
          // Just call onTileClick to trigger parent handlers
          onTileClick?.(x, y);
          break;
        case 'city':
        case 'town':
          // City and town interactions are handled by the parent component
          // The parent will show modals and handle location data
          break;
      }
    }
  };

  const handleTileClick = (tile: Tile, x: number, y: number) => {
    // Handle monster interaction first
    if (tile.hasMonster) {
      // Trigger monster battle - this should be handled by the parent component
      onTileClick?.(x, y);
      return;
    }
    
    if (isMovementMode && isValidMovementTarget(x, y)) {
      handleMove({ tile, x, y });
    } else {
      onTileClick?.(x, y);
    }
  };

  useEffect(() => {
    // Persistent horse caught flag
    const horseCaught = typeof window !== 'undefined' && localStorage.getItem('horseCaught') === 'true';
    if (
      horsePos &&
      safeCharacter.x === horsePos.x &&
      safeCharacter.y === horsePos.y &&
      isHorsePresent &&
      !horseCaught
    ) {
      // Remove horse from map and trigger event only once
      if (typeof window !== 'undefined') {
        localStorage.setItem('horseCaught', 'true');
      }
      const horses = [
        {
          id: 'swift-horse',
          name: 'Sally Swift Horse',
          description: 'Fast and agile.',
          type: 'creature',
          emoji: '🐎',
          image: '/images/items/horse/horse-stelony.png',
        },
        {
          id: 'endurance-horse',
          name: 'Buster Endurance Horse',
          description: 'Can travel long distances.',
          type: 'creature',
          emoji: '🐴',
          image: '/images/items/horse/horse-perony.png',
        },
        {
          id: 'war-horse',
          name: 'Shadow War Horse',
          description: 'Strong and brave.',
          type: 'creature',
          emoji: '🦄',
          image: '/images/items/horse/horse-felony.png',
        },
      ];
      const randomHorse = { ...horses[Math.floor(Math.random() * horses.length)], quantity: 1 };
      window.dispatchEvent(new CustomEvent('horse-caught', { 
        detail: { horse: randomHorse }
      }));
      showScrollToast(toast, 'Horse Caught!', `You caught a horse: ${randomHorse.name}`);
    }
  }, [horsePos, safeCharacter, isHorsePresent]);

  const BUYABLE_TILE_TYPE = 'empty';
  const BUYABLE_TILE_COST = 100; // Example cost

  const handleBuyTile = (x: number, y: number) => {
    if (!grid[y] || !grid[y][x]) return;
    // Replace the tile with a default grass tile (ensure all required properties)
    const row = grid[y];
    if (!row || !row[x]) return;
    const tile = row[x]!;
    // Ensure rotation is always 0|90|180|270
    const validRotations = [0, 90, 180, 270];
    const rotation = (validRotations.includes(tile.rotation) ? tile.rotation : 0) as 0 | 90 | 180 | 270;
    const newTile = {
      ...tile,
      id: `grass-${x}-${y}`,
      type: 'grass' as TileType,
      name: 'Grass',
      image: '/images/tiles/grass-tile.png',
      quantity: 1,
      revealed: true,
      isVisited: true,
      x,
      y,
      ariaLabel: 'grass tile',
      cost: 0,
      description: tile.description || '',
      connections: tile.connections || [],
      rotation,
    };
    const newGrid = grid.map(row => row.slice());
    if (newGrid[y]) {
      newGrid[y][x] = newTile;
    }
    // Call parent handler if provided (expecting 2 args: x, y)
    if (typeof onTileClick === 'function') onTileClick(x, y);
    toast({
      title: 'Tile Purchased!',
      description: `You bought a new tile.`,
    });
  };

  if (grid.length === 0) {
    return <div>Loading map...</div>;
  }

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      role="application"
      aria-label="map-grid"
    >
      <div 
        className="w-full h-full overflow-auto"
        aria-label="map-grid-scroll-area"
      >
        <div aria-label="map-rows">
          {grid.map((row: Tile[], y: number) => (
            <div
              key={y}
              className={`grid w-full map-grid-row-cols-${row.length}`}
              aria-label={`map-row-${y}`}
            >
              {row.map((tile: Tile, x: number) => {
                if (!tile) {
                  return (
                    <div key={`${x}-${y}`} className="relative w-full h-full aspect-square min-w-[32px] min-h-[32px] bg-gray-800" />
                  );
                }
                const isValidTarget = isMovementMode && isValidMovementTarget(x, y);
                const isBuyable = tile.type === BUYABLE_TILE_TYPE;
                return (
                  <div
                    key={`${x}-${y}`}
                    className={cn(
                      "relative w-full h-full aspect-square min-w-[32px] min-h-[32px]",
                      isValidTarget && "cursor-pointer hover:ring-2 hover:ring-white"
                    )}
                    aria-label={`${tile.type} tile at position ${x}, ${y}`}
                    onClick={() => {
                      if (isBuyable) {
                        handleBuyTile(x, y);
                      } else {
                        handleTileClick(tile, x, y);
                      }
                    }}
                    onMouseEnter={() => { handleTileHover(tile, x, y); setHoveredTileLocal({x, y}); }}
                    onMouseLeave={() => { handleTileLeave(); setHoveredTileLocal(null); }}
                  >
                    {/* Character image at character position, only on valid tiles */}
                    {safeCharacter.x === x && safeCharacter.y === y && !['mountain', 'water', 'lava', 'volcano', 'empty'].includes(tile.type) && (
                      <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                        <Image
                          src="/images/character/character.png"
                          alt="Character"
                          width={40}
                          height={40}
                          className="object-contain w-10 h-10"
                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', '<span style=\'color:red;font-size:2rem;\'>⚠️</span>'); }}
                          priority
                        />
                      </div>
                    )}
                    {/* Animal overlays */}
                    {horsePos && horsePos.x === x && horsePos.y === y && isHorsePresent && (
                      <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                        <Image
                          src="/images/Animals/horse.png"
                          alt="Horse"
                          width={96}
                          height={96}
                          className="object-contain w-24 h-24 drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)]"
                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', '<span style=\'color:red;font-size:2rem;\'>🐴</span>'); }}
                          priority
                        />
                      </div>
                    )}
                    {sheepPos && sheepPos.x === x && sheepPos.y === y && (
                      <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                        <Image
                          src="/images/Animals/sheep.png"
                          alt="Sheep"
                          width={96}
                          height={96}
                          className="object-contain w-24 h-24 drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)]"
                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', '<span style=\'color:red;font-size:2rem;\'>🐑</span>'); }}
                          priority
                        />
                      </div>
                    )}
                    {eaglePos && eaglePos.x === x && eaglePos.y === y && (
                      <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                        <Image
                          src="/images/Animals/eagle.png"
                          alt="Eagle"
                          width={96}
                          height={96}
                          className="object-contain w-24 h-24 drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)]"
                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', '<span style=\'color:red;font-size:2rem;\'>🦅</span>'); }}
                          priority
                        />
                      </div>
                    )}
                    {/* Penguin appears only at penguinPos on an ice tile */}
                    {tile.type === 'ice' && penguinPos && penguinPos.x === x && penguinPos.y === y && (
                      <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                        <Image
                          src="/images/Animals/penguin.png"
                          alt="Penguin"
                          width={96}
                          height={96}
                          className="object-contain w-24 h-24 drop-shadow-[0_2px_8px_rgba(0,200,255,0.8)]"
                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', '<span style=\'color:blue;font-size:2rem;\'>🐧</span>'); }}
                          priority
                        />
                      </div>
                    )}
                    {/* Monster overlays */}
                    {tile.hasMonster && (
                      <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                        <Image
                          src={`/images/achievements/${getMonsterImageName(tile.hasMonster)}`}
                          alt={`${tile.hasMonster} monster`}
                          width={96}
                          height={96}
                          className="object-contain w-24 h-24 drop-shadow-[0_2px_8px_rgba(255,0,0,0.8)] animate-pulse"
                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', `<span style='color:red;font-size:2rem;'>👹</span>`); }}
                          priority
                        />
                      </div>
                    )}
                    {/* Only show delete icon on hover in build mode */}
                    {!isMovementMode && tile.type !== 'empty' && typeof onTileDelete === 'function' && hoveredTile && hoveredTile.x === x && hoveredTile.y === y && (
                      <button
                        aria-label={`Delete tile at ${x},${y}`}
                        className="absolute top-1 right-1 z-20 bg-red-700 rounded-full p-1 hover:bg-red-800 focus:outline-none"
                        onClick={e => { e.stopPropagation(); onTileDelete(x, y); }}
                        tabIndex={0}
                      >
                        <Trash2 size={18} className="text-white" />
                      </button>
                    )}
                    <TileVisual
                      tile={tile}
                      isSelected={selectedTile?.x === x && selectedTile?.y === y}
                      isHovered={externalHoveredTile?.row === y && externalHoveredTile?.col === x}
                      isCharacterPresent={safeCharacter.x === x && safeCharacter.y === y}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {localCurrentEvent && (
        <Dialog open={!!localCurrentEvent} onOpenChange={() => setLocalCurrentEvent(null)}>
          <DialogContent role="dialog" aria-label="event-modal">
            <DialogHeader>
              <DialogTitle>{localCurrentEvent.title}</DialogTitle>
              <DialogDescription id="event-modal-desc">{localCurrentEvent.description}</DialogDescription>
            </DialogHeader>
            {eventOutcome ? (
              <div className="grid gap-4 py-4">
                <div className="text-lg font-semibold text-center">{eventOutcome.message}</div>
                {/* Show artifact details if present */}
                {eventOutcome.reward && eventOutcome.reward.type === 'item' && eventOutcome.reward.item && eventOutcome.reward.item.some(i => i.type === 'artifact') && (
                  <div className="flex flex-col items-center mt-2">
                    {eventOutcome.reward.item.filter(i => i.type === 'artifact').map(artifact => (
                      <div key={artifact.id} className="flex flex-col items-center">
                        <img src={artifact.image || '/images/placeholders/item-placeholder.svg'} alt={artifact.name} className="w-16 h-16 mb-2" />
                        <div className="text-amber-400 font-bold">{artifact.name}</div>
                        <div className="text-sm text-gray-300 text-center">{artifact.description}</div>
                      </div>
                    ))}
                    <div className="text-green-400 mt-2">Artifact added to your Kingdom Inventory!</div>
                  </div>
                )}
                <Button onClick={handleAcknowledgeOutcome} className="mx-auto mt-4">OK</Button>
              </div>
            ) : (
              <div className="grid gap-4 py-4">
                {localCurrentEvent.choices.map((choice, index) => (
                  <Button
                    key={index}
                    variant={index === 0 ? "default" : "secondary"}
                    onClick={() => handleEventChoice(choice)}
                  >
                    {choice}
                  </Button>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 