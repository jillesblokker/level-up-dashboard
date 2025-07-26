import { useState, useEffect } from 'react';
import { getCharacterStats } from '@/lib/character-stats-manager';
import { calculateLevelFromExperience } from '@/types/character';
import { TITLES, getCurrentTitle } from '@/lib/title-manager';

export interface TitleEvolution {
  oldTitle: string;
  newTitle: string;
  oldTitleImage: string;
  newTitleImage: string;
  level: number;
}

export function useTitleEvolution() {
  const [showModal, setShowModal] = useState(false);
  const [evolution, setEvolution] = useState<TitleEvolution | null>(null);
  const [lastProcessedLevel, setLastProcessedLevel] = useState<number>(0);

  useEffect(() => {
    const checkForTitleEvolution = () => {
      try {
        const stats = getCharacterStats();
        const currentLevel = calculateLevelFromExperience(stats.experience || 0);
        
        // Only check if level has increased
        if (currentLevel > lastProcessedLevel) {
          const currentTitle = getCurrentTitle(currentLevel);
          const previousTitle = getCurrentTitle(lastProcessedLevel || currentLevel - 1);
          
          // Check if we've reached a new title (every 10 levels)
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

    // Check immediately
    checkForTitleEvolution();

    // Listen for character stats updates
    const handleStatsUpdate = () => {
      checkForTitleEvolution();
    };

    window.addEventListener('character-stats-update', handleStatsUpdate);
    
    return () => {
      window.removeEventListener('character-stats-update', handleStatsUpdate);
    };
  }, [lastProcessedLevel]);

  const closeModal = () => {
    setShowModal(false);
    setEvolution(null);
  };

  const triggerTestModal = () => {
    // Test with Squire to Knight evolution (level 10)
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
    // Test with Knight to Baron evolution (level 20)
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
    // Test with Baron to Viscount evolution (level 30)
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

  return {
    showModal,
    evolution,
    closeModal,
    triggerTestModal,
    triggerTestModal2,
    triggerTestModal3
  };
} 