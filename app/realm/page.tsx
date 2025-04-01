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

export default function RealmPage() {
  // State
  const [grid, setGrid] = useState<Tile[][]>([])
  const [rows, setRows] = useState(INITIAL_ROWS)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [showMinimap, setShowMinimap] = useState(false)
  const [characterPos, setCharacterPos] = useLocalStorage<Position>("character-position", { x: 1, y: 1 })
  const [inventory, setInventory] = useLocalStorage<TileInventory>("tile-inventory", initialTileInventory)
  const [selectedTile, setSelectedTile] = useState<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

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
    if (grid[newY][newX].type === "mountain") return // Can't move to mountains

    setCharacterPos({ x: newX, y: newY })
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
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
                          selectedTile === type && "border-primary"
                        )}
                        onClick={() => setSelectedTile(type)}
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
            <div className="flex items-center gap-2">
              <Switch
                checked={showMinimap}
                onCheckedChange={setShowMinimap}
              />
              <span className="text-sm">Show Minimap</span>
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
          className="relative w-full overflow-auto border rounded-lg bg-muted/20"
          style={{
            height: "calc(100vh - 300px)",
          }}
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
                    "aspect-square relative cursor-pointer",
                    "hover:bg-primary/20 transition-colors",
                    tile.type !== "empty" && "bg-secondary"
                  )}
                  onClick={() => handleTileClick(x, y)}
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
                    <Avatar className="absolute inset-0 m-auto w-3/4 h-3/4" />
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
              {/* Minimap content */}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


