"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { KingdomStatsGraph } from "@/components/kingdom-stats-graph"
import Image from "next/image"
import { useState, useRef, useEffect } from "react"
import { Camera, X, Upload, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { signIn } from "next-auth/react"
import { defaultInventoryItems, InventoryItem } from "@/app/lib/default-inventory"
import { Badge } from "@/components/ui/badge"

export function KingdomClient({ session }: { session: any }) {
  const [isHovering, setIsHovering] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [coverImage, setCoverImage] = useState("/images/kingdom-header.jpg")
  const [isUploading, setIsUploading] = useState(false)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Load inventory on mount
  useEffect(() => {
    const loadInventory = () => {
      // Start with default items
      const savedInventory = localStorage.getItem('kingdom-inventory')
      if (savedInventory) {
        setInventory(JSON.parse(savedInventory))
      } else {
        setInventory(defaultInventoryItems)
        localStorage.setItem('kingdom-inventory', JSON.stringify(defaultInventoryItems))
      }
    }
    
    loadInventory()
    
    // Listen for inventory updates
    window.addEventListener('character-inventory-update', loadInventory)
    return () => window.removeEventListener('character-inventory-update', loadInventory)
  }, [])

  // Load saved image from localStorage if available
  useEffect(() => {
    const savedImage = localStorage.getItem("kingdom-header-image")
    if (savedImage) {
      setCoverImage(savedImage)
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
          localStorage.setItem("kingdom-header-image", result)
          if (typeof window !== 'undefined') {
            (window as any).headerImages = (window as any).headerImages || {}
            ;(window as any).headerImages.kingdom = result
          }
          setIsUploading(false)
          setShowUploadModal(false)
          
          toast({
            title: "Banner Updated",
            description: "Your kingdom banner has been updated successfully.",
          })
        } catch (err) {
          setIsUploading(false)
          toast({
            title: "Upload Failed",
            description: "There was an error processing your image.",
            variant: "destructive",
          })
        }
      }
      reader.onerror = () => {
        setIsUploading(false)
        toast({
          title: "Upload Failed",
          description: "There was an error reading your image file.",
          variant: "destructive",
        })
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setIsUploading(false)
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your image.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header Section */}
      <div 
        className="relative h-[300px] md:h-[400px] lg:h-[600px] w-full max-w-full overflow-hidden"
        aria-label="kingdom-header-section"
      >
        <Image
          src={coverImage}
          alt="Kingdom Header"
          fill
          className="object-cover"
          priority
        />
        <div 
          className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80"
          aria-label="header-gradient-overlay"
        />
        
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center z-[5] gap-6"
          aria-label="kingdom-title-container"
        >
          <h1 className="text-4xl sm:text-5xl font-bold tracking-widest drop-shadow-lg font-medieval text-amber-500">
            KINGDOM
          </h1>
        </div>
        
        {session && (
          <div 
            className={cn(
              "absolute inset-0 bg-black/50 opacity-0 transition-opacity flex items-center justify-center",
              { "opacity-100": isHovering || showUploadModal }
            )}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <Button
              className="text-white border-white hover:bg-white/20"
              onClick={() => setShowUploadModal(true)}
            >
              <Camera className="w-4 h-4 mr-2" />
              Change Banner
            </Button>
          </div>
        )}

        {showUploadModal && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="bg-black p-6 rounded-lg border-2 border-amber-800/50 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-amber-500">Upload New Banner</h3>
                <Button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-white h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                ref={fileInputRef}
                className="hidden"
              />
              <Button
                className="w-full text-amber-500 border-amber-800/50 hover:bg-amber-950/30"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? "Uploading..." : "Select Image"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div 
        className="container mx-auto p-4 space-y-8"
        aria-label="kingdom-main-content"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Kingdom Stats */}
          <Card 
            className="bg-black border-amber-800/50"
            aria-label="kingdom-stats-card"
          >
            <CardHeader>
              <CardTitle className="text-amber-500">Kingdom Statistics</CardTitle>
              <CardDescription className="text-gray-400">Track your realm's growth</CardDescription>
            </CardHeader>
            <CardContent>
              <KingdomStatsGraph />
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card 
            className="bg-black border-amber-800/50"
            aria-label="kingdom-inventory-card"
          >
            <CardHeader>
              <CardTitle className="text-amber-500">Kingdom Inventory</CardTitle>
              <CardDescription className="text-gray-400">Your equipment and resources</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea 
                className="h-[calc(100vh-20rem)] rounded-md border border-amber-800/20 p-4"
                aria-label="kingdom-inventory-scroll-area"
              >
                <div 
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  aria-label="inventory-items-grid"
                >
                  {inventory.map((item) => (
                    <Card 
                      key={item.id} 
                      className="bg-black/50 border-amber-800/30"
                      aria-label={`inventory-item-${item.id}`}
                    >
                      <CardHeader className="p-4">
                        <div 
                          className="flex items-center justify-between"
                          aria-label={`item-header-${item.id}`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">{item.emoji}</span>
                            <div>
                              <h4 className="text-amber-500 font-semibold">{item.name}</h4>
                              <p className="text-xs text-gray-400">{item.type}</p>
                            </div>
                          </div>
                          {Object.entries(item.stats).map(([stat, value]) => (
                            <Badge key={stat} className="bg-amber-950/30 text-amber-500 border-amber-800/30">
                              {stat} +{value}
                            </Badge>
                          ))}
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-sm text-gray-400">{item.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 