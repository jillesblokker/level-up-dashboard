import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CreatureState {
  discoveredCreatures: string[];
  unlockCreature: (creatureId: string) => void;
  isCreatureDiscovered: (creatureId: string) => boolean;
}

export const useCreatureStore = create<CreatureState>()(
  persist(
    (set, get) => ({
      discoveredCreatures: [],
      unlockCreature: (creatureId: string) => {
        set((state) => ({
          discoveredCreatures: [...state.discoveredCreatures, creatureId]
        }));
      },
      isCreatureDiscovered: (creatureId: string) => {
        return get().discoveredCreatures.includes(creatureId);
      }
    }),
    {
      name: 'creature-storage'
    }
  )
); 