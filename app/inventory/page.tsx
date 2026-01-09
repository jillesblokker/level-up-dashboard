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
import { InventorySkeleton } from "@/components/skeletons/inventory-skeleton";
import { TEXT_CONTENT } from "@/lib/text-content";
import { getStarDisplay, getStarTierInfo, calculateItemValue } from "@/lib/star-rating";

const ITEM_TYPES = [
  { value: "resource", label: TEXT_CONTENT.inventory.itemTypes.resource, emoji: "🌿" },
  { value: "item", label: TEXT_CONTENT.inventory.itemTypes.item, emoji: "📦" },
  { value: "creature", label: TEXT_CONTENT.inventory.itemTypes.creature, emoji: "🐉" },
  { value: "scroll", label: TEXT_CONTENT.inventory.itemTypes.scroll, emoji: "📜" },
  { value: "equipment", label: TEXT_CONTENT.inventory.itemTypes.equipment, emoji: "⚔️" },
  { value: "artifact", label: TEXT_CONTENT.inventory.itemTypes.artifact, emoji: "🏺" },
  { value: "book", label: TEXT_CONTENT.inventory.itemTypes.book, emoji: "📚" },
  { value: "mount", label: TEXT_CONTENT.inventory.itemTypes.mount, emoji: "🐎" },
  { value: "weapon", label: TEXT_CONTENT.inventory.itemTypes.weapon, emoji: "🗡️" },
  { value: "shield", label: TEXT_CONTENT.inventory.itemTypes.shield, emoji: "🛡️" },
  { value: "armor", label: TEXT_CONTENT.inventory.itemTypes.armor, emoji: "🦺" },
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
    { value: "all", label: TEXT_CONTENT.inventory.itemTypes.all },
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
        title: TEXT_CONTENT.inventory.ui.loadingError,
        description: TEXT_CONTENT.inventory.ui.loadingErrorDesc,
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
      // Removed debugging log
      loadItems();
    }
  });

  // 🎯 REAL-TIME SUPABASE SUBSCRIPTIONS for character stats updates
  useSupabaseRealtimeSync({
    table: 'character_stats',
    userId: user?.id,
    onChange: () => {
      // Removed debugging log
      // Refresh inventory when character stats change (e.g., equipped items)
      loadItems();
    }
  });

  // Keep legacy event listeners for backward compatibility
  useEffect(() => {
    const handleInventoryUpdate = () => {
      // Removed debugging log
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

  const renderItemCard = (item: InventoryItem) => {
    // Get star rating info (default to 0 if not present)
    const starRating = (item as any).star_rating ?? 0;
    const tierInfo = getStarTierInfo(starRating);
    const starsDisplay = getStarDisplay(starRating);
    const baseValue = (item as any).cost ?? 0;
    const actualValue = calculateItemValue(baseValue, starRating);

    // Glow classes based on rarity
    const glowClass = starRating === 3
      ? 'ring-2 ring-amber-400 shadow-xl shadow-amber-500/40 animate-pulse'
      : starRating === 2
        ? 'ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20'
        : starRating === 1
          ? 'ring-1 ring-yellow-400/30'
          : '';

    return (
      <Card
        key={item.id}
        className={`bg-gray-800 border-gray-700 hover:border-amber-500 transition-colors relative ${glowClass}`}
      >
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 relative">
              {item.emoji ? (
                <div className="text-4xl">{item.emoji}</div>
              ) : item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-lg"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    (e.target as HTMLImageElement).src = "/images/items/placeholder.png";
                  }}
                />
              ) : (
                <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📦</span>
                </div>
              )}

              {/* Star Rating Badge */}
              {starRating > 0 && (
                <div className="absolute -top-1 -right-1 bg-black/90 rounded-full px-1.5 py-0.5 text-xs border border-amber-500/50">
                  {starsDisplay}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-lg font-semibold truncate ${starRating >= 2 ? 'text-amber-400' : starRating === 1 ? 'text-yellow-400' : 'text-white'}`}>
                  {item.name}
                </h3>
                <div className="flex items-center gap-2">
                  {starRating > 0 && (
                    <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-400">
                      {tierInfo.name}
                    </Badge>
                  )}
                  <Badge variant={item.equipped ? "default" : "secondary"}>
                    {item.equipped ? TEXT_CONTENT.inventory.ui.equipped : item.type}
                  </Badge>
                </div>
              </div>

              {item.description && (
                <p className="text-gray-300 text-sm mb-2 line-clamp-2">{item.description}</p>
              )}

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  {TEXT_CONTENT.inventory.ui.quantity} <span className="text-amber-400 font-semibold">{item.quantity}</span>
                </div>

                {/* Show value with multiplier for starred items */}
                {baseValue > 0 && (
                  <div className="text-sm">
                    <span className="text-amber-400 font-bold">{actualValue} 🪙</span>
                    {starRating > 0 && (
                      <span className="text-gray-500 ml-1 text-xs">({tierInfo.multiplier}x)</span>
                    )}
                  </div>
                )}

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

          {/* Legendary sparkle effect */}
          {starRating === 3 && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
              <div className="absolute top-2 left-2 w-1 h-1 bg-amber-300 rounded-full animate-ping" />
              <div className="absolute bottom-4 right-4 w-1 h-1 bg-orange-300 rounded-full animate-ping" style={{ animationDelay: '0.3s' }} />
              <div className="absolute top-1/2 left-1/3 w-0.5 h-0.5 bg-yellow-200 rounded-full animate-ping" style={{ animationDelay: '0.7s' }} />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading || supabaseLoading) {
    return <InventorySkeleton />;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-amber-500 mb-2">{TEXT_CONTENT.inventory.header.title}</h1>
        <p className="text-gray-400">
          {TEXT_CONTENT.inventory.header.subtitle}
        </p>
      </div>

      <Card className="bg-black border-amber-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-amber-500 text-2xl font-bold">{TEXT_CONTENT.inventory.ui.yourItems}</CardTitle>
              <CardDescription className="text-gray-300">
                {TEXT_CONTENT.inventory.ui.itemsFound.replace("{count}", String(filteredItems.length))}
              </CardDescription>
            </div>
            <Button
              onClick={loadItems}
              variant="outline"
              className="border-amber-800 text-amber-500 hover:bg-amber-800 hover:text-white"
              aria-label="Refresh inventory"
            >
              🔄 {TEXT_CONTENT.inventory.ui.refresh}
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
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">{TEXT_CONTENT.inventory.ui.emptyTitle}</h3>
                  <p className="text-gray-500">
                    {activeTab === "all"
                      ? TEXT_CONTENT.inventory.ui.emptyAll
                      : TEXT_CONTENT.inventory.ui.emptyFilter.replace("{type}", activeTab)
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

