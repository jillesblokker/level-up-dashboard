"use client"

import { useState, useEffect, useRef, useCallback } from 'react'

interface AudioSettings {
  masterVolume: number
  musicVolume: number
  sfxVolume: number
  musicEnabled: boolean
  sfxEnabled: boolean
}

interface AudioTrack {
  id: string
  name: string
  url: string
  loop: boolean
  volume: number
  category: 'music' | 'sfx' | 'ambient'
}

const defaultSettings: AudioSettings = {
  masterVolume: 0.7,
  musicVolume: 0.5,
  sfxVolume: 0.8,
  musicEnabled: true,
  sfxEnabled: true
}

// Medieval-themed audio tracks
const audioTracks: AudioTrack[] = [
  // Background music
  {
    id: 'medieval-ambient',
    name: 'Medieval Ambience',
    url: '/audio/medieval-ambient.mp3',
    loop: true,
    volume: 0.4,
    category: 'music'
  },
  {
    id: 'tavern-music',
    name: 'Tavern Music',
    url: '/audio/tavern-music.mp3',
    loop: true,
    volume: 0.3,
    category: 'music'
  },
  {
    id: 'castle-theme',
    name: 'Castle Theme',
    url: '/audio/castle-theme.mp3',
    loop: true,
    volume: 0.4,
    category: 'music'
  },
  {
    id: 'quest-theme',
    name: 'Quest Theme',
    url: '/audio/quest-theme.mp3',
    loop: true,
    volume: 0.3,
    category: 'music'
  },
  
  // Sound effects
  {
    id: 'quest-complete',
    name: 'Quest Complete',
    url: '/audio/quest-complete.mp3',
    loop: false,
    volume: 0.8,
    category: 'sfx'
  },
  {
    id: 'level-up',
    name: 'Level Up',
    url: '/audio/level-up.mp3',
    loop: false,
    volume: 0.9,
    category: 'sfx'
  },
  {
    id: 'gold-earned',
    name: 'Gold Earned',
    url: '/audio/gold-earned.mp3',
    loop: false,
    volume: 0.7,
    category: 'sfx'
  },
  {
    id: 'xp-earned',
    name: 'XP Earned',
    url: '/audio/xp-earned.mp3',
    loop: false,
    volume: 0.7,
    category: 'sfx'
  },
  {
    id: 'button-click',
    name: 'Button Click',
    url: '/audio/button-click.mp3',
    loop: false,
    volume: 0.5,
    category: 'sfx'
  },
  {
    id: 'sword-clash',
    name: 'Sword Clash',
    url: '/audio/sword-clash.mp3',
    loop: false,
    volume: 0.8,
    category: 'sfx'
  },
  {
    id: 'magic-cast',
    name: 'Magic Cast',
    url: '/audio/magic-cast.mp3',
    loop: false,
    volume: 0.7,
    category: 'sfx'
  },
  {
    id: 'page-turn',
    name: 'Page Turn',
    url: '/audio/page-turn.mp3',
    loop: false,
    volume: 0.4,
    category: 'sfx'
  },
  
  // Ambient sounds
  {
    id: 'fire-crackle',
    name: 'Fire Crackle',
    url: '/audio/fire-crackle.mp3',
    loop: true,
    volume: 0.3,
    category: 'ambient'
  },
  {
    id: 'wind-forest',
    name: 'Forest Wind',
    url: '/audio/wind-forest.mp3',
    loop: true,
    volume: 0.2,
    category: 'ambient'
  },
  {
    id: 'castle-ambient',
    name: 'Castle Ambient',
    url: '/audio/castle-ambient.mp3',
    loop: true,
    volume: 0.3,
    category: 'ambient'
  }
]

export function useAudio() {
  const [settings, setSettings] = useState<AudioSettings>(defaultSettings)
  const [currentMusic, setCurrentMusic] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map())

  // Load audio settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('audio-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsed })
      } catch (error) {
        console.error('Failed to load audio settings:', error)
      }
    }
  }, [])

  // Save audio settings to localStorage
  useEffect(() => {
    localStorage.setItem('audio-settings', JSON.stringify(settings))
  }, [settings])

  // Create audio elements
  useEffect(() => {
    audioTracks.forEach(track => {
      if (!audioRefs.current.has(track.id)) {
        const audio = new Audio(track.url)
        audio.loop = track.loop
        audio.volume = track.volume * settings.masterVolume * (track.category === 'music' ? settings.musicVolume : settings.sfxVolume)
        audio.preload = 'auto'
        audioRefs.current.set(track.id, audio)
      }
    })
  }, [settings])

  // Play sound effect
  const playSFX = useCallback((id: string) => {
    if (!settings.sfxEnabled) return

    const audio = audioRefs.current.get(id)
    if (audio) {
      audio.currentTime = 0
      audio.volume = audioTracks.find(t => t.id === id)?.volume || 0.8
      audio.volume *= settings.masterVolume * settings.sfxVolume
      audio.play().catch(error => {
        console.error(`Failed to play SFX ${id}:`, error)
      })
    }
  }, [settings])

  // Play music
  const playMusic = useCallback((id: string) => {
    if (!settings.musicEnabled) return

    // Stop current music
    if (currentMusic && currentMusic !== id) {
      const currentAudio = audioRefs.current.get(currentMusic)
      if (currentAudio) {
        currentAudio.pause()
        currentAudio.currentTime = 0
      }
    }

    const audio = audioRefs.current.get(id)
    if (audio) {
      audio.volume = audioTracks.find(t => t.id === id)?.volume || 0.5
      audio.volume *= settings.masterVolume * settings.musicVolume
      audio.loop = true
      audio.play().then(() => {
        setCurrentMusic(id)
        setIsPlaying(true)
      }).catch(error => {
        console.error(`Failed to play music ${id}:`, error)
      })
    }
  }, [settings, currentMusic])

  // Stop music
  const stopMusic = useCallback(() => {
    if (currentMusic) {
      const audio = audioRefs.current.get(currentMusic)
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
      setCurrentMusic(null)
      setIsPlaying(false)
    }
  }, [currentMusic])

  // Pause/Resume music
  const toggleMusic = useCallback(() => {
    if (currentMusic) {
      const audio = audioRefs.current.get(currentMusic)
      if (audio) {
        if (audio.paused) {
          audio.play().catch(error => {
            console.error('Failed to resume music:', error)
          })
          setIsPlaying(true)
        } else {
          audio.pause()
          setIsPlaying(false)
        }
      }
    }
  }, [currentMusic])

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<AudioSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings }
      
      // Update all audio volumes
      audioRefs.current.forEach((audio, id) => {
        const track = audioTracks.find(t => t.id === id)
        if (track) {
          audio.volume = track.volume * updated.masterVolume * 
            (track.category === 'music' ? updated.musicVolume : updated.sfxVolume)
        }
      })

      return updated
    })
  }, [])

  // Quest completion sound
  const playQuestComplete = useCallback(() => {
    playSFX('quest-complete')
  }, [playSFX])

  // Level up sound
  const playLevelUp = useCallback(() => {
    playSFX('level-up')
  }, [playSFX])

  // Gold earned sound
  const playGoldEarned = useCallback(() => {
    playSFX('gold-earned')
  }, [playSFX])

  // XP earned sound
  const playXPEarned = useCallback(() => {
    playSFX('xp-earned')
  }, [playSFX])

  // Button click sound
  const playButtonClick = useCallback(() => {
    playSFX('button-click')
  }, [playSFX])

  // Page navigation sound
  const playPageTurn = useCallback(() => {
    playSFX('page-turn')
  }, [playSFX])

  return {
    settings,
    currentMusic,
    isPlaying,
    audioTracks: audioTracks.filter(t => t.category === 'music'),
    playSFX,
    playMusic,
    stopMusic,
    toggleMusic,
    updateSettings,
    playQuestComplete,
    playLevelUp,
    playGoldEarned,
    playXPEarned,
    playButtonClick,
    playPageTurn
  }
}
