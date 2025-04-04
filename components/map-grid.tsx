"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Building, RotateCw, Trash } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Tile } from "@/types/tiles";
import { TileVisual } from "@/components/tile-visual";
import { cn } from "@/lib/utils";
import { BattleMinigame } from "@/components/battle-minigame";

interface MysteryEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  choices: string[];
  imageUrl: string | null;
}

interface CityData {
  name: string;
  type: string;
}

interface MapGridProps {
  onDiscovery: (message: string) => void;
  selectedTile: Tile | null;
  onTilePlaced: (x: number, y: number) => void;
  grid: Tile[][];
  character: { x: number; y: number };
  onCharacterMove: (x: number, y: number) => void;
  onTileClick: (x: number, y: number) => void;
  onGridUpdate: (grid: Tile[][]) => void;
  onGoldUpdate: (amount: number) => void;
  onExperienceUpdate?: (amount: number) => void;
  onHover?: (x: number, y: number) => void;
  onHoverEnd?: () => void;
  hoveredTile?: { row: number; col: number } | null;
  onRotateTile?: (x: number, y: number) => void;
  onDeleteTile?: (x: number, y: number) => void;
  isMovementMode?: boolean;
  onAddMoreRows?: () => void;
  zoomLevel?: number;
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
  hoveredTile,
  onRotateTile,
  onDeleteTile,
  isMovementMode = false,
  onAddMoreRows,
  zoomLevel = 1
}: MapGridProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [currentEvent, setCurrentEvent] = useState<MysteryEvent | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [showBattle, setShowBattle] = useState(false);
  const [battlePosition, setBattlePosition] = useState<{ x: number; y: number } | null>(null);

  const handleMysteryTile = (tile: Tile) => {
    setCurrentEvent({
      id: 'mystery-event',
      type: 'mystery',
      title: 'Mysterious Location',
      description: 'You have discovered something mysterious...',
      choices: ['Investigate', 'Leave'],
      imageUrl: '/images/tiles/mystery-tile.png'
    });

    // Mark tile as visited
    const newGrid = [...grid];
    const y = tile.y || 0;
    const x = tile.x || 0;
    newGrid[y][x] = {
      ...tile,
      isVisited: true
    };
    onGridUpdate(newGrid);
  };

  const handleEventChoice = (choiceIndex: number) => {
    if (!currentEvent) return;
    setSelectedChoice(choiceIndex);

    if (choiceIndex === 0) { // Investigate
      const eventTypes = ['battle', 'treasure', 'nothing'];
      const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];

      switch (randomEvent) {
        case 'battle':
          setShowBattle(true);
          setCurrentEvent(null);
          // Replace mystery tile with grass after battle
          if (character) {
            const newGrid = [...grid];
            newGrid[character.y][character.x] = {
              ...newGrid[character.y][character.x],
              type: 'grass',
              isVisited: true
            };
            onGridUpdate?.(newGrid);
          }
          break;

        case 'treasure':
          const goldAmount = Math.floor(Math.random() * 51) + 10; // 10-60 gold
          if (onGoldUpdate) {
            onGoldUpdate(goldAmount);
          }
          toast({
            title: "Treasure Found!",
            description: `You found ${goldAmount} gold!`,
            variant: "default"
          });
          setCurrentEvent(null);
          // Replace mystery tile with grass after finding treasure
          if (character) {
            const newGrid = [...grid];
            newGrid[character.y][character.x] = {
              ...newGrid[character.y][character.x],
              type: 'grass',
              isVisited: true
            };
            onGridUpdate?.(newGrid);
          }
          break;

        case 'nothing':
          toast({
            title: "Nothing Here",
            description: "You found nothing interesting.",
            variant: "default"
          });
          setCurrentEvent(null);
          // Replace mystery tile with grass after finding nothing
          if (character) {
            const newGrid = [...grid];
            newGrid[character.y][character.x] = {
              ...newGrid[character.y][character.x],
              type: 'grass',
              isVisited: true
            };
            onGridUpdate?.(newGrid);
          }
          break;
      }
    } else {
      // Player chose to leave
      setCurrentEvent(null);
    }
    setSelectedChoice(null);
  };

  const isValidMovementTarget = (x: number, y: number) => {
    if (!hoveredTile) return false;
    const dx = Math.abs(x - character.x);
    const dy = Math.abs(y - character.y);
    const targetTile = grid[y][x];
    return dx + dy === 1 && targetTile.type !== 'mountain' && targetTile.type !== 'water';
  };

  const handleCharacterMove = (x: number, y: number) => {
    if (x < 0 || y < 0 || y >= grid.length || x >= grid[0].length) return;

    const targetTile = grid[y][x];
    const isAdjacent = (Math.abs(x - character.x) === 1 && y === character.y) ||
      (Math.abs(y - character.y) === 1 && x === character.x);

    if (!isAdjacent) {
      toast({
        title: 'Invalid Move',
        description: 'You can only move to adjacent tiles',
        variant: 'destructive'
      });
      return;
    }

    if (targetTile.type === 'mountain' || targetTile.type === 'water') {
      toast({
        title: 'Invalid Move',
        description: `You cannot move onto ${targetTile.type} tiles`,
        variant: 'destructive'
      });
      return;
    }

    // Update character position
    onCharacterMove(x, y);

    // Handle tile effects
    if (targetTile.type === 'mystery' && !targetTile.isVisited) {
      handleMysteryTile(targetTile);
    }

    // Mark tile as visited
    const newGrid = [...grid];
    newGrid[y][x] = {
      ...targetTile,
      isVisited: true
    };
    onGridUpdate(newGrid);
  };

  if (grid.length === 0) {
    return <div>Loading map...</div>;
  }

  return (
    <div className="relative">
      <div className="grid grid-cols-12 w-full">
        {grid.map((row, y) => (
          <React.Fragment key={y}>
            {row.map((tile, x) => {
              const isSelected = hoveredTile?.row === y && hoveredTile?.col === x;
              const isVisited = tile.revealed || false;

              return (
                <div
                  key={`${y}-${x}`}
                  className={cn(
                    "relative aspect-square group",
                    isMovementMode && isValidMovementTarget(x, y) && isSelected && "shadow-[0_0_15px_rgba(34,197,94,0.2)]",
                    "transition-all duration-200",
                    "cursor-pointer"
                  )}
                  onClick={() => {
                    if (isMovementMode) {
                      handleCharacterMove(x, y);
                    }
                    onTileClick(x, y);
                  }}
                  onMouseEnter={() => onHover?.(x, y)}
                  onMouseLeave={() => onHoverEnd?.()}
                >
                  <div className="absolute inset-0">
                    <TileVisual
                      tile={tile}
                      isSelected={isSelected}
                      isHovered={false}
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
            })}
          </React.Fragment>
        ))}
      </div>

      {currentEvent && !showBattle && (
        <Dialog open={true} onOpenChange={() => setCurrentEvent(null)}>
          <DialogContent className="sm:max-w-md border border-amber-800/20 bg-gray-900">
            <DialogHeader>
              <DialogTitle className="text-2xl font-medievalsharp text-amber-500">
                {currentEvent.title}
              </DialogTitle>
              <DialogDescription className="text-gray-300 mt-2">
                {currentEvent.description}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="w-full h-48 bg-amber-800/20 rounded-lg flex items-center justify-center overflow-hidden">
                <img 
                  src={currentEvent.imageUrl || "/images/tiles/mystery-tile.png"}
                  alt="Mystery Event"
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
            <DialogFooter className="flex flex-col gap-2">
              {currentEvent.choices?.map((choice: string, index: number) => (
                <Button
                  key={index}
                  onClick={() => handleEventChoice(index)}
                  disabled={selectedChoice !== null}
                  variant={selectedChoice === index ? 'default' : 'outline'}
                >
                  {choice}
                </Button>
              ))}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {showBattle && (
        <Dialog open={true} onOpenChange={() => setShowBattle(false)} modal>
          <DialogContent className="fixed inset-0 w-screen h-screen sm:static sm:max-w-[100vw] sm:max-h-[100vh] sm:h-full sm:w-full border border-amber-800/20 bg-gray-900 p-0 overflow-y-auto">
            <div className="h-full flex flex-col">
              <DialogHeader className="sticky top-0 z-10 p-6 border-b border-amber-800/20 bg-gray-900">
                <DialogTitle className="text-2xl font-medievalsharp text-amber-500">
                  Battle!
                </DialogTitle>
                <DialogDescription className="text-gray-300 mt-2">
                  A wild creature appears!
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 p-6 overflow-y-auto">
                <BattleMinigame
                  onVictory={() => {
                    setShowBattle(false);
                    const expGain = Math.floor(Math.random() * 30) + 20; // 20-50 exp
                    if (onExperienceUpdate) {
                      onExperienceUpdate(expGain);
                    }
                    toast({
                      title: "Victory!",
                      description: `You gained ${expGain} experience!`,
                      variant: "default"
                    });
                  }}
                  onDefeat={() => {
                    setShowBattle(false);
                    toast({
                      title: "Defeat",
                      description: "You were defeated...",
                      variant: "destructive"
                    });
                  }}
                  onClose={() => setShowBattle(false)}
                  enemyName="Mysterious Creature"
                  enemyLevel={Math.floor(Math.random() * 3) + 1}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {grid.length > 0 && grid[0].length > 0 && (
        <div className="fixed bottom-4 right-4">
          <Button onClick={onAddMoreRows}>Add More Rows</Button>
        </div>
      )}
    </div>
  );
}