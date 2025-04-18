"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { KingdomStatsGraph } from "@/components/kingdom-stats-graph"
import Image from "next/image"
import { useState, useRef, useEffect } from "react"
import { Camera, X, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { getInventory, InventoryItem } from "@/lib/inventory-manager"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function KingdomPage() {
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
      const items = getInventory()
      setInventory(items)
    }
    
    loadInventory()
    
    // Listen for inventory updates
    window.addEventListener('character-inventory-update', loadInventory)
    return () => window.removeEventListener('character-inventory-update', loadInventory)
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
      <div className="relative h-[300px] md:h-[400px] lg:h-[600px] w-full max-w-full overflow-hidden">
        <Image
          src={coverImage}
          alt="Kingdom Header"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80" />
        
        <div className="absolute inset-0 flex items-center justify-center z-[5]">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-widest drop-shadow-lg font-medieval text-amber-500">
            KINGDOM
          </h1>
        </div>
        
        <div 
          className={cn(
            "absolute inset-0 bg-black/50 opacity-0 transition-opacity flex items-center justify-center",
            { "opacity-100": isHovering || showUploadModal }
          )}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <Button
            variant="outline"
            className="text-white border-white hover:bg-white/20"
            onClick={() => setShowUploadModal(true)}
          >
            <Camera className="w-4 h-4 mr-2" />
            Change Banner
          </Button>
        </div>

        {showUploadModal && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="bg-black p-6 rounded-lg border-2 border-amber-800/50 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-amber-500">Upload New Banner</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-white"
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
                variant="outline"
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
      <div className="container mx-auto p-4 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Kingdom Stats */}
          <Card className="bg-black border-amber-800/50">
            <CardHeader>
              <CardTitle className="text-amber-500">Kingdom Statistics</CardTitle>
              <CardDescription className="text-gray-400">Track your realm's growth</CardDescription>
            </CardHeader>
            <CardContent>
              <KingdomStatsGraph />
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card className="bg-black border-amber-800/50">
            <CardHeader>
              <CardTitle className="text-amber-500">Kingdom Inventory</CardTitle>
              <CardDescription className="text-gray-400">Your collected resources and items</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] rounded-md border border-amber-800/20 p-4">
                {inventory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <p>No items in your inventory yet</p>
                    <p className="text-sm mt-2">Complete quests to earn resources</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inventory.map((item, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-3 rounded-lg bg-amber-950/20 hover:bg-amber-950/30 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">
                            {item.type === 'resource' && '🌟'}
                            {item.type === 'item' && '📦'}
                            {item.type === 'creature' && '🐾'}
                            {item.type === 'scroll' && '📜'}
                          </span>
                          <span className="text-amber-100 font-medium">{item.name}</span>
                        </div>
                        <span className="text-amber-400 font-bold">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}