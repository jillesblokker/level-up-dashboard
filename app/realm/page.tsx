"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar } from "@/components/ui/avatar"
import { toast } from "@/components/ui/use-toast"
import { useToast } from "@/components/ui/use-toast"
import { showScrollToast } from "@/lib/toast-utils"
import { getCharacterName } from "@/lib/toast-utils"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Tile, TileType, Character } from "@/types/tiles"
import { Icons } from "@/components/icons"
import { useCreatureStore } from "@/stores/creatureStore"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, ChevronDown } from "lucide-react"

// Types
interface Position {
  x: number
  y: number
}

interface TileInventory {
  [key: string]: {
    count: number
    name: string
    description: string
    image: string
    cost: number
  }
}

// Constants
const GRID_COLS = 12
const INITIAL_ROWS = 20
const ZOOM_LEVELS = [0.5, 1, 1.5, 2]
const AUTOSAVE_INTERVAL = 30000 // 30 seconds

// Initial state
const initialTileInventory: TileInventory = {
  empty: {
    count: 0,
    name: "Empty",
    description: "Empty tile",
    image: "/images/tiles/empty-tile.png",
    cost: 0
  },
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
    cost: 40
  },
  town: { 
    count: 5, 
    name: "Town", 
    description: "Small settlement", 
    image: "/images/tiles/town_image.png",
    cost: 35
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

// Define a custom tile interface extending Tile to include potential town/city names
interface MapTile extends Tile {
  // ... existing code ...
}

export default function RealmPage() {
  // State
  const [grid, setGrid] = useState<Tile[][]>(() => {
    // Try to load from localStorage first
    try {
      const savedGrid = localStorage.getItem("realm-grid");
          if (savedGrid) {
        const parsedGrid = JSON.parse(savedGrid) as Tile[][];
        // Validate the loaded grid structure
        if (Array.isArray(parsedGrid) && parsedGrid.length > 0 && Array.isArray(parsedGrid[0])) {
          // Ensure each tile has all required properties
          return parsedGrid.map(row => row.map(tile => ({
            ...tile,
            connections: tile.connections ?? [],
            revealed: tile.revealed ?? true,
            rotation: tile.rotation ?? 0,
            id: tile.id ?? `tile-${Math.random()}`, // Fallback ID
            type: tile.type ?? 'empty'
          } as Tile)));
        } else {
          console.warn("Invalid grid structure found in localStorage.");
        }
      }
    } catch (e) {
      console.error("Failed to load or parse grid from localStorage", e);
    }
    
    // Initialize a new grid if loading failed or no saved grid exists
    const newGrid = Array(INITIAL_ROWS).fill(null).map((_, y) => 
      Array(GRID_COLS).fill(null).map((_, x) => ({
        id: `tile-${x}-${y}`,
        type: "empty",
        connections: [], // Add missing property
            rotation: 0,
        revealed: true // Add missing property
      } as Tile))
    );

    // Foundation setup
    const foundation = [
      // Row 1
      { y: 0, x: 0, type: "mountain" }, { y: 0, x: 1, type: "mountain" }, { y: 0, x: 2, type: "mountain" },
      { y: 0, x: 3, type: "mountain" }, { y: 0, x: 4, type: "mountain" }, { y: 0, x: 5, type: "grass" },
      { y: 0, x: 6, type: "mountain" }, { y: 0, x: 7, type: "mountain" }, { y: 0, x: 8, type: "mountain" },
      { y: 0, x: 9, type: "mountain" }, { y: 0, x: 10, type: "mountain" }, { y: 0, x: 11, type: "mountain" },
      // Row 2
      { y: 1, x: 0, type: "mountain" }, { y: 1, x: 1, type: "grass" }, { y: 1, x: 2, type: "grass" },
      { y: 1, x: 3, type: "grass" }, { y: 1, x: 4, type: "grass" }, { y: 1, x: 5, type: "town" },
      { y: 1, x: 6, type: "grass" }, { y: 1, x: 7, type: "grass" }, { y: 1, x: 8, type: "grass" },
      { y: 1, x: 9, type: "grass" }, { y: 1, x: 10, type: "grass" }, { y: 1, x: 11, type: "mountain" },
      // Row 3
      { y: 2, x: 0, type: "mountain" }, { y: 2, x: 1, type: "grass" }, { y: 2, x: 2, type: "grass" },
      { y: 2, x: 3, type: "grass" }, { y: 2, x: 4, type: "grass" }, { y: 2, x: 5, type: "grass" },
      { y: 2, x: 6, type: "grass" }, { y: 2, x: 7, type: "grass" }, { y: 2, x: 8, type: "grass" },
      { y: 2, x: 9, type: "grass" }, { y: 2, x: 10, type: "grass" }, { y: 2, x: 11, type: "mountain" },
      // Row 4
      { y: 3, x: 0, type: "mountain" }, { y: 3, x: 1, type: "water" }, { y: 3, x: 2, type: "water" },
      { y: 3, x: 3, type: "grass" }, { y: 3, x: 4, type: "forest" }, { y: 3, x: 5, type: "city" },
      { y: 3, x: 6, type: "grass" }, { y: 3, x: 7, type: "grass" }, { y: 3, x: 8, type: "grass" },
      { y: 3, x: 9, type: "forest" }, { y: 3, x: 10, type: "water" }, { y: 3, x: 11, type: "mountain" },
      // Row 5
      { y: 4, x: 0, type: "mountain" }, { y: 4, x: 1, type: "water" }, { y: 4, x: 2, type: "grass" },
      { y: 4, x: 3, type: "grass" }, { y: 4, x: 4, type: "forest" }, { y: 4, x: 5, type: "grass" },
      { y: 4, x: 6, type: "desert" }, { y: 4, x: 7, type: "mystery" }, { y: 4, x: 8, type: "grass" },
      { y: 4, x: 9, type: "forest" }, { y: 4, x: 10, type: "water" }, { y: 4, x: 11, type: "mountain" },
    ];

    foundation.forEach(({ x, y, type }) => {
      if (newGrid[y] && newGrid[y][x]) {
      newGrid[y][x] = {
          id: `tile-${x}-${y}`,
          type: type as TileType,
          connections: [], // Add missing property
        rotation: 0,
          revealed: true // Add missing property
        };
      }
    });

    return newGrid;
  })
  const [rows, setRows] = useState(INITIAL_ROWS)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [showMinimap, setShowMinimap] = useState(false)
  const [buildMode, setBuildMode] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [characterPos, setCharacterPos] = useLocalStorage<Position>("character-position", { x: 5, y: 0 })
  const [inventory, setInventory] = useLocalStorage<TileInventory>("tile-inventory", initialTileInventory)
  const [selectedTile, setSelectedTile] = useState<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ type: string; name: string; description: string } | null>(null)
  const router = useRouter()

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

  // Clear old grid data on mount
  useEffect(() => {
    localStorage.removeItem("realm-grid")
    setInventory(initialTileInventory)
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

  // Character movement handlers
  const moveCharacter = (newX: number, newY: number) => {
    if (newX < 0 || newX >= GRID_COLS || newY < 0 || newY >= rows) return
    if (grid[newY][newX].type === "mountain" || 
        grid[newY][newX].type === "water" || 
        grid[newY][newX].type === "empty") return

    setCharacterPos({ x: newX, y: newY })

    // Check if moved to city or town
    const tileType = grid[newY][newX].type
    if (tileType === "city" || tileType === "town") {
      setCurrentLocation({
        type: tileType,
        ...locationData[tileType as keyof typeof locationData]
      })
      setShowLocationModal(true)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!gridRef.current?.contains(document.activeElement)) return

    switch (e.key) {
      case "ArrowUp":
      case "w":
        moveCharacter(characterPos.x, characterPos.y - 1)
        break
      case "ArrowDown":
      case "s":
        moveCharacter(characterPos.x, characterPos.y + 1)
        break
      case "ArrowLeft":
      case "a":
        moveCharacter(characterPos.x - 1, characterPos.y)
        break
      case "ArrowRight":
      case "d":
        moveCharacter(characterPos.x + 1, characterPos.y)
        break
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [characterPos])

  // Grid interaction handlers
  const handleTileClick = (x: number, y: number) => {
    if (x < 0 || y < 0 || y >= grid.length || x >= grid[0].length) return; // Bounds check

    const clickedTile = grid[y][x];

    if (buildMode) {
      if (selectedTile && clickedTile.type === "empty") {
        if (inventory[selectedTile] && inventory[selectedTile].count > 0) {
          const newGrid = [...grid];
          newGrid[y][x] = {
            id: clickedTile.id, 
            type: selectedTile as TileType, 
            connections: [], // Add missing property
            rotation: 0,
            revealed: true // Add missing property
          };
          setGrid(newGrid);
          setInventory({
            ...inventory,
            [selectedTile]: {
              ...inventory[selectedTile],
              count: inventory[selectedTile].count - 1
            }
          });
          setSelectedTile(null); // Deselect tile after placing
        } else {
      toast({
            title: "Out of Tiles",
            description: `You don't have any ${inventory[selectedTile]?.name || selectedTile} tiles left.`, 
            variant: "destructive"
          });
        }
      } else if (clickedTile.type !== "empty") {
        // Handle interacting with non-empty tiles in build mode (optional)
        // For now, just select the tile type for potential placement
        setSelectedTile(clickedTile.type);
        toast({ title: `Selected ${inventory[clickedTile.type]?.name || clickedTile.type} tile` });
      } else {
        // Clicking empty space without a selected tile
        setSelectedTile(null); // Ensure nothing is selected
      }
    } else { // Play Mode
      moveCharacter(x, y);
      // Additional logic for interacting with tiles in play mode
      if (clickedTile.type === "city" || clickedTile.type === "town") {
        const locationInfo = locationData[clickedTile.type as keyof typeof locationData];
        setCurrentLocation({ 
          type: clickedTile.type,
          name: locationInfo.name,
          description: locationInfo.description
        });
        setShowLocationModal(true);
      }
    }
  }

  // Handle tile destruction
  const handleDestroyTile = (x: number, y: number) => {
    const tileType = grid[y][x].type as TileType; // Ensure correct type
    if (tileType === "empty") return

    const newGrid = [...grid]
    // Ensure the new empty tile matches the Tile interface
    newGrid[y][x] = {
      id: `tile-${x}-${y}`,
      type: "empty",
      connections: [], // Add missing property
      rotation: 0,
      revealed: true // Add missing property (assuming revealed)
    }
    setGrid(newGrid)

    // Add the tile back to inventory
    // Ensure inventory keys match TileType
    const inventoryKey = tileType as keyof typeof inventory;
    if (inventory[inventoryKey]) {
      setInventory({
        ...inventory,
        [inventoryKey]: {
          ...inventory[inventoryKey],
          count: inventory[inventoryKey].count + 1
        }
      });
    } else {
      console.warn(`Attempted to add unknown tile type back to inventory: ${tileType}`);
    }
    
    // Check if it was the first forest tile destroyed
    if (tileType === 'forest') {
      const { discoveredCreatures, discoverCreature } = useCreatureStore.getState();
      if (!discoveredCreatures.includes('001')) {
        discoverCreature('001');
      toast({
          title: "Creature Discovered!",
          description: "Your actions have awakened something... You've discovered creature #001!",
        });
      }
    }

    // Award experience for destroying tile
    if (inventory[inventoryKey]) { // Check again to prevent error if type was unknown
      toast({
        title: "Tile Destroyed",
        description: `You gained 5 experience for recycling a ${inventory[inventoryKey].name.toLowerCase()} tile.`,
        variant: "default",
        className: "scroll-toast"
      });
    } else {
      toast({
        title: "Tile Destroyed",
        description: `Recycled an unknown tile type. Gained 5 experience.`,
        variant: "default",
        className: "scroll-toast"
      });
    }
  }

  const addNewRow = () => {
    setRows(rows + 1)
    // Ensure the new empty tiles match the Tile interface
    const newRow: Tile[] = Array(GRID_COLS).fill(null).map((_, x) => ({
      id: `tile-${x}-${rows}`,
      type: "empty",
      connections: [], // Add missing property
            rotation: 0,
      revealed: true // Add missing property (assuming revealed)
    }))
    setGrid([...grid, newRow])
  }

  // Handle location visit
  const handleVisitLocation = () => {
    if (!currentLocation) return
    setShowLocationModal(false)
    
    // Route based on location type
    if (currentLocation.type === 'city') {
      router.push(`/city/${encodeURIComponent(currentLocation.name)}`)
    } else if (currentLocation.type === 'town') {
      const townSlug = currentLocation.name.toLowerCase().replace(/\s+/g, '-')
      router.push(`/town/${townSlug}`)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="flex-1">
        {/* Grid container */}
        <div className="relative">
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
                          <h3 className="font-semibold">{data.name}</h3>
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
              "relative w-full overflow-auto border rounded-lg bg-muted/20",
              isFullscreen ? "h-screen" : "h-[calc(100vh-300px)]"
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
                        src={inventory[tile.type].image}
                        alt={inventory[tile.type].name}
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
                    {x === characterPos.x && y === characterPos.y && (
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
                        {x === characterPos.x && y === characterPos.y && (
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
        </div>
      </div>
    </div>
  )
}


