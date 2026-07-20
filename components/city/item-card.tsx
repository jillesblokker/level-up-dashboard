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
    if (isWeapon(item)) return "from-red-900/20 to-zinc-900"
    if (isArmor(item)) return "from-blue-900/20 to-zinc-900"
    if (isPotion(item)) return "from-green-900/20 to-zinc-900"
    if (isFood(item)) return "from-yellow-900/20 to-zinc-900"
    if (isMount(item)) return "from-cyan-900/20 to-zinc-900"
    if (isMagic(item)) return "from-purple-900/20 to-zinc-900"
    return "from-amber-900/20 to-zinc-900"
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
    <Card className={`border-2 border-amber-800/40 ${getBorderColor()} transition-all duration-300 bg-gradient-to-b ${getCardBackground()} hover:shadow-xl hover:shadow-amber-950/40 rounded-2xl overflow-hidden flex flex-col justify-between`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg font-serif font-bold text-amber-100">{item.name}</CardTitle>
          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-amber-950 border border-amber-500/50 text-amber-200 shadow-sm shrink-0">{getItemType()}</span>
        </div>
        <CardDescription className="text-zinc-300 text-xs leading-relaxed">{item.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2">
        {/* Image area - radial pedestal background */}
        <div className="w-full h-32 mb-3 rounded-xl overflow-hidden border border-amber-800/40 relative group bg-gradient-to-b from-zinc-900 via-zinc-950 to-amber-950/40">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name + ' ' + getItemType()}
              fill
              className="object-contain w-full h-full p-2"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
              aria-label={`${item.name}-image`}
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => { (e.target as HTMLImageElement).src = "/images/placeholders/item-placeholder.svg"; }}
            />
          ) : (
            <Image
              src="/images/placeholders/item-placeholder.svg"
              alt={item.name + ' placeholder'}
              fill
              className="object-contain w-full h-full p-2"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
              aria-label={`${item.name}-fallback-image`}
            />
          )}
        </div>

        {/* Stats/Effects - High Contrast */}
        <div className="bg-zinc-950/90 border border-amber-900/30 p-2.5 rounded-xl mb-2 text-xs">
          {isWeapon(item) && (
            <div className="space-y-1">
              <div className="flex justify-between font-medium">
                <span className="text-zinc-300">Attack</span>
                <span className="text-red-400 font-bold">+{item.stats.attack}</span>
              </div>
            </div>
          )}

          {isArmor(item) && (
            <div className="space-y-1">
              <div className="flex justify-between font-medium">
                <span className="text-zinc-300">Defense</span>
                <span className="text-blue-400 font-bold">+{item.stats.defense}</span>
              </div>
            </div>
          )}

          {isPotion(item) && (
            <div className="space-y-1">
              {item.stats.health && (
                <div className="flex justify-between font-medium">
                  <span className="text-zinc-300">Health</span>
                  <span className="text-emerald-400 font-bold">+{item.stats.health}</span>
                </div>
              )}
              {item.stats.mana && (
                <div className="flex justify-between font-medium">
                  <span className="text-zinc-300">Mana</span>
                  <span className="text-cyan-400 font-bold">+{item.stats.mana}</span>
                </div>
              )}
              {item.stats.stamina && (
                <div className="flex justify-between font-medium">
                  <span className="text-zinc-300">Stamina</span>
                  <span className="text-yellow-400 font-bold">+{item.stats.stamina}</span>
                </div>
              )}
            </div>
          )}

          {isFood(item) && (
            <div className="space-y-1">
              <div className="flex justify-between font-medium">
                <span className="text-zinc-300">Effect</span>
                <span className="text-amber-300 font-semibold">{item.effect}</span>
              </div>
            </div>
          )}

          {isMount(item) && (
            <div className="space-y-1">
              <div className="flex justify-between font-medium">
                <span className="text-zinc-300">Speed</span>
                <span className="text-cyan-400 font-bold">+{item.speed}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-zinc-300">Stamina</span>
                <span className="text-yellow-400 font-bold">+{item.stamina}</span>
              </div>
            </div>
          )}

          {isMagic(item) && (
            <div className="space-y-1">
              <div className="flex justify-between font-medium">
                <span className="text-zinc-300">Power</span>
                <span className="text-purple-400 font-bold">+{item.power}</span>
              </div>
              {item.element && (
                <div className="flex justify-between font-medium">
                  <span className="text-zinc-300">Element</span>
                  <span className="text-amber-300 font-semibold">{item.element}</span>
                </div>
              )}
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-900/30">
            <span className="text-zinc-400 font-medium">Price</span>
            <span className="flex items-center gap-1 font-bold font-mono text-amber-300">
              <Coins className="h-4 w-4 text-amber-400" />
              {item.price} Gold
            </span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-1">
        <Button
          className="min-h-[44px] w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 hover:from-amber-500 hover:to-amber-400 text-zinc-950 font-bold rounded-xl shadow-lg border border-yellow-300/40 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
          onClick={() => onPurchase(item)}
          aria-label={`Purchase ${item.name} for ${item.price} gold`}
        >
          Purchase
        </Button>
      </CardFooter>
    </Card>
  )
} 