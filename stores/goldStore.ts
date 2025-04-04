import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GoldStore {
  gold: number
  updateGold: (amount: number) => void
}

export const useGoldStore = create<GoldStore>()(
  persist(
    (set) => ({
      gold: 1000, // Starting gold
      updateGold: (amount) => set((state) => ({ gold: state.gold + amount })),
    }),
    {
      name: 'gold-storage',
    }
  )
) 