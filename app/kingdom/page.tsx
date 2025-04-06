"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { KingdomStatsGraph } from "@/components/kingdom-stats-graph"
import Image from "next/image"
import { useState, useRef, useEffect } from "react"
import { Upload, Camera, Edit, X, MapPin, User, Backpack } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRealm } from "@/lib/realm-context"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { getInventory, InventoryItem } from "@/lib/inventory-manager"
import { PageTitle } from "@/components/ui/page-title"
import { RealmProvider } from "@/lib/realm-context"

// Extend Window interface to include headerImages
declare global {
  interface Window {
    headerImages?: {
      realm?: string;
      character?: string;
      quests?: string;
      guildhall?: string;
      achievements?: string;
      kingdom?: string;
    };
  }
}

export default function KingdomPage() {
  const [goldBalance, setGoldBalance] = useState(5000)
  const [isHovering, setIsHovering] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [coverImage, setCoverImage] = useState("/images/kingdom-header.jpg")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { grid } = useRealm()
  const [purchasedItems, setPurchasedItems] = useState<Array<{id: string, name: string}>>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])

  // Load header image from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedImage = localStorage.getItem("kingdom-header-image")
      if (savedImage) {
        setCoverImage(savedImage)
      } else if ((window as any).headerImages?.kingdom) {
        setCoverImage((window as any).headerImages.kingdom)
      }
    }
  }, [])

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
          // Update global state
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
          console.error("Error processing file:", err)
          setIsUploading(false)
          toast({
            title: "Upload Failed",
            description: "There was an error processing your image.",
            variant: "destructive",
          })
        }
      }
      reader.onerror = () => {
        console.error("Error reading file")
        setIsUploading(false)
        toast({
          title: "Upload Failed",
          description: "There was an error reading your image file.",
          variant: "destructive",
        })
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error("Error initiating file read:", err)
      setIsUploading(false)
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your image.",
        variant: "destructive",
      })
    }
  }

  return (
    <RealmProvider>
      <div className="flex flex-col gap-4 p-4">
        <PageTitle>KINGDOM</PageTitle>
        <div className="min-h-screen bg-black">
          {/* Hero Section with Image */}
          <div 
            className="relative h-[300px] md:h-[400px] lg:h-[600px] w-full max-w-full overflow-hidden"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <Image
              src={coverImage}
              alt="Kingdom Overview"
              fill
              className="object-cover"
              priority
              quality={100}
              onError={() => {
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
            
            {/* Image upload modal */}
            {showUploadModal && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-300 z-10">
                <div className="bg-black/90 p-6 rounded-lg border border-amber-500/50 backdrop-blur-md max-w-md relative">
                  <Button 
                    onClick={() => setShowUploadModal(false)}
                    className="absolute top-2 right-2 rounded-full h-8 w-8 p-0 bg-transparent hover:bg-gray-800"
                    size="icon"
                  >
                    <X size={16} className="text-gray-400" />
                  </Button>
                  
                  <h3 className="text-xl text-amber-500 mb-4 font-medieval text-center">Change Kingdom Banner</h3>
                  
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
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
              <h1 className="text-4xl sm:text-5xl font-bold tracking-widest drop-shadow-lg font-medieval text-amber-500 text-center">
                KINGDOM
              </h1>
            </div>
          </div>

          <div className="container mx-auto p-4 space-y-4">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border border-amber-800/20 bg-black">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Backpack className="h-6 w-6" />
                    Inventory
                  </CardTitle>
                  <CardDescription>Your collected items and scrolls</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {inventory && inventory.length > 0 ? (
                      inventory.map((item) => (
                        <Card key={item.id} className="p-4">
                          <div className="flex items-start gap-4">
                            {item.type === 'scroll' && (
                              <div className="text-2xl">📜</div>
                            )}
                            <div>
                              <h4 className="font-semibold">{item.name}</h4>
                              {item.description && (
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                              )}
                              {item.category && (
                                <p className="text-xs text-muted-foreground mt-1">Category: {item.category}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">Quantity: {item.quantity}</p>
                            </div>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No items in inventory</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </RealmProvider>
  )
}