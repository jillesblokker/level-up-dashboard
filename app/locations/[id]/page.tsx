"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { ShoppingCart } from "lucide-react"

interface NotableLocation {
  id: string
  name: string
  description: string
  image: string
  items: {
    id: string
    name: string
    price: number
    description: string
  }[]
}

interface ShopItem {
  id: string
  name: string
  description: string
  price: number
}

interface LocationData {
  name: string
  description: string
  image: string
  notableLocations: NotableLocation[]
}

interface LocationDetails {
  [key: string]: LocationData
}

const locationDetails: LocationDetails = {
  "grand-citadel": {
    name: "Grand Citadel",
    description: "A magnificent city with towering spires and bustling markets. The heart of commerce and culture in the realm.",
    image: "/images/locations/The-dragon's-rest-tavern.png",
    notableLocations: [
      {
        id: "tavern",
        name: "The Dragon's Rest Tavern",
        description: "A lively tavern where adventurers gather to share tales and refreshments.",
        image: "/images/locations/The-dragon's-rest-tavern.png",
        items: [
          {
            id: "ale",
            name: "Dragon's Breath Ale",
            description: "A strong ale that warms the spirit",
            price: 5
          },
          {
            id: "meal",
            name: "Hearty Feast",
            description: "A filling meal fit for an adventurer",
            price: 10
          }
        ]
      },
      {
        id: "market",
        name: "Kingdom Marketplace",
        description: "A bustling marketplace filled with merchants from across the realm.",
        image: "/images/locations/kingdom-marketplace.png",
        items: [
          {
            id: "potion",
            name: "Health Potion",
            description: "Restores vitality in times of need",
            price: 50
          },
          {
            id: "scroll",
            name: "Scroll of Wisdom",
            description: "Contains ancient knowledge",
            price: 100
          }
        ]
      },
      {
        id: "blacksmith",
        name: "Ember's Anvil",
        description: "The finest blacksmith in the city, known for exceptional weaponry and armor.",
        image: "/images/locations/ember's-anvil.png",
        items: [
          {
            id: "sword",
            name: "Steel Sword",
            description: "A well-crafted blade",
            price: 200
          },
          {
            id: "armor",
            name: "Chain Mail",
            description: "Reliable protection in battle",
            price: 300
          }
        ]
      },
      {
        id: "stables",
        name: "Royal Stables",
        description: "Home to the finest horses in the kingdom, available for rent or purchase.",
        image: "/images/locations/royal-stables.png",
        items: [
          {
            id: "horse",
            name: "Sturdy Steed",
            description: "A reliable mount for your journey",
            price: 500
          },
          {
            id: "saddle",
            name: "Quality Saddle",
            description: "Makes for comfortable riding",
            price: 100
          }
        ]
      }
    ]
  },
  "riverside-haven": {
    name: "Riverside Haven",
    description: "A peaceful town nestled by the river. Known for its friendly inhabitants and local crafts.",
    image: "/images/locations/The-dragon's-rest-tavern.png",
    notableLocations: [
      {
        id: "tavern",
        name: "The Dragon's Rest Tavern",
        description: "A cozy tavern where locals and travelers alike find comfort and conversation.",
        image: "/images/locations/The-dragon's-rest-tavern.png",
        items: [
          {
            id: "ale",
            name: "Local Brew",
            description: "A refreshing ale made with local ingredients",
            price: 3
          },
          {
            id: "meal",
            name: "Fisherman's Stew",
            description: "Fresh catch from the river",
            price: 8
          }
        ]
      },
      {
        id: "market",
        name: "Kingdom Marketplace",
        description: "A charming market square where local artisans sell their wares.",
        image: "/images/locations/kingdom-marketplace.png",
        items: [
          {
            id: "herbs",
            name: "Healing Herbs",
            description: "Locally gathered medicinal herbs",
            price: 20
          },
          {
            id: "craft",
            name: "Handwoven Basket",
            description: "Sturdy basket for gathering",
            price: 15
          }
        ]
      },
      {
        id: "blacksmith",
        name: "Ember's Anvil",
        description: "A skilled blacksmith offering quality tools and repairs.",
        image: "/images/locations/ember's-anvil.png",
        items: [
          {
            id: "tools",
            name: "Craftsman's Tools",
            description: "Quality tools for various trades",
            price: 75
          },
          {
            id: "dagger",
            name: "Iron Dagger",
            description: "A simple but effective weapon",
            price: 50
          }
        ]
      },
      {
        id: "stables",
        name: "Royal Stables",
        description: "A well-maintained stable providing horses and riding services.",
        image: "/images/locations/royal-stables.png",
        items: [
          {
            id: "pony",
            name: "River Pony",
            description: "A gentle mount suitable for beginners",
            price: 200
          },
          {
            id: "feed",
            name: "Quality Feed",
            description: "Nutritious feed for your mount",
            price: 20
          }
        ]
      }
    ]
  },
  tavern: {
    name: "The Dragon's Rest Tavern",
    description: "A cozy tavern where adventurers gather to share tales and drink mead.",
    image: "/images/locations/The-dragon's-rest-tavern.png",
    notableLocations: [
      {
        id: "bar",
        name: "Main Bar",
        description: "The heart of the tavern, where drinks flow freely.",
        image: "/images/locations/tavern-bar.png",
        items: [
          { id: "ale", name: "Dragon's Breath Ale", price: 5, description: "A strong ale that warms the spirit" },
          { id: "mead", name: "Honeyed Mead", price: 8, description: "Sweet and smooth" }
        ]
      },
      {
        id: "kitchen",
        name: "Hearth & Kitchen",
        description: "Where hearty meals are prepared day and night.",
        image: "/images/locations/tavern-kitchen.png",
        items: [
          { id: "stew", name: "Hearty Stew", price: 12, description: "A filling bowl of stew" },
          { id: "bread", name: "Fresh Bread", price: 3, description: "Warm from the oven" }
        ]
      },
      {
        id: "inn",
        name: "Inn Rooms",
        description: "Comfortable lodging for weary travelers.",
        image: "/images/locations/tavern-rooms.png",
        items: [
          { id: "room", name: "Single Room", price: 50, description: "A cozy room for one" },
          { id: "suite", name: "Suite", price: 100, description: "A luxurious suite" }
        ]
      },
      {
        id: "cellar",
        name: "Wine Cellar",
        description: "A vast collection of fine wines and spirits.",
        image: "/images/locations/tavern-cellar.png",
        items: [
          { id: "wine", name: "Fine Wine", price: 15, description: "A bottle of quality wine" },
          { id: "spirits", name: "Aged Spirits", price: 25, description: "Premium distilled spirits" }
        ]
      }
    ]
  },
  market: {
    name: "Kingdom Marketplace",
    description: "A bustling marketplace filled with merchants from across the realm.",
    image: "/images/locations/kingdom-marketplace.png",
    notableLocations: [
      {
        id: "general",
        name: "General Goods",
        description: "Everything an adventurer might need.",
        image: "/images/locations/kingdom-marketplace.png",
        items: [
          { id: "backpack", name: "Adventurer's Pack", price: 50, description: "Essential adventuring gear" },
          { id: "torch", name: "Torch", price: 1, description: "Lights your way" }
        ]
      },
      {
        id: "magic",
        name: "Magic Emporium",
        description: "Mystical items and arcane goods.",
        image: "/images/locations/kingdom-marketplace.png",
        items: [
          { id: "scroll", name: "Magic Scroll", price: 100, description: "Contains a basic spell" },
          { id: "potion", name: "Minor Potion", price: 30, description: "Restores some health" }
        ]
      },
      {
        id: "food",
        name: "Food Court",
        description: "Fresh produce and prepared meals.",
        image: "/images/locations/market-food.png",
        items: [
          { id: "fruit", name: "Fresh Fruit", price: 2, description: "Healthy and delicious" },
          { id: "meal", name: "Hot Meal", price: 8, description: "A satisfying meal" }
        ]
      },
      {
        id: "exotic",
        name: "Exotic Goods",
        description: "Rare items from distant lands.",
        image: "/images/locations/market-exotic.png",
        items: [
          { id: "spice", name: "Rare Spices", price: 20, description: "Exotic cooking spices" },
          { id: "silk", name: "Fine Silk", price: 50, description: "Luxurious fabric" }
        ]
      }
    ]
  },
  blacksmith: {
    name: "Ember's Anvil",
    description: "The finest blacksmith in the city, known for exceptional weaponry and armor.",
    image: "/images/locations/ember's-anvil.png",
    notableLocations: [
      {
        id: "forge",
        name: "Main Forge",
        description: "Where masterwork weapons are crafted.",
        image: "/images/locations/blacksmith-forge.png",
        items: [
          { id: "sword", name: "Steel Sword", price: 200, description: "A well-crafted blade" },
          { id: "axe", name: "Battle Axe", price: 250, description: "Heavy and powerful" }
        ]
      },
      {
        id: "armory",
        name: "Armor Workshop",
        description: "Specializing in protective gear.",
        image: "/images/locations/blacksmith-armory.png",
        items: [
          { id: "chainmail", name: "Chainmail", price: 300, description: "Flexible armor protection" },
          { id: "shield", name: "Shield", price: 150, description: "Sturdy defense" }
        ]
      },
      {
        id: "tools",
        name: "Tool Shop",
        description: "Quality tools for all trades.",
        image: "/images/locations/blacksmith-tools.png",
        items: [
          { id: "hammer", name: "Smith's Hammer", price: 40, description: "Essential blacksmith tool" },
          { id: "tongs", name: "Forging Tongs", price: 30, description: "For handling hot metal" }
        ]
      },
      {
        id: "repair",
        name: "Repair Station",
        description: "Expert weapon and armor repairs.",
        image: "/images/locations/blacksmith-repair.png",
        items: [
          { id: "repair", name: "Weapon Repair", price: 50, description: "Restore weapon condition" },
          { id: "sharpen", name: "Blade Sharpening", price: 20, description: "Sharpen your blade" }
        ]
      }
    ]
  },
  stables: {
    name: "Royal Stables",
    description: "Home to the finest horses in the kingdom.",
    image: "/images/locations/royal-stables.png",
    notableLocations: [
      {
        id: "horses",
        name: "Horse Paddock",
        description: "Where the finest steeds are kept.",
        image: "/images/locations/royal-stables.png",
        items: [
          { id: "horse", name: "Riding Horse", price: 500, description: "A reliable mount" },
          { id: "warhorse", name: "Warhorse", price: 1000, description: "Trained for battle" }
        ]
      },
      {
        id: "training",
        name: "Training Grounds",
        description: "For horse and rider training.",
        image: "/images/locations/stables-training.png",
        items: [
          { id: "lesson", name: "Riding Lesson", price: 50, description: "Learn to ride" },
          { id: "training", name: "Horse Training", price: 200, description: "Train your mount" }
        ]
      },
      {
        id: "tack",
        name: "Tack Room",
        description: "Quality riding equipment.",
        image: "/images/locations/stables-tack.png",
        items: [
          { id: "saddle", name: "Leather Saddle", price: 100, description: "Quality riding saddle" },
          { id: "bridle", name: "Bridle", price: 40, description: "Essential riding gear" }
        ]
      },
      {
        id: "care",
        name: "Care Station",
        description: "Where horses receive expert care.",
        image: "/images/locations/stables-care.png",
        items: [
          { id: "grooming", name: "Horse Grooming", price: 30, description: "Keep your horse clean" },
          { id: "feed", name: "Premium Feed", price: 20, description: "High-quality horse feed" }
        ]
      }
    ]
  }
}

interface PageProps {
  params: {
    id: string
  }
}

export default function LocationPage({ params }: PageProps) {
  const router = useRouter()
  const location = locationDetails[params.id]
  const [goldBalance, setGoldBalance] = useState(0)
  const [purchasedItems, setPurchasedItems] = useState<string[]>([])

  useEffect(() => {
    // Load gold balance from localStorage
    const savedGold = localStorage.getItem("goldBalance")
    setGoldBalance(savedGold ? parseInt(savedGold) : 5000)

    // Load purchased items from localStorage
    const savedPurchasedItems = JSON.parse(localStorage.getItem("purchasedItems") || "[]")
    setPurchasedItems(savedPurchasedItems)
  }, [])

  const handlePurchase = (item: ShopItem) => {
    if (goldBalance < item.price) {
      toast({
        title: "Insufficient Gold",
        description: "You don't have enough gold to purchase this item.",
        variant: "destructive"
      })
      return
    }

    // Update gold balance
    const newBalance = goldBalance - item.price
    setGoldBalance(newBalance)
    localStorage.setItem("goldBalance", newBalance.toString())

    // Update purchased items
    const newPurchasedItems = [...purchasedItems, item.id]
    setPurchasedItems(newPurchasedItems)
    localStorage.setItem("purchasedItems", JSON.stringify(newPurchasedItems))

    toast({
      title: "Item Purchased!",
      description: `You have purchased ${item.name} for ${item.price} gold.`
    })
  }

  if (!location) {
    router.push('/404')
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Location Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">{location.name}</h1>
        <p className="text-muted-foreground">{location.description}</p>
      </div>

      {/* Notable Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {location.notableLocations.map((place) => (
          <Card key={place.id} className="overflow-hidden">
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}> {/* 16:9 aspect ratio (56.25% = 9/16) */}
              <Image
                src={place.image}
                alt={place.name}
                fill
                className="object-cover"
              />
            </div>
            <CardHeader>
              <CardTitle>{place.name}</CardTitle>
              <CardDescription>{place.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {place.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-2 rounded-lg bg-secondary">
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-500">{item.price} gold</span>
                      <Button
                        onClick={() => handlePurchase(item)}
                        disabled={purchasedItems.includes(item.id) || goldBalance < item.price}
                        size="sm"
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        {purchasedItems.includes(item.id) ? "Purchased" : "Buy"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gold Balance */}
      <div className="fixed bottom-4 right-4 bg-background/80 backdrop-blur-sm p-4 rounded-lg border">
        <p className="text-amber-500">Gold Balance: {goldBalance}</p>
      </div>
    </div>
  )
} 