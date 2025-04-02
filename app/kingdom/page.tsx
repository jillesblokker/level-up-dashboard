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
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

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
      image: "/images/locations/tavern.jpg",
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
      image: "/images/locations/stables.jpg",
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
      image: "/images/locations/market.jpg",
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
      image: "/images/locations/blacksmith.jpg",
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

  useEffect(() => {
    // Load purchased items from localStorage
    const savedItems = localStorage.getItem('purchasedItems')
    if (savedItems) {
      setPurchasedItems(JSON.parse(savedItems))
    }
    
    // Load gold balance from localStorage
    const savedGold = localStorage.getItem('goldBalance')
    if (savedGold) {
      setGoldBalance(parseInt(savedGold))
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

  const handlePurchase = (item: { id: string, name: string, price: number }, locationId: string) => {
    // Check if already purchased
    if (purchasedItems.some(i => i.id === item.id)) {
      return;
    }
    
    // Check if enough gold
    if (goldBalance < item.price) {
      toast({
        title: "Insufficient Gold",
        description: "You don't have enough gold to purchase this item.",
        variant: "destructive",
      });
      return;
    }
    
    // Update gold balance
    const newBalance = goldBalance - item.price;
    setGoldBalance(newBalance);
    localStorage.setItem('goldBalance', newBalance.toString());
    
    // Update purchased items
    const newPurchasedItems = [...purchasedItems, { id: item.id, name: item.name }];
    setPurchasedItems(newPurchasedItems);
    localStorage.setItem('purchasedItems', JSON.stringify(newPurchasedItems));
    
    toast({
      title: "Item Purchased!",
      description: `You have purchased ${item.name} for ${item.price} gold.`,
      variant: "default",
    });
    
    // Dispatch event to update kingdom stats
    updateKingdomStats.dispatchEvent(new CustomEvent('goldUpdate', { 
      detail: { amount: -item.price } 
    }));
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
        
        {/* Notable Locations Section */}
        <div className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-medieval text-amber-500 mb-4">Notable Locations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notableLocations.map((place) => (
              <Card key={place.id} className="overflow-hidden">
                <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                  <Image
                    src={place.image}
                    alt={place.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="text-xl text-amber-500">{place.name}</CardTitle>
                  <CardDescription>{place.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-amber-400">Available Items</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {place.items.map((item) => {
                        const isPurchased = purchasedItems.some(i => i.id === item.id);
                        return (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                            <div>
                              <h4 className="font-medium text-amber-100">{item.name}</h4>
                              <p className="text-sm text-gray-400">{item.description}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-amber-500">{item.price} gold</span>
                              <Button 
                                onClick={() => handlePurchase(item, place.id)}
                                disabled={isPurchased || goldBalance < item.price}
                                className={cn(
                                  "bg-amber-600 hover:bg-amber-700",
                                  isPurchased && "bg-gray-600 hover:bg-gray-600 cursor-not-allowed"
                                )}
                              >
                                {isPurchased ? "Owned" : "Buy"}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* After the Notable Locations section, add a Quick Links section */}
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
        
        {/* Daily Quests Section */}
        <DailyQuests />
        
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