"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, Coins, Clock, ShieldAlert, CheckCircle2 } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface SpecialTileModalProps {
  isOpen: boolean
  onClose: () => void
  tile: any
  timer: any
  onCollect: () => void
}

export function SpecialTileModal({ isOpen, onClose, tile, timer, onCollect }: SpecialTileModalProps) {
  if (!tile) return null

  const isReady = timer ? (Date.now() >= timer.endTime || timer.isReady) : true
  const timeRemainingMs = timer ? Math.max(0, timer.endTime - Date.now()) : 0
  
  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000)
    const hours = Math.floor(totalSecs / 3600)
    const minutes = Math.floor((totalSecs % 3600) / 60)
    const seconds = totalSecs % 60
    return `${hours > 0 ? `${hours}h ` : ""}${minutes}m ${seconds}s`
  }

  const isObelisk = tile.type === "mystic-obelisk"
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md w-full bg-zinc-950 border border-amber-900/40 text-white rounded-2xl p-6 shadow-2xl overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute inset-0 pointer-events-none -z-10 opacity-30">
          <div className={cn(
            "absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl",
            isObelisk ? "bg-purple-500" : "bg-yellow-500"
          )} />
        </div>

        <DialogHeader className="text-center pb-2 border-b border-amber-900/20">
          <DialogTitle className="text-3xl font-medieval tracking-wide text-amber-400">
            {isObelisk ? "Mystic Obelisk" : "Golden Pantheon"}
          </DialogTitle>
          <DialogDescription className="text-xs font-mono text-zinc-400">
            {isObelisk ? "Ancient Cosmic Beacon" : "Sacred Golden Shrine"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 mt-6">
          {/* Centered Large Pixel Art Building */}
          <div className="relative w-36 h-36 bg-zinc-900/60 border border-amber-900/30 rounded-xl overflow-hidden flex items-center justify-center p-2 shadow-inner group">
            <Image
              src={isObelisk ? "/images/tiles/mystic-obelisk-tile.webp" : "/images/tiles/golden-pantheon-tile.webp"}
              alt={tile.name}
              fill
              sizes="144px"
              className="object-contain transition-transform duration-500 group-hover:scale-110"
            />
          </div>

          {/* Description & Effect info */}
          <div className="text-center px-2 space-y-3">
            <p className="text-sm text-zinc-300 font-serif leading-relaxed">
              {isObelisk
                ? "The cosmic spire hums with a deep vibrational tone. Once collected, it grants you the Astral Fortune perk for 2 hours, boosting your chances of finding unowned Mythic cards from scratch card packs."
                : "A grand cathedral built to honor the kingdom's prosperity. It yields a massive daily gold dividend (1,000–3,000 Gold) and has a 35% chance to award a Crown card pack, bonus Gems, or Ember Essence."}
            </p>

            {/* Special Perk / Bonus Indicator */}
            <div className={cn(
              "rounded-xl p-3 border text-xs flex items-center justify-center gap-2",
              isObelisk 
                ? "bg-purple-950/20 border-purple-500/30 text-purple-200"
                : "bg-amber-950/20 border-amber-500/30 text-amber-200"
            )}>
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {isObelisk
                  ? "Effect: +15% Unowned Scratch Card Chance (2 Hours)"
                  : "Bonus: 35% chance to drop Crown Pack, Gems, or 500 Essence"}
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
              <div className="text-left">
                <span className="text-xs text-zinc-400 font-mono block">STATUS</span>
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
          <div className="w-full flex gap-3 mt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-white rounded-xl py-6"
            >
              Close
            </Button>
            {isReady && (
              <Button
                onClick={() => {
                  onCollect();
                  onClose();
                }}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl py-6 shadow-lg shadow-amber-500/20"
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
