"use client"

import React from 'react';
import { TitleEvolutionModal } from '@/components/title-evolution-modal';
import { TitleEvolutionProvider as Provider, useTitleEvolution } from '@/hooks/title-evolution-context';

function TitleEvolutionModalWrapper() {
  const { showModal, evolution, closeModal } = useTitleEvolution();

  console.log('TitleEvolutionModalWrapper render:', {
    showModal,
    evolution: evolution ? `${evolution.oldTitle} -> ${evolution.newTitle}` : 'null',
    evolutionData: evolution
  });

  return (
    <>
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

export function TitleEvolutionProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider>
      {children}
      <TitleEvolutionModalWrapper />
    </Provider>
  );
} 