"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import Image from "next/image"
import { useLocalStorage } from "@/lib/hooks/use-local-storage"
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
import { TileType, Tile, TileItem } from '@/types/tiles'
import { useCreatureStore } from "@/stores/creatureStore"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, Trash2 } from "lucide-react"
import { useCreatureUnlock } from "@/lib/hooks/use-creature-unlock"
import { MapGrid } from '../../components/map-grid'
import { TileInventory } from '@/components/tile-inventory'
import { Switch } from "@/components/ui/switch"
import { generateMysteryEventReward, getScrollById } from "@/lib/mystery-events"
import { toast } from 'sonner'
import { generateMysteryEvent, handleEventOutcome } from '@/lib/mystery-events'
import { MysteryEvent } from '@/lib/mystery-events'
import { MysteryEventType } from '@/lib/mystery-events'

// Types
interface Position {
  x: number
  y: number
}

interface InventoryItem {
  count: number;
  name: string;
  description: string;
  image: string;
  cost: number;
  type?: string;
  id?: string;
}

interface Inventory {
  [key: string]: InventoryItem;
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
const initialTileInventory: Inventory = {
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
    image: "/images/tiles/city-tile.png",
    cost: 50
  },
  town: { 
    count: 5, 
    name: "Town", 
    description: "Small settlement", 
    image: "/images/tiles/town-tile.png",
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
  const grid = Array(INITIAL_ROWS).fill(null).map((_, y) =>
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
        isVisited: false,
        x,
        y
      };
    })
  );
  return grid;
};

// Update type definitions
// Remove TileItem interface since we're importing it from @/types/tiles

export default function RealmPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { handleUnlock } = useCreatureUnlock()
  const gridRef = useRef<HTMLDivElement>(null)

  // State declarations
  const [inventory, setInventory] = useLocalStorage<Inventory>("tile-inventory", initialTileInventory)
  const [showScrollMessage, setShowScrollMessage] = useState(false)
  const [characterPosition, setCharacterPosition] = useLocalStorage<Position>("character-position", { x: 2, y: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedTile, setSelectedTile] = useState<TileItem | null>(null)
  const [grid, setGrid] = useState<Tile[][]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentEvent, setCurrentEvent] = useState<MysteryEvent | null>(null)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ type: string; name: string; description: string } | null>(null)
  const [showMinimap, setShowMinimap] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [movementMode, setMovementMode] = useState(true)
  const [hoveredTile, setHoveredTile] = useState<{ row: number; col: number } | null>(null)

  // Add tileCounts state
  const [tileCounts, setTileCounts] = useLocalStorage("tile-counts", {
    forestPlaced: 0,
    forestDestroyed: 0,
    waterPlaced: 0,
    mountainDestroyed: 0
  })

  // Add missing state declarations
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [achievementDetails, setAchievementDetails] = useState<{
    creatureName: string;
    requirement: string;
  } | null>(null);

  // Add showInventory state
  const [showInventory, setShowInventory] = useState(false);

  // Add eventDialogOpen state
  const [eventDialogOpen, setEventDialogOpen] = useState(false);

  // Handle fullscreen toggle
  const handleFullscreenToggle = (checked: boolean) => {
    setIsFullscreen(checked)
    const url = new URL(window.location.href)
    if (checked) {
      url.searchParams.set('fullscreen', 'true')
    } else {
      url.searchParams.delete('fullscreen')
    }
    window.history.replaceState({}, '', url.toString())
  }

  // Initialize grid on client side only
  useEffect(() => {
    if (!isInitialized) {
      const initialGrid = createInitialGrid()
      setGrid(initialGrid)
      setIsLoading(false)
      setIsInitialized(true)
    }
  }, [isInitialized])

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

  // Handle tile deletion
  const handleTileDelete = async (x: number, y: number, tileType: TileType) => {
    try {
      const newGrid = [...grid];
      // Create an empty tile
      newGrid[y][x] = {
        id: `tile-${x}-${y}`,
        type: 'empty',
        name: '',
        description: '',
            connections: [],
            rotation: 0,
            revealed: true,
        isVisited: false,
        x,
        y
      };
      setGrid(newGrid);

      // Return the tile to inventory
      setInventory({
        ...inventory,
        [tileType]: {
          ...inventory[tileType],
          count: (inventory[tileType]?.count || 0) + 1
        }
      });

      // Clear selection if the deleted tile was selected
      if (selectedTile?.type === tileType) {
        setSelectedTile(null);
      }

      // Track tile destruction and check for achievements
      if (tileType === 'forest') {
        const newForestCount = (tileCounts.forestDestroyed || 0) + 1;
        await setTileCounts(prev => ({ ...prev, forestDestroyed: newForestCount }));
        
        // Check forest destruction achievements (Fire creatures)
        let achievementUnlocked = null;
        if (newForestCount === 1) {
          await useCreatureStore.getState().discoverCreature('001');
          achievementUnlocked = { id: '001', name: 'First forest burned' };
        } else if (newForestCount === 5) {
          await useCreatureStore.getState().discoverCreature('002');
          achievementUnlocked = { id: '002', name: '5 forests burned' };
        } else if (newForestCount === 10) {
          await useCreatureStore.getState().discoverCreature('003');
          achievementUnlocked = { id: '003', name: '10 forests burned' };
        }

        // Show toast with achievement if unlocked
        toast({
          title: "Tile Removed",
          description: `The ${inventory[tileType]?.name || tileType} tile has been burned and returned to your inventory.${
            achievementUnlocked ? `\n🔥 Achievement Unlocked: ${achievementUnlocked.name}!` : ''
          }`,
          variant: "default"
        });

        if (achievementUnlocked) {
          await handleAchievementUnlock(achievementUnlocked.id, achievementUnlocked.name);
        }
      } else if (tileType === 'mountain') {
        const newMountainCount = (tileCounts.mountainDestroyed || 0) + 1;
        await setTileCounts(prev => ({ ...prev, mountainDestroyed: newMountainCount }));
        
        // Check mountain destruction achievements
        let achievementUnlocked = null;
        if (newMountainCount === 1) {
          await useCreatureStore.getState().discoverCreature('010');
          achievementUnlocked = { id: '010', name: 'First mountain destroyed' };
        } else if (newMountainCount === 5) {
          await useCreatureStore.getState().discoverCreature('011');
          achievementUnlocked = { id: '011', name: '5 mountains destroyed' };
        } else if (newMountainCount === 10) {
          await useCreatureStore.getState().discoverCreature('012');
          achievementUnlocked = { id: '012', name: '10 mountains destroyed' };
        }

        // Show toast with achievement if unlocked
        toast({
          title: "Tile Removed",
          description: `The ${inventory[tileType]?.name || tileType} tile has been removed and returned to your inventory.${
            achievementUnlocked ? `\n🏆 Achievement Unlocked: ${achievementUnlocked.name}!` : ''
          }`,
          variant: "default"
        });

        if (achievementUnlocked) {
          await handleAchievementUnlock(achievementUnlocked.id, achievementUnlocked.name);
        }
      } else {
        // Regular toast for other tile types
        toast({
          title: "Tile Removed",
          description: `The ${inventory[tileType]?.name || tileType} tile has been removed and returned to your inventory.`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error in handleTileDelete:', error);
      toast({
        title: "Error",
        description: "Failed to remove tile. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Add useEffect for first realm visit achievement
  useEffect(() => {
    const checkFirstVisit = async () => {
      const hasVisited = localStorage.getItem('has-visited-realm');
      if (!hasVisited) {
        await useCreatureStore.getState().discoverCreature('000');
        await handleAchievementUnlock('000', 'First time exploring the realm');
        localStorage.setItem('has-visited-realm', 'true');
      toast({
          title: "🧪 Achievement Unlocked!",
          description: "First time exploring the realm - Discovered a poisonous creature!",
          variant: "default"
        });
      }
    };
    checkFirstVisit();
  }, []);

  // Handle tile click
  const handleTileClick = async (x: number, y: number) => {
    const tile = grid[y]?.[x];
    if (!tile) return;

    if (tile.type === 'mystery' && !tile.isVisited) {
      const mysteryEvent = generateMysteryEvent();
      setCurrentEvent(mysteryEvent);
      
      // Mark tile as visited
      const newGrid = [...grid]
      newGrid[y][x] = {
        ...tile,
        isVisited: true
      }
      setGrid(newGrid)
    }

    try {
      if (x < 0 || y < 0 || y >= grid.length || x >= grid[0].length) return

      const clickedTile = grid[y][x]

      if (movementMode) {
        moveCharacter(x, y)
        if (clickedTile.type === "city" || clickedTile.type === "town") {
          const locationInfo = locationData[clickedTile.type]
          setCurrentLocation({
            type: clickedTile.type,
            name: locationInfo.name,
            description: locationInfo.description
          })
          setShowLocationModal(true)
        }
      } else {
        if (selectedTile && clickedTile.type === "empty") {
          if (inventory[selectedTile.type] && inventory[selectedTile.type].count > 0) {
            const newGrid = [...grid]
        newGrid[y][x] = {
              id: clickedTile.id,
              type: selectedTile.type,
              name: selectedTile.name || selectedTile.type,
              description: selectedTile.description || `${selectedTile.type} tile`,
              isVisited: false,
          connections: [],
          rotation: 0,
              revealed: true,
              x,
              y
            }
            setGrid(newGrid)
            setInventory({
              ...inventory,
              [selectedTile.type]: {
                ...inventory[selectedTile.type],
                count: inventory[selectedTile.type].count - 1
              }
            })

            // Track tile placement and check for achievements
            if (selectedTile.type === 'forest') {
              const newForestCount = (tileCounts.forestPlaced || 0) + 1
              await setTileCounts(prev => ({ ...prev, forestPlaced: newForestCount }))
              
              // Check forest placement achievements
              if (newForestCount === 1) {
                await useCreatureStore.getState().discoverCreature('007')
                await handleAchievementUnlock('007', 'First forest placed')
              } else if (newForestCount === 5) {
                await useCreatureStore.getState().discoverCreature('008')
                await handleAchievementUnlock('008', '5 forests placed')
              } else if (newForestCount === 10) {
                await useCreatureStore.getState().discoverCreature('009')
                await handleAchievementUnlock('009', '10 forests placed')
              }
            }
            else if (selectedTile.type === 'water') {
              const newWaterCount = (tileCounts.waterPlaced || 0) + 1
              await setTileCounts(prev => ({ ...prev, waterPlaced: newWaterCount }))
              
              // Check water placement achievements
              if (newWaterCount === 1) {
                await useCreatureStore.getState().discoverCreature('004')
                await handleAchievementUnlock('004', 'First water placed')
              } else if (newWaterCount === 5) {
                await useCreatureStore.getState().discoverCreature('005')
                await handleAchievementUnlock('005', '5 water tiles placed')
              } else if (newWaterCount === 10) {
                await useCreatureStore.getState().discoverCreature('006')
                await handleAchievementUnlock('006', '10 water tiles placed')
              }
            }

            toast({
              title: `Placed ${inventory[selectedTile.type].name}`,
              description: `Cost: ${inventory[selectedTile.type].cost} gold`,
              variant: "default"
            })
          } else {
            toast({
              title: "Out of Tiles",
              description: `You don't have any ${inventory[selectedTile.type]?.name || selectedTile.type} tiles left.`, 
              variant: "destructive"
            })
          }
        } else if (clickedTile.type !== "empty") {
          const tileInfo = inventory[clickedTile.type]
          setSelectedTile({
            id: clickedTile.id,
            type: clickedTile.type,
            name: tileInfo?.name || clickedTile.type,
            description: tileInfo?.description || `${clickedTile.type} tile`,
            connections: [],
            cost: tileInfo?.cost || 0,
            quantity: 1
          })
          toast({ 
            title: `Selected ${tileInfo?.name || clickedTile.type} tile`,
            description: "Click the delete icon to remove this tile",
            variant: "default"
          })
        }
      }
    } catch (error) {
      console.error('Error in handleTileClick:', error)
      toast({
        title: "Error",
        description: "Failed to process tile action. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Handle character movement
  const moveCharacter = useCallback((newX: number, newY: number) => {
    setCharacterPosition({ x: newX, y: newY })
  }, [setCharacterPosition])

  // Update handleAchievementUnlock to be async and handle state properly
  const handleAchievementUnlock = async (creatureId: string, requirement: string) => {
    try {
      const creatureStore = useCreatureStore.getState()
      const creature = creatureStore.creatures.find(c => c.id === creatureId)
      
      if (!creature) {
        console.error('Creature not found:', creatureId)
        return
      }

      console.log('Unlocking achievement for:', creature.name) // Debug log

      // Set achievement details and show modal
      setAchievementDetails({
        creatureName: creature.name,
        requirement: requirement
      })
      setShowAchievementModal(true)
    } catch (error) {
      console.error('Error in handleAchievementUnlock:', error)
    }
  }

  // Update the handleEventChoice function
  const handleEventChoice = async (choice: string) => {
    if (!currentEvent) return;

    const choiceIndex = currentEvent.choices.indexOf(choice);
    if (choiceIndex === -1) return;

    const outcome = currentEvent.outcomes[choiceIndex];
    if (!outcome) return;

    toast({
      title: 'Event Outcome',
      description: outcome.message
    });

    if (outcome.rewards) {
      const reward = outcome.rewards;
      switch (reward.type) {
        case 'gold':
          const newGold = Number(localStorage.getItem('gold') || '0') + reward.amount;
          localStorage.setItem('gold', newGold.toString());
          break;
        case 'experience':
          const newExp = Number(localStorage.getItem('experience') || '0') + reward.amount;
          localStorage.setItem('experience', newExp.toString());
          break;
        case 'scroll':
          const scroll = getScrollById(reward.scrollId);
          if (scroll) {
            const newInventory = { ...inventory };
            newInventory[scroll.id] = {
              id: scroll.id,
              type: 'scroll',
              name: scroll.name,
              description: scroll.content,
              image: '/images/scroll.png',
              cost: 100,
              count: 1
            };
            setInventory(newInventory);
            localStorage.setItem('inventory', JSON.stringify(newInventory));
            switch (scroll.category) {
              case 'might':
                handleAchievementUnlock('WARRIOR_SCROLL', 'Discovered Battle Sage!');
                break;
              case 'knowledge':
                handleAchievementUnlock('SCHOLAR_SCROLL', 'Discovered Scroll Keeper!');
                break;
              case 'exploration':
                handleAchievementUnlock('EXPLORER_SCROLL', 'Discovered Path Finder!');
                break;
              case 'social':
                handleAchievementUnlock('DIPLOMAT_SCROLL', 'Discovered Trade Master!');
                break;
              case 'crafting':
                handleAchievementUnlock('ARTISAN_SCROLL', 'Discovered Master Smith!');
                break;
            }
          }
          break;
        case 'artifact':
          const newArtifactInventory = { ...inventory };
          newArtifactInventory[reward.artifactId] = {
            id: reward.artifactId,
            type: 'artifact',
            name: 'Ancient Artifact',
            description: 'A mysterious artifact radiating with ancient power.',
            image: '/images/artifact.png',
            cost: 500,
            count: 1
          };
          setInventory(newArtifactInventory);
          localStorage.setItem('inventory', JSON.stringify(newArtifactInventory));
          handleAchievementUnlock('RELIC_GUARDIAN', 'Discovered Relic Guardian!');
          break;
        case 'book':
          const newBookInventory = { ...inventory };
          newBookInventory[reward.bookId] = {
            id: reward.bookId,
            type: 'book',
            name: 'Ancient Tome',
            description: 'A mysterious book filled with forgotten knowledge.',
            image: '/images/book.png',
            cost: 300,
            count: 1
          };
          setInventory(newBookInventory);
          localStorage.setItem('inventory', JSON.stringify(newBookInventory));
          handleAchievementUnlock('TOME_KEEPER', 'Discovered Tome Keeper!');
          break;
      }
    }

    // Mark the tile as visited
    const newGrid = [...grid];
    const { x, y } = characterPosition;
    if (newGrid[y]?.[x]) {
      newGrid[y][x] = { ...newGrid[y][x], isVisited: true };
      setGrid(newGrid);
      localStorage.setItem('grid', JSON.stringify(newGrid));
    }

    // Close the event dialog
    setCurrentEvent(null);
  };

  // Handle grid updates
  const handleGridUpdate = (newGrid: Tile[][]) => {
    setGrid(newGrid)
  }

  // Handle inventory updates
  const handleInventoryUpdate = (updatedTiles: any[]) => {
    const newInventory = { ...inventory }
    updatedTiles.forEach(tile => {
      if (newInventory[tile.type]) {
        newInventory[tile.type].count = tile.quantity
      }
    })
    setInventory(newInventory)
  }

  // Handle location visit
  const handleVisitLocation = () => {
    if (!currentLocation) return
    setShowLocationModal(false)
    
    // Route based on location type
    if (currentLocation.type === 'city') {
      router.push(`/city/${encodeURIComponent(locationData.city.name)}`)
    } else if (currentLocation.type === 'town') {
      const townSlug = locationData.town.name.toLowerCase().replace(/\s+/g, '-')
      router.push(`/town/${townSlug}`)
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

  // Handle keyboard navigation after handleTileClick is defined
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { x, y } = characterPosition
      let newX = x
      let newY = y
      
      switch (e.key) {
        case 'ArrowUp':
          if (y > 0) newY = y - 1
          break
        case 'ArrowDown':
          if (y < grid.length - 1) newY = y + 1
          break
        case 'ArrowLeft':
          if (x > 0) newX = x - 1
          break
        case 'ArrowRight':
          if (x < GRID_COLS - 1) newX = x + 1
          break
        default:
          return
      }

      // Check if the target tile is empty
      const targetTile = grid[newY][newX]
      if (targetTile.type === 'empty') {
    toast({
          title: "Cannot Move",
          description: "You cannot move onto an empty tile!",
          variant: "destructive"
        })
        return
      }

      // Only proceed if we're actually moving
      if (newX !== x || newY !== y) {
        // First move the character
        moveCharacter(newX, newY)
        
        // Then handle tile interaction
        const clickedTile = grid[newY][newX]
        if (movementMode) {
          if (clickedTile.type === "city" || clickedTile.type === "town") {
            const locationInfo = locationData[clickedTile.type]
            setCurrentLocation({
              type: clickedTile.type,
              name: locationInfo.name,
              description: locationInfo.description
            })
            setShowLocationModal(true)
          } else if (clickedTile.type === "mystery" && !clickedTile.isVisited) {
            const mysteryEvent = generateMysteryEvent();
            setCurrentEvent(mysteryEvent);
            
            // Mark tile as visited
            const newGrid = [...grid]
            newGrid[newY][newX] = {
              ...clickedTile,
              isVisited: true
            }
            setGrid(newGrid)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [characterPosition, grid, moveCharacter, GRID_COLS, movementMode, toast])

  // Show scroll message
  useEffect(() => {
    if (showScrollMessage) {
      toast({
        title: "Scroll to explore more!",
        description: "Keep scrolling down to reveal more of the map."
      })
    }
  }, [showScrollMessage, toast])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'b' && !event.repeat && !currentEvent) {
        setMovementMode(false)
      } else if (event.key === 'm' && !event.repeat && !currentEvent) {
        setMovementMode(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentEvent])

  const handleReset = () => {
    // Reset grid to initial state
    const initialGrid = createInitialGrid()
    setGrid(initialGrid)
    
    // Reset character position to starting position
    setCharacterPosition({ x: 2, y: 0 })
    
    // Reset tile counts
    setTileCounts({
      forestPlaced: 0,
      forestDestroyed: 0,
      waterPlaced: 0,
      mountainDestroyed: 0
    })
    
    // Reset inventory to initial state
    setInventory(initialTileInventory)
    
    // Show confirmation toast
      toast({
      title: "Reset Complete",
      description: "Map and counters have been reset to their initial state.",
    })
  }

  const handleHoverTile = (x: number, y: number) => {
    setHoveredTile({ row: y, col: x });
  };

  const handleTileSelection = (tile: TileItem | null) => {
    if (!tile) {
      setSelectedTile(null);
      return;
    }
    
    setSelectedTile(tile);
  };

  // Handle inventory toggle
  const toggleInventory = useCallback(() => {
    setShowInventory((prev) => {
      const newValue = !prev;
      if (newValue) {
        // Switch to build mode when opening inventory
        setMovementMode(false);
      }
      return newValue;
    });
  }, []);

  // Add keyboard shortcut handler
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'i' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        // Only trigger if the user is not typing in an input field
        if (!(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)) {
          toggleInventory();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [toggleInventory]);

  if (isLoading) {
  return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-cardo text-primary">Loading realm...</p>
        </div>
      </div>
    )
  }

    return (
    <div className="relative min-h-screen bg-background p-4">
      {/* Controls Bar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="default"
              onClick={() => setMovementMode(!movementMode)}
            >
              {movementMode ? "Switch to Build Mode" : "Switch to Movement Mode"}
            </Button>
            <span className="text-sm font-medium">
              {movementMode ? "Movement Mode" : "Build Mode"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={showInventory}
              onCheckedChange={toggleInventory}
              id="inventory-switch"
            />
            <label
              htmlFor="inventory-switch"
              className="text-sm font-medium cursor-pointer select-none"
            >
              Inventory (press 'i')
            </label>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-5 w-5" />
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleFullscreenToggle(!isFullscreen)}>
                {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleReset}>
                Reset Map
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>

      {/* Main Content */}
      <div className="flex gap-4">
        {/* Map Grid */}
        <div className="flex-1">
                <MapGrid
                  grid={grid}
            character={characterPosition}
            onCharacterMove={moveCharacter}
            onTileClick={handleTileClick}
            selectedTile={selectedTile ? {
              id: selectedTile.id,
              type: selectedTile.type,
              name: selectedTile.name || selectedTile.type,
              description: selectedTile.description || `${selectedTile.type} tile`,
              connections: selectedTile.connections,
              rotation: 0,
              revealed: true,
              isVisited: false,
              x: 0,
              y: 0
            } : null}
            onGridUpdate={handleGridUpdate}
            isMovementMode={movementMode}
            onDiscovery={(message) => {
                    toast({
                title: "Discovery",
                description: message
              });
            }}
            onTilePlaced={(tile) => {
              // Handle tile placement
            }}
            onGoldUpdate={(amount) => {
              // Handle gold update
            }}
            onHover={handleHoverTile}
                  onHoverEnd={() => setHoveredTile(null)}
                  hoveredTile={hoveredTile}
            zoomLevel={zoomLevel}
            onDeleteTile={(x, y) => {
              const tileType = grid[y][x].type;
              handleTileDelete(x, y, tileType);
            }}
          />
                </div>
          </div>

      {/* Tile Inventory Slide-over */}
      <Sheet open={showInventory} onOpenChange={setShowInventory}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0">
          <div className="h-full bg-background">
            <TileInventory
              tiles={Object.entries(inventory).map(([type, item]) => ({
                id: `inventory-${type}`,
                type: type as TileType,
                name: item.name || type,
                description: item.description || `${type} tile`,
                connections: [],
                cost: item.cost,
                quantity: item.count
              }))}
              selectedTile={selectedTile}
              onSelectTile={handleTileSelection}
              onUpdateTiles={handleInventoryUpdate}
            />
              </div>
        </SheetContent>
      </Sheet>

      {/* Event Dialog */}
      {currentEvent && (
        <Dialog open={true} onOpenChange={() => setCurrentEvent(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{currentEvent.title}</DialogTitle>
              <DialogDescription>{currentEvent.description}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              {currentEvent.choices.map((choice: string, index: number) => (
            <Button
                  key={index}
                  variant={index === 0 ? "default" : "secondary"}
                  onClick={() => handleEventChoice(choice)}
                >
                  {choice}
              </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Location Dialog */}
      {showLocationModal && currentLocation && (
        <Dialog open={true} onOpenChange={() => setShowLocationModal(false)}>
          <DialogContent>
          <DialogHeader>
              <DialogTitle>{currentLocation.name}</DialogTitle>
              <DialogDescription>{currentLocation.description}</DialogDescription>
          </DialogHeader>
            <DialogFooter>
              <Button onClick={handleVisitLocation}>Visit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}
    </div>
  )
}


