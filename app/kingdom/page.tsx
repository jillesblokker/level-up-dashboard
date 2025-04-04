"use client"

import React, { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { KingdomStatsGraph } from "@/components/kingdom-stats-graph"
import Image from "next/image"
import { Upload, Camera, Edit, X, MapPin, User, Backpack } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRealm } from "@/lib/realm-context"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

// Create an EventTarget instance for kingdom stats updates
const updateKingdomStats = new EventTarget()

export default function KingdomPage() {
  const [goldBalance, setGoldBalance] = useState(5000)
  const [isHovering, setIsHovering] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [coverImage, setCoverImage] = useState("/images/kingdom-header.jpg")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { grid } = useRealm()
  const [purchasedItems, setPurchasedItems] = useState<Array<{id: string, name: string}>>([])

  // Notable locations data
  const notableLocations = [
    {
      id: "tavern",
      name: "The Dragon's Rest Tavern",
      description: "A cozy tavern where adventurers gather to share tales and drink mead.",
      image: "/images/locations/The-dragon's-rest-tavern.png",
      items: [
        { id: "beer", name: "Frothy Ale", price: 5, description: "A refreshing drink after a long day of questing" },
        { id: "meal", name: "Hearty Stew", price: 15, description: "Fills your belly and restores energy" },
        { id: "room", name: "Night's Stay", price: 50, description: "A comfortable room to rest for the night" }
      ]
    },
    {
      id: "stables",
      name: "Royal Stables",
      description: "Fine steeds and mounts for your journeys across the kingdom.",
      image: "/images/locations/royal-stables.png",
      items: [
        { id: "horse", name: "Sturdy Steed", price: 500, description: "A reliable mount for your travels" },
        { id: "warhorse", name: "Battle-Trained Destrier", price: 1200, description: "A powerful warhorse fit for a knight" },
        { id: "feed", name: "Premium Horse Feed", price: 30, description: "Keep your mount happy and healthy" }
      ]
    },
    {
      id: "market",
      name: "Kingdom Marketplace",
      description: "Bustling market where merchants sell goods from across the land.",
      image: "/images/locations/kingdom-marketplace.png",
      items: [
        { id: "potion", name: "Healing Potion", price: 100, description: "Restores health in times of need" },
        { id: "map", name: "Treasure Map", price: 250, description: "Leads to hidden riches (maybe)" },
        { id: "torch", name: "Enchanted Torch", price: 75, description: "Never burns out, perfect for dark dungeons" }
      ]
    },
    {
      id: "blacksmith",
      name: "Ember's Anvil",
      description: "Master blacksmith crafting the finest weapons and armor.",
      image: "/images/locations/ember's-anvil.png",
      items: [
        { id: "sword", name: "Steel Longsword", price: 350, description: "Well-balanced weapon for any warrior" },
        { id: "shield", name: "Reinforced Shield", price: 300, description: "Sturdy protection in battle" },
        { id: "armor", name: "Chain Mail", price: 800, description: "Reliable protection without sacrificing mobility" }
      ]
    }
  ]

  // Save location data to localStorage for use in location pages
  useEffect(() => {
    try {
      localStorage.setItem("notableLocations", JSON.stringify(notableLocations))
      if (!localStorage.getItem('goldBalance')) {
        localStorage.setItem('goldBalance', '5000')
      }
      if (!localStorage.getItem('purchasedItems')) {
        localStorage.setItem('purchasedItems', '[]')
      }
    } catch (err) {
      console.error("Error saving locations to localStorage:", err)
    }
  }, [])

  // Load saved cover image from localStorage on component mount
  useEffect(() => {
    const savedImage = localStorage.getItem("kingdom-cover-image")
    if (savedImage) {
      setCoverImage(savedImage)
    }
  }, [])

  useEffect(() => {
    const savedItems = localStorage.getItem('purchasedItems')
    if (savedItems) {
      setPurchasedItems(JSON.parse(savedItems))
    }
    const savedGold = localStorage.getItem('goldBalance')
    if (savedGold) {
      setGoldBalance(parseInt(savedGold))
    }
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const result = event.target?.result as string
          setCoverImage(result)
          localStorage.setItem("kingdom-cover-image", result)
          setIsUploading(false)
          setShowUploadModal(false)
        } catch (err) {
          console.error("Error processing file:", err)
          setIsUploading(false)
        }
      }
      reader.onerror = () => {
        console.error("Error reading file")
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error("Error initiating file read:", err)
      setIsUploading(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Calculate number of settlements (towns and cities)
  const countSettlements = () => {
    let count = 0
    if (!grid || grid.length === 0) return count
    
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        if (grid[y][x].type === "city" || grid[y][x].type === "town") {
          count++
        }
      }
    }
    return count
  }
  
  // Calculate territory (each tile is 10 sq miles)
  const calculateTerritory = () => {
    let count = 0
    if (!grid || grid.length === 0) return count
    
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        if (grid[y][x].type !== "empty") {
          count++
        }
      }
    }
    return count * 10
  }

  const handlePurchase = (item: { id: string, name: string, price: number }, locationId: string) => {
    if (purchasedItems.some(i => i.id === item.id)) {
      return;
    }
    
    if (goldBalance < item.price) {
      toast({
        title: "Insufficient Gold",
        description: `You need ${item.price} gold to purchase ${item.name}`,
        variant: "destructive",
      })
      return
    }
    
    const newGoldBalance = goldBalance - item.price
    setGoldBalance(newGoldBalance)
    localStorage.setItem('goldBalance', newGoldBalance.toString())
    
    const newPurchasedItems = [...purchasedItems, { id: item.id, name: item.name }]
    setPurchasedItems(newPurchasedItems)
    localStorage.setItem('purchasedItems', JSON.stringify(newPurchasedItems))
    
    toast({
      title: "Purchase Successful",
      description: `You purchased ${item.name} for ${item.price} gold`,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="relative h-[300px] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={coverImage}
            alt="Kingdom Cover"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900"></div>
        </div>
        
        <div className="absolute bottom-4 right-4">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={triggerFileInput}
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 -mt-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
          <Card className="bg-black/80 border-amber-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-amber-500">Kingdom Stats</CardTitle>
              <CardDescription>Overview of your realm</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-gray-300">
                <p>Population: 10,000</p>
                <p>Settlements: {countSettlements()}</p>
                <p>Territory: {calculateTerritory()} sq miles</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/80 border-amber-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-amber-500">Resources</CardTitle>
              <CardDescription>Available resources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-gray-300">
                <p>Wood: 1,000</p>
                <p>Stone: 500</p>
                <p>Food: 2,000</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/80 border-amber-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-amber-500">Buildings</CardTitle>
              <CardDescription>Construction status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-gray-300">
                <p>Houses: 200</p>
                <p>Farms: 20</p>
                <p>Military: 5</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <section className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/profile">
              <Card className="h-full hover:bg-accent/5 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-2 text-amber-500" />
                    <CardTitle className="text-lg">Profile</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    View and update your adventurer's profile and statistics
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/inventory">
              <Card className="h-full hover:bg-accent/5 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <Backpack className="h-5 w-5 mr-2 text-amber-500" />
                    <CardTitle className="text-lg">Inventory</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Manage items and treasures you've collected on your adventures
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
        
        {/* Weekly Progress Graphs */}
        <div className="mt-8 mb-12">
          <h2 className="text-2xl sm:text-3xl font-medieval text-amber-500 mb-4">Weekly Progress</h2>
          <p className="text-gray-300 mb-6">Track your progress over the last week.</p>
          
          <div className="overflow-x-auto">
            <div className="min-w-[320px]">
              <KingdomStatsGraph />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 