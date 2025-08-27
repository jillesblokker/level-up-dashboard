"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Building, ShoppingBag, Swords, BookOpen, Home } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { getCharacterStats } from "@/lib/character-stats-manager"
import { HeaderSection } from "@/components/HeaderSection"
import Image from "next/image"

interface LocationItem {
  id: string
  name: string
  description: string
  price: number
  type: "item" | "resource" | "creature" | "scroll" | "equipment" | "artifact" | "book"
  emoji?: string
  image?: string
  movement?: number
  attack?: number
  defense?: number
  stats?: {
    movement?: number
    attack?: number
    defense?: number
  }
}

const locationData: Record<string, any> = {
  marketplace: {
    name: "Marketplace",
    description: "A bustling marketplace where merchants sell their wares.",
    icon: ShoppingBag,
    items: [
      { 
        id: "health-elixir", 
        name: "Health Elixir", 
        description: "A potent healing elixir brewed from rare herbs.", 
        price: 50, 
        type: "item",
        emoji: "🧪",
        image: "/images/items/potion/potion-health.png",
        stats: { defense: 1 }
      },
      { 
        id: "mana-crystal", 
        name: "Mana Crystal", 
        description: "A crystallized form of pure magical energy.", 
        price: 75, 
        type: "item",
        emoji: "💎",
        image: "/images/items/potion/potion-exp.png",
        stats: { attack: 1 }
      },
      { 
        id: "merchants-charm", 
        name: "Merchant's Charm", 
        description: "A lucky charm that brings fortune in trade.", 
        price: 100, 
        type: "artifact",
        emoji: "🍀",
        image: "/images/items/artifact/ring/artifact-ringo.png"
      }
    ]
  },
  blacksmith: {
    name: "Blacksmith",
    description: "A master forge where legendary weapons and armor are crafted.",
    icon: Swords,
    items: [
      { 
        id: "sunforged-blade", 
        name: "Sunforged Blade", 
        description: "A blade forged in magical flames, gleaming with inner light.", 
        price: 200, 
        type: "equipment",
        emoji: "⚔️",
        image: "/images/items/sword/sword-sunblade.png",
        stats: { attack: 4 }
      },
      { 
        id: "shadowmail", 
        name: "Shadowmail", 
        description: "Dark, flexible armor that moves like silk but protects like steel.", 
        price: 250, 
        type: "equipment",
        emoji: "🥋",
        image: "/images/items/armor/armor-darko.png",
        stats: { defense: 4 }
      },
      { 
        id: "guardian-shield", 
        name: "Guardian Shield", 
        description: "An enchanted shield that seems to move on its own to protect its wielder.", 
        price: 180, 
        type: "equipment",
        emoji: "🛡️",
        image: "/images/items/shield/shield-blockado.png",
        stats: { defense: 3 }
      }
    ]
  },
  library: {
    name: "Library",
    description: "An ancient repository of magical knowledge and forgotten lore.",
    icon: BookOpen,
    items: [
      { 
        id: "tome-of-power", 
        name: "Tome of Power", 
        description: "Ancient writings containing powerful magical knowledge.", 
        price: 300, 
        type: "book",
        emoji: "📚",
        image: "/images/items/scroll/scroll-perkamento.png",
        stats: { attack: 2 }
      },
      { 
        id: "scroll-of-wisdom", 
        name: "Scroll of Wisdom", 
        description: "A mystical scroll that enhances the reader's understanding.", 
        price: 250, 
        type: "scroll",
        emoji: "📜",
        image: "/images/items/scroll/scroll-memento.png",
        stats: { defense: 2 }
      },
      { 
        id: "crystal-codex", 
        name: "Crystal Codex", 
        description: "A book bound in crystalline pages that shimmer with magic.", 
        price: 400, 
        type: "book",
        emoji: "💠",
        image: "/images/items/scroll/scroll-scrolly.png",
        stats: { attack: 1, defense: 1 }
      }
    ]
  },
  townhall: {
    name: "Town Hall",
    description: "The administrative heart of the city, where important matters are decided.",
    icon: Building,
    items: [
      { 
        id: "noble-signet", 
        name: "Noble Signet", 
        description: "A ring bearing the city's seal, granting special privileges.", 
        price: 500, 
        type: "artifact",
        emoji: "💍",
        image: "/images/items/artifact/ring/artifact-ringo.png"
      },
      { 
        id: "royal-decree", 
        name: "Royal Decree", 
        description: "An official document granting special trading rights.", 
        price: 750, 
        type: "scroll",
        emoji: "📜",
        image: "/images/items/scroll/scroll-perkamento.png"
      },
      { 
        id: "governors-medallion", 
        name: "Governor's Medallion", 
        description: "A symbol of authority in the city.", 
        price: 1000, 
        type: "artifact",
        emoji: "🏅",
        image: "/images/items/artifact/crown/artifact-crowny.png"
      }
    ]
  },
  inn: {
    name: "Inn",
    description: "A welcoming establishment offering rest, refreshment, and local gossip.",
    icon: Home,
    items: [
      { 
        id: "travelers-feast", 
        name: "Traveler's Feast", 
        description: "A hearty meal that restores vitality.", 
        price: 30, 
        type: "item",
        emoji: "🍖",
        image: "/images/items/potion/potion-health.png",
        stats: { defense: 1 }
      },
      { 
        id: "mystic-brew", 
        name: "Mystic Brew", 
        description: "A special drink that enhances magical abilities.", 
        price: 45, 
        type: "item",
        emoji: "🍺",
        image: "/images/items/potion/potion-exp.png",
        stats: { attack: 1 }
      },
      { 
        id: "restful-charm", 
        name: "Restful Charm", 
        description: "A magical trinket that ensures peaceful sleep.", 
        price: 100, 
        type: "artifact",
        emoji: "💫",
        image: "/images/items/artifact/ring/artifact-ringo.png"
      }
    ]
  },
  "embers-anvil": {
    name: "Ember's Anvil",
    description: "Buy equipment: sword, shield, and armor set.",
    icon: Swords,
    items: [
      { id: "iron-sword", name: "Iron Sword", description: "A sturdy iron sword for battle.", price: 120, type: "equipment", emoji: "⚔️", image: "/images/items/sword/sword-irony.png", stats: { attack: 3 } },
      { id: "steel-shield", name: "Steel Shield", description: "A strong steel shield for protection.", price: 100, type: "equipment", emoji: "🛡️", image: "/images/items/shield/shield-reflecto.png", stats: { defense: 2 } },
      { id: "iron-armor", name: "Iron Armor", description: "Full body iron armor.", price: 250, type: "equipment", emoji: "🥋", image: "/images/items/armor/armor-darko.png", stats: { defense: 3 } }
    ]
  },
  "kingdom-marketplace": {
    name: "Kingdom Marketplace",
    description: "Trade/sell your artifacts for gold and buy artifacts, scrolls, or books.",
    icon: ShoppingBag,
    items: [
      { id: "ancient-artifact", name: "Ancient Artifact", description: "A mysterious artifact.", price: 300, type: "artifact", emoji: "🏺" },
      { id: "magic-scroll", name: "Magic Scroll", description: "A scroll containing a spell.", price: 200, type: "scroll", emoji: "📜" },
      { id: "tome-of-knowledge", name: "Tome of Knowledge", description: "A book of wisdom.", price: 400, type: "book", emoji: "📚" }
    ]
  },
  "royal-stables": {
    name: "Royal Stables",
    description: "Buy horses with unique movement stats.",
    icon: Home,
    horses: [
      { id: "swift-horse", name: "Sally Swift Horse", description: "Fast and agile.", price: 500, movement: 6, emoji: "🐎", type: "creature" },
      { id: "endurance-horse", name: "Buster Endurance Horse", description: "Can travel long distances.", price: 600, movement: 8, emoji: "🐴", type: "creature" },
      { id: "war-horse", name: "Shadow War Horse", description: "Strong and brave.", price: 800, movement: 10, emoji: "🦄", type: "creature" }
    ]
  }
}

// Helper function for item image mapping
function getItemImagePath(item: LocationItem): string {
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
  
  // Handle variations for items with multiple images
  const variations = [
    "/images/items/sword/sword-irony.png",
    "/images/items/sword/sword-sunblade.png",
    "/images/items/sword/sword-twig.png"
  ];
  let idx = 0;
  if (item.id && typeof item.id === 'string') {
    const mod = item.id.length % variations.length;
    idx = isNaN(mod) ? 0 : mod;
  }
  // Ensure idx is within bounds
  idx = Math.max(0, Math.min(idx, variations.length - 1));
  return variations[idx] || "/images/items/placeholder.jpg";
}

export default function CityLocationPage() {
  const params = useParams() as { cityName: string; locationId: string }
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useUser()
  const [gold, setGold] = useState(0)
  const [purchasedItems, setPurchasedItems] = useState<string[]>([])

  useEffect(() => {
    // Load character stats from localStorage
    const loadStats = async () => {
      try {
        if (user?.id) {
          const stats = getCharacterStats()
          setGold(stats?.gold || 0)
        }

        // Load inventory but don't store in state since it's not used
        if (user?.id) {
          try {
            const response = await fetch('/api/inventory', {
              credentials: 'include'
            });
            if (!response.ok) {
              console.error('Failed to load inventory:', response.status);
            }
          } catch (error) {
            console.error('Failed to load inventory:', error);
          }
        }
      } catch (error) {
        console.error("Failed to load character stats:", error)
      }
    }
    
    loadStats()

    // Listen for updates
    window.addEventListener("character-stats-update", loadStats)
    window.addEventListener("character-inventory-update", loadStats)
    
    return () => {
      window.removeEventListener("character-stats-update", loadStats)
      window.removeEventListener("character-inventory-update", loadStats)
    }
  }, [user?.id])

  const location = locationData[params.locationId]
  if (!location) {
    router.push(`/city/${params.cityName}`)
    return null
  }

  const handlePurchase = async (item: LocationItem) => {
    if (gold < item.price) {
      toast({
        title: "Insufficient Gold",
        description: `You need ${item.price} gold to purchase this item.`,
        variant: "destructive"
      })
      return
    }

    // Update gold
    const newGold = gold - item.price
    if (user?.id) {
      try {
        const response = await fetch('/api/character-stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stats: { gold: newGold } }),
          credentials: 'include'
        });
        if (!response.ok) {
          console.error('Failed to update character stats:', response.status);
        }
      } catch (error) {
        console.error('Failed to update character stats:', error);
      }
    }
    setGold(newGold)

    // Add item to inventory
    if (user?.id) {
      try {
        const inventoryItem = {
          ...item,
          quantity: 1,
          image: item.image ? item.image : getItemImagePath(item) as string,
          stats: item.stats || {
            ...(item.movement !== undefined ? { movement: item.movement } : {}),
            ...(item.attack !== undefined ? { attack: item.attack } : {}),
            ...(item.defense !== undefined ? { defense: item.defense } : {}),
          },
        };

        const response = await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item: inventoryItem }),
          credentials: 'include'
        });
        
        if (!response.ok) {
          console.error('Failed to add item to inventory:', response.status);
        }
      } catch (error) {
        console.error('Failed to add item to inventory:', error);
      }
    }

    // Dispatch update event
    window.dispatchEvent(new Event("character-stats-update"))

    toast({
      title: "Item Purchased!",
      description: `You have purchased ${item.name} for ${item.price} gold.`
    })

    setPurchasedItems((prev) => [...prev, item.id])
  }

  const locationImage = params.locationId === "royal-stables"
    ? "/images/locations/royal-stables.png"
    : `/images/locations/${location.name.toLowerCase().replace(/'/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.png`;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => router.push(`/city/${params.cityName}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{location.name}</h1>
        </div>

        <HeaderSection
          title={location.name}
          imageSrc={locationImage}
          canEdit={false}
          shouldRevealImage={true}
        />

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <location.icon className="h-5 w-5" />
              <CardTitle>{location.name}</CardTitle>
            </div>
            <CardDescription>{location.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {params.locationId === "royal-stables" ? (
              <>
                <h2 className="text-xl font-bold mb-4">Horses for Sale</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {location.horses.map((horse: LocationItem & { movement: number }) => {
                    const imagePath = horse.image ? horse.image : getItemImagePath(horse);
                    return (
                      <Card key={horse.id} className="flex flex-col">
                        <div className="w-full aspect-[4/3] relative bg-black">
                          <Image
                            src={imagePath}
                            alt={`${horse.name} image`}
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, 33vw"
                            aria-label={`${horse.name}-image`}
                            onError={(e) => { (e.target as HTMLImageElement).src = "/images/items/placeholder.jpg"; }}
                          />
                        </div>
                        <CardHeader>
                          <CardTitle className="text-lg">{horse.name}</CardTitle>
                          <CardDescription>{horse.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                          <p className="text-sm text-muted-foreground">Price: {horse.price} gold</p>
                          <p className="text-sm text-muted-foreground">Movement: +{horse.movement}</p>
                        </CardContent>
                        <CardContent className="pt-0">
                          <Button
                            className="w-full"
                            onClick={() => handlePurchase(horse as LocationItem)}
                            disabled={
                              gold < horse.price ||
                              (purchasedItems.includes(horse.id) && !['potion', 'health-potion', 'mana-potion', 'strength-potion'].includes(horse.id))
                            }
                          >
                            {purchasedItems.includes(horse.id) && !['potion', 'health-potion', 'mana-potion', 'strength-potion'].includes(horse.id) ? 'Purchased' : 'Purchase'}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {location.items && location.items.map((item: LocationItem) => {
                  const imagePath = item.image ? item.image : getItemImagePath(item);
                  return (
                    <Card key={item.id} className="overflow-hidden">
                      <div className="w-full aspect-[4/3] relative bg-black">
                        <Image
                          src={imagePath}
                          alt={`${item.name} image`}
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 100vw, 33vw"
                          aria-label={`${item.name}-image`}
                          onError={(e) => { (e.target as HTMLImageElement).src = "/images/items/placeholder.jpg"; }}
                        />
                      </div>
                      <CardHeader>
                        <CardTitle>{item.name}</CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <p className="text-sm text-muted-foreground">Price: {item.price} gold</p>
                        <p className="text-sm text-muted-foreground">Type: {item.type}</p>
                      </CardContent>
                      <CardContent className="pt-0">
                        <Button
                          className="w-full"
                          onClick={() => handlePurchase(item)}
                          disabled={
                            gold < item.price ||
                            (purchasedItems.includes(item.id) && !['potion', 'health-potion', 'mana-potion', 'strength-potion'].includes(item.id))
                          }
                        >
                          {purchasedItems.includes(item.id) && !['potion', 'health-potion', 'mana-potion', 'strength-potion'].includes(item.id) ? 'Purchased' : 'Purchase'}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// NOTE: Dev server runs on port 3005, so images are accessible at http://localhost:3005/images/... 