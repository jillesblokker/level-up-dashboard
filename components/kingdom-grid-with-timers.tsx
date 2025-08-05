"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { Tile, TileType } from '@/types/tiles'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Sparkles } from 'lucide-react'
import { KINGDOM_TILES, getRandomItem, getRandomGold, isLucky, getRarityColor } from '@/lib/kingdom-tiles'
import { KingdomTileModal } from './kingdom-tile-modal'
import { useToast } from '@/components/ui/use-toast'

interface KingdomGridWithTimersProps {
  grid: Tile[][]
  onTilePlace: (x: number, y: number, tile: Tile) => void
  selectedTile: Tile | null
  setSelectedTile: (tile: Tile | null) => void
  onGridExpand?: (newGrid: Tile[][]) => void
  onGoldEarned?: (amount: number) => void
  onItemFound?: (item: { image: string; name: string; type: string }) => void
}

interface TileTimer {
  x: number
  y: number
  tileId: string
  endTime: number
  isReady: boolean
}

export function KingdomGridWithTimers({ 
  grid, 
  onTilePlace, 
  selectedTile, 
  setSelectedTile, 
  onGridExpand,
  onGoldEarned,
  onItemFound
}: KingdomGridWithTimersProps) {
  const { toast } = useToast()
  const [tileTimers, setTileTimers] = useState<TileTimer[]>([])
  const [showModal, setShowModal] = useState(false)
  const [modalData, setModalData] = useState<{
    tileName: string
    goldEarned: number
    itemFound?: {
      image: string
      name: string
      type: string
    } | undefined
    isLucky: boolean
    message: string
  } | null>(null)

  // Load timers from localStorage on mount
  useEffect(() => {
    const savedTimers = localStorage.getItem('kingdom-tile-timers')
    if (savedTimers) {
      setTileTimers(JSON.parse(savedTimers))
    }
  }, [])

  // Save timers to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('kingdom-tile-timers', JSON.stringify(tileTimers))
  }, [tileTimers])

  // Update timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTileTimers(prev => 
        prev.map(timer => {
          const now = Date.now()
          const isReady = now >= timer.endTime
          return { ...timer, isReady }
        })
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Initialize timers for placed kingdom tiles
  useEffect(() => {
    const newTimers: TileTimer[] = []
    
    grid.forEach((row, y) => {
      row.forEach((tile, x) => {
        if (tile && tile.type !== 'empty' && tile.type !== 'vacant') {
          const kingdomTile = KINGDOM_TILES.find(kt => kt.id === tile.type.toLowerCase())
          if (kingdomTile) {
            const existingTimer = tileTimers.find(t => t.x === x && t.y === y)
            if (!existingTimer) {
              // Create new timer
              const endTime = Date.now() + (kingdomTile.timerMinutes * 60 * 1000)
              newTimers.push({
                x,
                y,
                tileId: kingdomTile.id,
                endTime,
                isReady: false
              })
            }
          }
        }
      })
    })

    if (newTimers.length > 0) {
      setTileTimers(prev => [...prev, ...newTimers])
    }
  }, [grid])

  const handleTileClick = (x: number, y: number, tile: Tile) => {
    const kingdomTile = KINGDOM_TILES.find(kt => kt.id === tile.type.toLowerCase())
    if (!kingdomTile) return

    const timer = tileTimers.find(t => t.x === x && t.y === y)
    if (!timer) return

    if (timer.isReady) {
      // Calculate rewards
      const gold = isLucky(kingdomTile.luckyChance) 
        ? kingdomTile.luckyGoldAmount 
        : getRandomGold(...kingdomTile.normalGoldRange)
      
      const item = kingdomTile.possibleItems.length > 0 
        ? getRandomItem(kingdomTile.possibleItems)
        : null

      // Reset timer
      const newEndTime = Date.now() + (kingdomTile.timerMinutes * 60 * 1000)
      setTileTimers(prev => 
        prev.map(t => 
          t.x === x && t.y === y 
            ? { ...t, endTime: newEndTime, isReady: false }
            : t
        )
      )

      // Show modal
      setModalData({
        tileName: kingdomTile.name,
        goldEarned: gold,
        itemFound: item ? { image: item, name: kingdomTile.name, type: kingdomTile.itemType } : undefined,
        message: kingdomTile.clickMessage,
        isLucky: isLucky(kingdomTile.luckyChance)
      } as {
        tileName: string
        goldEarned: number
        itemFound?: {
          image: string
          name: string
          type: string
        } | undefined
        isLucky: boolean
        message: string
      })
      setShowModal(true)

      // Update gold and items
      if (onGoldEarned) onGoldEarned(gold)
      if (item && onItemFound) {
        onItemFound({ image: item, name: kingdomTile.name, type: kingdomTile.itemType })
      }

      // Show toast
      toast({
        title: "Kingdom Reward!",
        description: `You earned ${gold} gold${item ? ` and found a ${kingdomTile.itemType}!` : '!'}`,
      })
    }
  }

  const formatTimeRemaining = (endTime: number) => {
    const now = Date.now()
    const remaining = Math.max(0, endTime - now)
    
    if (remaining === 0) return "Ready!"
    
    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
  }

  const renderGridWithBorder = () => {
    const rows = grid.length
    const cols = grid[0]?.length || 0
    
    return (
      <div
        className="grid gap-0 border-5 border-gray-700"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          width: '100%',
          height: 'auto',
          minHeight: '400px',
          background: 'none',
          border: '20px solid #374151',
        }}
        aria-label="thrivehaven-grid"
      >
        {Array.from({ length: rows }).map((_, y) =>
          Array.from({ length: cols }).map((_, x) => {
            const tile = grid[y]?.[x]
            const timer = tileTimers.find(t => t.x === x && t.y === y)
            const kingdomTile = tile ? KINGDOM_TILES.find(kt => kt.id === tile.type.toLowerCase()) : null
            
            if (!tile) {
              return <div key={`empty-${x}-${y}`} className="w-full h-full aspect-square bg-black/40" />
            }

            const isKingdomTile = kingdomTile !== null
            const isReady = timer?.isReady || false

            return (
              <button
                key={`tile-${x}-${y}`}
                className={cn(
                  "group relative w-full h-full aspect-square bg-black/60 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-500",
                  selectedTile && "ring-2 ring-amber-500",
                  isKingdomTile && isReady && "ring-2 ring-green-500 animate-pulse"
                )}
                aria-label={tile.ariaLabel || tile.name || `Tile ${x},${y}`}
                onClick={() => {
                  if (isKingdomTile && isReady) {
                    handleTileClick(x, y, tile)
                  } else if (selectedTile && (selectedTile.quantity || 0) > 0) {
                    onTilePlace(x, y, selectedTile)
                  }
                }}
                style={{ minWidth: 0, minHeight: 0, borderRadius: 0, margin: 0, padding: 0 }}
              >
                <Image
                  src={tile.image}
                  alt={tile.name}
                  fill
                  className="object-cover"
                  draggable={false}
                  unoptimized
                  onError={(e) => { e.currentTarget.src = '/images/placeholders/item-placeholder.svg' }}
                />
                
                {/* Timer overlay for kingdom tiles - Only show on hover */}
                {isKingdomTile && timer && (
                  <div className="group-hover:opacity-100 opacity-0 transition-opacity duration-200 absolute bottom-1 left-1 right-1">
                    <div className={cn(
                      "text-xs px-2 py-1 rounded text-center font-mono",
                      isReady 
                        ? "bg-green-500 text-white" 
                        : "bg-black/80 text-white",
                      // Mobile-specific improvements
                      "sm:text-xs md:text-sm",
                      "min-h-[24px] flex items-center justify-center"
                    )}>
                      {isReady ? (
                        <div className="flex items-center justify-center gap-1">
                          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="whitespace-nowrap">Ready!</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="whitespace-nowrap">{formatTimeRemaining(timer.endTime)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}


              </button>
            )
          })
        )}
      </div>
    )
  }

  return (
    <>
      {renderGridWithBorder()}
      
      {showModal && modalData && (
        <KingdomTileModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          reward={modalData}
        />
      )}
    </>
  )
} 