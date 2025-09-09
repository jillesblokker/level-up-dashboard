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
  musicEnabled: false,
  sfxEnabled: false
}

// Medieval-themed audio tracks
const audioTracks: AudioTrack[] = [
  // Background music
  {
    id: 'medieval-ambient',
    name: 'Medieval Ambience',
    url: '/audio/medieval-ambient.wav',
    loop: true,
    volume: 0.4,
    category: 'music'
  },
  {
    id: 'medieval-battle',
    name: 'Medieval Battle',
    url: '/audio/medieval-battle.wav',
    loop: true,
    volume: 0.3,
    category: 'music'
  },
  {
    id: 'medieval-village',
    name: 'Medieval Village',
    url: '/audio/medieval-village.wav',
    loop: true,
    volume: 0.3,
    category: 'music'
  },
  {
    id: 'medieval-castle',
    name: 'Medieval Castle',
    url: '/audio/medieval-castle.wav',
    loop: true,
    volume: 0.3,
    category: 'music'
  },
  {
    id: 'medieval-forest',
    name: 'Medieval Forest',
    url: '/audio/medieval-forest.wav',
    loop: true,
    volume: 0.3,
    category: 'music'
  },
  {
    id: 'medieval-tavern',
    name: 'Medieval Tavern',
    url: '/audio/medieval-tavern.wav',
    loop: true,
    volume: 0.3,
    category: 'music'
  },
  {
    id: 'medieval-mystical',
    name: 'Medieval Mystical',
    url: '/audio/medieval-mystical.wav',
    loop: true,
    volume: 0.3,
    category: 'music'
  },
  {
    id: 'medieval-epic',
    name: 'Medieval Epic',
    url: '/audio/medieval-epic.wav',
    loop: true,
    volume: 0.3,
    category: 'music'
  },
  {
    id: 'medieval-calm',
    name: 'Medieval Calm',
    url: '/audio/medieval-calm.wav',
    loop: true,
    volume: 0.3,
    category: 'music'
  },
  {
    id: 'medieval-adventure',
    name: 'Medieval Adventure',
    url: '/audio/medieval-adventure.wav',
    loop: true,
    volume: 0.3,
    category: 'music'
  },
  
  // Sound effects
  {
    id: 'quest-complete',
    name: 'Quest Complete',
    url: '/audio/quest-complete.wav',
    loop: false,
    volume: 0.8,
    category: 'sfx'
  },
  {
    id: 'level-up',
    name: 'Level Up',
    url: '/audio/level-up.wav',
    loop: false,
    volume: 0.9,
    category: 'sfx'
  },
  {
    id: 'gold-earned',
    name: 'Gold Earned',
    url: '/audio/gold-earned.wav',
    loop: false,
    volume: 0.7,
    category: 'sfx'
  },
  {
    id: 'xp-earned',
    name: 'XP Earned',
    url: '/audio/xp-earned.wav',
    loop: false,
    volume: 0.7,
    category: 'sfx'
  },
  {
    id: 'button-click',
    name: 'Button Click',
    url: '/audio/button-click.wav',
    loop: false,
    volume: 0.5,
    category: 'sfx'
  },
  {
    id: 'sword-clash',
    name: 'Sword Clash',
    url: '/audio/sword-clash.wav',
    loop: false,
    volume: 0.8,
    category: 'sfx'
  },
  {
    id: 'magic-spell',
    name: 'Magic Spell',
    url: '/audio/magic-spell.wav',
    loop: false,
    volume: 0.7,
    category: 'sfx'
  },
  {
    id: 'door-open',
    name: 'Door Open',
    url: '/audio/door-open.wav',
    loop: false,
    volume: 0.4,
    category: 'sfx'
  },
  {
    id: 'chest-open',
    name: 'Chest Open',
    url: '/audio/chest-open.wav',
    loop: false,
    volume: 0.6,
    category: 'sfx'
  },
  {
    id: 'achievement-unlock',
    name: 'Achievement Unlock',
    url: '/audio/achievement-unlock.wav',
    loop: false,
    volume: 0.8,
    category: 'sfx'
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
    if (!settings.sfxEnabled) {
      console.log(`[Audio] SFX disabled, skipping ${id}`)
      return
    }

    const audio = audioRefs.current.get(id)
    if (audio) {
      console.log(`[Audio] Playing SFX: ${id}`)
      audio.currentTime = 0
      audio.volume = audioTracks.find(t => t.id === id)?.volume || 0.8
      audio.volume *= settings.masterVolume * settings.sfxVolume
      audio.play().catch(error => {
        console.warn(`[Audio] Failed to play ${id}:`, error)
      })
    } else {
      console.warn(`[Audio] Audio element not found for ${id}`)
    }
  }, [settings])

  // Play music
  const playMusic = useCallback((id: string) => {
    if (!settings.musicEnabled) {
      console.log(`[Audio] Music disabled, skipping ${id}`)
      return
    }

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
      console.log(`[Audio] Playing music: ${id}`)
      audio.volume = audioTracks.find(t => t.id === id)?.volume || 0.5
      audio.volume *= settings.masterVolume * settings.musicVolume
      audio.loop = true
      audio.play().then(() => {
        setCurrentMusic(id)
        setIsPlaying(true)
        console.log(`[Audio] Music started: ${id}`)
      }).catch(error => {
        console.warn(`[Audio] Failed to play music ${id}:`, error)
      })
    } else {
      console.warn(`[Audio] Music element not found for ${id}`)
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

  // Toggle music enabled/disabled
  const toggleMusic = useCallback(() => {
    setSettings(prev => {
      const newSettings = { ...prev, musicEnabled: !prev.musicEnabled }
      
      // If disabling music, stop current music
      if (!newSettings.musicEnabled && currentMusic) {
        const audio = audioRefs.current.get(currentMusic)
        if (audio) {
          audio.pause()
          audio.currentTime = 0
        }
        setIsPlaying(false)
      }
      
      return newSettings
    })
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
    setSettings,
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
