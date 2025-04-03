import { useState } from 'react';
import { useCreatureStore } from '@/stores/creatureStore';

interface UseCreatureUnlockReturn {
  showUnlockModal: boolean;
  unlockedCreature: {
    id: string;
    name: string;
    description: string;
    requirement: string;
  } | null;
  handleUnlock: (creatureId: string) => void;
  handleCloseModal: () => void;
}

export function useCreatureUnlock(): UseCreatureUnlockReturn {
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockedCreature, setUnlockedCreature] = useState<{
    id: string;
    name: string;
    description: string;
    requirement: string;
  } | null>(null);
  
  const { discoverCreature, isCreatureDiscovered, getCreature } = useCreatureStore();

  const handleUnlock = (creatureId: string) => {
    // Only proceed if the creature hasn't been discovered yet
    if (!isCreatureDiscovered(creatureId)) {
      const creature = getCreature(creatureId);
      if (creature) {
        discoverCreature(creatureId);
        setUnlockedCreature({
          id: creatureId,
          name: creature.name,
          description: creature.description,
          requirement: creature.requirement
        });
        setShowUnlockModal(true);
      }
    }
  };

  const handleCloseModal = () => {
    setShowUnlockModal(false);
    setUnlockedCreature(null);
  };

  return {
    showUnlockModal,
    unlockedCreature,
    handleUnlock,
    handleCloseModal,
  };
} 