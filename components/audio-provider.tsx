"use client"

import React, { createContext, useContext, useEffect } from 'react'
import { useAudio } from '@/hooks/useAudio'

interface AudioContextType {
  playQuestComplete: () => void
  playLevelUp: () => void
  playGoldEarned: () => void
  playXPEarned: () => void
  playButtonClick: () => void
  playPageTurn: () => void
  playSFX: (id: string) => void
  playMusic: (id: string) => void
  stopMusic: () => void
  toggleMusic: () => void
  settings: any
  currentMusic: string | null
  isPlaying: boolean
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audio = useAudio()

  // Auto-play ambient music on app start (disabled for now)
  useEffect(() => {
    // Disabled auto-play to prevent errors with missing audio files
    // if (audio.settings.musicEnabled) {
    //   // Play medieval ambient music by default
    //   audio.playMusic('medieval-ambient')
    // }
  }, [audio.settings.musicEnabled])

  return (
    <AudioContext.Provider value={audio}>
      {children}
    </AudioContext.Provider>
  )
}

export function useAudioContext() {
  const context = useContext(AudioContext)
  if (context === undefined) {
    throw new Error('useAudioContext must be used within an AudioProvider')
  }
  return context
}

// Hook for quest-related audio
export function useQuestAudio() {
  const { playQuestComplete, playGoldEarned, playXPEarned, playButtonClick } = useAudioContext()

  return {
    onQuestComplete: playQuestComplete,
    onGoldEarned: playGoldEarned,
    onXPEarned: playXPEarned,
    onButtonClick: playButtonClick
  }
}

// Hook for level-up audio
export function useLevelUpAudio() {
  const { playLevelUp, playButtonClick } = useAudioContext()

  return {
    onLevelUp: playLevelUp,
    onButtonClick: playButtonClick
  }
}

// Hook for navigation audio
export function useNavigationAudio() {
  const { playPageTurn, playButtonClick } = useAudioContext()

  return {
    onPageChange: playPageTurn,
    onButtonClick: playButtonClick
  }
}
