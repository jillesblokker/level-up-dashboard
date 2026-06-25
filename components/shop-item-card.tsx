"use client"

import { Coins } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  type ShopItem,
  type Rarity,
  RARITY_COLORS,
  RARITY_BADGE_CLASSES,
  RARITY_TEXT_CLASSES,
  STAT_BADGE_CLASSES,
  STAT_LABELS,
} from '@/lib/shop-items'

interface ShopItemCardProps {
  item: ShopItem
  onPurchase: (item: ShopItem) => void
  disabled?: boolean
  accentColor?: 'amber' | 'red' | 'blue' | 'purple' | 'emerald'
  actionLabel?: string
}

const ACCENT_STYLES = {
  amber: {
    border: 'border-amber-900/20 hover:border-amber-500/40',
    button: 'bg-amber-950 border border-amber-800/40 text-amber-400 hover:bg-amber-900 hover:text-white',
    title: 'text-amber-200 group-hover:text-amber-400',
    topLine: 'from-amber-700 to-amber-950',
  },
  red: {
    border: 'border-red-900/20 hover:border-red-500/40',
    button: 'bg-red-950 border border-red-800/40 text-red-400 hover:bg-red-900 hover:text-white',
    title: 'text-red-200 group-hover:text-red-400',
    topLine: 'from-red-600 to-red-950',
  },
  blue: {
    border: 'border-blue-900/20 hover:border-blue-500/40',
    button: 'bg-blue-950 border border-blue-800/40 text-blue-400 hover:bg-blue-900 hover:text-white',
    title: 'text-blue-200 group-hover:text-blue-400',
    topLine: 'from-blue-600 to-blue-950',
  },
  purple: {
    border: 'border-purple-900/20 hover:border-purple-500/40',
    button: 'bg-purple-950 border border-purple-800/40 text-purple-400 hover:bg-purple-900 hover:text-white',
    title: 'text-purple-200 group-hover:text-purple-400',
    topLine: 'from-purple-600 to-purple-950',
  },
  emerald: {
    border: 'border-emerald-900/20 hover:border-emerald-500/40',
    button: 'bg-emerald-950 border border-emerald-800/40 text-emerald-400 hover:bg-emerald-900 hover:text-white',
    title: 'text-emerald-200 group-hover:text-emerald-400',
    topLine: 'from-emerald-600 to-emerald-950',
  },
}

export function ShopItemCard({
  item,
  onPurchase,
  disabled = false,
  accentColor = 'amber',
  actionLabel = 'Purchase',
}: ShopItemCardProps) {
  const accent = ACCENT_STYLES[accentColor]
  const rarity = (item.rarity || 'common') as Rarity
  const rarityColor = RARITY_COLORS[rarity] || '#9CA3AF'

  // Build stat entries from the item (defensive against missing stats)
  const statEntries = Object.entries(item.stats || {}).filter(([, v]) => v !== undefined && v > 0)

  return (
    <Card
      className={`
        bg-zinc-950 ${accent.border}
        transition-all duration-300 ease-out
        hover:shadow-lg hover:-translate-y-0.5
        flex flex-col group relative overflow-hidden
      `}
      style={{
        boxShadow: `0 0 0 0 ${rarityColor}00`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px -4px ${rarityColor}30`
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 0 ${rarityColor}00`
      }}
    >
      {/* Rarity-colored accent line at top */}
      <div
        className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r ${accent.topLine} opacity-60`}
        style={{ background: `linear-gradient(to right, ${rarityColor}80, ${rarityColor}10)` }}
      />

      {/* Item Image Area */}
      <div className="relative h-48 bg-zinc-950 border-b border-zinc-800/50 overflow-hidden">
        {/* Radial gradient behind item */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at center, ${rarityColor}08 0%, transparent 70%)`,
          }}
        />

        {/* Item image */}
        <img
          src={item.image}
          alt={item.name}
          className="absolute inset-0 w-full h-full object-contain p-4 drop-shadow-lg
                     group-hover:scale-110 transition-transform duration-500 ease-out"
          onError={(e) => {
            // Fallback to placeholder if image fails
            (e.target as HTMLImageElement).src = '/images/items/placeholder.webp'
          }}
        />

        {/* Rarity badge */}
        <Badge
          className={`
            absolute top-2.5 right-2.5 text-[9px] font-bold tracking-widest
            uppercase px-2 py-0.5 border ${RARITY_BADGE_CLASSES[rarity] || 'bg-gray-900 border-gray-700 text-gray-400'}
          `}
        >
          {rarity}
        </Badge>
      </div>

      {/* Item Details */}
      <CardHeader className="p-4 flex-1">
        <CardTitle className={`text-lg transition-colors ${accent.title}`}>
          {item.name}
        </CardTitle>
        <CardDescription className="text-zinc-400 text-xs mt-1 leading-relaxed">
          {item.description}
        </CardDescription>

        {/* Stat Badges */}
        {statEntries.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            {statEntries.map(([stat, value]) => (
              <Badge
                key={stat}
                className={`
                  text-[9px] font-bold tracking-widest px-2 py-0.5 border
                  ${STAT_BADGE_CLASSES[stat] || 'bg-zinc-900 border-zinc-700 text-zinc-400'}
                `}
              >
                {STAT_LABELS[stat] || stat.toUpperCase()} +{value}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      {/* Footer: Price + Buy */}
      <CardFooter className="p-4 border-t border-zinc-800/30 bg-zinc-950/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Coins className="w-4 h-4 text-amber-500" />
          <span className="font-bold font-serif text-amber-200 text-sm">
            {(item.cost || 0).toLocaleString()}
          </span>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
            Gold
          </span>
        </div>
        <Button
          onClick={() => onPurchase(item)}
          disabled={disabled}
          className={`
            ${accent.button}
            rounded-lg px-4 text-xs font-bold uppercase tracking-wider
            transition-colors disabled:opacity-40 disabled:cursor-not-allowed
          `}
        >
          {actionLabel}
        </Button>
      </CardFooter>
    </Card>
  )
}
