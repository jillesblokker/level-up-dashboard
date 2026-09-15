"use client"

import { Button } from '@/components/ui/button'
import { Star, RotateCcw } from 'lucide-react'
import { MobileButtonWrapper } from './mobile-layout-wrapper'

interface MobileQuestActionsProps {
  onBulkCompleteFavorites: () => void
  onBulkCompleteAllFavorites: () => void
  onManualReset: () => void
  favoritesCount: number
  allFavoritesCount: number
  loading: boolean
  manualResetLoading: boolean
  token: string | null
}

export function MobileQuestActions({
  onBulkCompleteFavorites,
  onBulkCompleteAllFavorites,
  onManualReset,
  favoritesCount,
  allFavoritesCount,
  loading,
  manualResetLoading,
  token
}: MobileQuestActionsProps) {
  return (
    <div className="space-y-3">
      {/* Mobile-optimized action buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Complete Favorites Button */}
        <MobileButtonWrapper fullWidth>
          <Button
            onClick={onBulkCompleteFavorites}
            disabled={loading || favoritesCount === 0}
            className="w-full btn-rpg-emerald px-4 py-3 font-serif font-bold rounded-xl shadow-lg min-h-[48px] touch-manipulation text-xs sm:text-sm"
            aria-label="Complete all favorited quests in this category"
          >
            <Star className="w-4 h-4 text-amber-300" />
            <span className="text-sm sm:text-base">
              Complete {favoritesCount} Favorites
            </span>
          </Button>
        </MobileButtonWrapper>

        {/* Complete All Favorites Button */}
        <MobileButtonWrapper fullWidth>
          <Button
            onClick={onBulkCompleteAllFavorites}
            disabled={loading || allFavoritesCount === 0}
            className="w-full btn-rpg-emerald px-4 py-3 font-serif font-bold rounded-xl shadow-lg min-h-[48px] touch-manipulation text-xs sm:text-sm"
            aria-label="Complete all favorited quests across all categories"
          >
            <Star className="w-4 h-4 text-amber-300" />
            <span className="text-sm sm:text-base">
              Complete {allFavoritesCount} Total
            </span>
          </Button>
        </MobileButtonWrapper>

        {/* Reset Button */}
        <MobileButtonWrapper fullWidth>
          <Button
            onClick={onManualReset}
            disabled={manualResetLoading || !token}
            variant="outline"
            className="w-full border border-red-500/60 bg-red-950/20 text-red-300 hover:bg-red-900/40 hover:text-red-100 hover:border-red-400 px-4 py-3 font-serif font-bold rounded-xl shadow-md min-h-[48px] touch-manipulation disabled:opacity-50"
            aria-label="Manually reset today's quests"
          >
            {manualResetLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm sm:text-base">Resetting...</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                <span className="text-sm sm:text-base">Reset Today</span>
              </>
            )}
          </Button>
        </MobileButtonWrapper>
      </div>

      {/* Mobile-optimized info text */}
      <div className="text-center text-xs text-zinc-400 px-2">
        Tap and hold buttons for quick actions • Swipe quests to favorite
      </div>
    </div>
  )
}
