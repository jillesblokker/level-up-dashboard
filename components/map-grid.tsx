"use client";

import React, { useState, useEffect } from 'react';
import { Building, Trash, RotateCw, User } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { Tile, Character } from "@/types/tiles";
import { TileVisual } from "@/components/tile-visual";
import { cn } from "@/lib/utils";
import { BattleMinigame } from "@/components/battle-minigame";
import { updateKingdomStats } from '@/lib/kingdom-stats';

interface CityData {
  name: string;
  type: 'city' | 'town';
}

interface MysteryEvent {
  title: string;
  description: string;
  reward: {
    type: 'gold' | 'experience';
    amount: number;
  };
}

interface MapGridProps {
  onDiscovery: (discovery: string) => void;
  selectedTile: Tile | null;
  onTilePlaced: () => void;
  grid: Tile[][];
  character: Character;
  onCharacterMove: (x: number, y: number) => void;
  onTileClick: (x: number, y: number) => void;
  onGridUpdate: (newGrid: Tile[][]) => void;
  onGoldUpdate: (amount: number) => void;
  onHover?: (x: number, y: number) => void;
  onHoverEnd?: () => void;
  hoveredTile?: { row: number; col: number } | null;
  onRotateTile?: (x: number, y: number) => void;
  onDeleteTile?: (x: number, y: number) => void;
  isMovementMode?: boolean;
  onAddMoreRows?: () => void;
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
  onHover,
  onHoverEnd,
  hoveredTile,
  onRotateTile,
  onDeleteTile,
  isMovementMode = false,
  onAddMoreRows
}: MapGridProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [showCityDialog, setShowCityDialog] = useState(false);
  const [showMysteryDialog, setShowMysteryDialog] = useState(false);
  const [selectedCity, setSelectedCity] = useState<CityData>({ name: '', type: 'city' });
  const [currentEvent, setCurrentEvent] = useState<MysteryEvent | null>(null);
  const [showBattle, setShowBattle] = useState(false);
  const [battlePosition, setBattlePosition] = useState<{ x: number; y: number } | null>(null);

  const handleEnterCity = () => {
    setShowCityDialog(false);
    onDiscovery(`Entered ${selectedCity.name}`);
  };

  const isValidMovementTarget = (x: number, y: number) => {
    if (!hoveredTile) return false;
    const dx = Math.abs(x - character.x);
    const dy = Math.abs(y - character.y);
    return dx + dy === 1;
  };

  // Mystery events
  const mysteryEvents: MysteryEvent[] = [
    {
      title: "Lucky Find!",
      description: "You stumble upon a small pouch of gold coins!",
      reward: {
        type: 'gold',
        amount: 50
      }
    },
    {
      title: "Ancient Knowledge",
      description: "You discover an ancient scroll containing valuable wisdom.",
      reward: {
        type: 'experience',
        amount: 100
      }
    },
    {
      title: "Hidden Cache",
      description: "You find a well-hidden treasure chest!",
      reward: {
        type: 'gold',
        amount: 100
      }
    }
  ];

  const handleCharacterMove = (x: number, y: number) => {
    if (!isValidMovementTarget(x, y)) return;

    // Update character position
    onCharacterMove(x, y);

    // Check if landed on a mystery tile
    const tile = grid[y][x];
    if (tile.type === "mystery" && !tile.isVisited) {
      handleMysteryTile(x, y);
    }
  };

  const handleMysteryTile = (x: number, y: number) => {
    // Randomly select an event
    const event = mysteryEvents[Math.floor(Math.random() * mysteryEvents.length)];
    setCurrentEvent(event);
    setShowMysteryDialog(true);

    // Handle rewards
    if (event.reward.type === 'gold') {
      onGoldUpdate(event.reward.amount);
      toast({
        title: "Gold Found!",
        description: `You found ${event.reward.amount} gold coins!`,
        variant: "success"
      });
    } else {
      // Update experience
      const updateEvent = new CustomEvent('updateCharacterStats', {
        detail: {
          experience: event.reward.amount
        }
      });
      updateKingdomStats.dispatchEvent(updateEvent);
      toast({
        title: "Experience Gained!",
        description: `You gained ${event.reward.amount} experience points!`,
        variant: "success"
      });
    }

    // Mark tile as visited
    const newGrid = [...grid];
    newGrid[y][x] = {
      ...newGrid[y][x],
      isVisited: true
    };
    onGridUpdate(newGrid);
  };

  if (grid.length === 0) {
    return <div>Loading map...</div>;
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-12 auto-rows-fr gap-2">
        {grid.map((row, y) => (
          <React.Fragment key={y}>
            {row.map((tile, x) => {
              if ((tile.type === "city" || tile.type === "town") && !tile.isMainTile) {
                return null;
              }

              const isSelected = hoveredTile?.row === y && hoveredTile?.col === x;
              const isVisited = tile.revealed || false;

              return (
                <div
                  key={`${y}-${x}`}
                  className={cn(
                    "relative group",
                    "min-h-[60px]",
                    "aspect-square",
                    "bg-gray-800/50 rounded-lg border border-gray-700/50",
                    isMovementMode && isValidMovementTarget(x, y) && isSelected && "border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]",
                    !isMovementMode && "hover:border-amber-500/50",
                    "transition-all duration-200",
                    "cursor-pointer"
                  )}
                  style={{
                    minWidth: `calc((100vw - 16rem) / 12)`,
                  }}
                  onClick={() => {
                    if (isMovementMode) {
                      handleCharacterMove(x, y);
                    } else if (tile.type === "mystery" && !tile.isVisited) {
                      handleMysteryTile(x, y);
                    }
                    onTileClick(x, y);
                  }}
                  onMouseEnter={() => onHover?.(x, y)}
                  onMouseLeave={() => onHoverEnd?.()}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <TileVisual
                      type={tile.type}
                      rotation={tile.rotation || 0}
                      isMainTile={tile.isMainTile}
                      citySize={tile.citySize}
                      isSelected={isSelected}
                      isVisited={isVisited}
                    />
                  </div>

                  {isMovementMode && isValidMovementTarget(x, y) && isSelected && (
                    <div className="absolute inset-0 bg-green-500/10 rounded-lg transition-opacity duration-200" />
                  )}

                  {character.x === x && character.y === y && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-amber-900" />
                      </div>
                    </div>
                  )}

                  {isSelected && !isMovementMode && tile.type !== "empty" && (
                    <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-gray-900/80 hover:bg-gray-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRotateTile?.(x, y);
                        }}
                      >
                        <RotateCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-gray-900/80 hover:bg-gray-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTile?.(x, y);
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <Dialog open={showCityDialog} onOpenChange={setShowCityDialog}>
        <DialogContent className="sm:max-w-md border border-amber-800/20 bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-amber-500 font-medievalsharp">Enter {selectedCity.name}</DialogTitle>
            <DialogDescription className="text-gray-300">
              Would you like to enter this {selectedCity.type}? You will gain experience from your visit.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="w-full h-40 bg-amber-800/20 rounded flex items-center justify-center">
              <Building className="h-16 w-16 text-amber-500" />
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleEnterCity} className="bg-amber-600 hover:bg-amber-500">
              Enter {selectedCity.type === 'city' ? 'City' : 'Town'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showMysteryDialog} onOpenChange={setShowMysteryDialog}>
        <DialogContent className="sm:max-w-md border border-amber-800/20 bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-2xl font-medievalsharp text-amber-500">{currentEvent?.title}</DialogTitle>
            <DialogDescription className="text-gray-300 mt-2">
              {currentEvent?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="w-full h-48 bg-amber-800/20 rounded-lg flex items-center justify-center overflow-hidden">
              <img 
                src="/images/tiles/mystery-tile.png" 
                alt="Mystery Event" 
                className="object-cover w-full h-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowMysteryDialog(false)}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showBattle && battlePosition && (
        <BattleMinigame
          onClose={() => {
            setShowBattle(false);
            setBattlePosition(null);
          }}
          onVictory={(gold: number, exp: number) => {
            setShowBattle(false);
            setBattlePosition(null);
            onGoldUpdate(gold);
            toast({
              title: "Victory!",
              description: `You won the battle! Earned ${gold} gold and ${exp} experience.`,
              variant: "default",
            });
          }}
          onDefeat={() => {
            setShowBattle(false);
            setBattlePosition(null);
            toast({
              title: "Defeat!",
              description: "You were defeated in battle. Better luck next time!",
              variant: "destructive",
            });
          }}
        />
      )}
    </div>
  );
} 