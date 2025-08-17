"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCharacterStats } from '@/lib/character-stats-manager';
import { calculateLevelFromExperience } from '@/types/character';
import { getCurrentTitle } from '@/lib/title-manager';

export interface TitleEvolution {
  oldTitle: string;
  newTitle: string;
  oldTitleImage: string;
  newTitleImage: string;
  level: number;
}

interface TitleEvolutionContextType {
  showModal: boolean;
  evolution: TitleEvolution | null;
  closeModal: () => void;
  triggerTestModal: () => void;
  triggerTestModal2: () => void;
  triggerTestModal3: () => void;
  triggerTestModal4: () => void;
  triggerTestModal5: () => void;
  triggerTestModal6: () => void;
  triggerTestModal7: () => void;
  triggerTestModal8: () => void;
  triggerTestModal9: () => void;
  triggerTestModal10: () => void;
}

const TitleEvolutionContext = createContext<TitleEvolutionContextType | undefined>(undefined);

export function TitleEvolutionProvider({ children }: { children: ReactNode }) {
  const [showModal, setShowModal] = useState(false);
  const [evolution, setEvolution] = useState<TitleEvolution | null>(null);
  const [lastProcessedLevel, setLastProcessedLevel] = useState<number>(0);

  useEffect(() => {
    console.log('State changed:', { showModal, evolution: evolution ? `${evolution.oldTitle} -> ${evolution.newTitle}` : 'null' });
  }, [showModal, evolution]);

  useEffect(() => {
    const checkForTitleEvolution = () => {
      try {
        const stats = getCharacterStats();
        const currentLevel = calculateLevelFromExperience(stats.experience || 0);

        if (currentLevel > lastProcessedLevel) {
          const currentTitle = getCurrentTitle(currentLevel);
          const previousTitle = getCurrentTitle(lastProcessedLevel || currentLevel - 1);

          if (currentTitle.id !== previousTitle.id && currentLevel % 10 === 0) {
            const evolutionData: TitleEvolution = {
              oldTitle: previousTitle.name,
              newTitle: currentTitle.name,
              oldTitleImage: `/images/character/${previousTitle.id}.png`,
              newTitleImage: `/images/character/${currentTitle.id}.png`,
              level: currentLevel
            };

            setEvolution(evolutionData);
            setShowModal(true);
          }

          setLastProcessedLevel(currentLevel);
        }
      } catch (error) {
        console.error('Error checking for title evolution:', error);
      }
    };

    checkForTitleEvolution();

    const handleStatsUpdate = () => {
      checkForTitleEvolution();
    };

    window.addEventListener('character-stats-update', handleStatsUpdate);

    return () => {
      window.removeEventListener('character-stats-update', handleStatsUpdate);
    };
  }, [lastProcessedLevel]);

  // Initialize lastProcessedLevel from storage to avoid showing the modal repeatedly across navigations
  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('title-evolution-last-processed') : null;
      const stats = getCharacterStats();
      const currentLevel = calculateLevelFromExperience(stats.experience || 0);
      const initialLevel = stored ? parseInt(stored, 10) : currentLevel;
      if (!Number.isNaN(initialLevel)) {
        setLastProcessedLevel(initialLevel);
      }
    } catch (error) {
      // noop
    }
  }, []);

  // Persist last processed level whenever it changes
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('title-evolution-last-processed', String(lastProcessedLevel));
      }
    } catch (error) {
      // noop
    }
  }, [lastProcessedLevel]);

  const closeModal = () => {
    setShowModal(false);
    // Persist the current evolution level as processed to prevent re-showing
    if (evolution?.level) {
      setLastProcessedLevel(prev => Math.max(prev, evolution.level));
    }
    setEvolution(null);
  };

  const triggerTestModal = () => {
    console.log('Triggering test modal: Squire -> Knight');
    const testEvolution: TitleEvolution = {
      oldTitle: 'Squire',
      newTitle: 'Knight',
      oldTitleImage: '/images/character/squire.png',
      newTitleImage: '/images/character/knight.png',
      level: 10
    };
    setEvolution(testEvolution);
    setShowModal(true);
  };

  const triggerTestModal2 = () => {
    const testEvolution: TitleEvolution = {
      oldTitle: 'Knight',
      newTitle: 'Baron',
      oldTitleImage: '/images/character/knight.png',
      newTitleImage: '/images/character/baron.png',
      level: 20
    };
    setEvolution(testEvolution);
    setShowModal(true);
  };

  const triggerTestModal3 = () => {
    const testEvolution: TitleEvolution = {
      oldTitle: 'Baron',
      newTitle: 'Viscount',
      oldTitleImage: '/images/character/baron.png',
      newTitleImage: '/images/character/viscount.png',
      level: 30
    };
    setEvolution(testEvolution);
    setShowModal(true);
  };

  const triggerTestModal4 = () => {
    const testEvolution: TitleEvolution = {
      oldTitle: 'Viscount',
      newTitle: 'Count',
      oldTitleImage: '/images/character/viscount.png',
      newTitleImage: '/images/character/count.png',
      level: 40
    };
    setEvolution(testEvolution);
    setShowModal(true);
  };

  const triggerTestModal5 = () => {
    const testEvolution: TitleEvolution = {
      oldTitle: 'Count',
      newTitle: 'Marquis',
      oldTitleImage: '/images/character/count.png',
      newTitleImage: '/images/character/marquis.png',
      level: 50
    };
    setEvolution(testEvolution);
    setShowModal(true);
  };

  const triggerTestModal6 = () => {
    const testEvolution: TitleEvolution = {
      oldTitle: 'Marquis',
      newTitle: 'Duke',
      oldTitleImage: '/images/character/marquis.png',
      newTitleImage: '/images/character/duke.png',
      level: 60
    };
    setEvolution(testEvolution);
    setShowModal(true);
  };

  const triggerTestModal7 = () => {
    const testEvolution: TitleEvolution = {
      oldTitle: 'Duke',
      newTitle: 'Prince',
      oldTitleImage: '/images/character/duke.png',
      newTitleImage: '/images/character/prince.png',
      level: 70
    };
    setEvolution(testEvolution);
    setShowModal(true);
  };

  const triggerTestModal8 = () => {
    const testEvolution: TitleEvolution = {
      oldTitle: 'Prince',
      newTitle: 'King',
      oldTitleImage: '/images/character/prince.png',
      newTitleImage: '/images/character/king.png',
      level: 80
    };
    setEvolution(testEvolution);
    setShowModal(true);
  };

  const triggerTestModal9 = () => {
    const testEvolution: TitleEvolution = {
      oldTitle: 'King',
      newTitle: 'Emperor',
      oldTitleImage: '/images/character/king.png',
      newTitleImage: '/images/character/emperor.png',
      level: 90
    };
    setEvolution(testEvolution);
    setShowModal(true);
  };

  const triggerTestModal10 = () => {
    const testEvolution: TitleEvolution = {
      oldTitle: 'Emperor',
      newTitle: 'God',
      oldTitleImage: '/images/character/emperor.png',
      newTitleImage: '/images/character/god.png',
      level: 100
    };
    setEvolution(testEvolution);
    setShowModal(true);
  };

  const value: TitleEvolutionContextType = {
    showModal,
    evolution,
    closeModal,
    triggerTestModal,
    triggerTestModal2,
    triggerTestModal3,
    triggerTestModal4,
    triggerTestModal5,
    triggerTestModal6,
    triggerTestModal7,
    triggerTestModal8,
    triggerTestModal9,
    triggerTestModal10
  };

  return (
    <TitleEvolutionContext.Provider value={value}>
      {children}
    </TitleEvolutionContext.Provider>
  );
}

export function useTitleEvolution() {
  const context = useContext(TitleEvolutionContext);
  if (context === undefined) {
    throw new Error('useTitleEvolution must be used within a TitleEvolutionProvider');
  }
  return context;
} 