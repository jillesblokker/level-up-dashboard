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
import { generateMysteryEvent, handleEventOutcome, MysteryEvent } from '@/lib/mystery-events'
import { BattleModal } from "@/components/battle-modal"

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
  const [showBattleModal, setShowBattleModal] = useState(false)
  const [currentBattle, setCurrentBattle] = useState<{
    enemyName: string;
    enemyLevel: number;
  } | null>(null)

  const handleMysteryTile = (tile: Tile) => {
    const event = generateMysteryEvent();
    setCurrentEvent(event);
    
    // Update tile type to grass after event is triggered
    const newGrid = [...grid];
    const tileIndex = grid.findIndex(row => row.includes(tile));
    const rowIndex = grid[tileIndex].findIndex(t => t === tile);
    
    if (tileIndex !== -1 && rowIndex !== -1) {
      newGrid[tileIndex][rowIndex] = {
        ...tile,
        type: 'grass',
        isVisited: true
      };
      onGridUpdate(newGrid);
    }
  };

  const handleEventChoice = (choice: string, index: number) => {
    if (!currentEvent) return;
    
    if (currentEvent.type === 'battle' && choice === 'Fight!') {
      // Start battle if choosing to fight
      setCurrentBattle({
        enemyName: currentEvent.enemyName || 'Monster',
        enemyLevel: currentEvent.enemyLevel || 1
      });
      setShowBattleModal(true);
      setCurrentEvent(null);
      return;
    }
    
    handleEventOutcome(currentEvent, choice);
    setCurrentEvent(null);

    // Convert mystery tile to grass after event completion
    if (battlePosition) {
      const newGrid = [...grid];
      newGrid[battlePosition.y][battlePosition.x] = {
        ...newGrid[battlePosition.y][battlePosition.x],
        type: 'grass',
        isVisited: true
      };
      onGridUpdate(newGrid);
    }
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

      {showBattleModal && currentBattle && (
        <BattleModal
          isOpen={showBattleModal}
          onClose={() => setShowBattleModal(false)}
          enemyName={currentBattle.enemyName}
          enemyLevel={currentBattle.enemyLevel}
          onBattleEnd={(won) => {
            setShowBattleModal(false);
            setCurrentBattle(null);
          }}
        />
      )}

      {grid.length > 0 && grid[0].length > 0 && (
        <div className="fixed bottom-4 right-4">
          <Button onClick={onAddMoreRows}>Add More Rows</Button>
              </div>
            )}
    </div>
  );
} 