"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ShoppingCart } from "lucide-react"
import { db } from "@/lib/db"

interface LocationItem {
  id: string
  name: string
  price: number
  description: string
}

interface Location {
  id: string
  name: string
  description: string
  image: string
  items: LocationItem[]
}

interface InventoryItem {
  name: string;
  type: string;
  description: string;
  quantity: number;
  acquired: string;
}

interface PageParams {
  id: string
}

export default function LocationPage() {
  const params = useParams()
  const locationId = params?.id as string
  const [location, setLocation] = useState<Location | null>(null)
  const [goldBalance, setGoldBalance] = useState(0)
  const [purchasedItems, setPurchasedItems] = useState<string[]>([])

  useEffect(() => {
    if (!locationId) return

    // Load location data from localStorage
    const locations = JSON.parse(localStorage.getItem("notableLocations") || "[]")
    const currentLocation = locations.find((loc: Location) => loc.id === locationId)
    setLocation(currentLocation || null)

    // Load gold balance
    const savedGold = localStorage.getItem("goldBalance")
    setGoldBalance(savedGold ? parseInt(savedGold) : 5000)

    // Load purchased items
    const savedPurchasedItems = JSON.parse(localStorage.getItem("purchasedItems") || "[]")
    setPurchasedItems(savedPurchasedItems)
  }, [locationId])

  const handlePurchase = async (item: LocationItem) => {
    if (goldBalance < item.price) {
      toast({
        title: "Insufficient Gold",
        description: "You don't have enough gold to purchase this item.",
        variant: "destructive"
      })
      return
    }

    try {
      // Update gold balance
      const newBalance = goldBalance - item.price
      setGoldBalance(newBalance)
      localStorage.setItem("goldBalance", newBalance.toString())

      // Update purchased items in localStorage
      const newPurchasedItems = [...purchasedItems, item.id]
      setPurchasedItems(newPurchasedItems)
      localStorage.setItem("purchasedItems", JSON.stringify(newPurchasedItems))

      // Add item to inventory database
      const itemType = determineItemType(item.name.toLowerCase())
      const inventoryItem: Omit<InventoryItem, "id"> = {
        name: item.name,
        type: itemType,
        description: item.description,
        quantity: 1,
        acquired: new Date().toISOString(),
      }

      await db.inventory.add(inventoryItem)

      // Dispatch event to update inventory counts
      window.dispatchEvent(new Event("inventory-update"))

      toast({
        title: "Item Purchased!",
        description: `You have purchased ${item.name} for ${item.price} gold.`
      })
    } catch (error) {
      console.error("Error purchasing item:", error)
      toast({
        title: "Error",
        description: "Failed to purchase item. Please try again.",
        variant: "destructive"
      })
    }
  }

  const determineItemType = (itemName: string): string => {
    if (itemName.includes("sword") || itemName.includes("axe") || itemName.includes("bow")) {
      return "weapon"
    }
    if (itemName.includes("armor") || itemName.includes("shield") || itemName.includes("mail")) {
      return "armor"
    }
    if (itemName.includes("potion") || itemName.includes("elixir")) {
      return "potion"
    }
    if (itemName.includes("map") || itemName.includes("scroll")) {
      return "scroll"
    }
    if (itemName.includes("gem") || itemName.includes("gold") || itemName.includes("jewel")) {
      return "treasure"
    }
    return "misc"
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl text-red-500">Location not found</h1>
          <Link href="/kingdom" className="text-amber-500 hover:text-amber-400">
            Return to Kingdom
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header Image */}
      <div className="relative h-[300px] w-full">
        <Image
          src={location.image}
          alt={location.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 -mt-16 relative">
        {/* Back button */}
        <Link href="/kingdom">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Kingdom
          </Button>
        </Link>

        <Card className="bg-black/60 backdrop-blur-sm border-amber-800/20">
          <CardHeader>
            <CardTitle className="text-3xl font-medieval text-amber-500">{location.name}</CardTitle>
            <CardDescription>{location.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {location.items.map((item) => (
                <Card key={item.id} className="bg-black/60 border-amber-800/20">
                  <CardHeader>
                    <CardTitle className="text-xl">{item.name}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <span className="text-amber-500">{item.price} gold</span>
                      <Button
                        onClick={() => handlePurchase(item)}
                        disabled={purchasedItems.includes(item.id) || goldBalance < item.price}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        {purchasedItems.includes(item.id) ? "Purchased" : "Buy"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gold Balance */}
        <div className="fixed bottom-4 right-4 bg-black/80 p-4 rounded-lg border border-amber-800/20">
          <p className="text-amber-500">Gold Balance: {goldBalance}</p>
        </div>
      </div>
    </div>
  )
} 