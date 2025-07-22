"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HeaderSection } from "@/components/HeaderSection"
import { defaultInventoryItems } from "@/app/lib/default-inventory"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogAction } from "@/components/ui/alert-dialog"
import { 
  getKingdomInventory, 
  getEquippedItems, 
  getStoredItems, 
  equipItem, 
  unequipItem,
  getTotalStats,
  type InventoryItem 
} from "@/lib/inventory-manager"
import { getUserPreference, setUserPreference } from '@/lib/user-preferences-manager';
import type { InventoryItem as DefaultInventoryItem } from "@/app/lib/default-inventory"
import type { InventoryItem as ManagerInventoryItem } from "@/lib/inventory-manager"
import { KingdomStatsBlock, KingStatsBlock } from "@/components/kingdom-stats-graph";
import { KingdomGrid } from '@/components/kingdom-grid';
import { KingdomPropertiesInventory } from '@/components/kingdom-properties-inventory';
import type { Tile, TileType, ConnectionDirection } from '@/types/tiles';

type KingdomInventoryItem = (DefaultInventoryItem | ManagerInventoryItem) & { 
  stats?: Record<string, number>, 
  description?: string,
  category?: string 
}

interface WindowWithHeaderImages extends Window {
  headerImages?: Record<string, string>;
}

// Perk mapping for potions
const potionPerkMap: Record<string, { name: string; perks: { name: string; effect: string }[] }> = {
  "elixir of strength": {
    name: "Elixir of Strength",
    perks: [
      { name: "Might Mastery", effect: "+10% XP & gold from Might activities per level" },
      { name: "Vitality Sage", effect: "+10% XP & gold from Vitality activities per level" },
    ],
  },
  "elixir of wisdom": {
    name: "Elixir of Wisdom",
    perks: [
      { name: "Knowledge Seeker", effect: "+10% XP & gold from Knowledge activities per level" },
      { name: "Honor Guard", effect: "+10% XP & gold from Honor activities per level" },
    ],
  },
  "elixir of fortitude": {
    name: "Elixir of Fortitude",
    perks: [
      { name: "Castle Steward", effect: "+10% XP & gold from Castle activities per level" },
      { name: "Craft Artisan", effect: "+10% XP & gold from Craft activities per level" },
    ],
  },
}

function getRandomFromArray<T>(arr: T[]): T {
  if (arr.length === 0) throw new Error('Array is empty');
  return arr[Math.floor(Math.random() * arr.length)]!;
}

const getConsumableEffect = (item: KingdomInventoryItem) => {
  // Artifacts: 60, 80, or 100 gold
  if (item.type === 'artifact') {
    const gold = getRandomFromArray([60, 80, 100])
    // Update gold in localStorage
    const stats = JSON.parse(localStorage.getItem('character-stats') || '{"gold":0}')
    stats.gold = (stats.gold || 0) + gold
    localStorage.setItem('character-stats', JSON.stringify(stats))
    return `You used an artifact and gained ${gold} gold!`
  }
  // Scrolls: 10, 25, or 50 gold
  if (item.type === 'scroll') {
    const gold = getRandomFromArray([10, 25, 50])
    const stats = JSON.parse(localStorage.getItem('character-stats') || '{"gold":0}')
    stats.gold = (stats.gold || 0) + gold
    localStorage.setItem('character-stats', JSON.stringify(stats))
    return `You used a scroll and gained ${gold} gold!`
  }
  // Potions: handle each potion type explicitly
  if (item.type === 'item' && item.name) {
    const key = item.name.toLowerCase();
    if (key === 'health potion') {
      // Restore health (if tracked) or show a toast
      // (Assume health is tracked in character-stats)
      const stats = JSON.parse(localStorage.getItem('character-stats') || '{"health":100}')
      stats.health = Math.min((stats.health || 100) + 50, 100)
      localStorage.setItem('character-stats', JSON.stringify(stats))
      return `You used a Health Potion and restored 50 health!`;
    }
    if (key === 'gold potion') {
      const stats = JSON.parse(localStorage.getItem('character-stats') || '{"gold":0}')
      stats.gold = (stats.gold || 0) + 50
      localStorage.setItem('character-stats', JSON.stringify(stats))
      return `You used a Gold Potion and gained 50 gold!`;
    }
    if (key === 'experience potion' || key === 'exp potion') {
      const stats = JSON.parse(localStorage.getItem('character-stats') || '{"experience":0}')
      stats.experience = (stats.experience || 0) + 50
      localStorage.setItem('character-stats', JSON.stringify(stats))
      return `You used an Experience Potion and gained 50 XP!`;
    }
    // Other potions: use perk logic
    if (potionPerkMap[key]) {
      const perk = getRandomFromArray(potionPerkMap[key].perks)
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const activePerks = JSON.parse(localStorage.getItem('active-potion-perks') || '{}')
      activePerks[perk.name] = { effect: perk.effect, expiresAt: expiresAt.toISOString() }
      localStorage.setItem('active-potion-perks', JSON.stringify(activePerks))
      return `You used a ${item.name}! The perk "${perk.name}" is now active for 24 hours: ${perk.effect}`
    }
  }
  return `You used ${item.name}!`
}

// Helper to get fallback image path (copy logic from getItemImagePath in city location page)
function getItemImagePath(item: KingdomInventoryItem): string {
  if (item.image) return item.image;
  if (item.name === "Iron Sword") return "/images/items/sword/sword-irony.png";
  if (item.name === "Steel Sword") return "/images/items/sword/sword-sunblade.png";
  if (item.name === "Health Potion") return "/images/items/potion/potion-health.png";
  if (item.name === "Mana Potion") return "/images/items/potion/potion-exp.png";
  if (item.name === "Gold Potion") return "/images/items/potion/potion-gold.png";
  if (item.name === "Leather Armor") return "/images/items/armor/armor-normalo.png";
  if (item.name === "Chain Mail") return "/images/items/armor/armor-darko.png";
  if (item.name === "Plate Armor") return "/images/items/armor/armor-blanko.png";
  if (item.name === "Wooden Shield") return "/images/items/shield/shield-defecto.png";
  if (item.name === "Iron Shield") return "/images/items/shield/shield-blockado.png";
  if (item.name === "Steel Shield") return "/images/items/shield/shield-reflecto.png";
  if (item.name === "Sally Swift Horse") return "/images/items/horse/horse-stelony.png";
  if (item.name === "Buster Endurance Horse") return "/images/items/horse/horse-perony.png";
  if (item.name === "Shadow War Horse") return "/images/items/horse/horse-felony.png";
  if (item.name === "Crown") return "/images/items/artifact/crown/artifact-crowny.png";
  if (item.name === "Ring") return "/images/items/artifact/ring/artifact-ringo.png";
  if (item.name === "Scepter") return "/images/items/artifact/scepter/artifact-staffy.png";
  if (item.name === "Scroll of Memory") return "/images/items/scroll/scroll-memento.png";
  if (item.name === "Scroll of Perkament") return "/images/items/scroll/scroll-perkamento.png";
  if (item.name === "Scroll of Scrolly") return "/images/items/scroll/scroll-scrolly.png";
  if (item.name === "Tome of Knowledge") return "/images/items/scroll/scroll-perkamento.png";
  if (item.name === "Magic Scroll") return "/images/items/scroll/scroll-scrolly.png";
  // Fallback
  return "/images/items/placeholder.jpg";
}

// Helper to determine if an item is equippable
function isEquippable(item: KingdomInventoryItem): boolean {
  // Only allow equipment, creature (mount), or items with a category (e.g., weapon, shield, armor)
  if (item.type === 'equipment' || item.type === 'creature') return true;
  if (item.category && ['weapon', 'shield', 'armor', 'mount'].includes(item.category)) return true;
  return false;
}

// Helper to create an empty kingdom grid
function createEmptyKingdomGrid(): Tile[][] {
  const KINGDOM_GRID_ROWS = 6;
  const KINGDOM_GRID_COLS = 6;
  const VACANT_TILE_IMAGE = '/images/kingdom-tiles/Vacant.png';
  return Array.from({ length: KINGDOM_GRID_ROWS }, (_, y) =>
    Array.from({ length: KINGDOM_GRID_COLS }, (_, x) => ({
      id: `vacant-${x}-${y}`,
      type: 'empty' as TileType,
      name: 'Vacant',
      description: 'An empty plot of land.',
      connections: [] as ConnectionDirection[],
      rotation: 0,
      revealed: true,
      isVisited: false,
      x,
      y,
      ariaLabel: `Vacant tile at ${x},${y}`,
      image: VACANT_TILE_IMAGE,
    }))
  );
}

// Helper to get the kingdom tile inventory with build tokens
function getKingdomTileInventoryWithBuildTokens(): Tile[] {
  const KINGDOM_TILE_IMAGES = [
    'Archery.png', 'Blacksmith.png', 'Castle.png', 'Fisherman.png', 'Foodcourt.png', 'Fountain.png', 'Grocery.png', 'House.png', 'Inn.png', 'Jousting.png', 'Mansion.png', 'Mayor.png', 'Pond.png', 'Sawmill.png', 'Temple.png', 'Vegetables.png', 'Watchtower.png', 'Well.png', 'Windmill.png', 'Wizard.png'
  ];
  return KINGDOM_TILE_IMAGES.map((filename, idx) => {
    const isCastle = filename === 'Castle.png';
    return {
      id: `kingdom-tile-${idx}`,
      type: 'special' as TileType,
      name: filename.replace('.png', ''),
      description: `A special kingdom tile: ${filename.replace('.png', '')}`,
      connections: [] as ConnectionDirection[],
      rotation: 0,
      revealed: true,
      isVisited: false,
      x: 0,
      y: 0,
      ariaLabel: `Kingdom tile: ${filename.replace('.png', '')}`,
      image: `/images/kingdom-tiles/${filename}`,
      cost: isCastle ? 0 : Math.floor(Math.random() * 3) + 1, // 1-3 build tokens
      quantity: isCastle ? 1 : 0,
    };
  });
}

export function KingdomClient({ userId }: { userId: string | null }) {
  const [coverImage, setCoverImage] = useState<string | undefined>(undefined);
  const [equippedItems, setEquippedItems] = useState<KingdomInventoryItem[]>([]);
  const [storedItems, setStoredItems] = useState<KingdomInventoryItem[]>([]);
  const [totalStats, setTotalStats] = useState<{ movement: number; attack: number; defense: number }>({ movement: 0, attack: 0, defense: 0 });
  const [modalOpen, setModalOpen] = useState(false)
  const [modalText, setModalText] = useState("")
  const [activeTab, setActiveTab] = useState("equipped")
  const [kingdomTab, setKingdomTab] = useState("thrivehaven");
  const [kingdomGrid, setKingdomGrid] = useState<Tile[][]>(createEmptyKingdomGrid());
  const [selectedKingdomTile, setSelectedKingdomTile] = useState<Tile | null>(null);
  const kingdomTileInventory = getKingdomTileInventoryWithBuildTokens();
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [showEntrance, setShowEntrance] = useState(true);
  const [zoomed, setZoomed] = useState(false);
  const [moveUp, setMoveUp] = useState(false);
  const [kingdomReady, setKingdomReady] = useState(false);
  const [kingdomContent, setKingdomContent] = useState<JSX.Element | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [coverImageLoading, setCoverImageLoading] = useState(true);

  // Helper to determine if an item is consumable
  const isConsumable = (item: KingdomInventoryItem) => {
    return item.type === 'artifact' || item.type === 'scroll' || (item.type === 'item' && !item.category);
  };

  // Handler for equipping items
  const handleEquip = (item: KingdomInventoryItem) => {
    // For consumables, show modal
    if (item.type === 'artifact' || item.type === 'scroll' || (item.type === 'item' && !item.category)) {
      setModalText(getConsumableEffect(item));
      setModalOpen(true);
    }
    if (userId) equipItem(userId, item.id);
  };

  // Handler for unequipping items
  const handleUnequip = (item: KingdomInventoryItem) => {
    if (userId) unequipItem(userId, item.id);
  };

  // Restore handlePlaceKingdomTile for KingdomGrid
  function handlePlaceKingdomTile(x: number, y: number, tile: Tile) {
    setKingdomGrid(prev => {
      const newGrid = prev.map(row => row.slice());
      if (newGrid[y]) {
        newGrid[y][x] = { ...tile, x, y, id: `${tile.id}-${x}-${y}` };
      }
      return newGrid;
    });
    
    // Save the updated grid
    const updatedGrid = kingdomGrid.map(row => row.slice());
    if (updatedGrid[y]) {
      updatedGrid[y][x] = { ...tile, x, y, id: `${tile.id}-${x}-${y}` };
    }
    
    // Save to API
    fetch('/api/kingdom-grid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grid: updatedGrid })
    }).catch(error => {
      console.error('Failed to save kingdom grid:', error);
    });
  }

  // Restore renderItemCard for inventory display
  const renderItemCard = (item: KingdomInventoryItem, isEquipped: boolean = false) => (
    <Card 
      key={item.id} 
      className={`bg-black/60 border-2 border-amber-500 rounded-xl shadow-lg transition-all duration-200 ${isEquipped ? 'ring-2 ring-amber-500' : ''}`}
      aria-label={`inventory-item-${item.id}`}
    >
      <CardHeader className="p-4">
        <div 
          className="flex flex-col items-center justify-center space-y-2"
          aria-label={`item-header-${item.id}`}
        >
          <div className="w-full aspect-[4/3] relative mb-2">
            <Image
              src={getItemImagePath(item)}
              alt={`${item.name} ${item.type}`}
              fill
              className="object-contain rounded"
              aria-label={`${item.name}-image`}
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => { (e.target as HTMLImageElement).src = "/images/items/placeholder.jpg"; }}
            />
          </div>
          <div className="flex flex-col items-center">
            <h4 className="text-amber-500 font-semibold text-lg">{item.name}</h4>
            <p className="text-xs text-gray-400">{item.type}</p>
            {item.category && (
              <p className="text-xs text-amber-400">{item.category}</p>
            )}
          </div>
        </div>
        {Object.entries(item.stats ?? {}).map(([stat, value]) => (
          <Badge key={stat} className="bg-amber-950/30 text-amber-500 border-amber-800/30 mt-2">
            {stat} +{value}
          </Badge>
        ))}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-gray-400 mb-3">{item.description}</p>
        <div className="flex justify-between items-center">
          {/* Only show quantity for consumables */}
          {isConsumable(item) ? (
            <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
          ) : <span />}
          <Button
            size="sm"
            variant={isEquipped ? "destructive" : isConsumable(item) ? "default" : "default"}
            onClick={() => isEquipped ? handleUnequip(item) : (isEquippable(item) ? handleEquip(item) : undefined)}
            aria-label={
              isEquipped
                ? `Unequip ${item.name}`
                : isConsumable(item)
                  ? `Use ${item.name}`
                  : isEquippable(item)
                    ? `Equip ${item.name}`
                    : undefined
            }
            disabled={!isEquippable(item) && !isConsumable(item)}
          >
            {isEquipped
              ? "Unequip"
              : isConsumable(item)
                ? "Use"
                : isEquippable(item)
                  ? "Equip"
                  : null}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // All useEffect hooks at the top
  useEffect(() => {
    setShowEntrance(true);
    setZoomed(false);
    setMoveUp(false);
    // Linger for 2s, then start zoom (3.5s duration)
    const zoomTimeout = setTimeout(() => setZoomed(true), 2000);
    // Start move up at 2s (3s duration) - 0.5s earlier
    const moveUpTimeout = setTimeout(() => setMoveUp(true), 2000);
    // Hide overlay and show main content after animation completes (5.5s)
    const hideTimeout = setTimeout(() => setShowEntrance(false), 5500);
    return () => {
      clearTimeout(zoomTimeout);
      clearTimeout(moveUpTimeout);
      clearTimeout(hideTimeout);
    };
  }, []);

  // Load kingdom grid on mount
  useEffect(() => {
    if (!userId) return;
    
    const loadKingdomGrid = async () => {
      try {
        const response = await fetch('/api/kingdom-grid');
        if (response.ok) {
          const data = await response.json();
          if (data.grid) {
            setKingdomGrid(data.grid);
          }
        }
      } catch (error) {
        console.error('Failed to load kingdom grid:', error);
      }
    };

    loadKingdomGrid();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    setInventoryLoading(true);
    const loadInventory = async () => {
      try {
        console.log('[Kingdom] Loading inventory for user:', userId);
        const equipped = await getEquippedItems(userId);
        const stored = await getStoredItems(userId);
        const stats = await getTotalStats(userId);
        
        // Normalize items to always have a 'stats' property and description
        const normalizeItems = (items: any[]) => items.map(item => ({
          ...item,
          stats: (item as any).stats || {},
          description: (item as any).description || '',
        }) as KingdomInventoryItem);
        
        let equippedItemsToShow = normalizeItems(equipped.filter(isEquippable));
        
        // 🎯 SHOW DEFAULT ITEMS if no items are equipped
        if (equippedItemsToShow.length === 0) {
          console.log('[Kingdom] No equipped items found, showing default items');
          equippedItemsToShow = defaultInventoryItems.map(item => ({
            ...item,
            stats: item.stats || {},
            description: item.description || '',
            equipped: true,
            type: item.type as any, // Convert to compatible type
            category: item.type,
          })) as KingdomInventoryItem[];
        }
        
        setEquippedItems(equippedItemsToShow);
        setStoredItems(normalizeItems(stored));
        
        // 🎯 CALCULATE STATS from equipped items (including defaults)
        const calculatedStats = equippedItemsToShow.reduce(
          (totals, item) => {
            const itemStats = item.stats || {};
            return {
              movement: totals.movement + (itemStats.movement || 0),
              attack: totals.attack + (itemStats.attack || 0),
              defense: totals.defense + (itemStats.defense || 0),
            };
          },
          { movement: 0, attack: 0, defense: 0 }
        );
        
        setTotalStats(calculatedStats);
        console.log('[Kingdom] Successfully loaded inventory with stats:', calculatedStats);
      } catch (error) {
        console.error('[Kingdom] Error loading inventory:', error);
        // Show default items on error too
        const defaultItems = defaultInventoryItems.map(item => ({
          ...item,
          stats: item.stats || {},
          description: item.description || '',
          equipped: true,
          type: item.type as any,
          category: item.type,
        })) as KingdomInventoryItem[];
        setEquippedItems(defaultItems);
        setStoredItems([]);
        
        // Calculate stats from default items
        const defaultStats = defaultItems.reduce(
          (totals, item) => {
            const itemStats = item.stats || {};
            return {
              movement: totals.movement + (itemStats.movement || 0),
              attack: totals.attack + (itemStats.attack || 0),
              defense: totals.defense + (itemStats.defense || 0),
            };
          },
          { movement: 0, attack: 0, defense: 0 }
        );
        setTotalStats(defaultStats);
      } finally {
        setInventoryLoading(false);
      }
    };
    
    loadInventory();
    
    const handleInventoryUpdate = () => {
      // Only reload if not currently loading to prevent rapid fire requests
      if (!document.querySelector('[data-inventory-loading="true"]')) {
        loadInventory();
      }
    };
    
    window.addEventListener('character-inventory-update', handleInventoryUpdate);
    
    // 🎯 LISTEN FOR QUEST COMPLETION GOLD/XP UPDATES
    const handleGoldUpdate = (event: CustomEvent) => {
      console.log('[Kingdom] Gold gained from quest:', event.detail);
      // Force refresh kingdom stats when gold is gained
      loadInventory();
    };
    
    const handleXPUpdate = (event: CustomEvent) => {
      console.log('[Kingdom] XP gained from quest:', event.detail);
      // Force refresh kingdom stats when XP is gained  
      loadInventory();
    };
    
    window.addEventListener('kingdom:goldGained', handleGoldUpdate as EventListener);
    window.addEventListener('kingdom:experienceGained', handleXPUpdate as EventListener);
    window.addEventListener('character-stats-update', handleInventoryUpdate);
    
    return () => {
      window.removeEventListener('character-inventory-update', handleInventoryUpdate);
      window.removeEventListener('kingdom:goldGained', handleGoldUpdate as EventListener);
      window.removeEventListener('kingdom:experienceGained', handleXPUpdate as EventListener);
      window.removeEventListener('character-stats-update', handleInventoryUpdate);
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    setCoverImageLoading(true);
    const loadCoverImage = async () => {
      const pref = await getUserPreference(userId, 'kingdom-header-image');
      if (pref) {
        setCoverImage(pref);
      } else {
        // Set default kingdom header image
        setCoverImage('/images/kingdom-header.jpg');
      }
      setCoverImageLoading(false);
    };
    loadCoverImage();
  }, [userId]);

  if (showEntrance) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black" style={{ width: '100vw', height: '100vh', padding: 0, margin: 0 }}>
        <div className="relative w-full h-full" style={{ overflow: 'hidden', padding: 0, margin: 0 }}>
          <Image
            src="/images/kingdom-tiles/Entrance.png"
            alt="Kingdom Entrance"
            fill
            className={`object-cover transition-transform ease-in-out kingdom-entrance-img`}
            style={{
              objectPosition: 'top center',
              transform:
                zoomed
                  ? `scale(16) translateY(-50%)`
                  : moveUp
                    ? 'scale(1) translateY(-50%)'
                    : 'scale(1) translateY(0%)',
              transition:
                zoomed && moveUp
                  ? 'transform 3s cubic-bezier(0.4,0,0.2,1) 2s, transform 3.5s cubic-bezier(0.4,0,0.2,1) 2s'
                  : zoomed
                    ? 'transform 3.5s cubic-bezier(0.4,0,0.2,1) 2s'
                    : moveUp
                      ? 'transform 3s cubic-bezier(0.4,0,0.2,1) 2s'
                      : 'none',
            }}
            unoptimized
          />
        </div>
      </div>
    );
  }
  // After animation, show the main content immediately
  return (
    <div className="min-h-screen">
      {/* Main Content with Tabs */}
      <HeaderSection
        title="KINGDOM"
        imageSrc={coverImage || ""}
        canEdit={!!userId}
        onImageUpload={async (file) => {
          const reader = new FileReader();
          reader.onload = async (event: ProgressEvent<FileReader>) => {
            const result = event.target?.result as string;
            setCoverImage(result);
            if (userId) {
              await setUserPreference(userId, 'kingdom-header-image', result);
            }
          };
          reader.readAsDataURL(file);
        }}
        className=""
      />

      <AlertDialog open={modalOpen} onOpenChange={setModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Item Used</AlertDialogTitle>
            <AlertDialogDescription>{modalText}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={() => setModalOpen(false)} aria-label="Close modal">Close</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      {/* Main Content with Tabs */}
      <div className="container mx-auto p-4" aria-label="kingdom-main-content">
        <Tabs value={kingdomTab} onValueChange={setKingdomTab} className="w-full">
          <TabsList className="mb-2 w-full grid grid-cols-3">
            <TabsTrigger value="thrivehaven">Thrivehaven</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>
          <TabsContent value="thrivehaven">
            <div className="flex flex-col items-center justify-center w-full">
              <div className="flex items-center justify-center w-full">
                <KingdomGrid
                  grid={kingdomGrid}
                  onTilePlace={handlePlaceKingdomTile}
                  selectedTile={selectedKingdomTile}
                  setSelectedTile={setSelectedKingdomTile}
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="progress">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="w-full" aria-label="kingdom-stats-block-container">
                <KingdomStatsBlock userId={userId} />
              </div>
              <div className="w-full" aria-label="king-stats-block-container">
                <KingStatsBlock userId={userId} />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="inventory">
            <Card className="bg-black border-amber-800/50" aria-label="kingdom-inventory-card">
              <CardHeader>
                <CardTitle className="text-amber-500">Kingdom Inventory</CardTitle>
                <CardDescription className="text-gray-400">Your equipment and resources</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="equipped" value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="mb-4 md:hidden">
                    <label htmlFor="kingdom-inventory-tab-select" className="sr-only">Select inventory tab</label>
                    <select
                      id="kingdom-inventory-tab-select"
                      aria-label="Kingdom inventory tab selector"
                      className="w-full rounded-md border border-amber-800/20 bg-black text-white p-2"
                      value={activeTab}
                      onChange={e => setActiveTab(e.target.value)}
                    >
                      <option value="equipped">Equipped</option>
                      <option value="stored">Stored</option>
                    </select>
                  </div>
                  <TabsList className="grid w-full grid-cols-2 bg-black border-amber-800/30 hidden md:grid">
                    <TabsTrigger value="equipped" aria-label="equipped-tab">Equipped</TabsTrigger>
                    <TabsTrigger value="stored" aria-label="stored-tab">Stored</TabsTrigger>
                  </TabsList>
                  {inventoryLoading ? (
                    <div className="text-center text-gray-400 py-8">Loading inventory...</div>
                  ) : (
                    <>
                      <TabsContent value="equipped" className="mt-4">
                        {equippedItems.length === 0 ? (
                          <div className="text-center text-gray-400 py-8">
                            No items equipped
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-label="equipped-items-grid">
                            {equippedItems.map((item) => renderItemCard(item, true))}
                          </div>
                        )}
                      </TabsContent>
                      <TabsContent value="stored" className="mt-4">
                        {storedItems.length === 0 ? (
                          <Card className="bg-black/50 border-amber-800/30 border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
                              <div className="w-16 h-16 mb-4 rounded-full bg-amber-900/30 flex items-center justify-center">
                                <span className="text-2xl">🎒</span>
                              </div>
                              <h3 className="text-amber-500 font-semibold text-lg mb-2">Your bag is empty</h3>
                              <p className="text-gray-400 text-sm leading-relaxed">
                                Keep traversing the land and buy new items to be better equipped.
                              </p>
                            </CardContent>
                          </Card>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-label="stored-items-grid">
                            {storedItems.map((item) => renderItemCard(item, false))}
                          </div>
                        )}
                      </TabsContent>
                    </>
                  )}
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 