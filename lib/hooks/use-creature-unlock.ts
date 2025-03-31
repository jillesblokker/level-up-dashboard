import { useState } from 'react';
import { useCreatureStore } from '@/lib/stores/creature-store';

interface UseCreatureUnlockReturn {
  showUnlockModal: boolean;
  unlockedCreature: {
    id: string;
    name: string;
  } | null;
  handleUnlock: (creatureId: string) => void;
  handleCloseModal: () => void;
}

const creatureData = {
  '001': { name: 'Flamio' },
  '002': { name: 'Embera' },
  '003': { name: 'Vulcana' },
  '004': { name: 'Dolphio' },
  '005': { name: 'Divero' },
  '006': { name: 'Flippur' },
  '007': { name: 'Leaf' },
  '008': { name: 'Oaky' },
  '009': { name: 'Seqoio' },
};

export function useCreatureUnlock(): UseCreatureUnlockReturn {
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockedCreature, setUnlockedCreature] = useState<{ id: string; name: string } | null>(null);
  const { unlockCreature, isCreatureDiscovered } = useCreatureStore();

  const handleUnlock = (creatureId: string) => {
    // Only proceed if the creature hasn't been discovered yet
    if (!isCreatureDiscovered(creatureId)) {
      const creature = creatureData[creatureId as keyof typeof creatureData];
      if (creature) {
        unlockCreature(creatureId);
        setUnlockedCreature({ id: creatureId, name: creature.name });
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