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
  }
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            {reward.isLucky ? 'Lucky Find!' : 'Kingdom Reward'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Story Message */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-700 leading-relaxed">
                {reward.message}
              </p>
            </CardContent>
          </Card>

          {/* Gold Reward */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-amber-600" />
                  <span className="font-semibold text-amber-800">Gold Earned</span>
                </div>
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  +{reward.goldEarned} gold
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Item Found */}
          {reward.itemFound && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Gift className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-blue-800">Item Found</p>
                      <p className="text-sm text-blue-600 capitalize">{reward.itemFound.type}</p>
                    </div>
                  </div>
                  <div className="relative w-12 h-12">
                    <Image
                      src={reward.itemFound.image}
                      alt={reward.itemFound.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lucky Bonus Indicator */}
          {reward.isLucky && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-800">Lucky Bonus!</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  You found extra gold and a rare item!
                </p>
              </CardContent>
            </Card>
          )}

          {/* Close Button */}
          <Button onClick={onClose} className="w-full">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 