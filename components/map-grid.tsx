"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Crown, HelpCircle, MapPin, Plus, Sword, Swords, Building, Trash, RotateCw, User } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { db } from "@/lib/database"
import { useRouter } from "next/navigation"
import { Tile, TileType, Character, SelectedTile } from "@/types/tiles"
import { TileVisual } from "@/components/tile-visual"
import { cn } from "@/lib/utils"
import { BattleMinigame } from "@/components/battle-minigame"
import { useCreatureStore } from "@/stores/creatureStore"

// Define events that can update graph data
export const updateKingdomStats = new EventTarget();

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
  const { toast } = useToast()
  const router = useRouter() // For navigation
  const [discoveredMysteries, setDiscoveredMysteries] = useState<string[]>([])
  const [rowCount, setRowCount] = useState(10) // Initial number of rows
  const [showCityDialog, setShowCityDialog] = useState(false)
  const [showMysteryDialog, setShowMysteryDialog] = useState(false)
  const [showMysteryTestModal, setShowMysteryTestModal] = useState(false)
  const [selectedCity, setSelectedCity] = useState({ name: "", type: "" })
  const [mysteryEncounter, setMysteryEncounter] = useState({
    type: "",
    title: "",
    description: "",
    reward: 0,
    imageUrl: ""
  })
  const [isInitialized, setIsInitialized] = useState(false) // Track initialization
  const [showBattle, setShowBattle] = useState(false);
  const [battlePosition, setBattlePosition] = useState<{ x: number; y: number } | null>(null);
  
  // Initialize the grid
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      createInitialGrid(rowCount);
      setIsInitialized(true);
    }
  }, [rowCount, isInitialized]);
  
  // Safe localStorage helper that handles quota exceeded errors
  const safeSetItem = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      if (e instanceof DOMException && (e.name === 'QuotaExceededError' || 
          e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        // Storage full, try to clear some old data
        const keysToKeep = ['user-preferences', 'active-quests', 'discoveredMysteries'];
        
        // Get all keys
        const allKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && !keysToKeep.includes(key)) {
            allKeys.push(key);
          }
        }
        
        // Try to remove older items (this is a simple approach)
        if (allKeys.length > 0) {
          localStorage.removeItem(allKeys[0]);
          // Try again
          try {
            localStorage.setItem(key, value);
            return;
          } catch (e) {
            // Still failed, show toast
            toast({
              title: "Storage Full",
              description: "Unable to save data. Try clearing browser data.",
              variant: "destructive",
            });
          }
        }
      }
      // Other error or clearing didn't help
      console.error("Storage error:", e);
      toast({
        title: "Unable to Save",
        description: "Your progress couldn't be saved.",
        variant: "destructive",
      });
    }
  };
  
  const createInitialGrid = (rows: number) => {
    const newGrid: Tile[][] = []
    
    // Generate city and town names
    const cityNames = ["Eldoria", "Mystforge", "Ravenhold", "Dragonspire", "Stormwatch"];
    const townNames = ["Oakvale", "Riverton", "Meadowbrook", "Pineridge", "Foxhaven"];
    
    for (let y = 0; y < rows; y++) {
      const row: Tile[] = []
      for (let x = 0; x < 10; x++) {
        const id = `tile-${y}-${x}`;
        if (y < 5) {
          // First 5 rows with specific tiles
          if (y === 2 && x === 4) {
            // The user's starting position - desert tile
            row.push({ 
              id,
              type: 'desert',
              connections: [],
              rotation: 0,
              revealed: true
            })
          } else if (y === 2 && x === 5) {
            // City tile next to the desert
            const cityName = cityNames[Math.floor(Math.random() * cityNames.length)];
            row.push({ 
              id,
              type: 'city',
              connections: [],
              rotation: 0,
              revealed: true,
              cityName
            })
          } else if ((y === 1 && x === 3) || (y === 3 && x === 6)) {
            // Add towns
            const townName = townNames[Math.floor(Math.random() * townNames.length)];
            row.push({ 
              id,
              type: 'town',
              connections: [],
              rotation: 0,
              revealed: true,
              cityName: townName
            })
          } else if (y === 4 && (x === 2 || x === 7)) {
            // Add forest
            row.push({ 
              id,
              type: 'forest',
              connections: [],
              rotation: 0,
              revealed: true
            })
          } else if (y === 0 || x === 0 || x === 9 || y === 4) {
            // Mountains around the edges
            row.push({ 
              id,
              type: 'mountain',
              connections: [],
              rotation: 0,
              revealed: true
            })
          } else if (y === 1 && x === 7) {
            // Add a mystery
            row.push({ 
              id,
              type: 'mystery',
              connections: [],
              rotation: 0,
              revealed: false
            })
          } else if (y === 3 && x === 1) {
            // Add water
            row.push({ 
              id,
              type: 'water',
              connections: [],
              rotation: 0,
              revealed: true
            })
          } else {
            // Fill the rest with grass
            row.push({ 
              id,
              type: 'grass',
              connections: [],
              rotation: 0,
              revealed: true
            })
          }
        } else {
          // Empty slots for remaining grid where user can place tiles
          row.push({ 
            id,
            type: 'empty',
            connections: [],
            rotation: 0,
            revealed: true
          })
        }
      }
      newGrid.push(row)
    }
    
    onGridUpdate(newGrid)
    
    // Load any previously discovered mysteries - using database
    db.getDiscoveries().then(discoveries => {
      if (discoveries.length) {
        setDiscoveredMysteries(discoveries);
      }
    }).catch(error => {
      console.error("Failed to load discoveries:", error);
      // Fall back to localStorage if database fails
      const savedDiscoveries = localStorage.getItem('discoveredMysteries');
      if (savedDiscoveries) {
        try {
          setDiscoveredMysteries(JSON.parse(savedDiscoveries));
        } catch (e) {
          console.error("Error parsing saved discoveries:", e);
        }
      }
    });
  }
  
  // Save discovered mysteries
  useEffect(() => {
    if (discoveredMysteries.length > 0) {
      // Save to database first
      db.saveDiscoveries(discoveredMysteries).catch(error => {
        console.error("Failed to save discoveries to database:", error);
        // Fall back to localStorage
        safeSetItem('discoveredMysteries', JSON.stringify(discoveredMysteries));
      });
    }
  }, [discoveredMysteries]);
  
  const handleAddMoreRows = () => {
    if (onAddMoreRows) {
      onAddMoreRows();
    }
  }
  
  const handleTileClick = useCallback((x: number, y: number) => {
    const tile = grid[y][x];
    
    // Don't allow movement to mountain or water tiles
    if (tile.type === "mountain" || tile.type === "water") {
      toast({
        title: "Cannot Move There",
        description: "You cannot move onto mountain or water tiles.",
        variant: "destructive",
      });
      return;
    }

    // If we have a selected tile and clicking on an empty spot, handle tile placement
    if (selectedTile && tile.type === "empty") {
      onTileClick(x, y);
      return;
    }
    
    // Otherwise, move the character
    onCharacterMove(x, y);
    
    // After moving, check if it's a mystery tile and handle it
    if (tile.type === "mystery") {
      handleMysteryTile(x, y);
    }
  }, [grid, selectedTile, onTileClick, onCharacterMove]);
  
  const handleMysteryTile = (x: number, y: number) => {
    // --- Test Logic Start ---
    setShowMysteryTestModal(true); // Trigger the test modal immediately
    // --- Test Logic End ---

    // Original mystery handling logic (can remain for now)
    const random = Math.random();
    const newGrid = [...grid];
    let discovery = "";

    if (random < 0.25) { // 25% chance for scroll
      const isRareScroll = Math.random() < 0.2; // 20% chance for rare scroll
      const scrollTexts = [
        "Ancient texts speak of the first Necrion, a being born from the void between realms. Its poisonous nature was said to be a defense against the primal elements.",
        "The fire creatures of Thrivehaven emerged from the great forest fires, their bodies forged in the flames of destruction. They seek to cleanse the land through fire.",
        "Water beings like Dolphio are said to be guardians of the deep, protecting the ancient secrets buried beneath the waves of Thrivehaven.",
        "The grass creatures are born from the life force of the forests themselves, manifesting when nature's balance is threatened.",
        "Mountain spirits were once mere stone, until the earth's magic gave them consciousness. They remember every peak that was ever carved away.",
      ];
      
      const scrollText = scrollTexts[Math.floor(Math.random() * scrollTexts.length)];
      
      newGrid[y][x] = {
        id: `tile-${y}-${x}`,
        type: "grass",
        connections: [],
        rotation: 0,
        revealed: true,
      };
      
      discovery = "scroll";
      
      setMysteryEncounter({
        type: "scroll",
        title: isRareScroll ? "Rare Scroll Discovered!" : "Ancient Scroll Found!",
        description: scrollText,
        reward: 0,
        imageUrl: "/images/encounters/scroll.jpg"
      });
      setShowMysteryDialog(true);
      
    } else if (random < 0.5) { // 25% chance for nothing
      newGrid[y][x] = {
        id: `tile-${y}-${x}`,
        type: "grass",
        connections: [],
        rotation: 0,
        revealed: true,
      };
      
      discovery = "nothing";
      
      setMysteryEncounter({
        type: "empty",
        title: "Empty Mystery Tile",
        description: "This tile reveals itself to be ordinary grassland.",
        reward: 0,
        imageUrl: "/images/encounters/grass.jpg"
      });
      setShowMysteryDialog(true);
      
    } else if (random < 0.75) { // 25% chance for treasure
      const goldAmount = Math.floor(Math.random() * 481) + 20; // 20-500 gold
      const expAmount = Math.floor(Math.random() * 41) + 10; // 10-50 exp
      
      newGrid[y][x] = {
        id: `tile-${y}-${x}`,
        type: "grass",
        connections: [],
        rotation: 0,
        revealed: true,
      };
      
      discovery = "treasure";
      
      setMysteryEncounter({
        type: "treasure",
        title: "Treasure Found!",
        description: `You found ${goldAmount} gold and gained ${expAmount} experience!`,
        reward: goldAmount,
        imageUrl: "/images/encounters/treasure.jpg"
      });
      setShowMysteryDialog(true);
      onGoldUpdate(goldAmount);

    } else { // 25% chance for battle
      newGrid[y][x] = {
        id: `tile-${y}-${x}`,
        type: "grass",
        connections: [],
        rotation: 0,
        revealed: true,
      };
      
      discovery = "battle";
      setShowBattle(true);
      setBattlePosition({x, y});
    }

    onGridUpdate(newGrid);
    onDiscovery(discovery);
  }
  
  const handleResolveEncounter = () => {
    // Update stats based on encounter type
    if (mysteryEncounter.type === "treasure") {
      // Award gold
      if (onGoldUpdate) {
        onGoldUpdate(mysteryEncounter.reward);
      }
      
      toast({
        title: "Gold Acquired!",
        description: `You received ${mysteryEncounter.reward} gold coins.`,
        variant: "default",
      });
    } else if (mysteryEncounter.type === "scroll") {
      // Award experience for discovering lore
      const expAmount = 25;
      // Experience update will be handled by the parent component
      
      toast({
        title: "Knowledge Gained!",
        description: `You gained ${expAmount} experience points from studying the ancient scroll.`,
        variant: "default",
      });
    }
    
    // Close the dialog
    setShowMysteryDialog(false);
  }
  
  const handleEnterCity = () => {
    // Move character to the city/town position
    const cityPosition = grid.findIndex(row => 
      row.findIndex(tile => 
        tile.type === selectedCity.type && 
        (tile.name === selectedCity.name || (!tile.name && selectedCity.name.includes(selectedCity.type)))
      ) !== -1
    );
    
    if (cityPosition !== -1) {
      const rowIndex = cityPosition;
      const colIndex = grid[rowIndex].findIndex(tile => 
        tile.type === selectedCity.type && 
        (tile.name === selectedCity.name || (!tile.name && selectedCity.name.includes(selectedCity.type)))
      );
      
      if (colIndex !== -1) {
        onCharacterMove(colIndex, rowIndex);
      }
    }
    
    // Close the dialog
    setShowCityDialog(false);
    
    // Update experience for visiting a city/town
    const expAmount = selectedCity.type === 'city' ? 25 : 10;
    updateKingdomStats.dispatchEvent(new CustomEvent('expUpdate', { 
      detail: { amount: expAmount } 
    }));
    
    toast({
      title: `Entered ${selectedCity.name}`,
      description: `You gained ${expAmount} experience from your visit.`,
      variant: "default",
    });
    
    // Navigate to the city page
    const citySlug = selectedCity.name.toLowerCase().replace(/\s+/g, "-");
    if (selectedCity.type === 'city') {
      router.push(`/city/${citySlug}`);
    } else {
      router.push(`/town/${citySlug}`);
    }
  }
  
  // Add this function to calculate if a tile is a valid movement target
  const isValidMovementTarget = useCallback((x: number, y: number) => {
    if (!isMovementMode) return false;
    
    // Don't allow movement to mountain, water or empty tiles
    const tile = grid[y][x];
    if (tile.type === "mountain" || tile.type === "water" || tile.type === "empty") {
      return false;
    }

    // Calculate Euclidean distance
    const distance = Math.sqrt(Math.pow(x - character.x, 2) + Math.pow(y - character.y, 2));
    return distance <= 3.5; // Match the movement range from findPath
  }, [isMovementMode, grid, character]);
  
  const renderTile = (tile: Tile, x: number, y: number) => {
    // Check if this is the character's position
    const isCharacterHere = character.x === x && character.y === y;
    
    // Check if this tile should show controls
    const showControls = 
      hoveredTile?.row === y && 
      hoveredTile.col === x && 
      !["empty", "mystery", "city", "town"].includes(tile.type) &&
      onRotateTile && 
      onDeleteTile &&
      !isMovementMode;
    
    const isValidTarget = isValidMovementTarget(x, y);
    const isHovered = hoveredTile?.row === y && hoveredTile?.col === x;
    
    return (
      <div 
        key={`${x}-${y}`} 
        className={cn(
          "relative aspect-square w-full h-full min-h-[60px] cursor-pointer overflow-hidden rounded-lg group",
          isValidTarget && isHovered && "border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]",
          !isMovementMode && "hover:border-amber-500/50",
          "transition-all duration-200"
        )}
        style={{ minWidth: 'calc((100vw - 16rem) / 12)' }}
        onClick={() => handleTileClick(x, y)}
        onMouseEnter={() => onHover && onHover(x, y)}
        onMouseLeave={() => onHoverEnd && onHoverEnd()}
      >
        <div className="absolute inset-0">
          <TileVisual 
            type={tile.type} 
            rotation={tile.rotation || 0} 
          />
        </div>
        
        {isCharacterHere && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Crown className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-yellow-300 drop-shadow-lg" />
          </div>
        )}
        
        {tile.type === 'city' || tile.type === 'town' ? (
          <div className="absolute bottom-0 left-0 right-0 text-center text-xs sm:text-sm text-white bg-black/50 px-2 py-1 truncate">
            {tile.name || (tile.type === 'city' ? 'City' : 'Town')}
          </div>
        ) : null}
        
        {/* Hover Controls */}
        {showControls && (
          <div className="absolute top-2 right-2 flex gap-2 z-20">
            <button
              className="bg-black/70 p-2 rounded-full hover:bg-red-800/70 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteTile(x, y);
              }}
              aria-label="Delete tile"
            >
              <Trash className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </button>
            <button
              className="bg-black/70 p-2 rounded-full hover:bg-amber-800/70 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onRotateTile(x, y);
              }}
              aria-label="Rotate tile"
            >
              <RotateCw className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </button>
          </div>
        )}

        {/* Movement target indicator */}
        {isMovementMode && isValidTarget && isHovered && (
          <div className="absolute inset-0 bg-green-500/10 rounded-lg transition-opacity duration-200" />
        )}
      </div>
    );
  }

  if (grid.length === 0) {
    return <div>Loading map...</div>;
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-12 auto-rows-fr gap-2">
        {grid.map((row, y) => (
          <React.Fragment key={y}>
            {row.map((tile, x) => {
              // Skip rendering if this is part of a city/town but not the main tile
              if ((tile.type === "city" || tile.type === "town") && !tile.isMainTile) {
                return null;
              }

              // Calculate the size of the tile
              let tileSize = "col-span-1 row-span-1";
              if (tile.type === "city" || tile.type === "town") {
                tileSize = "col-span-2 row-span-2";
              }

              return (
                <div
                  key={`${y}-${x}`}
                  className={cn(
                    "relative group",
                    "min-h-[60px]",
                    "aspect-square",
                    "bg-gray-800/50 rounded-lg border border-gray-700/50",
                    isMovementMode && isValidMovementTarget(x, y) && hoveredTile?.row === y && hoveredTile?.col === x && "border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]",
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
                  {/* Tile content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <TileVisual
                      type={tile.type}
                      rotation={tile.rotation || 0}
                      isMainTile={tile.isMainTile}
                      citySize={tile.citySize}
                    />
                  </div>

                  {/* Movement target indicator */}
                  {isMovementMode && isValidMovementTarget(x, y) && hoveredTile?.row === y && hoveredTile?.col === x && (
                    <div className="absolute inset-0 bg-green-500/10 rounded-lg transition-opacity duration-200" />
                  )}

                  {/* Character */}
                  {character.x === x && character.y === y && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-amber-900" />
                      </div>
                    </div>
                  )}

                  {/* Hover controls - only show in building mode */}
                  {hoveredTile?.row === y && 
                   hoveredTile?.col === x && 
                   !isMovementMode && 
                   tile.type !== "empty" && (
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

      {/* City/Town Entry Dialog */}
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

      {/* Mystery Encounter Dialog */}
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
            
            {/* Event-specific content */}
            {mysteryEncounter.type === "scroll" && (
              <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
                <div className="text-amber-400 text-sm mb-2">Ancient Knowledge</div>
                <p className="text-gray-300 italic">{mysteryEncounter.description}</p>
              </div>
            )}
            
            {mysteryEncounter.type === "treasure" && (
              <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
                <div className="text-amber-400 text-sm mb-2">Treasure Contents</div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500">{mysteryEncounter.reward} Gold</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="sm:justify-between">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
            <Button 
              type="button" 
              onClick={handleResolveEncounter}
              className="bg-amber-600 hover:bg-amber-500"
            >
              {mysteryEncounter.type === "scroll" ? "Learn" : 
               mysteryEncounter.type === "treasure" ? "Collect" : 
               mysteryEncounter.type === "empty" ? "Continue" : "Proceed"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Test Modal for Mystery Tile Trigger --- */} 
      <Dialog open={showMysteryTestModal} onOpenChange={setShowMysteryTestModal}>
        <DialogContent className="sm:max-w-md border border-blue-500 bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-blue-400">Mystery Tile Triggered!</DialogTitle>
            <DialogDescription className="text-gray-300 mt-2">
              The logic for entering a mystery tile was successfully triggered.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              type="button" 
              onClick={() => setShowMysteryTestModal(false)}
              className="bg-blue-600 hover:bg-blue-500"
            >
              Close Test Modal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* --- End Test Modal --- */}

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