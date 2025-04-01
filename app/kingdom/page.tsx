"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { DailyQuests } from "@/components/daily-quests"
import { KingdomStatsGraph } from "@/components/kingdom-stats-graph"
import Image from "next/image"
import { useState, useRef, useEffect } from "react"
import { Upload, Camera, Edit, X, MapPin, User, Backpack } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRealm } from "@/lib/realm-context"
import { db } from "@/lib/db"

export default function KingdomPage() {
  const [goldBalance, setGoldBalance] = useState(5000)
  const [isHovering, setIsHovering] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [coverImage, setCoverImage] = useState("/images/kingdom-header.jpg")
  const [isUploading, setIsUploading] = useState(false)
  const [totalItems, setTotalItems] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { grid } = useRealm()

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

  // Load inventory stats
  useEffect(() => {
    const loadInventoryStats = async () => {
      try {
        const items = await db.inventory.toArray()
        const total = items.reduce((sum, item) => sum + item.quantity, 0)
        setTotalItems(total)
      } catch (error) {
        console.error("Error loading inventory stats:", error)
      }
    }
    loadInventoryStats()

    // Listen for inventory updates
    window.addEventListener("inventory-update", loadInventoryStats)
    return () => {
      window.removeEventListener("inventory-update", loadInventoryStats)
    }
  }, [])

  // Save location data to localStorage for use in location pages
  useEffect(() => {
    try {
      // Save location data to localStorage
      localStorage.setItem("notableLocations", JSON.stringify(notableLocations))
      console.log("Saved notableLocations to localStorage:", notableLocations.length)
      
      // Set default gold if not already set
      if (!localStorage.getItem('goldBalance')) {
        localStorage.setItem('goldBalance', '5000')
      }
      
      // Initialize purchased items if not already set
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    
    // Use try-catch to handle potential errors during file reading
    try {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const result = event.target?.result as string
          setCoverImage(result)
          localStorage.setItem("kingdom-cover-image", result)
          setIsUploading(false)
          setShowUploadModal(false) // Hide modal after successful upload
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

  const tabs = [
    { value: "quests", label: "Quests" },
    { value: "gold", label: "Gold" },
    { value: "experience", label: "Experience" }
  ]

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
    return count * 10 // Each tile is 10 sq miles
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Add your NavBar here with md:block hidden class if it exists */}
      
      {/* Hero Section with Image */}
      <div 
        className="relative h-[300px] sm:h-[400px] md:h-[500px] w-full max-w-full overflow-hidden"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <Image
          src={coverImage}
          alt="Kingdom of Thrivehaven"
          fill
          className="object-cover"
          priority
          quality={100}
          onError={() => {
            // Set a default fallback image
            setCoverImage("/images/default-kingdom-header.jpg")
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80" />
        
        {/* Edit button that appears on hover */}
        {isHovering && !showUploadModal && (
          <div className="absolute top-4 right-4 z-20">
            <Button 
              onClick={() => setShowUploadModal(true)}
              className="bg-amber-700 hover:bg-amber-600 text-white rounded-full h-12 w-12 flex items-center justify-center"
              size="icon"
            >
              <Edit size={20} />
            </Button>
          </div>
        )}
        
        {/* Image upload modal that appears only when edit button is clicked */}
        {showUploadModal && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-300 z-10">
            <div className="bg-black/90 p-6 rounded-lg border border-amber-500/50 backdrop-blur-md max-w-md relative">
              {/* Close button */}
              <Button 
                onClick={() => setShowUploadModal(false)}
                className="absolute top-2 right-2 rounded-full h-8 w-8 p-0 bg-transparent hover:bg-gray-800"
                size="icon"
              >
                <X size={16} className="text-gray-400" />
              </Button>
              
              <h3 className="text-xl text-amber-500 mb-4 font-medieval text-center">Change Kingdom Banner</h3>
              
              <Button 
                onClick={triggerFileInput}
                className="w-full mb-3 bg-amber-700 hover:bg-amber-600 text-white flex items-center justify-center gap-2"
                disabled={isUploading}
              >
                <Upload size={18} />
                {isUploading ? 'Uploading...' : 'Upload Image'}
              </Button>
              
              <p className="text-gray-400 text-sm text-center">
                Upload a JPG, PNG or GIF image for your kingdom banner
              </p>
              
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg,image/png,image/gif" 
                onChange={handleImageUpload}
              />
            </div>
          </div>
        )}
        
        <div className="absolute inset-0 flex items-center justify-center z-[5]">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-widest drop-shadow-lg font-medieval text-amber-500">
            THRIVEHAVEN
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="container px-4 py-8">
        {/* Kingdom Stats */}
        <div className="grid gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Kingdom Overview</CardTitle>
              <CardDescription>Your realm at a glance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <h3 className="text-lg font-semibold">Territory</h3>
                  <p className="text-2xl font-bold">{calculateTerritory()} sq miles</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Settlements</h3>
                  <p className="text-2xl font-bold">{countSettlements()}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Treasury</h3>
                  <p className="text-2xl font-bold">{goldBalance} gold</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Overview */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Royal Treasury & Inventory</CardTitle>
              <CardDescription>Your collected items and treasures</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">Total Items</p>
                  <p className="text-3xl font-bold">{totalItems}</p>
                </div>
                <Link href="/inventory">
                  <Button className="flex items-center gap-2">
                    <Backpack className="h-4 w-4" />
                    View Inventory
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notable Locations */}
        <div className="grid gap-6">
          <h2 className="text-2xl font-bold">Notable Locations</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {notableLocations.map((location) => (
              <Link key={location.id} href={`/locations/${location.id}`}>
                <Card className="h-full hover:bg-accent transition-colors cursor-pointer">
                  <div className="aspect-video relative overflow-hidden rounded-t-lg">
                    <Image
                      src={location.image}
                      alt={location.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle>{location.name}</CardTitle>
                    <CardDescription>{location.description}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      <MapPin className="h-4 w-4 mr-2" />
                      Visit Location
                    </Button>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 