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

// Types
interface Position {
  x: number
  y: number
}

interface Tile {
  id: string
  type: string
  rotation: number
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

export default function RealmPage() {
  // State
  const [grid, setGrid] = useState<Tile[][]>([])
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

  // Initialize grid
  useEffect(() => {
    const savedGrid = localStorage.getItem("realm-grid")
    if (savedGrid) {
      setGrid(JSON.parse(savedGrid))
    } else {
      const newGrid = Array(rows).fill(null).map((_, y) => 
        Array(GRID_COLS).fill(null).map((_, x) => ({
          id: `tile-${x}-${y}`,
          type: "empty",
          rotation: 0
        }))
      )

      // Foundation setup - Note: Arrays are 0-based, so we subtract 1 from the given coordinates
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
        { y: 2, x: 0, type: "mountain" }, { y: 2, x: 1, type: "grass" }, { y: 2, x: 2, type: "forest" },
        { y: 2, x: 3, type: "forest" }, { y: 2, x: 4, type: "forest" }, { y: 2, x: 5, type: "grass" },
        { y: 2, x: 6, type: "forest" }, { y: 2, x: 7, type: "forest" }, { y: 2, x: 8, type: "grass" },
        { y: 2, x: 9, type: "forest" }, { y: 2, x: 10, type: "forest" }, { y: 2, x: 11, type: "mountain" },
        // Row 4
        { y: 3, x: 0, type: "mountain" }, { y: 3, x: 1, type: "grass" }, { y: 3, x: 2, type: "forest" },
        { y: 3, x: 3, type: "forest" }, { y: 3, x: 4, type: "forest" }, { y: 3, x: 5, type: "water" },
        { y: 3, x: 6, type: "water" }, { y: 3, x: 7, type: "water" }, { y: 3, x: 8, type: "water" },
        { y: 3, x: 9, type: "water" }, { y: 3, x: 10, type: "forest" }, { y: 3, x: 11, type: "mountain" },
        // Row 5
        { y: 4, x: 0, type: "mountain" }, { y: 4, x: 1, type: "grass" }, { y: 4, x: 2, type: "grass" },
        { y: 4, x: 3, type: "city" }, { y: 4, x: 4, type: "forest" }, { y: 4, x: 5, type: "water" },
        { y: 4, x: 6, type: "water" }, { y: 4, x: 7, type: "water" }, { y: 4, x: 8, type: "water" },
        { y: 4, x: 9, type: "water" }, { y: 4, x: 10, type: "forest" }, { y: 4, x: 11, type: "mountain" }
      ]

      // Apply foundation setup
      foundation.forEach(({ x, y, type }) => {
        newGrid[y][x] = {
          id: `tile-${x}-${y}`,
          type,
          rotation: 0
        }
      })

      setGrid(newGrid)
    }
  }, [rows])

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
    if (buildMode) {
      if (!selectedTile || inventory[selectedTile].count <= 0) return
      
      const newGrid = [...grid]
      newGrid[y][x] = {
        id: `tile-${x}-${y}`,
        type: selectedTile,
        rotation: 0
      }
      setGrid(newGrid)

      setInventory({
        ...inventory,
        [selectedTile]: {
          ...inventory[selectedTile],
          count: inventory[selectedTile].count - 1
        }
      })

      toast({
        title: "Tile Placed",
        description: `A ${inventory[selectedTile].name.toLowerCase()} tile has been placed in your realm, ${getCharacterName()}.`,
        variant: "default",
        className: "scroll-toast"
      })
    } else {
      // Move mode - handle character movement on click
      if (grid[y][x].type === "mountain" || 
          grid[y][x].type === "water" || 
          grid[y][x].type === "empty") return
      moveCharacter(x, y)
    }
  }

  // Handle tile destruction
  const handleDestroyTile = (x: number, y: number) => {
    const tileType = grid[y][x].type
    if (tileType === "empty") return

    const newGrid = [...grid]
    newGrid[y][x] = {
      id: `tile-${x}-${y}`,
      type: "empty",
      rotation: 0
    }
    setGrid(newGrid)

    // Add the tile back to inventory
    setInventory({
      ...inventory,
      [tileType]: {
        ...inventory[tileType],
        count: inventory[tileType].count + 1
      }
    })

    // Award experience for destroying tile
    toast({
      title: "Tile Destroyed",
      description: `You gained 5 experience for recycling a ${inventory[tileType].name.toLowerCase()} tile.`,
      variant: "default",
      className: "scroll-toast"
    })
  }

  const addNewRow = () => {
    setRows(rows + 1)
    const newRow = Array(GRID_COLS).fill(null).map((_, x) => ({
      id: `tile-${x}-${rows}`,
      type: "empty",
      rotation: 0
    }))
    setGrid([...grid, newRow])
  }

  // Handle location visit
  const handleVisitLocation = () => {
    if (!currentLocation) return
    setShowLocationModal(false)
    router.push(`/locations/${locationData[currentLocation.type as keyof typeof locationData].locationId}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {!isFullscreen && (
        <>
          <div className="relative w-full h-48 overflow-hidden">
            <Image
              src="/images/realm-header.jpg"
              alt="Realm header"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
          </div>
          <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <nav className="container flex h-14 max-w-screen-2xl items-center">
              {/* Your navigation items */}
            </nav>
          </div>
        </>
      )}

      {/* Main content */}
      <div className={cn(
        "container mx-auto px-4 py-8",
        isFullscreen && "fixed inset-0 p-0"
      )}>
        {/* Controls */}
        <div className={cn(
          "flex items-center justify-between mb-6",
          isFullscreen && "absolute top-4 left-4 right-4 z-10 mb-0 bg-background/80 backdrop-blur rounded-lg p-4"
        )}>
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Tile Inventory</Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px]">
                <ScrollArea className="h-full">
                  <div className="grid gap-4 p-4">
                    {Object.entries(inventory).map(([type, data]) => (
                      <Card
                        key={type}
                        className={cn(
                          "p-4 cursor-pointer transition-colors",
                          selectedTile === type && "border-primary",
                          !buildMode && "opacity-50 pointer-events-none"
                        )}
                        onClick={() => buildMode && setSelectedTile(type)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 relative">
                            <Image
                              src={data.image}
                              alt={data.name}
                              fill
                              className="object-contain"
                            />
                          </div>
                          <div>
                            <h3 className="font-medium">{data.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {data.count} available
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={showMinimap}
                  onCheckedChange={setShowMinimap}
                />
                <span className="text-sm">Show Minimap</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={buildMode}
                  onCheckedChange={setBuildMode}
                />
                <span className="text-sm">Build Mode</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={isFullscreen}
                  onCheckedChange={handleFullscreenToggle}
                />
                <span className="text-sm">Fullscreen</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {ZOOM_LEVELS.map(level => (
              <Button
                key={level}
                variant={zoomLevel === level ? "default" : "outline"}
                onClick={() => setZoomLevel(level)}
                className="w-12"
              >
                {level}x
              </Button>
            ))}
          </div>
        </div>

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
  )
}


