"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { ShoppingCart } from "lucide-react"
import { HeaderSection } from "@/components/HeaderSection"

interface ShopItem {
  id: string
  name: string
  description: string
  price: number
}

interface NotableLocation {
  id: string
  name: string
  description: string
  image: string
  items: ShopItem[]
}

interface LocationData {
  name: string
  description: string
  image: string
  notableLocations: NotableLocation[]
}

interface LocationClientProps {
  location: LocationData
}

export function LocationClient({ location }: LocationClientProps) {
  const router = useRouter()
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
        description: "You don&rsquo;t have enough gold to purchase this item.",
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

  return (
    <div className="container mx-auto px-4 py-8">
      <HeaderSection
        title={location.name}
        subtitle={location.description}
        imageSrc={location.image}
        canEdit={false}
        defaultBgColor="bg-green-900"
      />

      {/* Notable Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {location.notableLocations.map((place) => (
          <Card key={place.id} className="overflow-hidden">
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}> {/* 16:9 aspect ratio */}
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