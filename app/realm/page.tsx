"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import Image from "next/image"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { getCharacterName } from "@/lib/toast-utils"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { Tile, TileType } from "@/types/tiles"
import { useCreatureStore } from "@/stores/creatureStore"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, ChevronDown } from "lucide-react"
import { useCreatureUnlock } from "@/lib/hooks/use-creature-unlock"
import { MapGrid } from '@/components/map-grid'
import { TileInventory } from '@/components/tile-inventory'

// Types
interface Position {
  x: number
  y: number
}

interface TileInventoryItem {
  count: number
  name: string
  description: string
  image: string
  cost: number
}

interface TileInventory {
  [key: string]: TileInventoryItem
}

// Remove empty interface and extend Tile directly where needed
type MapTile = Tile & {
  cityName?: string
  townName?: string
}

// Constants
const GRID_COLS = 12
const INITIAL_ROWS = 20
const ZOOM_LEVELS = [0.5, 1, 1.5, 2]
const AUTOSAVE_INTERVAL = 30000 // 30 seconds

// Initial state
const initialTileInventory: TileInventory = {
  grass: { 
    count: 50, 
    name: "Grass", 
    description: "Basic grassland tile", 
    image: "/images/tiles/grass-tile.png",
    cost: 20
  },
  water: { 
    count: 20, 
    name: "Water", 
    description: "Water body tile", 
    image: "/images/tiles/water-tile.png",
    cost: 35
  },
  mountain: { 
    count: 10, 
    name: "Mountain", 
    description: "Mountain tile", 
    image: "/images/tiles/mountain-tile.png",
    cost: 40
  },
  forest: { 
    count: 15, 
    name: "Forest", 
    description: "Forest tile", 
    image: "/images/tiles/forest-tile.png",
    cost: 30
  },
  desert: { 
    count: 12, 
    name: "Desert", 
    description: "Desert tile", 
    image: "/images/tiles/desert-tile.png",
    cost: 25
  },
  mystery: { 
    count: 5, 
    name: "Mystery", 
    description: "Unknown mysterious tile", 
    image: "/images/tiles/mystery-tile.png",
    cost: 40
  },
  city: { 
    count: 3, 
    name: "City", 
    description: "Large urban settlement", 
    image: "/images/tiles/city_image.png",
    cost: 50
  },
  town: { 
    count: 5, 
    name: "Town", 
    description: "Small settlement", 
    image: "/images/tiles/town_image.png",
    cost: 45
  }
}

// Add location data
const locationData = {
  city: {
    name: "Grand Citadel",
    description: "A magnificent city with towering spires and bustling markets. The heart of commerce and culture in the realm.",
    locationId: "grand-citadel"
  },
  town: {
    name: "Riverside Haven",
    description: "A peaceful town nestled by the river. Known for its friendly inhabitants and local crafts.",
    locationId: "riverside-haven"
  }
}

// Function to create initial grid
const createInitialGrid = () => {
  return Array(INITIAL_ROWS).fill(null).map((_, y) =>
    Array(GRID_COLS).fill(null).map((_, x) => {
      let type: TileType = 'empty';
      
      // Row 1: All mountain tiles except (1,2) which is grass for character start
      if (y === 0) {
        if (x === 2) {
          type = 'grass'; // Character starting position
        } else {
          type = 'mountain';
        }
      }
      // Row 2: All grass tiles except 2,2 which is a city, sides are mountain
      else if (y === 1) {
        if (x === 0 || x === GRID_COLS - 1) {
          type = 'mountain';
        } else if (x === 2) {
          type = 'city';
        } else {
          type = 'grass';
        }
      }
      // Row 3: Grass at 3,2 and 3,9, rest forest, sides mountain
      else if (y === 2) {
        if (x === 0 || x === GRID_COLS - 1) {
          type = 'mountain';
        } else if (x === 2 || x === 9) {
          type = 'grass';
        } else {
          type = 'forest';
        }
      }
      // Row 4: Grass at 4,2, 4,3, and 4,9, rest forest, sides mountain
      else if (y === 3) {
        if (x === 0 || x === GRID_COLS - 1) {
          type = 'mountain';
        } else if (x === 2 || x === 3 || x === 9) {
          type = 'grass';
        } else {
          type = 'forest';
        }
      }
      // Row 5: Town at 5,3, grass at 5,4, rest forest, sides mountain
      else if (y === 4) {
        if (x === 0 || x === GRID_COLS - 1) {
          type = 'mountain';
        } else if (x === 3) {
          type = 'town';
        } else if (x === 4) {
          type = 'grass';
        } else {
          type = 'forest';
        }
      }

      return {
        id: `tile-${x}-${y}`,
        type,
        name: type === 'city' ? locationData.city.name : 
              type === 'town' ? locationData.town.name : '',
        description: type === 'city' ? locationData.city.description :
                    type === 'town' ? locationData.town.description : '',
        connections: [],
        rotation: 0,
        revealed: true,
        isVisited: false
      } as Tile;
    })
  );
};

export default function RealmPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { handleUnlock } = useCreatureUnlock()

  // State declarations
  const [inventory, setInventory] = useLocalStorage<TileInventory>("tile-inventory", initialTileInventory)
  const [showScrollMessage, setShowScrollMessage] = useState(false)
  const [characterPosition, setCharacterPosition] = useLocalStorage<Position>("character-position", { x: 2, y: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedTile, setSelectedTile] = useState<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const [grid, setGrid] = useState<Tile[][]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Initialize grid on client side only
  useEffect(() => {
    const savedGrid = localStorage.getItem('realm-grid');
    if (savedGrid) {
      try {
        setGrid(JSON.parse(savedGrid));
      } catch (e) {
        console.error('Error loading saved grid:', e);
        setGrid(createInitialGrid());
      }
    } else {
      setGrid(createInitialGrid());
    }
    setIsLoading(false);
  }, []);

  // Save grid changes
  useEffect(() => {
    if (!isLoading && grid.length > 0) {
      localStorage.setItem('realm-grid', JSON.stringify(grid));
    }
  }, [grid, isLoading]);

  const [rows, setRows] = useState(INITIAL_ROWS)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [showMinimap, setShowMinimap] = useState(false)
  const [buildMode, setBuildMode] = useState(true)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ type: string; name: string; description: string } | null>(null)

  // Update tileCounts initialization
  const [tileCounts, setTileCounts] = useLocalStorage("tile-counts", {
    forestPlaced: 0,
    forestDestroyed: 0,
    waterPlaced: 0,
    mountainDestroyed: 0
  });

  // Add state for achievement modal
  const [showAchievementModal, setShowAchievementModal] = useState(false)
  const [achievementDetails, setAchievementDetails] = useState<{
    creatureName: string;
    requirement: string;
  } | null>(null)

  // Handle fullscreen toggle with URL parameter
  const handleFullscreenToggle = (checked: boolean) => {
    setIsFullscreen(checked)
    // Add or remove fullscreen parameter from URL
    const url = new URL(window.location.href)
    if (checked) {
      url.searchParams.set('fullscreen', 'true')
    } else {
      url.searchParams.delete('fullscreen')
    }
    window.history.replaceState({}, '', url.toString())
  }

  // Initialize fullscreen state from URL on mount
  useEffect(() => {
    const url = new URL(window.location.href)
    const isFullscreen = url.searchParams.get('fullscreen') === 'true'
    setIsFullscreen(isFullscreen)
  }, [])

  // Autosave
  useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem("realm-grid", JSON.stringify(grid))
      toast({
        title: "Realm Saved",
        description: `Your realm has been preserved in the archives, ${getCharacterName()}.`,
        variant: "default",
        className: "scroll-toast"
      })
    }, AUTOSAVE_INTERVAL)

    return () => clearInterval(interval)
  }, [grid])

  // Define moveCharacter before using it in useEffect
  const moveCharacter = useCallback((newX: number, newY: number) => {
    setCharacterPosition({ x: newX, y: newY })
  }, [setCharacterPosition])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { x, y } = characterPosition;
      
      switch (e.key) {
        case 'ArrowUp':
          if (y > 0) moveCharacter(x, y - 1);
          break;
        case 'ArrowDown':
          if (y < grid.length - 1) moveCharacter(x, y + 1);
          break;
        case 'ArrowLeft':
          if (x > 0) moveCharacter(x - 1, y);
          break;
        case 'ArrowRight':
          if (x < GRID_COLS - 1) moveCharacter(x + 1, y);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [characterPosition, grid, moveCharacter, GRID_COLS]);

  // Show scroll message
  useEffect(() => {
    if (showScrollMessage) {
      toast({
        title: "Scroll to explore more!",
        description: "Keep scrolling down to reveal more of the map."
      })
    }
  }, [showScrollMessage, toast])

  // Update handleAchievementUnlock to be async and handle state properly
  const handleAchievementUnlock = async (creatureId: string, requirement: string) => {
    try {
      const creatureStore = useCreatureStore.getState();
      const creature = creatureStore.creatures.find(c => c.id === creatureId);
      
      if (!creature) {
        console.error('Creature not found:', creatureId);
        return;
      }

      console.log('Unlocking achievement for:', creature.name); // Debug log

      // Set achievement details and show modal
      setAchievementDetails({
        creatureName: creature.name,
        requirement: requirement
      });
      setShowAchievementModal(true);
    } catch (error) {
      console.error('Error in handleAchievementUnlock:', error);
    }
  };

  // Update the achievement checks in handleTileClick
  const handleTileClick = async (x: number, y: number) => {
    try {
      if (x < 0 || y < 0 || y >= grid.length || x >= grid[0].length) return;

      const clickedTile = grid[y][x];

      if (buildMode) {
        if (selectedTile && clickedTile.type === "empty") {
          if (inventory[selectedTile] && inventory[selectedTile].count > 0) {
            const newGrid = [...grid];
            newGrid[y][x] = {
              id: clickedTile.id,
              type: selectedTile as TileType,
              name: selectedTile === 'city' ? 'Grand Citadel' :
                    selectedTile === 'town' ? 'Riverside Haven' : '',
              description: '',
              isVisited: false,
              connections: [],
              rotation: 0,
              revealed: true
            };
            setGrid(newGrid);
            setInventory({
              ...inventory,
              [selectedTile]: {
                ...inventory[selectedTile],
                count: inventory[selectedTile].count - 1
              }
            });

            // Track tile placement and check for achievements
            if (selectedTile === 'forest') {
              const newForestCount = (tileCounts.forestPlaced || 0) + 1;
              await setTileCounts(prev => ({ ...prev, forestPlaced: newForestCount }));
              
              // Check forest placement achievements
              if (newForestCount === 1) {
                await useCreatureStore.getState().discoverCreature('007');
                await handleAchievementUnlock('007', 'First forest placed');
              } else if (newForestCount === 5) {
                await useCreatureStore.getState().discoverCreature('008');
                await handleAchievementUnlock('008', '5 forests placed');
              } else if (newForestCount === 10) {
                await useCreatureStore.getState().discoverCreature('009');
                await handleAchievementUnlock('009', '10 forests placed');
              }
            }
            else if (selectedTile === 'water') {
              const newWaterCount = (tileCounts.waterPlaced || 0) + 1;
              await setTileCounts(prev => ({ ...prev, waterPlaced: newWaterCount }));
              
              // Check water placement achievements
              if (newWaterCount === 1) {
                await useCreatureStore.getState().discoverCreature('004');
                await handleAchievementUnlock('004', 'First water placed');
              } else if (newWaterCount === 5) {
                await useCreatureStore.getState().discoverCreature('005');
                await handleAchievementUnlock('005', '5 water tiles placed');
              } else if (newWaterCount === 10) {
                await useCreatureStore.getState().discoverCreature('006');
                await handleAchievementUnlock('006', '10 water tiles placed');
              }
            }

            toast({
              title: `Placed ${inventory[selectedTile].name}`,
              description: `Cost: ${inventory[selectedTile].cost} gold`,
              variant: "default"
            });
      } else {
            toast({
              title: "Out of Tiles",
              description: `You don't have any ${inventory[selectedTile]?.name || selectedTile} tiles left.`, 
              variant: "destructive"
            });
          }
        } else if (clickedTile.type !== "empty") {
          setSelectedTile(clickedTile.type);
          toast({ 
            title: `Selected ${inventory[clickedTile.type]?.name || clickedTile.type} tile`,
            variant: "default"
          });
        }
      } else { // Play Mode
        moveCharacter(x, y);
        if (clickedTile.type === "city" || clickedTile.type === "town") {
          const locationInfo = locationData[clickedTile.type];
          setCurrentLocation({
            type: clickedTile.type,
            name: locationInfo.name,
            description: locationInfo.description
          });
          setShowLocationModal(true);
        }
      }
    } catch (error) {
      console.error('Error in handleTileClick:', error);
    toast({
        title: "Error",
        description: "Failed to process tile placement. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Update handleDestroyTile with proper async handling and debug logs
  const handleDestroyTile = async (x: number, y: number) => {
    try {
      const tileType = grid[y][x].type as TileType;
      if (tileType === "empty") return;

      console.log('Destroying tile:', tileType); // Debug log

      // Update grid first
    const newGrid = [...grid];
    newGrid[y][x] = {
        id: `tile-${x}-${y}`,
        type: "empty",
        name: "",
        description: "",
        isVisited: false,
      connections: [],
      rotation: 0,
      revealed: true
    };
      setGrid(newGrid);

      // Track tile destruction and check for achievements
      if (tileType === 'forest') {
        console.log('Current forest destroyed count:', tileCounts.forestDestroyed); // Debug log
        
        // Calculate new count
        const newForestDestroyed = (tileCounts.forestDestroyed || 0) + 1;
        console.log('New forest destroyed count:', newForestDestroyed); // Debug log
        
        // Update state and localStorage first
        const updatedCounts = { ...tileCounts, forestDestroyed: newForestDestroyed };
        localStorage.setItem('tile-counts', JSON.stringify(updatedCounts));
        await setTileCounts(updatedCounts);

        // Now check forest destruction achievements
        if (newForestDestroyed === 1) {
          console.log('Attempting to unlock first forest achievement'); // Debug log
          handleUnlock('001');
        } else if (newForestDestroyed === 5) {
          handleUnlock('002');
        } else if (newForestDestroyed === 10) {
          handleUnlock('003');
        }
      }
      else if (tileType === 'mountain') {
        const newMountainDestroyed = (tileCounts.mountainDestroyed || 0) + 1;
        const updatedCounts = { ...tileCounts, mountainDestroyed: newMountainDestroyed };
        localStorage.setItem('tile-counts', JSON.stringify(updatedCounts));
        await setTileCounts(updatedCounts);
        
        // Check mountain destruction achievements
        if (newMountainDestroyed === 1) {
          handleUnlock('010');
        } else if (newMountainDestroyed === 5) {
          handleUnlock('011');
        } else if (newMountainDestroyed === 10) {
          handleUnlock('012');
        }
      }

      // Handle inventory update and toast
      const inventoryKey = tileType as keyof typeof inventory;
      if (inventory[inventoryKey]) {
        setInventory({
          ...inventory,
          [inventoryKey]: {
            ...inventory[inventoryKey],
            count: inventory[inventoryKey].count + 1
          }
        });
        
      toast({
          title: "Tile Recycled",
          description: `Recycled ${inventory[inventoryKey].name} tile. Refunded ${Math.floor(inventory[inventoryKey].cost * 0.5)} gold.`,
          variant: "default",
          className: "scroll-toast"
        });
      }
    } catch (error) {
      console.error('Error in handleDestroyTile:', error);
      toast({
        title: "Error",
        description: "Failed to process tile destruction. Please try again.",
        variant: "destructive"
      });
    }
  };

  const addNewRow = () => {
    setRows(rows + 1)
    // Ensure the new empty tiles match the Tile interface
    const newRow: Tile[] = Array(GRID_COLS).fill(null).map((_, x) => ({
      id: `tile-${x}-${rows}`,
      type: x === 0 || x === GRID_COLS - 1 ? "mountain" as TileType : "empty" as TileType,
      connections: [], // Add missing property
        rotation: 0,
      revealed: true // Add missing property (assuming revealed)
    }))
    setGrid([...grid, newRow])
  }

  // Handle location visit
  const handleVisitLocation = () => {
    if (!currentLocation) return;
    setShowLocationModal(false);
    
    // Route based on location type
    if (currentLocation.type === 'city') {
      router.push(`/city/${encodeURIComponent(locationData.city.name)}`);
    } else if (currentLocation.type === 'town') {
      const townSlug = locationData.town.name.toLowerCase().replace(/\s+/g, '-');
      router.push(`/town/${townSlug}`);
    }
  }

  // Fix the image rendering for empty tiles
  const getTileImage = (tile: Tile) => {
    if (tile.type === 'empty') {
      return '/images/tiles/empty-tile.png' // Default empty tile image
    }
    return inventory[tile.type]?.image || '/images/tiles/empty-tile.png'
  }

  const getTileName = (tile: Tile) => {
    if (tile.type === 'empty') {
      return 'Empty Tile'
    }
    return inventory[tile.type]?.name || 'Unknown Tile'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-cardo text-primary">Loading realm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="flex-1 flex flex-col">
        {/* Grid container */}
        <div className="relative flex-1">
          {/* Controls */}
          <div className="fixed top-16 right-4 z-10 flex flex-col gap-2">
            {/* Mobile Controls Dropdown */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Settings className="h-4 w-4" />
                    <span>Controls</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setZoomLevel(Math.max(zoomLevel - 0.5, ZOOM_LEVELS[0]))}>
                    Zoom Out
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setZoomLevel(Math.min(zoomLevel + 0.5, ZOOM_LEVELS[ZOOM_LEVELS.length - 1]))}>
                    Zoom In
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowMinimap(!showMinimap)}>
                    Toggle Minimap
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBuildMode(!buildMode)}>
                    {buildMode ? "Play Mode" : "Build Mode"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFullscreenToggle(!isFullscreen)}>
                    {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          </div>

            {/* Desktop Controls */}
            <div className="hidden md:flex md:flex-col md:gap-2">
            <Button 
              variant="outline" 
                size="sm"
                onClick={() => setZoomLevel(Math.max(zoomLevel - 0.5, ZOOM_LEVELS[0]))}
            >
                Zoom Out
            </Button>
            <Button 
              variant="outline" 
                size="sm"
                onClick={() => setZoomLevel(Math.min(zoomLevel + 0.5, ZOOM_LEVELS[ZOOM_LEVELS.length - 1]))}
            >
                Zoom In
            </Button>
            <Button 
              variant="outline" 
                size="sm"
                onClick={() => setShowMinimap(!showMinimap)}
            >
                {showMinimap ? "Hide Minimap" : "Show Minimap"}
            </Button>
                <Button 
                variant={buildMode ? "default" : "outline"}
                size="sm"
                onClick={() => setBuildMode(!buildMode)}
              >
                {buildMode ? "Build Mode" : "Play Mode"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFullscreenToggle(!isFullscreen)}
              >
                {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                </Button>
                </div>
          </div>

          {/* Tile Inventory */}
          <Sheet>
            <SheetTrigger asChild>
                <Button
                variant="outline"
                size="sm"
                className="fixed top-16 left-4 z-10"
              >
                Tile Inventory
                </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <ScrollArea className="h-[calc(100vh-8rem)]">
                <div className="grid gap-4 py-4">
                  {Object.entries(inventory).map(([type, data]) => (
                    <Card
                      key={type}
                      className={cn(
                        "p-4 cursor-pointer transition-colors",
                        selectedTile === type && "border-primary"
                      )}
                      onClick={() => setSelectedTile(type)}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <Image
                            src={data.image}
                            alt={data.name}
                            width={48}
                            height={48}
                          />
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="font-semibold">{data.name}</h3>
                            <span className="text-sm text-muted-foreground">{data.cost} gold</span>
              </div>
                          <p className="text-sm text-muted-foreground">
                            {data.description}
                          </p>
                          <p className="text-sm mt-1">
                            Available: {data.count}
                          </p>
              </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          {/* Grid */}
          <div 
            ref={gridRef}
            className={cn(
              "relative w-full h-full overflow-auto border rounded-lg bg-muted/20",
              isFullscreen ? "h-screen" : "h-full"
            )}
            tabIndex={0}
          >
            <div
              className={cn(
                "grid gap-px transition-transform duration-200",
                "bg-muted-foreground/20"
              )}
              style={{
                gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
                transform: `scale(${zoomLevel})`,
                transformOrigin: "top left"
              }}
            >
              {grid.map((row, y) =>
                row.map((tile, x) => (
                      <div
                        key={tile.id}
                        className={cn(
                      "aspect-square relative cursor-pointer group",
                      "hover:bg-primary/20 transition-colors",
                      tile.type !== "empty" && "bg-secondary"
                    )}
                    onClick={() => handleTileClick(x, y)}
                  >
                    <div className="absolute inset-0">
                      <Image
                        src={getTileImage(tile)}
                        alt={getTileName(tile)}
                        fill
                        className="object-cover"
                      />
          </div>
                    {tile.type !== "empty" && buildMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDestroyTile(x, y)
                        }}
                        className="absolute top-1 right-1 p-1 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                        title="Destroy tile"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </button>
                    )}
                    {x === characterPosition.x && y === characterPosition.y && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Image
                          src="/character/character.png"
                          alt="Character"
                          width={48}
                          height={48}
                          className="w-1/4 h-1/4 object-contain"
                          priority
                        />
                          </div>
                    )}
                        </div>
                ))
          )}
                        </div>
                      </div>

          {/* Explore button */}
          <Button
            className="mt-4 w-full"
            onClick={addNewRow}
          >
            Explore New Lands
              </Button>

          {/* Minimap */}
          {showMinimap && (
            <div className="fixed bottom-4 right-4 w-48 h-48 border rounded-lg overflow-hidden bg-background/80 backdrop-blur">
              <div className="relative w-full h-full">
                <div
                  className={cn(
                    "grid gap-[1px] absolute inset-0",
                    "bg-muted-foreground/20"
                  )}
                  style={{
                    gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
                  }}
                >
                  {grid.map((row, y) =>
                    row.map((tile, x) => (
                      <div
                        key={`minimap-${tile.id}`}
                        className={cn(
                          "relative",
                          tile.type !== "empty" && "bg-secondary"
                        )}
                      >
                        {tile.type !== "empty" && (
                          <div className="absolute inset-0">
                            <Image
                              src={inventory[tile.type].image}
                              alt={inventory[tile.type].name}
                              fill
                              className="object-cover"
                            />
                </div>
                        )}
                        {x === characterPosition.x && y === characterPosition.y && (
                          <div className="absolute inset-0 bg-amber-500/80" />
                        )}
            </div>
                    ))
          )}
        </div>
                {/* Viewport indicator */}
                <div
                  className="absolute border-2 border-primary pointer-events-none"
                  style={{
                    width: `${(100 / zoomLevel)}%`,
                    height: `${(100 / zoomLevel)}%`,
                    left: `${(gridRef.current?.scrollLeft || 0) / (gridRef.current?.scrollWidth || 1) * 100}%`,
                    top: `${(gridRef.current?.scrollTop || 0) / (gridRef.current?.scrollHeight || 1) * 100}%`,
                  }}
                />
      </div>
                  </div>
          )}

          {/* Location Modal */}
          <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
            <DialogContent>
            <DialogHeader>
                <DialogTitle>{currentLocation?.name}</DialogTitle>
              <DialogDescription>
                  {currentLocation?.description}
              </DialogDescription>
            </DialogHeader>
              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={() => setShowLocationModal(false)}>
                  Leave
              </Button>
                <Button onClick={handleVisitLocation}>
                  Visit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      {/* Achievement Modal */}
      <Dialog open={showAchievementModal} onOpenChange={setShowAchievementModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold">Achievement Unlocked! 🎉</DialogTitle>
            <DialogDescription className="text-center">
              <div className="mt-4 space-y-4">
                <p className="text-lg font-semibold">{achievementDetails?.creatureName} has been discovered!</p>
                <p className="text-sm text-muted-foreground">{achievementDetails?.requirement}</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              variant="default"
              onClick={() => {
                setShowAchievementModal(false);
                router.push('/achievements');
              }}
            >
              View in Achievements
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAchievementModal(false)}
            >
              Continue Playing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
      </div>
    </div>
  )
}


