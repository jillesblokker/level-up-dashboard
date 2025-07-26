"use client"

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

  // Debug state changes
  useEffect(() => {
    console.log('🎯 State changed:', { showModal, evolution: evolution ? `${evolution.oldTitle} → ${evolution.newTitle}` : 'null' });
  }, [showModal, evolution]);

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
    console.log('🎯 Triggering test modal: Squire → Knight');
    // Test with Squire to Knight evolution (level 10)
    const testEvolution: TitleEvolution = {
      oldTitle: 'Squire',
      newTitle: 'Knight',
      oldTitleImage: '/images/character/squire.png',
      newTitleImage: '/images/character/knight.png',
      level: 10
    };
    console.log('🎯 Setting evolution state:', testEvolution);
    setEvolution(testEvolution);
    setShowModal(true);
    console.log('🎯 Modal state set to true');
  };

  const triggerTestModal2 = () => {
    console.log('🎯 Triggering test modal: Knight → Baron');
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
    console.log('🎯 Triggering test modal: Baron → Viscount');
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

  const triggerTestModal4 = () => {
    console.log('🎯 Triggering test modal: Viscount → Count');
    // Test with Viscount to Count evolution (level 40)
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
    console.log('🎯 Triggering test modal: Count → Marquis');
    // Test with Count to Marquis evolution (level 50)
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
    console.log('🎯 Triggering test modal: Marquis → Duke');
    // Test with Marquis to Duke evolution (level 60)
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
    console.log('🎯 Triggering test modal: Duke → Prince');
    // Test with Duke to Prince evolution (level 70)
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
    console.log('🎯 Triggering test modal: Prince → King');
    // Test with Prince to King evolution (level 80)
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
    console.log('🎯 Triggering test modal: King → Emperor');
    // Test with King to Emperor evolution (level 90)
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
    console.log('🎯 Triggering test modal: Emperor → God');
    // Test with Emperor to God evolution (level 100)
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

  return {
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
} 