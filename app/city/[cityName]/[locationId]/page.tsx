"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useToast } from "@/components/ui/use-toast"
import { getCharacterStats } from "@/lib/character-stats-service"
import Image from "next/image"
import { Home, Building, ShoppingBag, Swords, BookOpen, Footprints, Coffee } from "lucide-react"

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
      { id: "health-elixir", name: "Health Elixir", description: "A potent healing elixir brewed from rare herbs.", price: 50, type: "item", emoji: "🧪", image: "/images/items/potion/potion-health.webp", stats: { defense: 1 } },
      { id: "mana-crystal", name: "Mana Crystal", description: "A crystallized form of pure magical energy.", price: 75, type: "item", emoji: "💎", image: "/images/items/potion/potion-exp.webp", stats: { attack: 1 } }
    ]
  },
  blacksmith: {
    name: "Blacksmith",
    description: "A master forge where legendary weapons and armor are crafted.",
    icon: Swords,
    items: [
      { id: "sunforged-blade", name: "Sunforged Blade", description: "A blade forged in magical flames.", price: 200, type: "equipment", emoji: "⚔️", image: "/images/items/sword/sword-sunblade.webp", stats: { attack: 4 } }
    ]
  },
  library: {
    name: "Library",
    description: "An ancient repository of magical knowledge.",
    icon: BookOpen,
    items: [
      { id: "tome-of-power", name: "Tome of Power", description: "Ancient magical knowledge.", price: 300, type: "book", emoji: "📚", image: "/images/items/scroll/scroll-perkamento.webp", stats: { attack: 2 } }
    ]
  },
  castle: {
    name: "Royal Castle",
    description: "The seat of power in the realm.",
    icon: Building,
    items: [
      { id: "royal-crown", name: "Royal Crown", description: "Symbol of authority.", price: 1500, type: "artifact", emoji: "👑", image: "/images/items/artifact/crown/artifact-crowny.webp" }
    ]
  },
  temple: {
    name: "Great Temple",
    description: "A holy place of worship.",
    icon: Footprints,
    items: [
      { id: "holy-water", name: "Holy Water", description: "Purified healing water.", price: 50, type: "item", emoji: "💧", image: "/images/items/potion/potion-health.webp", stats: { defense: 1 } }
    ]
  },
  townhall: {
    name: "Town Hall",
    description: "The administrative heart of the city.",
    icon: Building,
    items: [
      { id: "noble-signet", name: "Noble Signet", description: "A ring bearing the city's seal.", price: 500, type: "artifact", emoji: "💍", image: "/images/items/artifact/ring/artifact-ringo.webp" }
    ]
  },
  inn: {
    name: "Inn",
    description: "A welcoming establishment offering rest.",
    icon: Home,
    items: [
      { id: "travelers-feast", name: "Traveler's Feast", description: "Hearty meal.", price: 30, type: "item", emoji: "🍖", image: "/images/items/potion/potion-health.webp", stats: { defense: 1 } }
    ]
  },
  "embers-anvil": {
    name: "Ember's Anvil",
    description: "Buy equipment.",
    icon: Swords,
    items: [
      { id: "iron-sword", name: "Iron Sword", description: "Sturdy iron sword.", price: 120, type: "equipment", emoji: "⚔️", image: "/images/items/sword/sword-irony.webp", stats: { attack: 3 } }
    ]
  },
  "kingdom-marketplace": {
    name: "Kingdom Marketplace",
    description: "Trade artifacts.",
    icon: ShoppingBag,
    items: [
      { id: "ancient-artifact", name: "Ancient Artifact", description: "Mysterious artifact.", price: 300, type: "artifact", emoji: "🏺" }
    ]
  },
  "royal-stables": {
    name: "Royal Stables",
    description: "Buy horses.",
    icon: Home,
    horses: [
      { id: "swift-horse", name: "Sally Swift Horse", description: "Fast and agile.", price: 500, movement: 6, emoji: "🐎", type: "creature" }
    ]
  },
  stables: {
    name: "Royal Stables",
    description: "Buy horses.",
    icon: Home,
    horses: [
      { id: "swift-horse", name: "Sally Swift Horse", description: "Fast and agile.", price: 500, movement: 6, emoji: "🐎", type: "creature" }
    ]
  },
  tavern: {
    name: "The Dragon's Rest",
    description: "A cozy tavern for weary adventurers.",
    icon: Home,
    items: [
      { id: "health-potion", name: "Health Potion", description: "Restores 50 HP", price: 40, type: "item", emoji: "🧪", image: "/images/items/potion/potion-health.webp", stats: { defense: 1 } },
      { id: "mana-potion", name: "Mana Potion", description: "Restores 50 MP", price: 45, type: "item", emoji: "🔮", image: "/images/items/potion/potion-mana.webp", stats: { attack: 1 } },
      { id: "stamina-potion", name: "Stamina Potion", description: "Restores 50 SP", price: 60, type: "item", emoji: "💪", image: "/images/items/potion/potion-strength.webp", stats: { movement: 1 } }
    ]
  }
}

function getItemImagePath(item: LocationItem): string {
  return (item as any).image || "/images/items/placeholder.webp";
}

export default function CityLocationPage() {
  const params = useParams() as { cityName: string; locationId: string }
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useUser()
  const [gold, setGold] = useState(0)
  const [purchasedItems, setPurchasedItems] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const loadStats = async () => {
      try {
        if (user?.id) {
          const stats = getCharacterStats()
          setGold(stats?.gold || 0)
        }
      } catch (error) {
        // Ignored
      }
    }
    loadStats()
  }, [user?.id])

  const location = locationData[params.locationId]

  if (isLoading && params.locationId === "tavern") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-amber-500">
        <div className="text-center animate-pulse">
           <Coffee className="w-12 h-12 mx-auto mb-4" />
           <p className="text-lg italic">Gathering Tavern Stories...</p>
        </div>
      </div>
    );
  }

  if (!location) {
    if (params.cityName && router) {
       router.push(`/city/${params.cityName}`)
    }
    return null
  }

  const handlePurchase = async (item: LocationItem) => {
    if (gold < item.price) {
      toast({ title: "Insufficient Gold", variant: "destructive" })
      return
    }
    setGold(prev => prev - item.price)
    toast({ title: "Item Purchased!", description: `You have purchased ${item.name}` })
    setPurchasedItems((prev) => [...prev, item.id])
  }

  const locationImage = params.locationId === "royal-stables" || params.locationId === "stables"
    ? "/images/locations/royal-stables.webp"
    : `/images/locations/${location.name.toLowerCase().replace(/\s+/g, '-')}.png`;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto p-4">
        <div className="flex items-center gap-4 mb-6">
          <button 
            className="p-2 border border-amber-800/20 rounded-md text-amber-500 hover:bg-amber-900/20"
            onClick={() => router.push(`/city/${params.cityName}`)}
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-amber-500">{location.name}</h1>
        </div>

        <div className="w-full h-64 relative rounded-xl overflow-hidden mb-8 border border-amber-900/30">
          <Image
             src={locationImage}
             alt={location.name}
             fill
             className="object-cover"
             priority
             onError={(e) => { (e.target as HTMLImageElement).src = "/images/locations/city.webp"; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          <div className="absolute bottom-6 left-6">
             <h2 className="text-4xl font-bold text-amber-500 drop-shadow-md">{location.name}</h2>
             <p className="text-slate-300 italic">{location.description}</p>
          </div>
        </div>

        <div className="bg-gray-900/40 border border-amber-900/20 rounded-xl p-8">
           {location.horses ? (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {location.horses.map((horse: any) => (
                 <div key={horse.id} className="bg-black border border-amber-900/20 p-4 rounded-lg">
                    <h3 className="text-xl font-bold text-amber-500">{horse.name}</h3>
                    <p className="text-sm text-gray-400 mb-4">{horse.description}</p>
                    <button 
                      className="w-full py-2 bg-amber-700 hover:bg-amber-600 rounded text-white font-bold"
                      onClick={() => handlePurchase(horse)}
                    >
                      {horse.price} Gold
                    </button>
                 </div>
               ))}
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {(location.items || []).map((item: any) => (
                 <div key={item.id} className="bg-black border border-amber-900/20 p-4 rounded-lg">
                    <h3 className="text-xl font-bold text-amber-500">{item.name}</h3>
                    <p className="text-sm text-gray-400 mb-4">{item.description}</p>
                    <button 
                      className="w-full py-2 bg-amber-700 hover:bg-amber-600 rounded text-white font-bold"
                      onClick={() => handlePurchase(item)}
                    >
                      {item.price} Gold
                    </button>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
    </div>
  )
}