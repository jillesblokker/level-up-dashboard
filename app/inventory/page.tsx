"use client"

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { useSupabase } from "@/lib/hooks/useSupabase";
import { useSupabaseRealtimeSync } from "@/hooks/useSupabaseRealtimeSync";
import { getInventory, InventoryItem } from "@/lib/inventory-manager";

const ITEM_TYPES = [
  { value: "resource", label: "Resources", emoji: "🌿" },
  { value: "item", label: "Items", emoji: "📦" },
  { value: "creature", label: "Creatures", emoji: "🐉" },
  { value: "scroll", label: "Scrolls", emoji: "📜" },
  { value: "equipment", label: "Equipment", emoji: "⚔️" },
  { value: "artifact", label: "Artifacts", emoji: "🏺" },
  { value: "book", label: "Books", emoji: "📚" },
  { value: "mount", label: "Mounts", emoji: "🐎" },
  { value: "weapon", label: "Weapons", emoji: "🗡️" },
  { value: "shield", label: "Shields", emoji: "🛡️" },
  { value: "armor", label: "Armor", emoji: "🦺" },
];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();
  const { user } = useUser();
  const { supabase, isLoading: supabaseLoading } = useSupabase();

  // Tabs configuration for navigation
  const tabOptions = [
    { value: "all", label: "All Items" },
    ...ITEM_TYPES.map(type => ({ value: type.value, label: type.label }))
  ];

  // Load inventory items
  const loadItems = async () => {
    try {
      setIsLoading(true);
      if (user?.id) {
        const inventoryItems = await getInventory(user.id);
        setItems(inventoryItems || []);
      }
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
  };

  useEffect(() => {
    loadItems();
  }, [user?.id]);

  // 🎯 REAL-TIME SUPABASE SUBSCRIPTIONS for instant inventory updates
  useSupabaseRealtimeSync({
    table: 'inventory_items',
    userId: user?.id,
    onChange: () => {
      console.log('[Inventory] Real-time update received from inventory_items table');
      loadItems();
    }
  });

  // 🎯 REAL-TIME SUPABASE SUBSCRIPTIONS for character stats updates
  useSupabaseRealtimeSync({
    table: 'character_stats',
    userId: user?.id,
    onChange: () => {
      console.log('[Inventory] Real-time update received from character_stats table');
      // Refresh inventory when character stats change (e.g., equipped items)
      loadItems();
    }
  });

  // Keep legacy event listeners for backward compatibility
  useEffect(() => {
    const handleInventoryUpdate = () => {
      console.log('[Inventory] Legacy inventory update event received');
      loadItems();
    };

    window.addEventListener("character-inventory-update", handleInventoryUpdate);
    
    return () => {
      window.removeEventListener("character-inventory-update", handleInventoryUpdate);
    };
  }, []);

  const filteredItems = activeTab === "all" 
    ? items 
    : items.filter(item => item.type === activeTab);

  const renderItemCard = (item: InventoryItem) => (
    <Card key={item.id} className="bg-gray-800 border-gray-700 hover:border-amber-500 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            {item.emoji ? (
              <div className="text-4xl">{item.emoji}</div>
            ) : item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white truncate">{item.name}</h3>
              <Badge variant={item.equipped ? "default" : "secondary"}>
                {item.equipped ? "Equipped" : item.type}
              </Badge>
            </div>
            
            {item.description && (
              <p className="text-gray-300 text-sm mb-2 line-clamp-2">{item.description}</p>
            )}
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Quantity: <span className="text-amber-400 font-semibold">{item.quantity}</span>
              </div>
              
                             {item.stats && Object.keys(item.stats).length > 0 && (
                 <div className="text-xs text-gray-500">
                   {Object.entries(item.stats).map(([key, value]) => (
                     <span key={key} className="mr-2">
                       {key}: {String(value)}
                     </span>
                   ))}
                 </div>
               )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading || supabaseLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-500 mb-2">Loading Inventory...</div>
            <div className="text-gray-400">Fetching your items from the database</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-amber-500 mb-2">Inventory</h1>
        <p className="text-gray-400">
          Manage your collected items, equipment, and resources
        </p>
      </div>

      <Card className="bg-black border-amber-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-amber-500 text-2xl font-bold">Your Items</CardTitle>
              <CardDescription className="text-gray-300">
                {filteredItems.length} items found
              </CardDescription>
            </div>
            <Button
              onClick={loadItems}
              variant="outline"
              className="border-amber-800 text-amber-500 hover:bg-amber-800 hover:text-white"
              aria-label="Refresh inventory"
            >
              🔄 Refresh
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-6">
              <TabsTrigger value="all" aria-label="All items tab">All</TabsTrigger>
              {ITEM_TYPES.slice(0, 5).map(type => (
                <TabsTrigger key={type.value} value={type.value} aria-label={`${type.label} tab`}>
                  {type.emoji} {type.label}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsList className="grid w-full grid-cols-6 mb-6">
              {ITEM_TYPES.slice(5).map(type => (
                <TabsTrigger key={type.value} value={type.value} aria-label={`${type.label} tab`}>
                  {type.emoji} {type.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">No items found</h3>
                  <p className="text-gray-500">
                    {activeTab === "all" 
                      ? "Your inventory is empty. Start collecting items by completing quests and exploring the realm!"
                      : `No ${activeTab} items found. Try completing quests or exploring different areas.`
                    }
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[600px] pr-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredItems.map(renderItemCard)}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

