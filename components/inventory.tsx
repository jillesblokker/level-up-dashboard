"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getInventory, InventoryItem } from "@/lib/inventory-manager"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function Inventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [selectedType, setSelectedType] = useState<string>("all")

  useEffect(() => {
    // Load inventory from localStorage
    const loadInventory = () => {
      setInventory(getInventory())
    }

    loadInventory()

    // Listen for inventory updates
    window.addEventListener("character-inventory-update", loadInventory)
    
    return () => {
      window.removeEventListener("character-inventory-update", loadInventory)
    }
  }, [])

  // Group items by type
  const itemsByType = inventory.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = []
    }
    acc[item.type].push(item)
    return acc
  }, {} as Record<string, InventoryItem[]>)

  const types = ["all", ...Object.keys(itemsByType)]

  const filteredItems = selectedType === "all" 
    ? inventory 
    : inventory.filter(item => item.type === selectedType)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory</CardTitle>
        <CardDescription>Your collected items and equipment</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" onValueChange={setSelectedType}>
          <TabsList className="mb-4">
            {types.map(type => (
              <TabsTrigger key={type} value={type} className="capitalize">
                {type}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={selectedType}>
            <ScrollArea className="h-[400px]">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map((item) => (
                  <Card key={item.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Type: {item.type}</p>
                      <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 