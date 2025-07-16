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
  const [coverImage, setCoverImage] = useState("/images/kingdom-header.jpg")
  const [equippedItems, setEquippedItems] = useState<KingdomInventoryItem[]>([])
  const [storedItems, setStoredItems] = useState<KingdomInventoryItem[]>([])
  const [totalStats, setTotalStats] = useState({ movement: 0, attack: 0, defense: 0 })
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
  const [fadeStage, setFadeStage] = useState<'none' | 'black' | 'white'>('none');
  const [moveUp, setMoveUp] = useState(false);
  const [kingdomReady, setKingdomReady] = useState(false);
  const [kingdomContent, setKingdomContent] = useState<JSX.Element | null>(null);

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
    equipItem(item.id);
  };

  // Handler for unequipping items
  const handleUnequip = (item: KingdomInventoryItem) => {
    unequipItem(item.id);
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
    setFadeStage('none');
    setMoveUp(false);
    // Start zoom immediately, lasts 4s
    const zoomTimeout = setTimeout(() => setZoomed(true), 0);
    // Start move up at 1s, lasts 3s (overlaps with zoom)
    const moveUpTimeout = setTimeout(() => setMoveUp(true), 1000);
    // Fade to black at 3.5s, lasts 1s
    const fadeBlackTimeout = setTimeout(() => setFadeStage('black'), 3500);
    // Fade to white at 4.5s, lasts 1.5s
    const fadeWhiteTimeout = setTimeout(() => setFadeStage('white'), 4500);
    // Hide overlay and show main content at 6s
    const hideTimeout = setTimeout(() => setShowEntrance(false), 6000);
    return () => {
      clearTimeout(zoomTimeout);
      clearTimeout(moveUpTimeout);
      clearTimeout(fadeBlackTimeout);
      clearTimeout(fadeWhiteTimeout);
      clearTimeout(hideTimeout);
    };
  }, []);

  useEffect(() => {
    const loadInventory = () => {
      const equipped = getEquippedItems()
      const stored = getStoredItems()
      const stats = getTotalStats()
      // Normalize items to always have a 'stats' property and description
      const normalizeItems = (items: any[]) => items.map(item => ({
        ...item,
        stats: (item as any).stats || {},
        description: (item as any).description || '',
      }) as KingdomInventoryItem)
      setEquippedItems(normalizeItems(equipped.filter(isEquippable)))
      setStoredItems(normalizeItems(stored))
      setTotalStats(stats)
    }
    loadInventory()
    const handleInventoryUpdate = () => {
      loadInventory();
    };
    window.addEventListener('character-inventory-update', handleInventoryUpdate)
    return () => window.removeEventListener('character-inventory-update', handleInventoryUpdate)
  }, [])

  useEffect(() => {
    const savedImage = localStorage.getItem("kingdom-header-image")
    if (savedImage) {
      setCoverImage(savedImage)
    }
  }, [])

  if (showEntrance) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black" style={{ width: '100vw', height: '100vh', padding: 0, margin: 0 }}>
        <div className="relative w-full h-full" style={{ overflow: 'hidden', padding: 0, margin: 0 }}>
          <Image
            src="/images/kingdom-tiles/Entrance.png"
            alt="Kingdom Entrance"
            fill
            className={`object-cover transition-transform duration-[4000ms] ease-in-out kingdom-entrance-img`}
            style={{
              transform: zoomed
                ? `scale(16) translateY(-20%)`
                : moveUp
                  ? 'scale(1) translateY(-20%)'
                  : 'scale(1) translateY(0%)',
              transition: moveUp
                ? 'transform 3s cubic-bezier(0.4,0,0.2,1)' // move up over 3s
                : 'transform 1s cubic-bezier(0.4,0,0.2,1)',
              objectPosition: 'top center',
              position: 'absolute',
              top: 0,
              left: 0,
              margin: 0,
              padding: 0,
            }}
            unoptimized
          />
          {/* Fade overlays */}
          <div
            className={`pointer-events-none absolute inset-0 z-20 transition-opacity duration-[3000ms] ${fadeStage === 'black' ? 'opacity-100 bg-black' : 'opacity-0'}`}
            style={{ transition: 'opacity 3s linear' }}
          />
          <div
            className={`pointer-events-none absolute inset-0 z-30 transition-opacity duration-[2000ms] ${fadeStage === 'white' ? 'opacity-100' : 'opacity-0'}`}
            style={{
              transition: 'opacity 2s linear',
              background: fadeStage === 'white'
                ? 'radial-gradient(ellipse at center, #f8fafc 0%, #e2e8f0 60%, #000 100%)'
                : 'transparent',
              opacity: fadeStage === 'white' ? 0.95 : 0,
              mixBlendMode: 'lighten',
              animation: fadeStage === 'white' ? 'fadeWhiteOut 1s 1s forwards' : undefined,
            }}
          />
          <style jsx global>{`
            @keyframes fadeWhiteOut {
              0% { opacity: 0.95; }
              100% { opacity: 0; }
            }
          `}</style>
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
        imageSrc={coverImage}
        canEdit={!!userId}
        onImageUpload={(file) => {
          const reader = new FileReader();
          reader.onload = (event: ProgressEvent<FileReader>) => {
            const result = event.target?.result as string;
            setCoverImage(result);
            localStorage.setItem("kingdom-header-image", result);
            if (typeof window !== 'undefined') {
              const win = window as WindowWithHeaderImages;
              win.headerImages = win.headerImages || {};
              win.headerImages['kingdom'] = result;
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
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 