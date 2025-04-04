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
import { Tile, Character, SelectedTile } from "@/types/tiles";
import { TileVisual } from "@/components/tile-visual";
import { cn } from "@/lib/utils";
import { BattleMinigame } from "@/components/battle-minigame";

export const updateKingdomStats = new EventTarget();

interface CityData {
  name: string;
  type: 'city' | 'town';
}

interface MysteryEncounter {
  type: 'scroll' | 'empty' | 'treasure';
  title: string;
  description: string;
  reward: number;
  imageUrl?: string;
}

interface MapGridProps {
  onDiscovery: (discovery: string) => void;
  selectedTile: SelectedTile | null;
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
  const [discoveredMysteries, setDiscoveredMysteries] = useState<string[]>([]);
  const [showCityDialog, setShowCityDialog] = useState(false);
  const [showMysteryDialog, setShowMysteryDialog] = useState(false);
  const [selectedCity, setSelectedCity] = useState<CityData>({ name: '', type: 'city' });
  const [mysteryEncounter, setMysteryEncounter] = useState<MysteryEncounter>({
    type: 'empty',
    title: '',
    description: '',
    reward: 0,
    imageUrl: ''
  });
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
                  onClick={() => onTileClick(x, y)}
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
            <DialogTitle className="text-2xl font-medievalsharp text-amber-500">{mysteryEncounter.title}</DialogTitle>
            <DialogDescription className="text-gray-300 mt-2">
              {mysteryEncounter.description}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="w-full h-48 bg-amber-800/20 rounded-lg flex items-center justify-center overflow-hidden">
              {mysteryEncounter.type === "scroll" ? (
                <div className="w-full h-full relative">
                  <img 
                    src="/images/encounters/scroll.jpg" 
                    alt="Ancient Scroll" 
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      e.currentTarget.src = "/images/placeholders/encounter-placeholder.svg";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              ) : mysteryEncounter.type === "empty" ? (
                <div className="w-full h-full relative">
                  <img 
                    src="/images/encounters/grass.jpg" 
                    alt="Empty Land" 
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      e.currentTarget.src = "/images/placeholders/encounter-placeholder.svg";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              ) : mysteryEncounter.type === "treasure" ? (
                <div className="w-full h-full relative">
                  <img 
                    src="/images/encounters/treasure.jpg" 
                    alt="Treasure" 
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      e.currentTarget.src = "/images/placeholders/encounter-placeholder.svg";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              ) : null}
            </div>
          </div>
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