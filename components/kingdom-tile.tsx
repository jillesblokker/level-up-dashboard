"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Sparkles } from 'lucide-react'
import Image from 'next/image'
import { KingdomTile, getRandomItem, getRandomGold, isLucky, getRarityColor } from '@/lib/kingdom-tiles'
import { KingdomTileModal } from './kingdom-tile-modal'

interface KingdomTileProps {
  tile: KingdomTile
  onReward: (gold: number, item?: { image: string; name: string; type: string }) => void
  timer?: any
}

interface TileState {
  lastClicked: number | null
  isReady: boolean
  timeRemaining: number
}

export function KingdomTileComponent({ tile, onReward, timer }: KingdomTileProps) {
  const [state, setState] = useState<TileState>({
    lastClicked: null,
    isReady: false,
    timeRemaining: 0
  })
  const [showModal, setShowModal] = useState(false)
  const [currentReward, setCurrentReward] = useState<any>(null)

  // Load tile state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(`kingdom-tile-${tile.id}`)
    if (savedState) {
      const parsed = JSON.parse(savedState)
      setState(parsed)
    }
  }, [tile.id])

  // Save tile state to localStorage
  useEffect(() => {
    localStorage.setItem(`kingdom-tile-${tile.id}`, JSON.stringify(state))
  }, [state, tile.id])

  // Timer logic - use passed timer if available, otherwise use local state
  useEffect(() => {
    const interval = setInterval(() => {
      if (timer) {
        // Use timer from kingdom grid
        const now = Date.now()
        const timeRemaining = Math.max(0, timer.endTime - now)
        const isReady = timeRemaining === 0
        
        setState(prev => ({
          ...prev,
          isReady,
          timeRemaining
        }))
      } else if (state.lastClicked) {
        // Use local state timer
        const now = Date.now()
        const timeSinceLastClick = now - state.lastClicked
        const timerMs = tile.timerMinutes * 60 * 1000
        const timeRemaining = Math.max(0, timerMs - timeSinceLastClick)
        
        setState(prev => ({
          ...prev,
          isReady: timeRemaining === 0,
          timeRemaining
        }))
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [timer, state.lastClicked, tile.timerMinutes])

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((ms % (1000 * 60)) / 1000)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
  }

  const handleTileClick = () => {
    if (!state.isReady) return

    // Calculate rewards
    const isLuckyReward = isLucky(tile.luckyChance)
    const goldEarned = isLuckyReward ? tile.luckyGoldAmount : getRandomGold(...tile.normalGoldRange)
    const itemFound = getRandomItem(tile.possibleItems)

    // Create reward object
    const reward = {
      tileName: tile.name,
      goldEarned,
      itemFound: itemFound ? {
        image: itemFound,
        name: itemFound.split('/').pop()?.replace('.png', '') || 'Unknown',
        type: tile.itemType
      } : undefined,
      isLucky: isLuckyReward,
      message: tile.clickMessage
    }

    // Update state
    setState(prev => ({
      ...prev,
      lastClicked: Date.now(),
      isReady: false,
      timeRemaining: tile.timerMinutes * 60 * 1000
    }))

    // Show modal
    setCurrentReward(reward)
    setShowModal(true)

    // Call parent reward handler
    onReward(goldEarned, reward.itemFound)
  }

  const getTileImage = () => {
    return `/images/kingdom-tiles/${tile.name}.png`
  }

  return (
    <>
      <Card 
        className={`group relative cursor-pointer transition-all duration-200 hover:scale-105 ${
          state.isReady 
            ? 'ring-2 ring-amber-400 shadow-lg' 
            : 'opacity-75'
        }`}
        onClick={handleTileClick}
      >
        <CardContent className="p-4">
          <div className="relative">
            {/* Tile Image */}
            <div className="relative w-full h-32 mb-3">
              <Image
                src={getTileImage()}
                alt={tile.name}
                fill
                className="object-contain"
              />
            </div>

            {/* Tile Name */}
            <h3 className="font-semibold text-center text-sm mb-2">{tile.name}</h3>

            {/* Timer or Ready Status - Only show on hover */}
            <div className="group-hover:opacity-100 opacity-0 transition-opacity duration-200 flex items-center justify-center gap-1">
              {state.isReady ? (
                <>
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Ready!
                  </Badge>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-gray-500" />
                  <Badge variant="outline" className="text-xs">
                    {formatTime(state.timeRemaining)}
                  </Badge>
                </>
              )}
            </div>

            {/* Lucky Indicator - Only show on hover */}
            {state.isReady && (
              <div className="group-hover:opacity-100 opacity-0 transition-opacity duration-200 mt-2 text-center space-y-1">
                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                  {Math.round(tile.luckyChance * 100)}% lucky chance
                </Badge>
                <div className="flex justify-center">
                  <Badge className={`text-xs ${getRarityColor(tile.rarity)}`}>
                    {tile.rarity}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reward Modal */}
      <KingdomTileModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        reward={currentReward}
      />
    </>
  )
} 