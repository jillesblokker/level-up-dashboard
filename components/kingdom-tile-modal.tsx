"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Coins, Gift, Sparkles } from 'lucide-react'
import Image from 'next/image'

interface KingdomTileReward {
  tileName: string
  goldEarned: number
  itemFound?: {
    image: string
    name: string
    type: string
  } | undefined
  isLucky: boolean
  message: string
}

interface KingdomTileModalProps {
  isOpen: boolean
  onClose: () => void
  reward: KingdomTileReward | null
}

export function KingdomTileModal({ isOpen, onClose, reward }: KingdomTileModalProps) {
  if (!reward) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gray-900 border-gray-700" aria-describedby="kingdom-tile-modal-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-amber-500" />
            {reward.isLucky ? 'Lucky Find!' : 'Kingdom Reward'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Story Message */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <p id="kingdom-tile-modal-description" className="text-sm text-gray-200 leading-relaxed">
                {reward.message}
              </p>
            </CardContent>
          </Card>

          {/* Gold Reward */}
          <Card className="border-amber-600 bg-amber-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-amber-400" />
                  <span className="font-semibold text-amber-200">Gold Earned</span>
                </div>
                <Badge variant="secondary" className="bg-amber-600 text-white">
                  +{reward.goldEarned} gold
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Item Found */}
          {reward.itemFound && (
            <Card className="border-blue-600 bg-blue-900/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Gift className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="font-semibold text-blue-200">Item Found</p>
                      <p className="text-sm text-blue-300 capitalize">{reward.itemFound.type}</p>
                    </div>
                  </div>
                  <div className="relative w-12 h-12">
                    <Image
                      src={reward.itemFound.image}
                      alt={reward.itemFound.name}
                      fill
                      className="object-contain"
                      onError={(e) => { 
                        e.currentTarget.src = '/images/placeholders/item-placeholder.svg' 
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lucky Bonus Indicator */}
          {reward.isLucky && (
            <Card className="border-green-600 bg-green-900/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-green-400" />
                  <span className="font-semibold text-green-200">Lucky Bonus!</span>
                </div>
                <p className="text-sm text-green-300 mt-1">
                  You found extra gold and a rare item!
                </p>
              </CardContent>
            </Card>
          )}

          {/* Close Button */}
          <Button onClick={onClose} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 