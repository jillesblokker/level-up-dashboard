"use client"

import React from 'react'
import Image from "next/image"
import { cn } from '@/lib/utils'
import { Tile } from '@/types/tiles'
import { ArrowRightLeft, Clock, RotateCw, Sparkles, Trash2, Check } from 'lucide-react'

interface KingdomTileItemProps {
  x: number
  y: number
  tile: Tile
  timer?: {
    endTime: number
    isReady: boolean
  } | undefined
  kingdomTile?: any
  currentTier: number
  placementMode: boolean
  readOnly: boolean
  focusCategory: string | null
  pendingHabits: string[]
  onClick: (x: number, y: number, tile: Tile) => void
  onMove: (x: number, y: number, tile: Tile) => void
  onDelete: (x: number, y: number, tile: Tile) => void
  onRotate: (x: number, y: number, tile: Tile) => void
  formatTimeRemaining: (endTime: number) => string
}

export const KingdomTileItem = React.memo(({
  x,
  y,
  tile,
  timer,
  kingdomTile,
  currentTier,
  placementMode,
  readOnly,
  focusCategory,
  pendingHabits,
  onClick,
  onMove,
  onDelete,
  onRotate,
  formatTimeRemaining
}: KingdomTileItemProps) => {
  const isReady = timer?.isReady || false
  const isKingdomTile = tile.type !== 'vacant'
  const type = tile.type?.toLowerCase()
  
  // Synergy Aura logic hoisted for efficiency
  let auraColor = ''
  let synergyLabel = ''
  if (type === 'library') { auraColor = 'blue'; synergyLabel = '+10% Knowledge XP'; }
  else if (type === 'training-grounds') { auraColor = 'red'; synergyLabel = '+10% Might XP'; }
  else if (type === 'zen-garden' || type === 'temple') { auraColor = 'emerald'; synergyLabel = '+10% Wellness XP'; }
  else if (type === 'castle') { auraColor = 'amber'; synergyLabel = '+10% Honor XP'; }

  const isPending = pendingHabits.includes(type)
  const isFocused = focusCategory && (
    (focusCategory === 'might' && ['training-grounds', 'blacksmith', 'archery', 'jousting', 'watchtower'].includes(type)) ||
    (focusCategory === 'knowledge' && ['library', 'wizard', 'temple', 'monument'].includes(type)) ||
    (focusCategory === 'wellness' && ['zen-garden', 'temple', 'fountain', 'well', 'pond', 'park'].includes(type)) ||
    (focusCategory === 'honor' && ['castle', 'mansion', 'mayor', 'monument'].includes(type))
  )

  return (
    <button
      onClick={() => onClick(x, y, tile)}
      className={cn(
        "relative aspect-square border group transition-all duration-300 overflow-hidden shadow-sm hover:shadow-xl",
        tile.type === 'vacant' 
          ? "bg-slate-900/40 border-white/5 hover:bg-slate-800/60" 
          : "bg-slate-800 border-white/10 hover:border-amber-500/50",
        placementMode && tile.type === 'vacant' && "ring-2 ring-amber-500 animate-pulse bg-amber-500/10",
        isFocused && "ring-2 ring-amber-400 z-10 shadow-[0_0_15px_rgba(245,158,11,0.4)]",
        focusCategory && !isFocused && "opacity-40 grayscale-[0.5]"
      )}
      style={{ willChange: 'transform, opacity' }} // GPU Acceleration
    >
      <div className="absolute inset-0 flex items-center justify-center p-0.5 md:p-1">
        <Image
          src={tile.image?.startsWith('/') ? tile.image : `/images/kingdom-tiles/${tile.image}`}
          alt={tile.name || tile.type}
          fill
          sizes="(max-width: 768px) 10vw, 5vw"
          className={cn(
            "object-contain transition-transform duration-500 group-hover:scale-110",
            (tile.rotation || 0) === 90 && "rotate-90",
            (tile.rotation || 0) === 180 && "rotate-180",
            (tile.rotation || 0) === 270 && "rotate-270"
          )}
          unoptimized={tile.image.endsWith('.gif')}
        />
      </div>

      {/* Efficiency Badge */}
      {tile.type !== 'vacant' && !['path', 'dirt-path', 'road', 'cobblestone', 'water', 'grass', 'crossroad', 'straightroad', 'cornerroad', 'tsplitroad'].includes(tile.type) && (
        <div className="absolute bottom-1 right-1 bg-black/60 px-1 rounded border border-white/10 text-[7px] font-bold text-amber-500/90 tracking-tighter z-40">
          {currentTier > 2 ? 'III' : currentTier > 1 ? 'II' : 'I'}
        </div>
      )}

      {/* Aura Effect */}
      {auraColor && (
        <div className={cn(
          "absolute inset-0 transition-opacity duration-1000",
          auraColor === 'blue' ? "bg-blue-400/5 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]" :
          auraColor === 'red' ? "bg-red-400/5 shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]" :
          auraColor === 'emerald' ? "bg-emerald-400/5 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]" :
          auraColor === 'amber' ? "bg-amber-400/5 shadow-[inset_0_0_20px_rgba(245,158,11,0.1)]" : ""
        )} />
      )}

      {/* Pending Habit Indicator */}
      {isPending && (
        <div className="absolute top-1 left-1 animate-bounce z-40 bg-white/90 rounded-full w-4 h-4 flex items-center justify-center shadow-lg border border-amber-200">
           <span className="text-[8px]">📜</span>
        </div>
      )}

      {/* Hover Info-Card */}
      {(tile.type === 'quest-board' || tile.type === 'market' ||
        tile.type === 'dungeon' ||
        tile.type === 'monument' || auraColor ||
        tile.type?.toLowerCase() === 'market-stalls') && (
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all pointer-events-none flex flex-col items-center justify-center p-1">
            <div className="bg-slate-900/95 border border-white/10 rounded-lg p-2 shadow-2xl scale-75 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-md">
              <p className="text-[10px] font-bold text-amber-100 uppercase tracking-tighter text-center">{tile.name || tile.type}</p>
              <div className="h-px bg-white/10 my-1 w-full" />
              <p className="text-[8px] text-slate-400 text-center italic">
                {tile.type === 'quest-board' ? 'Portal: Tasks' :
                 tile.type === 'market' ? 'Portal: Shop' :
                 tile.type === 'dungeon' ? 'Portal: Combat' :
                 tile.type === 'monument' ? 'Statue: Achievements' :
                 auraColor ? synergyLabel : 'Interaction Available'}
              </p>
              
              <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-white/5 pt-2 mt-2">
                <span>Current Tier</span>
                <span className="text-amber-500">Tier {currentTier}</span>
              </div>
            </div>
          </div>
      )}

      {/* Move/Delete Controls - Desktop only */}
      {isKingdomTile && !placementMode && !readOnly && (
        <div className="absolute top-1 right-1 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex">
          <div
            role="button"
            title="Move"
            className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700 shadow-md transform hover:scale-110 transition-transform"
            onClick={(e) => {
              e.stopPropagation()
              onMove(x, y, tile)
            }}
          >
            <ArrowRightLeft className="w-3 h-3" />
          </div>
          <div
            role="button"
            title="Store in Inventory"
            className="bg-red-600 text-white p-1 rounded hover:bg-red-700 shadow-md transform hover:scale-110 transition-transform"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(x, y, tile)
            }}
          >
            <Trash2 className="w-3 h-3" />
          </div>
          <div
            role="button"
            title="Rotate 90°"
            className="bg-amber-600 text-white p-1 rounded hover:bg-amber-700 shadow-md transform hover:scale-110 transition-transform"
            onClick={(e) => {
              e.stopPropagation()
              onRotate(x, y, tile)
            }}
          >
            <RotateCw className="w-3 h-3" />
          </div>
        </div>
      )}

      {/* Timer overlay */}
      {isKingdomTile && timer && kingdomTile && kingdomTile.timerMinutes > 0 && (
        <div className={cn(
          "transition-opacity duration-200 absolute bottom-1 left-1 right-1 pointer-events-none group-hover:opacity-100",
          (timer.endTime - Date.now() > 3 * 60 * 1000 && !isReady) ? "opacity-0 md:opacity-0" : "opacity-100 md:opacity-0"
        )}>
          <div className={cn(
            "text-[10px] md:text-xs px-1 md:px-2 py-0.5 md:py-1 rounded text-center font-mono shadow-sm backdrop-blur-sm",
            isReady ? "bg-green-500/90 text-white" : "bg-black/80 text-white",
            "min-h-[16px] md:min-h-[24px] flex items-center justify-center shrink-0"
          )}>
            {isReady ? (
              <div className="flex items-center justify-center gap-1">
                <Check className="w-3 h-3 md:hidden" />
                <Sparkles className="hidden md:block w-3 h-3 sm:w-4 sm:h-4" />
                <span className="whitespace-nowrap hidden md:inline">Ready!</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-0.5 md:gap-1">
                <Clock className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 opacity-70" />
                <span className="whitespace-nowrap md:hidden font-bold tracking-tighter">
                  {formatTimeRemaining(timer.endTime)}
                </span>
                <span className="whitespace-nowrap hidden md:inline">
                  {formatTimeRemaining(timer.endTime)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </button>
  )
})

KingdomTileItem.displayName = 'KingdomTileItem'
