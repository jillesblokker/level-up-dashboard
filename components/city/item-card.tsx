"use client"

import { Coins } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StoreItem, WeaponItem, ArmorItem, PotionItem, FoodItem, MountItem, MagicItem } from "@/lib/city-item-manager"
import Image from "next/image"

// Union type for all possible item types
export type AnyItem = StoreItem | WeaponItem | ArmorItem | PotionItem | FoodItem | MountItem | MagicItem

interface ItemCardProps {
  item: AnyItem
  onPurchase: (item: AnyItem) => void
}

export function ItemCard({ item, onPurchase }: ItemCardProps) {
  // Helper to check if item is of a specific type
  const isWeapon = (item: AnyItem): item is WeaponItem => 'stats' in item && 'attack' in item.stats
  const isArmor = (item: AnyItem): item is ArmorItem => 'stats' in item && 'defense' in item.stats
  const isPotion = (item: AnyItem): item is PotionItem => 'stats' in item && ('health' in item.stats || 'mana' in item.stats || 'stamina' in item.stats)
  const isFood = (item: AnyItem): item is FoodItem => 'effect' in item
  const isMount = (item: AnyItem): item is MountItem => 'speed' in item && 'stamina' in item
  const isMagic = (item: AnyItem): item is MagicItem => 'power' in item

  // Get background color based on item category
  const getCardBackground = () => {
    if (isWeapon(item)) return "from-red-900/20 to-gray-900"
    if (isArmor(item)) return "from-blue-900/20 to-gray-900"
    if (isPotion(item)) return "from-green-900/20 to-gray-900"
    if (isFood(item)) return "from-yellow-900/20 to-gray-900"
    if (isMount(item)) return "from-cyan-900/20 to-gray-900"
    if (isMagic(item)) return "from-purple-900/20 to-gray-900"
    return "from-amber-900/20 to-gray-900"
  }

  // Get item type display name
  const getItemType = () => {
    if (isWeapon(item)) return "Weapon"
    if (isArmor(item)) return "Armor"
    if (isPotion(item)) return "Potion"
    if (isFood(item)) return item.category.charAt(0).toUpperCase() + item.category.slice(1)
    if (isMount(item)) return "Mount"
    if (isMagic(item)) return item.category.charAt(0).toUpperCase() + item.category.slice(1)
    return item.category.charAt(0).toUpperCase() + item.category.slice(1)
  }

  // Get border color based on item category
  const getBorderColor = () => {
    if (isWeapon(item)) return "hover:border-red-500/50"
    if (isArmor(item)) return "hover:border-blue-500/50"
    if (isPotion(item)) return "hover:border-green-500/50"
    if (isFood(item)) return "hover:border-yellow-500/50"
    if (isMount(item)) return "hover:border-cyan-500/50"
    if (isMagic(item)) return "hover:border-purple-500/50"
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
        {/* Image area - show item image if available, else fallback */}
        <div className="w-full h-32 mb-3 rounded-md overflow-hidden border border-amber-800/30 relative group">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name + ' ' + getItemType()}
              fill
              className="object-contain w-full h-full bg-black"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
              aria-label={`${item.name}-image`}
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => { (e.target as HTMLImageElement).src = "/images/items/placeholder.jpg"; }}
            />
          ) : (
            <Image
              src="/images/items/placeholder.jpg"
              alt={item.name + ' placeholder'}
              fill
              className="object-contain w-full h-full bg-black"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
              aria-label={`${item.name}-fallback-image`}
            />
          )}
        </div>

        {/* Stats/Effects */}
        <div className="bg-black/20 p-2 rounded-md mb-2">
          {isWeapon(item) && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Attack</span>
                <span className="text-red-500">+{item.stats.attack}</span>
              </div>
            </div>
          )}

          {isArmor(item) && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Defense</span>
                <span className="text-blue-500">+{item.stats.defense}</span>
              </div>
            </div>
          )}

          {isPotion(item) && (
            <div className="space-y-1">
              {item.stats.health && (
                <div className="flex justify-between text-sm">
                  <span>Health</span>
                  <span className="text-green-500">+{item.stats.health}</span>
                </div>
              )}
              {item.stats.mana && (
                <div className="flex justify-between text-sm">
                  <span>Mana</span>
                  <span className="text-blue-500">+{item.stats.mana}</span>
                </div>
              )}
              {item.stats.stamina && (
                <div className="flex justify-between text-sm">
                  <span>Stamina</span>
                  <span className="text-yellow-500">+{item.stats.stamina}</span>
                </div>
              )}
            </div>
          )}

          {isFood(item) && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Effect</span>
                <span className="text-amber-400">{item.effect}</span>
              </div>
            </div>
          )}

          {isMount(item) && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Speed</span>
                <span className="text-blue-500">+{item.speed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Stamina</span>
                <span className="text-yellow-500">+{item.stamina}</span>
              </div>
            </div>
          )}

          {isMagic(item) && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Power</span>
                <span className="text-purple-500">+{item.power}</span>
              </div>
              {item.element && (
                <div className="flex justify-between text-sm">
                  <span>Element</span>
                  <span className="text-amber-400">{item.element}</span>
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