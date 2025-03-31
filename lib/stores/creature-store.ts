import { create } from 'zustand';
import { persist, type StateStorage } from 'zustand/middleware';

interface CreatureState {
  discoveredCreatures: string[];
  unlockCreature: (creatureId: string) => void;
  isCreatureDiscovered: (creatureId: string) => boolean;
}

type SetState = (
  partial: CreatureState | Partial<CreatureState> | ((state: CreatureState) => CreatureState | Partial<CreatureState>),
  replace?: boolean | undefined
) => void;

type GetState = () => CreatureState;

export const useCreatureStore = create<CreatureState>()(
  persist(
    (set: SetState, get: GetState) => ({
      discoveredCreatures: [],
      unlockCreature: (creatureId: string) => {
        set((state: CreatureState) => ({
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