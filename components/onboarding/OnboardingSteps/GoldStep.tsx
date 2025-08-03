import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Coins, TrendingUp, ShoppingCart } from 'lucide-react'

interface GoldStepProps {
  onNext: () => void
  onPrevious: () => void
  isFirstStep: boolean
  isLastStep: boolean
  stepData: any
}

export function GoldStep({ onNext }: GoldStepProps) {
  const [goldBalance, setGoldBalance] = useState(0)
  const [showEarning, setShowEarning] = useState(false)
  const [showSpending, setShowSpending] = useState(false)

  useEffect(() => {
    // Simulate earning gold from quests
    const timer = setTimeout(() => {
      setShowEarning(true)
      setGoldBalance(prev => prev + 45) // 15 + 10 + 20 from sample quests
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined

    if (showEarning) {
      // Simulate spending gold on tiles
      timer = setTimeout(() => {
        setShowSpending(true)
        setGoldBalance(prev => prev - 25) // Spend on a grass tile
      }, 2000)
    }

    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [showEarning])

  return (
    <div className="w-full max-w-2xl space-y-6">
      {/* Gold Balance Display */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Coins className="h-8 w-8 text-amber-400" />
          <span className="text-3xl font-bold text-amber-400">{goldBalance}</span>
        </div>
        <h3 className="text-lg font-semibold text-white">Your Gold Balance</h3>
        <p className="text-gray-300">
          Gold is your kingdom&apos;s currency. Earn it by completing quests, spend it on tiles and items.
        </p>
      </div>

      {/* Earning Gold */}
      <Card className="bg-gray-800/50 border border-amber-800/20">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3 mb-3">
            <TrendingUp className="h-5 w-5 text-amber-400" />
            <h4 className="font-semibold text-white">Earning Gold</h4>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Morning Exercise</span>
              <span className="text-amber-400">+15 gold</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Read 30 Minutes</span>
              <span className="text-amber-400">+10 gold</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Help Someone</span>
              <span className="text-amber-400">+20 gold</span>
            </div>
            {showEarning && (
              <div className="border-t border-amber-800/20 pt-2 mt-2">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span className="text-white">Total Earned</span>
                  <span className="text-amber-400">+45 gold</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Spending Gold */}
      {showSpending && (
        <Card className="bg-gray-800/50 border border-amber-800/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <ShoppingCart className="h-5 w-5 text-amber-400" />
              <h4 className="font-semibold text-white">Spending Gold</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Grass Tile</span>
                <span className="text-red-400">-25 gold</span>
              </div>
              <div className="border-t border-amber-800/20 pt-2 mt-2">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span className="text-white">Remaining Balance</span>
                  <span className="text-amber-400">{goldBalance} gold</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gold Economy Explanation */}
      <div className="space-y-3">
        <h4 className="text-md font-semibold text-white">Gold Economy</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <h5 className="font-medium text-amber-400 mb-1">Earning</h5>
            <p className="text-sm text-gray-300">
              Complete quests to earn gold. Different quests give different rewards.
            </p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <h5 className="font-medium text-amber-400 mb-1">Spending</h5>
            <p className="text-sm text-gray-300">
              Use gold to buy tiles, items, and unlock new content for your kingdom.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Demo Status */}
      {!showEarning && (
        <div className="text-center">
          <p className="text-sm text-gray-400">Watch as you earn gold from completing quests...</p>
        </div>
      )}
    </div>
  )
} 