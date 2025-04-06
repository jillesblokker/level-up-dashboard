"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { KingdomStatsGraph } from "@/components/kingdom-stats-graph"
import Image from "next/image"
import { useState, useRef, useEffect, Suspense, useCallback } from "react"
import { Upload, Camera, Edit, X, MapPin, User, Backpack } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRealm } from "@/lib/realm-context"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { getInventory, InventoryItem } from "@/lib/inventory-manager"
import { PageTitle } from "@/components/ui/page-title"
import { MapGrid } from "@/components/map-grid"
import { Tile } from "@/types/tiles"
import { useToast } from "@/components/ui/use-toast"
import { useRealmMap } from "@/lib/hooks/use-realm-map"

function createInitialTile(x: number, y: number): Tile {
  return {
    id: `tile-${x}-${y}`,
    type: 'grass',
    connections: [],
    rotation: 0,
    revealed: false,
    isDiscovered: false,
    x,
    y
  }
}

export default function KingdomPage() {
  const { grid, setGrid, isLoading } = useRealmMap()
  const [goldBalance, setGoldBalance] = useState(5000)
  const [isHovering, setIsHovering] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [coverImage, setCoverImage] = useState("/images/kingdom-header.jpg")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [purchasedItems, setPurchasedItems] = useState<Array<{id: string, name: string}>>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [character, setCharacter] = useState({ x: 0, y: 0 })
  const { toast } = useToast()

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

  const handleDiscovery = useCallback((message: string) => {
    toast({
      title: "Discovery!",
      description: message
    })
  }, [toast])

  const handleTilePlaced = useCallback((x: number, y: number) => {
    // Handle tile placement logic here
  }, [])

  const handleCharacterMove = useCallback((x: number, y: number) => {
    setCharacter({ x, y })
  }, [])

  const handleTileClick = useCallback((x: number, y: number) => {
    // Handle tile click logic here
  }, [])

  const handleGridUpdate = useCallback((newGrid: Tile[][]) => {
    setGrid(newGrid)
  }, [setGrid])

  const handleGoldUpdate = useCallback((amount: number) => {
    // Handle gold update logic here
  }, [])

  if (isLoading) {
    return <div>Loading realm map...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <PageTitle>KINGDOM</PageTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div>
          <Suspense fallback={<div>Loading map...</div>}>
            <MapGrid 
              onDiscovery={handleDiscovery}
              selectedTile={null}
              onTilePlaced={handleTilePlaced}
              grid={grid}
              character={character}
              onCharacterMove={handleCharacterMove}
              onTileClick={handleTileClick}
              onGridUpdate={handleGridUpdate}
              onGoldUpdate={handleGoldUpdate}
            />
          </Suspense>
        </div>
        <div>
          <Suspense fallback={<div>Loading stats...</div>}>
            <KingdomStatsGraph />
          </Suspense>
        </div>
      </div>
    </div>
  )
}