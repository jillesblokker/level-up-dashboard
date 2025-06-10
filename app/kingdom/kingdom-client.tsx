"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { KingdomStatsGraph } from "@/components/kingdom-stats-graph"
import Image from "next/image"
import { useState, useRef, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { HeaderSection } from "@/components/HeaderSection"
import { InventoryItem, defaultInventoryItems } from "@/app/lib/default-inventory"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Session } from '@supabase/supabase-js'

interface WindowWithHeaderImages extends Window {
  headerImages?: Record<string, string>;
}

export function KingdomClient({ session }: { session: Session | null }) {
  const [coverImage, setCoverImage] = useState("/images/kingdom-header.jpg")
  const [inventory, setInventory] = useState<InventoryItem[]>([])

  // Load inventory from localStorage on mount
  useEffect(() => {
    const loadInventory = () => {
      const savedInventory = localStorage.getItem('kingdom-inventory')
      if (savedInventory && savedInventory !== '[]') {
        setInventory(JSON.parse(savedInventory))
      } else {
        setInventory(defaultInventoryItems)
      }
    }
    loadInventory()
    window.addEventListener('character-inventory-update', loadInventory)
    return () => window.removeEventListener('character-inventory-update', loadInventory)
  }, [])

  // Whenever inventory changes, update localStorage
  useEffect(() => {
    localStorage.setItem('kingdom-inventory', JSON.stringify(inventory))
  }, [inventory])

  // Load saved image from localStorage if available
  useEffect(() => {
    const savedImage = localStorage.getItem("kingdom-header-image")
    if (savedImage) {
      setCoverImage(savedImage)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <HeaderSection
        title="KINGDOM"
        imageSrc={coverImage}
        canEdit={!!session}
        onImageUpload={(file) => {
          // handleImageUpload logic here
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            setCoverImage(result);
            localStorage.setItem("kingdom-header-image", result);
            if (typeof window !== 'undefined') {
              const win = window as WindowWithHeaderImages;
              win.headerImages = win.headerImages || {};
              win.headerImages['kingdom'] = result;
            }
          };
          reader.readAsDataURL(file);
        }}
      />

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
              <CardDescription className="text-gray-400">Track your realm&apos;s growth</CardDescription>
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
                          className="flex flex-col items-center justify-center space-y-2"
                          aria-label={`item-header-${item.id}`}
                        >
                          <div className="w-full aspect-[4/3] relative mb-2">
                            <Image
                              src={item.image || "/images/items/placeholder.jpg"}
                              alt={`${item.name} ${item.type}`}
                              fill
                              className="object-contain rounded"
                              aria-label={`${item.name}-image`}
                              onError={(e) => { (e.target as HTMLImageElement).src = "/images/items/placeholder.jpg"; }}
                            />
                          </div>
                          <div className="flex flex-col items-center">
                            <h4 className="text-amber-500 font-semibold text-lg">{item.name}</h4>
                            <p className="text-xs text-gray-400">{item.type}</p>
                          </div>
                        </div>
                        {Object.entries(item.stats ?? {}).map(([stat, value]) => (
                          <Badge key={stat} className="bg-amber-950/30 text-amber-500 border-amber-800/30 mt-2">
                            {stat} +{value}
                          </Badge>
                        ))}
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