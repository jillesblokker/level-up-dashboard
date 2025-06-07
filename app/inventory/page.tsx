"use client"

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Sword, Shield, Beaker, Gem, Scroll, Crown } from "lucide-react";
import Link from "next/link";
import { InventoryItem, getInventory } from "@/lib/inventory-manager";

const ITEM_TYPES = [
  { value: "weapon", label: "Weapon", icon: <Sword className="h-4 w-4" /> },
  { value: "armor", label: "Armor", icon: <Shield className="h-4 w-4" /> },
  { value: "potion", label: "Potion", icon: <Beaker className="h-4 w-4" /> },
  { value: "treasure", label: "Treasure", icon: <Gem className="h-4 w-4" /> },
  { value: "scroll", label: "Scroll", icon: <Scroll className="h-4 w-4" /> },
  { value: "misc", label: "Miscellaneous", icon: <Crown className="h-4 w-4" /> },
];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  // Tabs configuration for navigation
  const tabOptions = [
    { value: "all", label: "All Items" },
    ...ITEM_TYPES.map(type => ({ value: type.value, label: type.label }))
  ];

  useEffect(() => {
    function loadItems() {
      try {
        setIsLoading(true);
        const inventoryItems = getInventory();
        setItems(inventoryItems);
      } catch (error) {
        console.error("Error loading inventory items:", error);
        toast({
          title: "Error",
          description: "Failed to load inventory items",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadItems();
    // Listen for inventory updates
    window.addEventListener("character-inventory-update", loadItems);
    return () => {
      window.removeEventListener("character-inventory-update", loadItems);
    };
  }, []);

  const filteredItems = activeTab === "all" 
    ? items 
    : items.filter(item => item.type === activeTab);

  const renderItemCard = (item: InventoryItem) => {
    const itemType = ITEM_TYPES.find(type => type.value === item.type);
    
    return (
      <Card key={item.id} className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{item.emoji || "🎒"}</span>
            <div>
              <CardTitle className="text-lg">{item.name}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-2">
              {itemType?.icon}
              <span>{itemType?.label || "Item"}</span>
            </div>
            <div>Quantity: {item.quantity}</div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-4 pt-20">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/kingdom">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Inventory</h1>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          {tabOptions.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab}>
          {isLoading ? (
            <div className="text-center py-8">Loading items...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No items found in this category
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map(renderItemCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

