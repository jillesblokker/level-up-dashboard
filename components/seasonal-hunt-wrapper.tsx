"use client"

import { useState, useEffect } from 'react'
import { useSeasonalHunt } from '@/hooks/use-seasonal-hunt'
import { SeasonalHuntItem } from '@/components/seasonal-hunt-item'
import { SeasonalHuntLedger } from '@/components/seasonal-hunt-ledger'
import { SeasonalHuntCompletionModal } from '@/components/seasonal-hunt-completion-modal'
import { SeasonalHuntManager, SeasonalProgress } from '@/lib/seasonal-hunt-manager'

export function SeasonalHuntWrapper() {
  const { items, isLoading, progress, handleItemFound } = useSeasonalHunt()
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const currentEventKey = SeasonalHuntManager.getCurrentEvent()

  const onFoundCallback = (newProgress: SeasonalProgress) => {
    handleItemFound(newProgress)
    if (newProgress.found === newProgress.total && newProgress.total > 0) {
      setShowCompletionModal(true)
    }
  }

  useEffect(() => {
    const handleOpenCompletion = () => setShowCompletionModal(true)
    window.addEventListener('open-seasonal-hunt-completion', handleOpenCompletion)
    return () => {
      window.removeEventListener('open-seasonal-hunt-completion', handleOpenCompletion)
    }
  }, [])

  if (isLoading) return null

  return (
    <>
      {items.map((item) => (
        <SeasonalHuntItem
          key={item.item_id}
          item={item}
          onFound={onFoundCallback}
        />
      ))}
      <SeasonalHuntLedger />
      <SeasonalHuntCompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        eventKey={currentEventKey}
      />
    </>
  )
}