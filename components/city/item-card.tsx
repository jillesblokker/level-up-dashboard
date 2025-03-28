"use client"

import { Coins } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StoreItem, WeaponItem, ArmorItem, PotionItem, FoodItem, MountItem, MagicItem } from "@/lib/city-item-manager"

interface ItemCardProps {
  item: StoreItem | WeaponItem | ArmorItem | PotionItem | FoodItem | MountItem | MagicItem
  onPurchase: (item: any) => void
}

export function ItemCard({ item, onPurchase }: ItemCardProps) {
  // Helper to check if item is of a specific type
  const isWeapon = (item: any): item is WeaponItem => 'stats' in item && 'attack' in item.stats
  const isArmor = (item: any): item is ArmorItem => 'stats' in item && 'defense' in item.stats
  const isPotion = (item: any): item is PotionItem => 'stats' in item && ('health' in item.stats || 'mana' in item.stats || 'stamina' in item.stats)
  const isFood = (item: any): item is FoodItem => 'effect' in item
  const isMount = (item: any): item is MountItem => 'speed' in item && 'stamina' in item
  const isMagic = (item: any): item is MagicItem => 'power' in item

  // Get background color based on item category
  const getCardBackground = () => {
    if (isWeapon(item as any)) return "from-red-900/20 to-gray-900"
    if (isArmor(item as any)) return "from-blue-900/20 to-gray-900"
    if (isPotion(item as any)) return "from-green-900/20 to-gray-900"
    if (isFood(item as any)) return "from-yellow-900/20 to-gray-900"
    if (isMount(item as any)) return "from-cyan-900/20 to-gray-900"
    if (isMagic(item as any)) return "from-purple-900/20 to-gray-900"
    return "from-amber-900/20 to-gray-900"
  }

  // Get item type display name
  const getItemType = () => {
    if (isWeapon(item as any)) return "Weapon"
    if (isArmor(item as any)) return "Armor"
    if (isPotion(item as any)) return "Potion"
    if (isFood(item as any)) return item.category.charAt(0).toUpperCase() + item.category.slice(1)
    if (isMount(item as any)) return "Mount"
    if (isMagic(item as any)) return item.category.charAt(0).toUpperCase() + item.category.slice(1)
    return item.category.charAt(0).toUpperCase() + item.category.slice(1)
  }

  // Get border color based on item category
  const getBorderColor = () => {
    if (isWeapon(item as any)) return "hover:border-red-500/50"
    if (isArmor(item as any)) return "hover:border-blue-500/50"
    if (isPotion(item as any)) return "hover:border-green-500/50"
    if (isFood(item as any)) return "hover:border-yellow-500/50"
    if (isMount(item as any)) return "hover:border-cyan-500/50"
    if (isMagic(item as any)) return "hover:border-purple-500/50"
    return "hover:border-amber-500/50"
  }

  return (
    <Card className={`border-amber-800/20 ${getBorderColor()} transition-all duration-300 bg-gradient-to-b ${getCardBackground()} hover:shadow-md hover:shadow-amber-900/20`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{item.name}</CardTitle>
          <span className="text-xs px-2 py-0.5 rounded bg-amber-900/30 text-amber-400">{getItemType()}</span>
        </div>
        <CardDescription>{item.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2">
        {/* Image placeholder - enhanced version */}
        <div className="w-full h-32 mb-3 rounded-md overflow-hidden border border-amber-800/30 relative group">
          <div 
            id={item.image || `placeholder-${item.id}`} 
            className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 relative"
          >
            {/* Placeholder decoration elements */}
            <div className="absolute inset-0 flex items-center justify-center opacity-70">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-500/40 animate-spin-slow"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border border-amber-500/30"></div>
            </div>
            
            {/* Center icon or text based on item type */}
            <div className="relative z-10 text-amber-500/80 text-center">
              <div className="text-xl font-semibold mb-1">
                {isWeapon(item as any) ? "⚔️" : 
                 isArmor(item as any) ? "🛡️" : 
                 isPotion(item as any) ? "⚗️" : 
                 isFood(item as any) ? "🍗" : 
                 isMount(item as any) ? "🐎" : 
                 isMagic(item as any) ? "✨" : "📦"}
              </div>
              <span className="text-xs font-medium">Item Image</span>
            </div>
            
            {/* Hover effect */}
            <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
        </div>

        {/* Stats/Effects */}
        <div className="bg-black/20 p-2 rounded-md mb-2">
          {isWeapon(item as any) && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Attack</span>
                <span className="text-red-500">+{(item as WeaponItem).stats.attack}</span>
              </div>
            </div>
          )}

          {isArmor(item as any) && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Defense</span>
                <span className="text-blue-500">+{(item as ArmorItem).stats.defense}</span>
              </div>
            </div>
          )}

          {isPotion(item as any) && (
            <div className="space-y-1">
              {(item as PotionItem).stats.health && (
                <div className="flex justify-between text-sm">
                  <span>Health</span>
                  <span className="text-green-500">+{(item as PotionItem).stats.health}</span>
                </div>
              )}
              {(item as PotionItem).stats.mana && (
                <div className="flex justify-between text-sm">
                  <span>Mana</span>
                  <span className="text-blue-500">+{(item as PotionItem).stats.mana}</span>
                </div>
              )}
              {(item as PotionItem).stats.stamina && (
                <div className="flex justify-between text-sm">
                  <span>Stamina</span>
                  <span className="text-yellow-500">+{(item as PotionItem).stats.stamina}</span>
                </div>
              )}
            </div>
          )}

          {isFood(item as any) && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Effect</span>
                <span className="text-amber-400">{(item as FoodItem).effect}</span>
              </div>
            </div>
          )}

          {isMount(item as any) && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Speed</span>
                <span className="text-blue-500">+{(item as MountItem).speed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Stamina</span>
                <span className="text-yellow-500">+{(item as MountItem).stamina}</span>
              </div>
            </div>
          )}

          {isMagic(item as any) && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Power</span>
                <span className="text-purple-500">+{(item as MagicItem).power}</span>
              </div>
              {(item as MagicItem).element && (
                <div className="flex justify-between text-sm">
                  <span>Element</span>
                  <span className="text-amber-400">{(item as MagicItem).element}</span>
                </div>
              )}
            </div>
          )}

          {/* Price */}
          <div className="flex items-center mt-2 pt-2 border-t border-gray-700/50">
            <Coins className="h-4 w-4 text-amber-500 mr-1" />
            <span className="font-medium text-amber-500">{item.price} Gold</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button
          className="w-full bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 transition-all duration-300"
          onClick={() => onPurchase(item)}
        >
          Purchase
        </Button>
      </CardFooter>
    </Card>
  )
} 