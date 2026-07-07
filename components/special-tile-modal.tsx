"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, Coins, Clock, CheckCircle2, ChevronRight } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { KINGDOM_TILES } from "@/lib/kingdom-tiles"

interface SpecialTileModalProps {
  isOpen: boolean
  onClose: () => void
  tile: any
  timer: any
  onCollect: () => void
}

const getBuildingSubTitle = (id: string) => {
  const map: Record<string, string> = {
    'blacksmith': 'Refiner of Ore & Armory',
    'sawmill': 'Lumberyard & Wood Processing',
    'fisherman': 'Quiet Angler\'s Dock',
    'grocery': 'Fresh Harvest Market Stall',
    'foodcourt': 'Medieval Feast & Tavern Stall',
    'well': 'Fresh Water Stone Well',
    'windmill': 'Grain Mill & Bakery Supplies',
    'fountain': 'Sanctuary of Flowing Springs',
    'mansion': 'Wealthy Aristocrat\'s Manor',
    'mayor': 'Town Administration Office',
    'archery': 'Military Ranged Training Range',
    'jousting': 'Chivalrous Knight Arena',
    'watchtower': 'Fortress Border Defense Guard',
    'mystic-obelisk': 'Ancient Cosmic Beacon',
    'golden-pantheon': 'Sacred Golden Shrine'
  }
  return map[id] || 'Kingdom Building'
}

const getBuildingSpecialOutput = (id: string, kt: any) => {
  const map: Record<string, string> = {
    'blacksmith': 'Crafts refined metal materials & equipment.',
    'sawmill': 'Processes raw logs into building planks.',
    'fisherman': 'Catches fresh river fish & edible items.',
    'grocery': 'Distributes daily food rations & grain.',
    'foodcourt': 'Cooks premium meals for companions.',
    'well': 'Supplies fresh water & occasional luck charms.',
    'windmill': 'Grinds grain into flour for baking.',
    'fountain': 'Boosts town wellness and tranquility.',
    'mansion': 'Generates high passive tax revenues.',
    'mayor': 'Oversees town upgrades and expansion.',
    'archery': 'Improves combat readiness and skills.',
    'jousting': 'Yields champion crests & joust rewards.',
    'watchtower': 'Defends kingdom from chaotic rift rifts.',
    'mystic-obelisk': 'Effect: +15% Unowned Scratch Card Chance (2 Hours)',
    'golden-pantheon': 'Bonus: 35% chance of Crown Pack, Gems, or 500 Essence'
  }
  return map[id] || `Produces passive Gold & Experience.`
}

const getRarityColorClass = (rarity: string) => {
  switch (rarity?.toLowerCase()) {
    case 'mythic': return 'text-red-400 border-red-500/30 bg-red-950/20'
    case 'legendary': return 'text-orange-400 border-orange-500/30 bg-orange-950/20'
    case 'epic': return 'text-purple-400 border-purple-500/30 bg-purple-950/20'
    case 'rare': return 'text-blue-400 border-blue-500/30 bg-blue-950/20'
    case 'uncommon': return 'text-green-400 border-green-500/30 bg-green-950/20'
    default: return 'text-zinc-400 border-zinc-500/30 bg-zinc-950/20'
  }
}

export function SpecialTileModal({ isOpen, onClose, tile, timer, onCollect }: SpecialTileModalProps) {
  const [timeLeft, setTimeLeft] = React.useState(timer ? Math.max(0, timer.endTime - Date.now()) : 0)

  React.useEffect(() => {
    if (!timer || timer.isReady) {
      setTimeLeft(0)
      return
    }

    setTimeLeft(Math.max(0, timer.endTime - Date.now()))

    const interval = setInterval(() => {
      const remaining = Math.max(0, timer.endTime - Date.now())
      setTimeLeft(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [timer, isOpen])

  if (!tile) return null

  const isReady = timer ? (Date.now() >= timer.endTime || timer.isReady || timeLeft <= 0) : true
  const timeRemainingMs = timeLeft
  
  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000)
    const hours = Math.floor(totalSecs / 3600)
    const minutes = Math.floor((totalSecs % 3600) / 60)
    const seconds = totalSecs % 60
    return `${hours > 0 ? `${hours}h ` : ""}${minutes}m ${seconds}s`
  }

  const typeLower = tile.type?.toLowerCase() || ""
  const kingdomTile = KINGDOM_TILES.find(kt => kt.id === typeLower)
  
  const displayName = kingdomTile?.name || tile.name || "Building"
  const clickMessage = kingdomTile?.clickMessage || "A majestic structure in your growing settlement."
  const tileImage = kingdomTile?.image || tile.image || "/images/kingdom-tiles/Vacant.webp"
  const subTitle = getBuildingSubTitle(typeLower)
  const specialOutput = getBuildingSpecialOutput(typeLower, kingdomTile)
  
  const normalRange = kingdomTile?.normalGoldRange || [10, 20]
  const luckyGold = kingdomTile?.luckyGoldAmount || 50
  const luckyChancePercent = Math.round((kingdomTile?.luckyChance || 0) * 100)
  const rarity = kingdomTile?.rarity || "common"

  const isObelisk = typeLower === "mystic-obelisk"
  const isPantheon = typeLower === "golden-pantheon"
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md w-full bg-zinc-950 border border-amber-900/40 text-white rounded-2xl p-6 shadow-2xl overflow-hidden font-serif">
        {/* Decorative background glow */}
        <div className="absolute inset-0 pointer-events-none -z-10 opacity-30">
          <div className={cn(
            "absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl",
            isObelisk ? "bg-purple-500/20" : isPantheon ? "bg-yellow-500/20" : "bg-amber-600/10"
          )} />
        </div>

        <DialogHeader className="text-center pb-2 border-b border-amber-900/20">
          <DialogTitle className="text-3xl font-medieval tracking-wide text-amber-400">
            {displayName}
          </DialogTitle>
          <DialogDescription className="text-xs font-mono text-zinc-400">
            {subTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5 mt-5">
          {/* Centered Tile Image */}
          <div className="relative w-28 h-28 bg-zinc-900/60 border border-amber-900/20 rounded-xl overflow-hidden flex items-center justify-center p-2 shadow-inner group">
            <Image
              src={tileImage}
              alt={displayName}
              fill
              sizes="112px"
              className="object-contain p-1 transition-transform duration-500 group-hover:scale-110"
            />
          </div>

          {/* Rarity tag */}
          <span className={cn(
            "text-[10px] uppercase font-mono tracking-widest px-2.5 py-0.5 rounded-full border",
            getRarityColorClass(rarity)
          )}>
            {rarity}
          </span>

          {/* Lore / Description */}
          <div className="text-center px-1 space-y-3">
            <p className="text-sm text-zinc-300 font-serif leading-relaxed italic">
              &ldquo;{clickMessage}&rdquo;
            </p>

            {/* Produces info */}
            <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400 font-mono text-left bg-zinc-900/40 p-2.5 rounded-lg border border-amber-900/5">
              <div>
                <span className="text-zinc-500 block text-[9px] tracking-wider">DAILY YIELD</span>
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 shrink-0" />
                  {normalRange[0]}–{normalRange[1]} Gold
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[9px] tracking-wider">LUCKY BONUSES</span>
                <span className="text-white font-semibold">
                  {luckyGold} Gold ({luckyChancePercent}%)
                </span>
              </div>
            </div>

            {/* Special Output Banner */}
            <div className={cn(
              "rounded-xl p-3 border text-xs flex items-center justify-center gap-2",
              isObelisk 
                ? "bg-purple-950/20 border-purple-500/30 text-purple-200"
                : isPantheon 
                  ? "bg-amber-950/20 border-amber-500/30 text-amber-200"
                  : "bg-zinc-900/40 border-amber-900/20 text-amber-100"
            )}>
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-left font-serif leading-tight">
                {specialOutput}
              </span>
            </div>
          </div>

          {/* Status & Timer Card */}
          <div className="w-full bg-zinc-900 border border-amber-900/20 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isReady ? (
                <div className="p-2 bg-green-500/10 rounded-full">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
              ) : (
                <div className="p-2 bg-zinc-800 rounded-full">
                  <Clock className="w-5 h-5 text-zinc-400 animate-pulse" />
                </div>
              )}
              <div className="text-left font-serif">
                <span className="text-xs text-zinc-400 font-mono block leading-none">STATUS</span>
                <span className={cn(
                  "font-bold text-sm",
                  isReady ? "text-green-400" : "text-amber-300"
                )}>
                  {isReady ? "Ready to Harvest" : "Recharging..."}
                </span>
              </div>
            </div>

            {!isReady && (
              <div className="text-right font-mono text-xs text-zinc-300">
                {formatTime(timeRemainingMs)}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="w-full flex gap-3 mt-1">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-white rounded-xl py-5 font-serif font-semibold"
            >
              Close
            </Button>
            {isReady && (
              <Button
                onClick={() => {
                  onCollect();
                  onClose();
                }}
                className="flex-1 bg-gradient-to-br from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-bold rounded-xl py-5 shadow-lg shadow-amber-500/10 border border-amber-400/20"
              >
                Harvest Building
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
