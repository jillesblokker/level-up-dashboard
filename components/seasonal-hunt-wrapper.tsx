"use client"

import { useSeasonalHunt } from '@/hooks/use-seasonal-hunt'
import { SeasonalHuntItem } from '@/components/seasonal-hunt-item'
import { SeasonalHuntLedger } from '@/components/seasonal-hunt-ledger'

export function SeasonalHuntWrapper() {
  const { items, isLoading, handleItemFound } = useSeasonalHunt()

  if (isLoading) return null

  return (
    <>
      {items.map((item) => (
        <SeasonalHuntItem
          key={item.item_id}
          item={item}
          onFound={handleItemFound}
        />
      ))}
      <SeasonalHuntLedger />
    </>
  )
}