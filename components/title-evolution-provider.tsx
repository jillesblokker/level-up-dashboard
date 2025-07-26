"use client"

import React from 'react';
import { TitleEvolutionModal } from '@/components/title-evolution-modal';
import { useTitleEvolution } from '@/hooks/use-title-evolution';

export function TitleEvolutionProvider({ children }: { children: React.ReactNode }) {
  const { showModal, evolution, closeModal } = useTitleEvolution();

  console.log('🎭 TitleEvolutionProvider render:', { 
    showModal, 
    evolution: evolution ? `${evolution.oldTitle} → ${evolution.newTitle}` : 'null',
    evolutionData: evolution
  });

  return (
    <>
      {children}
      {evolution && (
        <TitleEvolutionModal
          isOpen={showModal}
          onClose={closeModal}
          oldTitle={evolution.oldTitle}
          newTitle={evolution.newTitle}
          oldTitleImage={evolution.oldTitleImage}
          newTitleImage={evolution.newTitleImage}
        />
      )}
    </>
  );
} 